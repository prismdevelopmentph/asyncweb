import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUniquePayPalMemo } from '@/lib/paypal-memos';
import { getPaymentSettings } from '@/lib/payment-settings';
import { fulfillProductOrder } from '@/lib/fulfillment';
import { getUsdToPhpRate } from '@/lib/currency';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      tierKey = 'daily',
      provider = 'paymongo_qrph', // 'paymongo_qrph' | 'gcash' | 'maya' | 'paypal' | 'crypto' | 'balance' | 'qrph'
      email,
      discordId,
      orderType = 'product_purchase', // 'product_purchase' | 'balance_topup'
      topupAmount,
      cartItems
    } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail && !discordId) {
      return NextResponse.json({ ok: false, error: 'Customer email or Discord ID is required' }, { status: 400 });
    }

    const settings = await getPaymentSettings();
    const liveRate = await getUsdToPhpRate();

    // ── CASE A: PRODUCT PURCHASE ──
    if (orderType === 'product_purchase') {
      const isCartOrder = Array.isArray(cartItems) && cartItems.length > 0;
      let basePhp = 0;
      let orderProductId = productId || null;
      let orderTierKey = tierKey || 'daily';

      if (isCartOrder) {
        for (const item of cartItems) {
          basePhp += Number(item.pricePHP || 0) * (Number(item.quantity) || 1);
        }
        basePhp = Math.round(basePhp);
        orderProductId = cartItems[0]?.productId || null;
        orderTierKey = cartItems[0]?.tierKey || 'daily';
      } else {
        if (!productId) {
          return NextResponse.json({ ok: false, error: 'Product ID required' }, { status: 400 });
        }

        // Fetch product configuration
        const { data: product, error: prodErr } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('is_active', true)
          .single();

        if (prodErr || !product) {
          return NextResponse.json({ ok: false, error: 'Product not found or inactive' }, { status: 404 });
        }

        const rawTiers = Array.isArray(product.tiers) ? product.tiers : [];
        const matchedTier = rawTiers.find((t: any) => (t.tier_key || t.tierKey) === tierKey) || rawTiers[0];

        const rawBase = Number(matchedTier?.price_php ?? matchedTier?.pricePHP ?? product.price_php ?? 0);
        const discountPct = Number(matchedTier?.discount_percent ?? matchedTier?.discountPercent ?? product.discount_percent ?? 0);
        basePhp = discountPct > 0 ? Math.round(rawBase * (1 - discountPct / 100)) : rawBase;
        orderProductId = productId;
        orderTierKey = tierKey;
      }

      const baseUsd = Math.round(((basePhp / liveRate) + Number.EPSILON) * 100) / 100;

      // ── SUB-ROUTE: WEB BALANCE (Instant - 0% fee) ──
      if (provider === 'balance') {
        if (!discordId) {
          return NextResponse.json({ ok: false, error: 'You must be logged in with Discord to pay with Web Balance' }, { status: 401 });
        }

        const { data: userBal } = await supabaseAdmin
          .from('user_balances')
          .select('balance_php')
          .eq('discord_id', discordId)
          .maybeSingle();

        const currentBalance = Number(userBal?.balance_php || 0);
        if (currentBalance < basePhp) {
          return NextResponse.json({
            ok: false,
            error: `Insufficient balance. Required: ₱${basePhp.toLocaleString('en-PH')}, Available: ₱${currentBalance.toLocaleString('en-PH')}`
          }, { status: 400 });
        }

        const newBalance = currentBalance - basePhp;
        await supabaseAdmin
          .from('user_balances')
          .update({ balance_php: newBalance, updated_at: new Date().toISOString() })
          .eq('discord_id', discordId);

        const { data: newOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            discord_id: discordId,
            email: cleanEmail || `${discordId}@discord.asyncdevph.xyz`,
            order_type: 'product_purchase',
            product_id: orderProductId,
            tier_key: orderTierKey,
            amount: basePhp,
            currency: 'PHP',
            provider: 'balance',
            provider_label: 'Web Balance',
            payment_details: {
              base_amount: basePhp,
              fee_percent: 0,
              fee_amount: 0,
              deducted_php: basePhp,
              remaining_balance: newBalance,
              ...(isCartOrder ? { cart_items: cartItems } : {})
            },
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .select()
          .single();

        if (orderErr || !newOrder) throw orderErr || new Error('Failed to create order record');

        const fulfillment = await fulfillProductOrder(newOrder.id);
        return NextResponse.json({
          ok: true,
          orderId: newOrder.id,
          status: 'delivered',
          licenseKey: fulfillment.licenseKey
        });
      }

      // ── SUB-ROUTE: PAYMONGO QRPH (with % fee) ──
      if (provider === 'paymongo_qrph' || provider === 'qrph') {
        const feePercent = settings.paymongoFeePercent || 0;
        const feeAmount = Math.round((basePhp * (feePercent / 100)) * 100) / 100;
        const finalChargedPhp = Math.round((basePhp + feeAmount) * 100) / 100;
        const refTag = `QRPH-${Math.floor(1000 + Math.random() * 9000)}`;

        const { data: newOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            discord_id: discordId || null,
            email: cleanEmail,
            order_type: 'product_purchase',
            product_id: orderProductId,
            tier_key: orderTierKey,
            amount: finalChargedPhp,
            currency: 'PHP',
            provider: 'paymongo_qrph',
            provider_label: 'PayMongo QRPH',
            payment_details: {
              base_amount: basePhp,
              fee_percent: feePercent,
              fee_amount: feeAmount,
              qr_image_url: settings.paymongoQrUrl || settings.gcashQrUrl,
              account_name: settings.paymongoName,
              ref_code: refTag,
              // Fallback fields for legacy screens
              gcash_number: settings.gcashNumber,
              gcash_name: settings.gcashName,
              gcash_qr_url: settings.paymongoQrUrl || settings.gcashQrUrl,
              maya_number: settings.mayaNumber,
              maya_name: settings.mayaName,
              maya_qr_url: settings.mayaQrUrl,
              ...(isCartOrder ? { cart_items: cartItems } : {})
            },
            status: 'awaiting_payment'
          })
          .select()
          .single();

        if (orderErr || !newOrder) throw orderErr || new Error('Failed to create PayMongo QRPH order');
        return NextResponse.json({ ok: true, orderId: newOrder.id, status: 'awaiting_payment' });
      }

      // ── SUB-ROUTE: GCASH DIRECT ──
      if (provider === 'gcash') {
        const feePercent = settings.gcashFeePercent || 0;
        const feeAmount = Math.round((basePhp * (feePercent / 100)) * 100) / 100;
        const finalChargedPhp = Math.round((basePhp + feeAmount) * 100) / 100;
        const refTag = `GCASH-${Math.floor(1000 + Math.random() * 9000)}`;

        const { data: newOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            discord_id: discordId || null,
            email: cleanEmail,
            order_type: 'product_purchase',
            product_id: orderProductId,
            tier_key: orderTierKey,
            amount: finalChargedPhp,
            currency: 'PHP',
            provider: 'gcash',
            provider_label: 'GCash Transfer',
            payment_details: {
              base_amount: basePhp,
              fee_percent: feePercent,
              fee_amount: feeAmount,
              gcash_number: settings.gcashNumber,
              gcash_name: settings.gcashName,
              gcash_qr_url: settings.gcashQrUrl,
              ref_code: refTag,
              ...(isCartOrder ? { cart_items: cartItems } : {})
            },
            status: 'awaiting_payment'
          })
          .select()
          .single();

        if (orderErr || !newOrder) throw orderErr || new Error('Failed to create GCash order');
        return NextResponse.json({ ok: true, orderId: newOrder.id, status: 'awaiting_payment' });
      }

      // ── SUB-ROUTE: MAYA DIRECT ──
      if (provider === 'maya') {
        const feePercent = settings.mayaFeePercent || 0;
        const feeAmount = Math.round((basePhp * (feePercent / 100)) * 100) / 100;
        const finalChargedPhp = Math.round((basePhp + feeAmount) * 100) / 100;
        const refTag = `MAYA-${Math.floor(1000 + Math.random() * 9000)}`;

        const { data: newOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            discord_id: discordId || null,
            email: cleanEmail,
            order_type: 'product_purchase',
            product_id: orderProductId,
            tier_key: orderTierKey,
            amount: finalChargedPhp,
            currency: 'PHP',
            provider: 'maya',
            provider_label: 'Maya Transfer',
            payment_details: {
              base_amount: basePhp,
              fee_percent: feePercent,
              fee_amount: feeAmount,
              maya_number: settings.mayaNumber,
              maya_name: settings.mayaName,
              maya_qr_url: settings.mayaQrUrl,
              ref_code: refTag,
              ...(isCartOrder ? { cart_items: cartItems } : {})
            },
            status: 'awaiting_payment'
          })
          .select()
          .single();

        if (orderErr || !newOrder) throw orderErr || new Error('Failed to create Maya order');
        return NextResponse.json({ ok: true, orderId: newOrder.id, status: 'awaiting_payment' });
      }

      // ── SUB-ROUTE: PAYPAL (Friends & Family) ──
      if (provider === 'paypal') {
        const uniqueMemo = await getUniquePayPalMemo();
        const feePercent = settings.paypalFeePercent || 0;
        const feeAmount = Math.round((baseUsd * (feePercent / 100)) * 100) / 100;
        const finalChargedUsd = Math.round((baseUsd + feeAmount) * 100) / 100;

        const { data: newOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            discord_id: discordId || null,
            email: cleanEmail,
            order_type: 'product_purchase',
            product_id: orderProductId,
            tier_key: orderTierKey,
            amount: finalChargedUsd,
            currency: 'USD',
            provider: 'paypal',
            provider_label: 'PayPal (Friends & Family)',
            payment_details: {
              base_amount: baseUsd,
              fee_percent: feePercent,
              fee_amount: feeAmount,
              paypal_email: settings.paypalEmail,
              paypal_note: uniqueMemo,
              original_php: basePhp,
              ...(isCartOrder ? { cart_items: cartItems } : {})
            },
            status: 'awaiting_payment'
          })
          .select()
          .single();

        if (orderErr || !newOrder) throw orderErr || new Error('Failed to create PayPal order');
        return NextResponse.json({ ok: true, orderId: newOrder.id, status: 'awaiting_payment' });
      }

      // ── SUB-ROUTE: CRYPTO (LTC / USDT) ──
      if (provider === 'crypto') {
        const feePercent = settings.cryptoFeePercent || 0;
        const feeAmount = Math.round((baseUsd * (feePercent / 100)) * 100) / 100;
        const finalChargedUsd = Math.round((baseUsd + feeAmount) * 100) / 100;
        const refTag = `CRYPTO-${Math.floor(1000 + Math.random() * 9000)}`;

        const { data: newOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            discord_id: discordId || null,
            email: cleanEmail,
            order_type: 'product_purchase',
            product_id: orderProductId,
            tier_key: orderTierKey,
            amount: finalChargedUsd,
            currency: 'USD',
            provider: 'crypto',
            provider_label: 'Crypto (LTC / USDT)',
            payment_details: {
              base_amount: baseUsd,
              fee_percent: feePercent,
              fee_amount: feeAmount,
              ltc_address: settings.cryptoLtc,
              usdt_address: settings.cryptoUsdt,
              ref_code: refTag,
              original_php: basePhp,
              ...(isCartOrder ? { cart_items: cartItems } : {})
            },
            status: 'awaiting_payment'
          })
          .select()
          .single();

        if (orderErr || !newOrder) throw orderErr || new Error('Failed to create Crypto order');
        return NextResponse.json({ ok: true, orderId: newOrder.id, status: 'awaiting_payment' });
      }
    }

    // ── CASE B: BALANCE TOP-UP ──
    if (orderType === 'balance_topup') {
      const topupPhp = Math.max(50, Number(topupAmount) || 100);
      const topupUsd = Math.round(((topupPhp / liveRate) + Number.EPSILON) * 100) / 100;

      if (provider === 'paypal') {
        const uniqueMemo = await getUniquePayPalMemo();
        const { data: newOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            discord_id: discordId || null,
            email: cleanEmail,
            order_type: 'balance_topup',
            amount: topupUsd,
            currency: 'USD',
            provider: 'paypal',
            provider_label: 'PayPal (Friends & Family)',
            payment_details: {
              paypal_email: settings.paypalEmail,
              paypal_note: uniqueMemo,
              target_credit_php: topupPhp
            },
            status: 'awaiting_payment'
          })
          .select()
          .single();

        if (orderErr) throw orderErr;
        return NextResponse.json({ ok: true, orderId: newOrder.id, status: 'awaiting_payment' });
      }

      if (provider === 'paymongo_qrph' || provider === 'qrph' || provider === 'gcash') {
        const refTag = `TOPUP-${Math.floor(1000 + Math.random() * 9000)}`;
        const { data: newOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            discord_id: discordId || null,
            email: cleanEmail,
            order_type: 'balance_topup',
            amount: topupPhp,
            currency: 'PHP',
            provider: 'paymongo_qrph',
            provider_label: 'QRPH Payment',
            payment_details: {
              qr_image_url: settings.paymongoQrUrl || settings.gcashQrUrl,
              account_name: settings.paymongoName,
              gcash_number: settings.gcashNumber,
              gcash_name: settings.gcashName,
              gcash_qr_url: settings.gcashQrUrl,
              gcash_enabled: settings.gcashEnabled,
              maya_number: settings.mayaNumber,
              maya_name: settings.mayaName,
              maya_qr_url: settings.mayaQrUrl,
              maya_enabled: settings.mayaEnabled,
              ref_code: refTag,
              target_credit_php: topupPhp
            },
            status: 'awaiting_payment'
          })
          .select()
          .single();

        if (orderErr) throw orderErr;
        return NextResponse.json({ ok: true, orderId: newOrder.id, status: 'awaiting_payment' });
      }
    }

    return NextResponse.json({ ok: false, error: 'Unsupported provider or order configuration' }, { status: 400 });
  } catch (err: any) {
    console.error('[Orders Create] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
