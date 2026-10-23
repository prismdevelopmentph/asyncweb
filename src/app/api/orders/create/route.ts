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
      provider = 'paypal', // 'balance', 'qrph', 'paypal'
      email,
      discordId,
      orderType = 'product_purchase', // 'product_purchase' | 'balance_topup'
      topupAmount
    } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail && !discordId) {
      return NextResponse.json({ ok: false, error: 'Customer email or Discord ID is required' }, { status: 400 });
    }

    const settings = await getPaymentSettings();
    const liveRate = await getUsdToPhpRate();

    // ── CASE A: PRODUCT PURCHASE ──
    if (orderType === 'product_purchase') {
      if (!productId) {
        return NextResponse.json({ ok: false, error: 'Product ID required' }, { status: 400 });
      }

      // 1. Fetch product configuration
      const { data: product, error: prodErr } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (prodErr || !product) {
        return NextResponse.json({ ok: false, error: 'Product not found or inactive' }, { status: 404 });
      }

      // 2. Resolve price for selected tier
      const rawTiers = Array.isArray(product.tiers) ? product.tiers : [];
      const matchedTier = rawTiers.find((t: any) => (t.tier_key || t.tierKey) === tierKey) || rawTiers[0];

      const basePhp = Number(matchedTier?.price_php ?? matchedTier?.pricePHP ?? product.price_php ?? 0);
      const discountPct = Number(matchedTier?.discount_percent ?? matchedTier?.discountPercent ?? product.discount_percent ?? 0);
      const finalPhp = discountPct > 0 ? Math.round(basePhp * (1 - discountPct / 100)) : basePhp;
      const finalUsd = Math.round(((finalPhp / liveRate) + Number.EPSILON) * 100) / 100;

      // ── SUB-ROUTE: WEB BALANCE (Instant) ──
      if (provider === 'balance') {
        if (!discordId) {
          return NextResponse.json({ ok: false, error: 'You must be logged in with Discord to pay with Web Balance' }, { status: 401 });
        }

        // Fetch user balance
        const { data: userBal } = await supabaseAdmin
          .from('user_balances')
          .select('balance_php')
          .eq('discord_id', discordId)
          .maybeSingle();

        const currentBalance = Number(userBal?.balance_php || 0);
        if (currentBalance < finalPhp) {
          return NextResponse.json({
            ok: false,
            error: `Insufficient balance. Required: ₱${finalPhp.toLocaleString('en-PH')}, Available: ₱${currentBalance.toLocaleString('en-PH')}`
          }, { status: 400 });
        }

        // Deduct balance
        const newBalance = currentBalance - finalPhp;
        await supabaseAdmin
          .from('user_balances')
          .update({ balance_php: newBalance, updated_at: new Date().toISOString() })
          .eq('discord_id', discordId);

        // Create order in completed state
        const { data: newOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            discord_id: discordId,
            email: cleanEmail || `${discordId}@discord.asyncdevph.xyz`,
            order_type: 'product_purchase',
            product_id: productId,
            tier_key: tierKey,
            amount: finalPhp,
            currency: 'PHP',
            provider: 'balance',
            provider_label: 'Web Balance',
            payment_details: { deducted_php: finalPhp, remaining_balance: newBalance },
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .select()
          .single();

        if (orderErr || !newOrder) {
          throw orderErr || new Error('Failed to create order record');
        }

        // Fulfill & issue key immediately
        const fulfillment = await fulfillProductOrder(newOrder.id);
        return NextResponse.json({
          ok: true,
          orderId: newOrder.id,
          status: 'delivered',
          licenseKey: fulfillment.licenseKey
        });
      }

      // ── SUB-ROUTE: PAYPAL FRIENDS & FAMILY ──
      if (provider === 'paypal') {
        const uniqueMemo = await getUniquePayPalMemo();

        const { data: newOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            discord_id: discordId || null,
            email: cleanEmail,
            order_type: 'product_purchase',
            product_id: productId,
            tier_key: tierKey,
            amount: finalUsd,
            currency: 'USD',
            provider: 'paypal',
            provider_label: 'PayPal (Friends & Family)',
            payment_details: {
              paypal_email: settings.paypalEmail,
              paypal_note: uniqueMemo,
              original_php: finalPhp
            },
            status: 'pending'
          })
          .select()
          .single();

        if (orderErr || !newOrder) throw orderErr || new Error('Failed to create PayPal order');

        return NextResponse.json({
          ok: true,
          orderId: newOrder.id,
          status: 'pending'
        });
      }

      // ── SUB-ROUTE: QRPH PAYMENT ──
      if (provider === 'qrph') {
        const refTag = `ASYNC-${Math.floor(1000 + Math.random() * 9000)}`;

        const { data: newOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            discord_id: discordId || null,
            email: cleanEmail,
            order_type: 'product_purchase',
            product_id: productId,
            tier_key: tierKey,
            amount: finalPhp,
            currency: 'PHP',
            provider: 'qrph',
            provider_label: 'QRPH Payment',
            payment_details: {
              gcash_number: settings.gcashNumber,
              gcash_name: settings.gcashName,
              gcash_qr_url: settings.gcashQrUrl,
              gcash_enabled: settings.gcashEnabled,
              maya_number: settings.mayaNumber,
              maya_name: settings.mayaName,
              maya_qr_url: settings.mayaQrUrl,
              maya_enabled: settings.mayaEnabled,
              ref_code: refTag
            },
            status: 'pending'
          })
          .select()
          .single();

        if (orderErr || !newOrder) throw orderErr || new Error('Failed to create QR order');

        return NextResponse.json({
          ok: true,
          orderId: newOrder.id,
          status: 'pending'
        });
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
            status: 'pending'
          })
          .select()
          .single();

        if (orderErr) throw orderErr;
        return NextResponse.json({ ok: true, orderId: newOrder.id, status: 'pending' });
      }

      if (provider === 'qrph') {
        const refTag = `TOPUP-${Math.floor(1000 + Math.random() * 9000)}`;
        const { data: newOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            discord_id: discordId || null,
            email: cleanEmail,
            order_type: 'balance_topup',
            amount: topupPhp,
            currency: 'PHP',
            provider: 'qrph',
            provider_label: 'QRPH Payment',
            payment_details: {
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
            status: 'pending'
          })
          .select()
          .single();

        if (orderErr) throw orderErr;
        return NextResponse.json({ ok: true, orderId: newOrder.id, status: 'pending' });
      }
    }

    return NextResponse.json({ ok: false, error: 'Unsupported provider or order configuration' }, { status: 400 });
  } catch (err: any) {
    console.error('[Orders Create] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

