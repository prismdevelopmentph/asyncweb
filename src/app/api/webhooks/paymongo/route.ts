import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getPayMongoConfig,
  verifyPayMongoSignature,
  getPayMongoCheckoutSession,
  getPayMongoPayment
} from '@/lib/paymongo';
import { fulfillProductOrder } from '@/lib/fulfillment';

export async function POST(req: NextRequest) {
  try {
    // 1. Read raw body as unparsed text for cryptographic HMAC verification
    const rawBody = await req.text();
    const signatureHeader =
      req.headers.get('paymongo-signature') ||
      req.headers.get('x-paymongo-signature') ||
      req.headers.get('signature');

    // 2. Fetch configured PayMongo keys
    const { secretKey, webhookSecret } = await getPayMongoConfig();

    // 3. Parse JSON event payload first so fallback verifications can inspect it
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

    console.log(`[PayMongo Webhook] Received incoming event: ${eventType} (ID: ${event?.data?.id})`);

    // 4. Verify authenticity
    let isAuthentic = false;

    if (webhookSecret) {
      const verification = verifyPayMongoSignature(rawBody, signatureHeader, webhookSecret);
      if (verification.isValid) {
        isAuthentic = true;
      } else {
        console.warn('[PayMongo Webhook] Signature verification failed:', verification.error);
      }
    }

    // Direct TLS API fallback: If signature failed or secret wasn't configured,
    // verify the event directly against PayMongo's authenticated API using secretKey
    if (!isAuthentic && secretKey) {
      try {
        if (eventType === 'checkout_session.payment.paid' && eventData?.id) {
          const remoteSession = await getPayMongoCheckoutSession(secretKey, eventData.id);
          const payments = remoteSession?.attributes?.payments || [];
          if (
            remoteSession?.attributes?.status === 'paid' ||
            payments.some((p: any) => p.attributes?.status === 'paid')
          ) {
            console.log('[PayMongo Webhook] Direct API verification confirmed checkout session is PAID.');
            isAuthentic = true;
          }
        } else if (
          (eventType === 'payment.paid' || eventType === 'qr.paid') &&
          eventData?.id
        ) {
          const remotePayment = await getPayMongoPayment(secretKey, eventData.id);
          if (remotePayment?.attributes?.status === 'paid') {
            console.log('[PayMongo Webhook] Direct API verification confirmed payment is PAID.');
            isAuthentic = true;
          }
        }
      } catch (apiErr) {
        console.warn('[PayMongo Webhook] Direct API fallback check error:', apiErr);
      }
    }

    // In test mode or when no webhook secret is set, log and proceed if we have valid event structure
    if (!isAuthentic && !webhookSecret) {
      console.warn('[PayMongo Webhook] No PAYMONGO_WEBHOOK_SECRET configured. Proceeding in unauthenticated dev mode.');
      isAuthentic = true;
    }

    if (!isAuthentic) {
      console.error('[PayMongo Webhook] Event rejected: unauthenticated signature and API fallback failed.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Single-Authority Fulfillment: PayMongo standard for hosted Checkout Sessions
    // is to listen exclusively to checkout_session.payment.paid. Child events like
    // payment.paid and qr.paid are safely acknowledged (HTTP 200) without double-minting licenses.
    if (eventType !== 'checkout_session.payment.paid') {
      console.log(`[PayMongo Webhook] Acknowledged child event: ${eventType} (Fulfillment handled by checkout_session.payment.paid).`);
      return NextResponse.json({ received: true, ignored: true, reason: 'Child event acknowledged' });
    }

    // 5. Multi-Strategy Order ID Resolution:
    // A) Metadata order_id / orderId
    let orderId: string | null = metadata.order_id || metadata.orderId || null;
    let order: any = null;

    if (orderId) {
      const { data } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      if (data) order = data;
    }

    // B) Description regex prefix matching (e.g., "Order #075d0509 • ASYNC Development")
    if (!order) {
      const desc = String(eventAttributes.description || '');
      const descMatch = desc.match(/(?:Order\s*#?|order_id=)([a-f0-9-]{8,36})/i);
      if (descMatch && descMatch[1]) {
        const prefix = descMatch[1].trim();
        const { data } = await supabaseAdmin
          .from('orders')
          .select('*')
          .ilike('id', `${prefix}%`)
          .maybeSingle();
        if (data) {
          order = data;
          orderId = data.id;
        }
      }
    }

    // C) Match by Checkout Session ID in payment_details
    if (!order) {
      const targetSessionId =
        (eventType === 'checkout_session.payment.paid' ? eventData?.id : null) ||
        eventAttributes.checkout_session_id ||
        null;

      if (targetSessionId) {
        const { data } = await supabaseAdmin
          .from('orders')
          .select('*')
          .contains('payment_details', { paymongo_checkout_session_id: targetSessionId })
          .maybeSingle();
        if (data) {
          order = data;
          orderId = data.id;
        }
      }
    }

    if (!order) {
      console.warn(`[PayMongo Webhook] Could not locate order for event ${eventType}. Description: "${eventAttributes.description}"`);
      // Return 200 so PayMongo does not spam retries for unknown external orders
      return NextResponse.json({ received: true, error: 'Order not found in database' });
    }

    // If order already reached terminal fulfillment or is currently fulfilling, exit cleanly
    if (order.status === 'delivered' || order.status === 'processing' || order.license_key) {
      console.log(`[PayMongo Webhook] Order ${order.id} is already fulfilled or processing. Acknowledging webhook.`);
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

