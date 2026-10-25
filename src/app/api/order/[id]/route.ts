import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPayMongoConfig, getPayMongoCheckoutSession } from '@/lib/paymongo';
import { fulfillProductOrder } from '@/lib/fulfillment';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Order ID is required' }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, products:product_id(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    let details = order.payment_details || {};
    const product = order.products;

    // Dual-Rail Auto-Fulfillment: If customer returns from PayMongo checkout
    // but webhook hasn't processed yet, poll PayMongo API directly in real-time
    if (order.status === 'awaiting_payment' && details.paymongo_checkout_session_id) {
      try {
        const { secretKey } = await getPayMongoConfig();
        if (secretKey) {
          const remoteSession = await getPayMongoCheckoutSession(
            secretKey,
            details.paymongo_checkout_session_id
          );
          const payments = remoteSession?.attributes?.payments || [];
          const isPaid =
            remoteSession?.attributes?.status === 'paid' ||
            payments.some((p: any) => p.attributes?.status === 'paid');

          if (isPaid) {
            const nowIso = new Date().toISOString();
            const primaryPayment = payments[0]?.attributes;
            const paymentId = payments[0]?.id;

            details = {
              ...details,
              paymongo_payment_id: paymentId,
              paymongo_paid_at: nowIso,
              paymongo_status: 'paid'
            };

            await supabaseAdmin
              .from('orders')
              .update({
                status: 'paid',
                paid_at: order.paid_at || nowIso,
                payment_details: details
              })
              .eq('id', order.id);

            const fulfillRes = await fulfillProductOrder(order.id);
            if (fulfillRes.success) {
              order.status = 'delivered';
              order.delivered_at = nowIso;
              order.license_key = fulfillRes.licenseKey;
            } else {
              order.status = 'paid';
              order.paid_at = nowIso;
            }
          }
        }
      } catch (pmSyncErr) {
        console.warn('[API Order Get] Active PayMongo sync error:', pmSyncErr);
      }
    }

    // 15-Minute Payment Lock & Auto-Cancellation Logic
    const LOCK_WINDOW_SECONDS = 15 * 60; // 900s
    const createdAtMs = new Date(order.created_at).getTime();
    const nowMs = Date.now();
    const elapsedSeconds = Math.floor((nowMs - createdAtMs) / 1000);
    const remainingSeconds = Math.max(0, LOCK_WINDOW_SECONDS - elapsedSeconds);
    const expiresAt = new Date(createdAtMs + LOCK_WINDOW_SECONDS * 1000).toISOString();
    const hasSubmittedRef = Boolean(details.customer_reference || details.reference_submitted_at);

    // If awaiting payment, over 15 minutes elapsed, and no reference was submitted: auto-cancel
    if (order.status === 'awaiting_payment' && !hasSubmittedRef && elapsedSeconds >= LOCK_WINDOW_SECONDS) {
      const updatedDetails = {
        ...details,
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'system_lock_expired',
        cancellation_reason: '15-minute payment lock expired without payment proof'
      };

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'cancelled',
          payment_details: updatedDetails
        })
        .eq('id', id);

      order.status = 'cancelled';
    }

    // Mask email for privacy (e.g. al***@gmail.com)
    const rawEmail = order.email || '';
    const [userPart, domainPart] = rawEmail.split('@');
    const maskedEmail = domainPart
      ? `${userPart.slice(0, 2)}***@${domainPart}`
      : rawEmail;

    // Resolve human tier name
    const tierKey = order.tier_key || 'daily';
    const tierName =
      tierKey === 'daily'
        ? '1 Day'
        : tierKey === 'weekly'
        ? '7 Days'
        : tierKey === 'monthly'
        ? '30 Days'
        : 'Lifetime';

    const cartItems = details.cart_items;
    const items =
      order.order_type === 'balance_topup'
        ? [
            {
              productName: 'Web Balance Account Top-Up',
              variantName: `${order.currency === 'PHP' ? '₱' : '$'}${order.amount} Credits`,
              quantity: 1,
              unitPrice: Number(order.amount),
              lineTotal: Number(order.amount)
            }
          ]
        : Array.isArray(cartItems) && cartItems.length > 0
        ? cartItems.map((ci: any) => {
            const unitPrice =
              order.currency === 'USD'
                ? Number(ci.priceUSD || 0)
                : Number(ci.pricePHP || 0);
            const qty = Number(ci.quantity || 1);
            return {
              productName: ci.title || 'ASYNC Product',
              variantName: ci.tierName || `${tierName} Access Tier`,
              quantity: qty,
              unitPrice: unitPrice,
              lineTotal: unitPrice * qty
            };
          })
        : [
            {
              productName: product?.title || 'ASYNC Software License',
              variantName: `${tierName} Access Tier`,
              quantity: 1,
              unitPrice: Number(order.amount),
              lineTotal: Number(order.amount)
            }
          ];

    return NextResponse.json({
      ok: true,
      id: order.id,
      status: order.status,
      provider: order.provider,
      providerLabel: order.provider_label,
      email: maskedEmail,
      amount: Number(order.amount),
      total: Number(order.amount),
      subtotal: Number(details.base_amount || order.amount),
      baseAmount: Number(details.base_amount || order.amount),
      feeAmount: Number(details.fee_amount || 0),
      feePercent: Number(details.fee_percent || 0),
      currency: order.currency,
      paypalEmail: details.paypal_email || null,
      paypalNote: details.paypal_note || null,
      gcashNumber: details.gcash_number || null,
      gcashName: details.gcash_name || null,
      gcashQrUrl: details.gcash_qr_url || null,
      gcashEnabled: details.gcash_enabled !== undefined ? Boolean(details.gcash_enabled) : true,
      mayaNumber: details.maya_number || null,
      mayaName: details.maya_name || null,
      mayaQrUrl: details.maya_qr_url || null,
      mayaEnabled: details.maya_enabled !== undefined ? Boolean(details.maya_enabled) : true,
      paymongoQrUrl: details.qr_image_url || null,
      paymongoName: details.account_name || null,
      paymongoCheckoutUrl: details.paymongo_checkout_url || null,
      paymongoSessionId: details.paymongo_checkout_session_id || null,
      cryptoLtc: details.ltc_address || null,
      cryptoUsdt: details.usdt_address || null,
      qrImageUrl: details.qr_image_url || details.gcash_qr_url || details.maya_qr_url || null,
      refCode: details.ref_code || null,
      customerRef: details.customer_reference || null,
      rejectionReason: details.rejection_reason || null,
      hasSubmittedRef,
      createdAt: order.created_at,
      paidAt: order.paid_at,
      deliveredAt: order.delivered_at,
      licenseKey: order.status === 'delivered' ? order.license_key : null,
      couponCode: details.coupon_code || null,
      discountAmount: Number(details.discount_amount || 0),
      expiresAt,
      remainingSeconds,
      lockWindowSeconds: LOCK_WINDOW_SECONDS,
      items
    });
  } catch (err: any) {
    console.error('[API Order Get] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

