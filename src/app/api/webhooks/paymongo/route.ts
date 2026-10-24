import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPayMongoConfig, verifyPayMongoSignature } from '@/lib/paymongo';
import { fulfillProductOrder } from '@/lib/fulfillment';

export async function POST(req: NextRequest) {
  try {
    // 1. Read raw body as unparsed text for cryptographic HMAC verification
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('paymongo-signature');

    // 2. Fetch configured Webhook Secret
    const { webhookSecret } = await getPayMongoConfig();

    if (webhookSecret) {
      const verification = verifyPayMongoSignature(rawBody, signatureHeader, webhookSecret);
      if (!verification.isValid) {
        console.error('[PayMongo Webhook] Signature verification failed:', verification.error);
        return NextResponse.json({ error: verification.error || 'Invalid signature' }, { status: 400 });
      }
    } else {
      console.warn('[PayMongo Webhook] Warning: PAYMONGO_WEBHOOK_SECRET is not configured. Skipping cryptographic verification.');
    }

    // 3. Parse JSON event payload
    let event: any = null;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = event?.data?.attributes?.type;
    const eventData = event?.data?.attributes?.data;
    const eventAttributes = eventData?.attributes || {};
    const metadata = eventAttributes.metadata || {};

    console.log(`[PayMongo Webhook] Received event: ${eventType}`);

    // We listen to checkout_session.payment.paid and direct payment.paid events
    const isPaidEvent =
      eventType === 'checkout_session.payment.paid' ||
      eventType === 'payment.paid' ||
      eventType === 'source.chargeable';

    if (!isPaidEvent) {
      return NextResponse.json({ received: true, ignored: true, eventType });
    }

    // 4. Resolve Order ID from metadata or description
    const orderId = metadata.order_id || metadata.orderId;

    if (!orderId) {
      console.warn('[PayMongo Webhook] No order_id found in event metadata.');
      return NextResponse.json({ received: true, error: 'No order_id in metadata' });
    }

    // 5. Fetch order from database
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order) {
      console.error(`[PayMongo Webhook] Order ${orderId} not found in database.`);
      return NextResponse.json({ received: true, error: 'Order not found' });
    }

    if (order.status === 'delivered') {
      console.log(`[PayMongo Webhook] Order ${orderId} is already fulfilled. Skipping.`);
      return NextResponse.json({ received: true, alreadyFulfilled: true });
    }

    // 6. Extract payment transaction metadata
    const payments = Array.isArray(eventAttributes.payments) ? eventAttributes.payments : [];
    const primaryPayment = payments[0]?.attributes || (eventType === 'payment.paid' ? eventAttributes : null);
    const paymentId = payments[0]?.id || (eventType === 'payment.paid' ? eventData?.id : null);
    const paymentSourceType = primaryPayment?.source?.type || 'paymongo_checkout';

    const nowIso = new Date().toISOString();
    const existingDetails = order.payment_details || {};

    // 7. Update order to 'paid' status before fulfillment
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        paid_at: order.paid_at || nowIso,
        payment_details: {
          ...existingDetails,
          paymongo_payment_id: paymentId,
          paymongo_event_id: event?.data?.id,
          paymongo_payment_type: paymentSourceType,
          paymongo_paid_at: nowIso,
          paymongo_raw_event: eventType,
        }
      })
      .eq('id', order.id);

    // 8. Trigger Automated Zero-Touch Fulfillment
    const fulfillment = await fulfillProductOrder(order.id);

    if (fulfillment.success) {
      console.log(`[PayMongo Webhook] Order ${order.id} automatically fulfilled. License: ${fulfillment.licenseKey}`);
    } else {
      console.error(`[PayMongo Webhook] Automated fulfillment error for order ${order.id}:`, fulfillment.error);
    }

    return NextResponse.json({
      received: true,
      orderId: order.id,
      fulfilled: fulfillment.success
    });
  } catch (err: any) {
    console.error('[PayMongo Webhook Error]:', err);
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
}
