import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getPayMongoConfig,
  verifyPayMongoSignature,
  getPayMongoCheckoutSession,
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

    console.log(`[PayMongo Webhook] Received incoming event: ${eventType} (ID: ${event?.data?.id})`);

    // 4. Cryptographic Signature Verification
    if (webhookSecret) {
      const verification = verifyPayMongoSignature(rawBody, signatureHeader, webhookSecret);
      if (!verification.isValid) {
        console.error('[PayMongo Webhook] Signature verification failed:', verification.error);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // In production, unsigned webhook requests are strictly forbidden
      if (process.env.NODE_ENV === 'production') {
        console.error('[PayMongo Webhook] PAYMONGO_WEBHOOK_SECRET is not configured in production. Rejecting event.');
        return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
      }
      console.warn('[PayMongo Webhook] No PAYMONGO_WEBHOOK_SECRET configured. Proceeding in development mode.');
    }

    // 5. Single-Authority Fulfillment:
    // Only checkout_session.payment.paid triggers automated fulfillment.
    // Child events (payment.paid, qr.paid) are acknowledged without double-processing.
    if (eventType !== 'checkout_session.payment.paid') {
      console.log(`[PayMongo Webhook] Acknowledged non-fulfillment event: ${eventType}`);
      return NextResponse.json({ received: true, ignored: true, reason: 'Child event acknowledged' });
    }

    const sessionId = eventData?.id;
    if (!sessionId) {
      console.error('[PayMongo Webhook] Missing checkout session ID in event data.');
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // 6. Remote Verification with PayMongo API (Authoritative Server-to-Server Lookup)
    let remoteSession: any = null;
    if (secretKey) {
      remoteSession = await getPayMongoCheckoutSession(secretKey, sessionId);
      if (!remoteSession) {
        console.error(`[PayMongo Webhook] Remote checkout session ${sessionId} not found via PayMongo API.`);
        return NextResponse.json({ error: 'Remote checkout session not found' }, { status: 404 });
      }

      const remoteStatus = remoteSession.attributes?.status;
      const remotePayments = Array.isArray(remoteSession.attributes?.payments) ? remoteSession.attributes.payments : [];
      const hasPaidPayment = remotePayments.some((p: any) => p.attributes?.status === 'paid');

      if (remoteStatus !== 'paid' && !hasPaidPayment) {
        console.warn(`[PayMongo Webhook] Remote checkout session ${sessionId} status is '${remoteStatus}', not paid.`);
        return NextResponse.json({ received: true, ignored: true, reason: 'Session not paid' });
      }
    }

    // Authoritative attributes from remote session if available, falling back to verified signed event
    const authoritativeSession = remoteSession || eventData;
    const authoritativeAttrs = authoritativeSession.attributes || {};
    const authoritativeMetadata = authoritativeAttrs.metadata || {};

    // 7. Order Resolution & Session Binding Guard
    let order: any = null;

    // A) Match by Checkout Session ID recorded in order.payment_details
    const { data: orderBySession } = await supabaseAdmin
      .from('orders')
      .select('*')
      .contains('payment_details', { paymongo_checkout_session_id: sessionId })
      .maybeSingle();

    if (orderBySession) {
      order = orderBySession;
    }

    // B) Match by Order ID from authoritative metadata
    if (!order) {
      const orderIdFromMeta = authoritativeMetadata.order_id || authoritativeMetadata.orderId;
      if (orderIdFromMeta) {
        const { data: orderByMeta } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', orderIdFromMeta)
          .maybeSingle();

        if (orderByMeta) {
          order = orderByMeta;
        }
      }
    }

    if (!order) {
      console.warn(`[PayMongo Webhook] Could not locate order for session ${sessionId}.`);
      return NextResponse.json({ received: true, error: 'Order not found' });
    }

    // Session binding validation: if the order already recorded a session ID, it MUST match
    if (
      order.payment_details?.paymongo_checkout_session_id &&
      order.payment_details.paymongo_checkout_session_id !== sessionId
    ) {
      console.error(
        `[PayMongo Webhook] Session mismatch for order ${order.id}. Bound: ${order.payment_details.paymongo_checkout_session_id}, Received: ${sessionId}`
      );
      return NextResponse.json({ error: 'Session ID mismatch' }, { status: 400 });
    }

    // 8. Replay & Idempotency Guards
    if (order.status === 'delivered' || order.status === 'processing') {
      console.log(`[PayMongo Webhook] Order ${order.id} is already ${order.status}. Acknowledging.`);
      return NextResponse.json({ received: true, alreadyFulfilled: true });
    }

    if (order.payment_details?.paymongo_event_id === event?.data?.id) {
      console.log(`[PayMongo Webhook] Webhook event ${event?.data?.id} already processed for order ${order.id}.`);
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    // 9. Authoritative Amount Extraction & Underpayment Guard
    const paymentsList = Array.isArray(authoritativeAttrs.payments) ? authoritativeAttrs.payments : [];
    const primaryPayment = paymentsList[0]?.attributes || null;
    const paymentId = paymentsList[0]?.id || null;
    const paymentSourceType = primaryPayment?.source?.type || 'paymongo_checkout';

    const paidCentavos = Number(primaryPayment?.amount);
    const expectedCentavos = Math.max(2000, Math.round(Number(order.amount) * 100));

    if (!Number.isFinite(paidCentavos) || paidCentavos < expectedCentavos) {
      console.error(
        `[PayMongo Webhook] Underpayment detected for order ${order.id}. Expected: ${expectedCentavos} centavos, Received: ${paidCentavos} centavos.`
      );

      const mismatchNow = new Date().toISOString();
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'payment_mismatch',
          payment_details: {
            ...(order.payment_details || {}),
            mismatch_reason: `Expected ${expectedCentavos} centavos, received ${paidCentavos} centavos`,
            paymongo_checkout_session_id: sessionId,
            paymongo_payment_id: paymentId,
            paymongo_event_id: event?.data?.id,
            mismatch_detected_at: mismatchNow
          }
        })
        .eq('id', order.id)
        .in('status', ['awaiting_payment', 'pending', 'cancelled']);

      return NextResponse.json({ received: true, mismatch: true });
    }

    if (paidCentavos > expectedCentavos) {
      console.warn(
        `[PayMongo Webhook] Overpayment noticed for order ${order.id}. Expected: ${expectedCentavos} centavos, Received: ${paidCentavos} centavos. Proceeding with fulfillment.`
      );
    }

    // 10. Atomic Order Claiming (Concurrency Lock)
    const nowIso = new Date().toISOString();
    const existingDetails = order.payment_details || {};

    const { data: claimedOrder, error: claimErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        paid_at: order.paid_at || nowIso,
        payment_details: {
          ...existingDetails,
          paymongo_checkout_session_id: sessionId,
          paymongo_payment_id: paymentId,
          paymongo_event_id: event?.data?.id,
          paymongo_payment_type: paymentSourceType,
          paymongo_paid_at: nowIso,
          paymongo_raw_event: eventType,
        }
      })
      .eq('id', order.id)
      .in('status', ['awaiting_payment', 'pending'])
      .select('id, order_type, discord_id, amount, payment_details')
      .maybeSingle();

    if (claimErr || !claimedOrder) {
      console.log(`[PayMongo Webhook] Order ${order.id} was already claimed by another worker or admin.`);
      return NextResponse.json({ received: true, alreadyClaimed: true });
    }

    // 11. Automated Zero-Touch Fulfillment
    if (order.order_type === 'product_purchase') {
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
    }

    if (order.order_type === 'balance_topup') {
      const creditAmount = Number(order.payment_details?.target_credit_php || order.amount || 0);
      const discordId = order.discord_id;

      if (discordId && creditAmount > 0) {
        let credited = false;
        let retries = 3;
        while (retries > 0 && !credited) {
          const { data: existing } = await supabaseAdmin
            .from('user_balances')
            .select('balance_php')
            .eq('discord_id', discordId)
            .maybeSingle();

          if (!existing) {
            const { error: insErr } = await supabaseAdmin
              .from('user_balances')
              .insert({
                discord_id: discordId,
                balance_php: creditAmount,
                updated_at: nowIso
              });
            if (!insErr) {
              credited = true;
              break;
            }
          } else {
            const current = Number(existing.balance_php || 0);
            const newBal = current + creditAmount;

            const { data: updateRes, error: updErr } = await supabaseAdmin
              .from('user_balances')
              .update({
                balance_php: newBal,
                updated_at: nowIso
              })
              .eq('discord_id', discordId)
              .eq('balance_php', current)
              .select('balance_php')
              .maybeSingle();

            if (!updErr && updateRes) {
              credited = true;
              break;
            }
          }
          retries--;
        }

        if (!credited) {
          console.error(`[PayMongo Webhook] [CRITICAL] Failed to credit balance for top-up order ${order.id} to user ${discordId}`);
        }
      }

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: nowIso
        })
        .eq('id', order.id);

      return NextResponse.json({
        received: true,
        orderId: order.id,
        fulfilled: true
      });
    }

    return NextResponse.json({ received: true, orderId: order.id });
  } catch (err: any) {
    console.error('[PayMongo Webhook Error]:', err);
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
}

