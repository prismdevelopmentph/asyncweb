import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser } from '@/lib/auth';
import { getUniquePayPalMemo } from '@/lib/paypal-memos';
import { getPaymentSettings } from '@/lib/payment-settings';
import { fulfillProductOrder } from '@/lib/fulfillment';
import { getUsdToPhpRate } from '@/lib/currency';
import { getPayMongoConfig, createPayMongoCheckoutSession } from '@/lib/paymongo';
import { generateOrderAccessToken } from '@/lib/order-auth';

function attachOrderAccessCookie(res: NextResponse, orderId: string, createdAt: string) {
  const token = generateOrderAccessToken(orderId, createdAt);
  res.cookies.set(`order_access_${orderId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 3600,
  });
  return token;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      tierKey = 'daily',
      provider = 'paymongo_qrph', // 'paymongo_qrph' | 'gcash' | 'maya' | 'paypal' | 'crypto' | 'balance' | 'qrph'
      email,
      orderType = 'product_purchase', // 'product_purchase' | 'balance_topup' | 'reseller_topup'
      topupAmount,
      cartItems,
      couponCode
    } = body;

    // Explicit Bearer token authentication:
    let verifiedDiscordId: string | null = null;
    let verifiedUserEmail: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const auth = await requireUser(req);
      if (!auth.ok) return auth.response;
      verifiedDiscordId = auth.data.discordId;
      verifiedUserEmail = auth.data.email;
    }

    if ((orderType === 'balance_topup' || orderType === 'reseller_topup') && !verifiedDiscordId) {
      return NextResponse.json({ ok: false, error: 'Authentication required for balance top-up' }, { status: 401 });
    }

    const cleanEmail = (email || verifiedUserEmail || '').trim().toLowerCase();
    if (!cleanEmail && !verifiedDiscordId) {
      return NextResponse.json({ ok: false, error: 'Customer email or Discord authentication is required' }, { status: 400 });
    }

    const settings = await getPaymentSettings();
    const liveRate = await getUsdToPhpRate();

    // ── CASE A: PRODUCT PURCHASE ──
    if (orderType === 'product_purchase') {
      const isCartOrder = Array.isArray(cartItems) && cartItems.length > 0;
      let basePhp = 0;
      let orderProductId = productId || null;
      let orderTierKey = tierKey || 'daily';
      let verifiedCartItems: any[] = [];

      if (isCartOrder) {
        if (cartItems.length > 20) {
          return NextResponse.json({ ok: false, error: 'Maximum 20 distinct cart line items allowed' }, { status: 400 });
        }

        const productIds = Array.from(new Set(cartItems.map((c: any) => c.productId).filter(Boolean)));
        if (productIds.length === 0) {
          return NextResponse.json({ ok: false, error: 'No valid products in cart' }, { status: 400 });
        }

        const { data: dbProducts, error: dbProdErr } = await supabaseAdmin
          .from('products')
          .select('*')
          .in('id', productIds)
          .eq('is_active', true);

        if (dbProdErr || !dbProducts || dbProducts.length === 0) {
          return NextResponse.json({ ok: false, error: 'Products not found or inactive' }, { status: 404 });
        }

        const productMap = new Map<string, any>();
        for (const p of dbProducts) {
          productMap.set(p.id, p);
        }

        for (const item of cartItems) {
          const product = productMap.get(item.productId);
          if (!product) {
            return NextResponse.json({ ok: false, error: `Product "${item.title || item.productId}" is unavailable or inactive` }, { status: 400 });
          }

          const rawQty = Number(item.quantity);
          if (!Number.isInteger(rawQty) || rawQty < 1 || rawQty > 20) {
            return NextResponse.json({
              ok: false,
              error: `Invalid quantity for item "${item.title || product.title}". Quantity must be an integer between 1 and 20.`
            }, { status: 400 });
          }
          const qty = rawQty;

          const rawTiers = Array.isArray(product.tiers) ? product.tiers : [];
          let itemTierKey = 'flat';
          let itemTierName = 'Direct Access';
          let rawBase = 0;
          let discountPct = 0;

          if (rawTiers.length > 0) {
            const reqKey = (item.tierKey || '').toLowerCase().trim();
            const matchedTier = rawTiers.find((t: any) => ((t.tier_key || t.tierKey || '').toLowerCase().trim()) === reqKey);
            if (!matchedTier) {
              return NextResponse.json({ ok: false, error: `Invalid tier "${item.tierKey}" for product "${product.title}"` }, { status: 400 });
            }
            itemTierKey = (matchedTier.tier_key || matchedTier.tierKey).toLowerCase();
            itemTierName = matchedTier.name || 'Standard';
            rawBase = Number(matchedTier.price_php ?? matchedTier.pricePHP ?? 0);
            discountPct = Number(matchedTier.discount_percent ?? matchedTier.discountPercent ?? 0);
          } else {
            const reqKey = (item.tierKey || 'flat').toLowerCase().trim();
            if (reqKey !== 'flat') {
              return NextResponse.json({ ok: false, error: `Product "${product.title}" only supports flat pricing` }, { status: 400 });
            }
            itemTierKey = 'flat';
            itemTierName = 'Direct Access';
            rawBase = Number(product.price_php ?? 0);
            discountPct = Number(product.discount_percent ?? 0);
          }

          const itemPricePhp = discountPct > 0 ? Math.round(rawBase * (1 - discountPct / 100)) : rawBase;
          basePhp += itemPricePhp * qty;

          verifiedCartItems.push({
            productId: product.id,
            tierKey: itemTierKey,
            tierName: itemTierName,
            title: product.title,
            pricePHP: itemPricePhp,
            quantity: qty,
            deliveryMode: product.delivery_mode || item.deliveryMode || 'generator_license',
            hasDiscount: discountPct > 0,
            discountPercent: discountPct,
            originalPricePHP: rawBase
          });
        }

        basePhp = Math.round(basePhp);

        const totalUnits = verifiedCartItems.reduce((acc, it) => acc + it.quantity, 0);
        if (totalUnits > 50) {
          return NextResponse.json({
            ok: false,
            error: `Total order quantity exceeds the maximum limit of 50 units (current total: ${totalUnits}).`
          }, { status: 400 });
        }

        orderProductId = verifiedCartItems[0]?.productId || null;
        orderTierKey = verifiedCartItems[0]?.tierKey || 'flat';
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
        let chosenTierKey = 'flat';
        let rawBase = 0;
        let discountPct = 0;

        if (rawTiers.length > 0) {
          const reqKey = (tierKey || '').toLowerCase().trim();
          const matchedTier = rawTiers.find((t: any) => ((t.tier_key || t.tierKey || '').toLowerCase().trim()) === reqKey);
          if (!matchedTier) {
            return NextResponse.json({ ok: false, error: `Invalid tier "${tierKey}" for product "${product.title}"` }, { status: 400 });
          }
          chosenTierKey = (matchedTier.tier_key || matchedTier.tierKey).toLowerCase();
          rawBase = Number(matchedTier.price_php ?? matchedTier.pricePHP ?? 0);
          discountPct = Number(matchedTier.discount_percent ?? matchedTier.discountPercent ?? 0);
        } else {
          const reqKey = (tierKey || 'flat').toLowerCase().trim();
          if (reqKey !== 'flat') {
            return NextResponse.json({ ok: false, error: `Product "${product.title}" only supports flat pricing` }, { status: 400 });
          }
          chosenTierKey = 'flat';
          rawBase = Number(product.price_php ?? 0);
          discountPct = Number(product.discount_percent ?? 0);
        }

        basePhp = discountPct > 0 ? Math.round(rawBase * (1 - discountPct / 100)) : rawBase;
        orderProductId = productId;
        orderTierKey = chosenTierKey;
      }

      // ── NON-STACKING PROMO / COUPON CODE ENGINE ──
      let appliedCouponCode: string | null = null;
      let appliedDiscountAmount = 0;
      let appliedDiscountType: 'percent' | 'fixed' | null = null;
      let appliedDiscountValue = 0;

      if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
        const cleanCode = couponCode.trim().toUpperCase();
        const { data: couponRow } = await supabaseAdmin
          .from('coupons')
          .select('*')
          .ilike('code', cleanCode)
          .eq('is_active', true)
          .maybeSingle();

        if (couponRow) {
          const isExpired = couponRow.expires_at && new Date(couponRow.expires_at) < new Date();
          const isMaxed = couponRow.max_uses && Number(couponRow.times_used) >= Number(couponRow.max_uses);

          if (!isExpired && !isMaxed) {
            let eligibleSubtotalPhp = 0;

            if (isCartOrder) {
              for (const item of verifiedCartItems) {
                const isDiscounted = Boolean(
                  item.hasDiscount ||
                  (item.discountPercent && Number(item.discountPercent) > 0) ||
                  (item.originalPricePHP && Number(item.originalPricePHP) > Number(item.pricePHP))
                );
                if (!isDiscounted) {
                  eligibleSubtotalPhp += Number(item.pricePHP || 0) * (Number(item.quantity) || 1);
                }
              }
            } else {
              eligibleSubtotalPhp = basePhp;
            }

            const minSpend = Number(couponRow.min_spend || 0);
            if (eligibleSubtotalPhp > 0 && eligibleSubtotalPhp >= minSpend) {
              const val = Number(couponRow.discount_value);
              if (couponRow.discount_type === 'percent') {
                appliedDiscountAmount = Math.round((eligibleSubtotalPhp * (val / 100)) * 100) / 100;
              } else {
                appliedDiscountAmount = Math.min(val, eligibleSubtotalPhp);
              }

              appliedCouponCode = couponRow.code;
              appliedDiscountType = couponRow.discount_type;
              appliedDiscountValue = val;

              // Apply discount to basePhp
              basePhp = Math.max(0, Math.round((basePhp - appliedDiscountAmount) * 100) / 100);
            }
          }
        }
      }

      const baseUsd = Math.round(((basePhp / liveRate) + Number.EPSILON) * 100) / 100;

      // ── SUB-ROUTE: WEB BALANCE (Instant - 0% fee) ──
      if (provider === 'balance') {
        if (!verifiedDiscordId) {
          return NextResponse.json({ ok: false, error: 'You must be logged in with Discord to pay with Web Balance' }, { status: 401 });
        }

        const buyerDiscordId = verifiedDiscordId;

        const { data: userBal, error: balErr } = await supabaseAdmin
          .from('user_balances')
          .select('balance_php')
          .eq('discord_id', buyerDiscordId)
          .maybeSingle();

        if (balErr || !userBal) {
          return NextResponse.json({
            ok: false,
            error: 'User balance account not found. Please top up first.'
          }, { status: 400 });
        }

        const currentBalance = Number(userBal.balance_php || 0);
        if (currentBalance < basePhp) {
          return NextResponse.json({
            ok: false,
            error: `Insufficient balance. Required: ₱${basePhp.toLocaleString('en-PH')}, Available: ₱${currentBalance.toLocaleString('en-PH')}`
          }, { status: 400 });
        }

        const newBalance = Math.round((currentBalance - basePhp) * 100) / 100;

        // Optimistic concurrency check: ensure balance hasn't been modified concurrently
        const { data: updatedBal, error: updateErr } = await supabaseAdmin
          .from('user_balances')
          .update({ balance_php: newBalance, updated_at: new Date().toISOString() })
          .eq('discord_id', buyerDiscordId)
          .eq('balance_php', currentBalance)
          .select('balance_php')
          .maybeSingle();

        if (updateErr || !updatedBal) {
          return NextResponse.json({
            ok: false,
            error: 'Balance deduction conflict due to concurrent transactions. Please retry.'
          }, { status: 409 });
        }

        let newOrder: any = null;
        try {
          const { data, error: orderErr } = await supabaseAdmin
            .from('orders')
            .insert({
              discord_id: buyerDiscordId,
              email: cleanEmail || `${buyerDiscordId}@discord.asyncdevph.xyz`,
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
                coupon_code: appliedCouponCode,
                discount_amount: appliedDiscountAmount,
                ...(isCartOrder ? { cart_items: verifiedCartItems } : {})
              },
              status: 'paid',
              paid_at: new Date().toISOString()
            })
            .select()
            .single();

          if (orderErr || !data) throw orderErr || new Error('Failed to create order record');
          newOrder = data;
        } catch (orderInsertErr) {
          console.error('[Orders Create] Order insert failed after balance deduction. Initiating refund compensation:', orderInsertErr);

          let refunded = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            const { data: latestBal } = await supabaseAdmin
              .from('user_balances')
              .select('balance_php')
              .eq('discord_id', buyerDiscordId)
              .maybeSingle();

            if (latestBal) {
              const readBal = Number(latestBal.balance_php || 0);
              const restoredBal = Math.round((readBal + basePhp) * 100) / 100;
              const { data: restored, error: restErr } = await supabaseAdmin
                .from('user_balances')
                .update({ balance_php: restoredBal, updated_at: new Date().toISOString() })
                .eq('discord_id', buyerDiscordId)
                .eq('balance_php', readBal)
                .select()
                .maybeSingle();

              if (!restErr && restored) {
                refunded = true;
                console.log(`[Orders Create] Refund compensation successful on attempt ${attempt} for ${buyerDiscordId}. Restored: ₱${restoredBal}`);
                break;
              }
            }
          }

          if (!refunded) {
            console.error(`[CRITICAL] Balance refund compensation failed for ${buyerDiscordId}. Amount to restore: ₱${basePhp}`);
          }

          throw orderInsertErr;
        }

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
            discord_id: verifiedDiscordId || null,
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
              coupon_code: appliedCouponCode,
              discount_amount: appliedDiscountAmount,
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
              ...(isCartOrder ? { cart_items: verifiedCartItems } : {})
            },
            status: 'awaiting_payment'
          })
          .select()
          .single();

        if (orderErr || !newOrder) throw orderErr || new Error('Failed to create PayMongo QRPH order');

        // Attempt automated dynamic PayMongo Checkout Session creation
        let paymongoCheckoutUrl: string | null = null;
        try {
          const { secretKey, isAutomated } = await getPayMongoConfig();
          if (secretKey && isAutomated) {
            const host = req.headers.get('host') || 'asyncdevph.xyz';
            const proto = req.headers.get('x-forwarded-proto') || 'https';
            const originUrl = `${proto}://${host}`;

            const pmSession = await createPayMongoCheckoutSession(secretKey, {
              orderId: newOrder.id,
              amountPHP: finalChargedPhp,
              productName: isCartOrder ? `ASYNC Order (${verifiedCartItems.length} items)` : 'ASYNC Product License',
              customerEmail: cleanEmail,
              customerDiscordId: verifiedDiscordId || null,
              originUrl,
            });

            paymongoCheckoutUrl = pmSession.checkoutUrl;

            await supabaseAdmin
              .from('orders')
              .update({
                payment_details: {
                  ...newOrder.payment_details,
                  paymongo_checkout_session_id: pmSession.sessionId,
                  paymongo_checkout_url: pmSession.checkoutUrl,
                  paymongo_created_at: new Date().toISOString()
                }
              })
              .eq('id', newOrder.id);
          }
        } catch (pmErr) {
          console.warn('[Orders Create] PayMongo automated session creation warning, falling back to static QR:', pmErr);
        }

        const token = generateOrderAccessToken(newOrder.id, newOrder.created_at);
        const res = NextResponse.json({
          ok: true,
          orderId: newOrder.id,
          orderToken: token,
          status: 'awaiting_payment',
          checkoutUrl: paymongoCheckoutUrl
        });
        attachOrderAccessCookie(res, newOrder.id, newOrder.created_at);
        return res;
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
            discord_id: verifiedDiscordId || null,
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
              coupon_code: appliedCouponCode,
              discount_amount: appliedDiscountAmount,
              gcash_number: settings.gcashNumber,
              gcash_name: settings.gcashName,
              gcash_qr_url: settings.gcashQrUrl,
              ref_code: refTag,
              ...(isCartOrder ? { cart_items: verifiedCartItems } : {})
            },
            status: 'awaiting_payment'
          })
          .select()
          .single();

        if (orderErr || !newOrder) throw orderErr || new Error('Failed to create GCash order');
        const token = generateOrderAccessToken(newOrder.id, newOrder.created_at);
        const res = NextResponse.json({ ok: true, orderId: newOrder.id, orderToken: token, status: 'awaiting_payment' });
        attachOrderAccessCookie(res, newOrder.id, newOrder.created_at);
        return res;
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
            discord_id: verifiedDiscordId || null,
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
              coupon_code: appliedCouponCode,
              discount_amount: appliedDiscountAmount,
              maya_number: settings.mayaNumber,
              maya_name: settings.mayaName,
              maya_qr_url: settings.mayaQrUrl,
              ref_code: refTag,
              ...(isCartOrder ? { cart_items: verifiedCartItems } : {})
            },
            status: 'awaiting_payment'
          })
          .select()
          .single();

        if (orderErr || !newOrder) throw orderErr || new Error('Failed to create Maya order');
        const token = generateOrderAccessToken(newOrder.id, newOrder.created_at);
        const res = NextResponse.json({ ok: true, orderId: newOrder.id, orderToken: token, status: 'awaiting_payment' });
        attachOrderAccessCookie(res, newOrder.id, newOrder.created_at);
        return res;
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
            discord_id: verifiedDiscordId || null,
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
              coupon_code: appliedCouponCode,
              discount_amount: appliedDiscountAmount,
              paypal_email: settings.paypalEmail,
              paypal_note: uniqueMemo,
              original_php: basePhp,
              ...(isCartOrder ? { cart_items: verifiedCartItems } : {})
            },
            status: 'awaiting_payment'
          })
          .select()
          .single();

        if (orderErr || !newOrder) throw orderErr || new Error('Failed to create PayPal order');
        const token = generateOrderAccessToken(newOrder.id, newOrder.created_at);
        const res = NextResponse.json({ ok: true, orderId: newOrder.id, orderToken: token, status: 'awaiting_payment' });
        attachOrderAccessCookie(res, newOrder.id, newOrder.created_at);
        return res;
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
            discord_id: verifiedDiscordId || null,
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
              coupon_code: appliedCouponCode,
              discount_amount: appliedDiscountAmount,
              ltc_address: settings.cryptoLtc,
              usdt_address: settings.cryptoUsdt,
              ref_code: refTag,
              original_php: basePhp,
              ...(isCartOrder ? { cart_items: verifiedCartItems } : {})
            },
            status: 'awaiting_payment'
          })
          .select()
          .single();

        if (orderErr || !newOrder) throw orderErr || new Error('Failed to create Crypto order');
        const token = generateOrderAccessToken(newOrder.id, newOrder.created_at);
        const res = NextResponse.json({ ok: true, orderId: newOrder.id, orderToken: token, status: 'awaiting_payment' });
        attachOrderAccessCookie(res, newOrder.id, newOrder.created_at);
        return res;
      }
    }

    // ── CASE B: BALANCE TOP-UP & RESELLER WHOLESALE CREDIT TOP-UP (Strictly GCash Rail) ──
    if (orderType === 'balance_topup' || orderType === 'reseller_topup') {
      const topupPhp = Math.max(50, Number(topupAmount) || 100);
      const refTag = `GCASH-${Math.floor(1000 + Math.random() * 9000)}`;
      const isResellerTopup = orderType === 'reseller_topup';

      const { data: newOrder, error: orderErr } = await supabaseAdmin
        .from('orders')
        .insert({
          discord_id: verifiedDiscordId,
          email: cleanEmail || `${verifiedDiscordId}@discord.asyncdevph.xyz`,
          order_type: isResellerTopup ? 'reseller_topup' : 'balance_topup',
          amount: topupPhp,
          currency: 'PHP',
          provider: 'gcash',
          provider_label: 'GCash',
          payment_details: {
            gcash_number: settings.gcashNumber,
            gcash_name: settings.gcashName,
            gcash_qr_url: settings.gcashQrUrl,
            gcash_enabled: true,
            account_name: settings.gcashName,
            qr_image_url: settings.gcashQrUrl,
            ref_code: refTag,
            target_credit_php: topupPhp,
            is_reseller_pool: isResellerTopup
          },
          status: 'awaiting_payment'
        })
        .select()
        .single();

      if (orderErr || !newOrder) throw orderErr || new Error('Failed to create GCash top-up order');
      const token = generateOrderAccessToken(newOrder.id, newOrder.created_at);
      const res = NextResponse.json({ ok: true, orderId: newOrder.id, orderToken: token, status: 'awaiting_payment' });
      attachOrderAccessCookie(res, newOrder.id, newOrder.created_at);
      return res;
    }

    return NextResponse.json({ ok: false, error: 'Unsupported provider or order configuration' }, { status: 400 });
  } catch (err: any) {
    console.error('[Orders Create] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
