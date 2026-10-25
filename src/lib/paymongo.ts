import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export interface PayMongoConfig {
  secretKey: string | null;
  webhookSecret: string | null;
  isAutomated: boolean;
}

/**
 * Retrieves PayMongo API keys from environment or Supabase config table
 */
export async function getPayMongoConfig(): Promise<PayMongoConfig> {
  const envSecretKey = (
    process.env.PAYMONGO_SECRET_KEY ||
    process.env.PAYMONGO_SECRET ||
    process.env.NEXT_PUBLIC_PAYMONGO_SECRET_KEY
  )?.trim() || null;

  const envWebhookSecret = (
    process.env.PAYMONGO_WEBHOOK_SECRET ||
    process.env.PAYMONGO_WEBHOOK_KEY
  )?.trim() || null;

  let dbSecretKey: string | null = null;
  let dbWebhookSecret: string | null = null;
  let isAutomated = true;

  try {
    const { data: rows } = await supabaseAdmin
      .from('config')
      .select('key, value')
      .in('key', [
        'payment_paymongo_secret_key',
        'payment_paymongo_webhook_secret',
        'payment_paymongo_automated'
      ]);

    if (rows && Array.isArray(rows)) {
      for (const row of rows) {
        if (!row.value) continue;
        const val = String(row.value).trim();
        if (row.key === 'payment_paymongo_secret_key') dbSecretKey = val;
        if (row.key === 'payment_paymongo_webhook_secret') dbWebhookSecret = val;
        if (row.key === 'payment_paymongo_automated') isAutomated = val !== 'false';
      }
    }
  } catch (err) {
    console.warn('[PayMongo] Error fetching config from DB:', err);
  }

  const finalSecretKey = envSecretKey || dbSecretKey;
  const finalWebhookSecret = envWebhookSecret || dbWebhookSecret;

  return {
    secretKey: finalSecretKey,
    webhookSecret: finalWebhookSecret,
    isAutomated: Boolean(finalSecretKey) && isAutomated,
  };
}

/**
 * Validates Paymongo-Signature header against the raw request body.
 * Header format: t=<timestamp>,te=<test_signature>,li=<live_signature>
 */
export function verifyPayMongoSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string
): { isValid: boolean; error?: string } {
  if (!signatureHeader || !webhookSecret) {
    return { isValid: false, error: 'Missing signature header or webhook secret' };
  }

  // Parse t, te, and li from header
  const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, item) => {
    const [k, v] = item.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const timestamp = parts['t'];
  const testSig = parts['te'];
  const liveSig = parts['li'];

  if (!timestamp || (!liveSig && !testSig)) {
    return { isValid: false, error: 'Malformed signature header format' };
  }

  // 1. Replay attack verification: Reject events outside 300s window (5 minutes)
  const eventTimeSec = parseInt(timestamp, 10);
  const currentTimeSec = Math.floor(Date.now() / 1000);
  if (isNaN(eventTimeSec) || Math.abs(currentTimeSec - eventTimeSec) > 300) {
    return { isValid: false, error: 'Webhook timestamp outside acceptable tolerance window (>300s)' };
  }

  // 2. Compute expected HMAC-SHA256
  const payloadToSign = `${timestamp}.${rawBody}`;
  const computedHash = crypto
    .createHmac('sha256', webhookSecret)
    .update(payloadToSign)
    .digest('hex');

  const computedBuffer = Buffer.from(computedHash, 'utf8');

  // Verify against live signature first, then fallback to test signature
  const targetSignatures = [liveSig, testSig].filter(Boolean) as string[];
  let matched = false;

  for (const sig of targetSignatures) {
    const sigBuffer = Buffer.from(sig, 'utf8');
    if (sigBuffer.length === computedBuffer.length && crypto.timingSafeEqual(computedBuffer, sigBuffer)) {
      matched = true;
      break;
    }
  }

  if (!matched) {
    return { isValid: false, error: 'Signature mismatch' };
  }

  return { isValid: true };
}

export interface CreatePayMongoSessionParams {
  orderId: string;
  amountPHP: number;
  productName: string;
  customerEmail?: string | null;
  customerName?: string | null;
  customerDiscordId?: string | null;
  originUrl: string;
  lineItems?: Array<{
    name: string;
    quantity: number;
    amountPHP: number;
  }>;
}

/**
 * Creates a hosted PayMongo Checkout Session via POST /v1/checkout_sessions
 */
export async function createPayMongoCheckoutSession(
  secretKey: string,
  params: CreatePayMongoSessionParams
) {
  const {
    orderId,
    amountPHP,
    productName,
    customerEmail,
    customerName,
    customerDiscordId,
    originUrl,
    lineItems
  } = params;

  // Convert amount to centavos (PHP 1 = 100 centavos). Minimum PayMongo checkout is PHP 20.00 (2000 centavos)
  const totalCentavos = Math.max(2000, Math.round(amountPHP * 100));

  let formattedLineItems: any[] = [];

  if (Array.isArray(lineItems) && lineItems.length > 0) {
    formattedLineItems = lineItems.map((item) => ({
      currency: 'PHP',
      amount: Math.max(2000, Math.round(item.amountPHP * 100)),
      name: item.name || productName || 'ASYNC Product',
      quantity: Math.max(1, item.quantity || 1)
    }));
  } else {
    formattedLineItems = [
      {
        currency: 'PHP',
        amount: totalCentavos,
        name: productName || 'ASYNC Product License',
        quantity: 1
      }
    ];
  }

  const cancelUrl = `${originUrl}/order/${orderId}?canceled=true`;
  const successUrl = `${originUrl}/order/${orderId}?success=true`;

  const payload = {
    data: {
      attributes: {
        billing: {
          email: customerEmail || 'customer@asyncdevph.xyz',
          name: customerName || 'ASYNC Customer'
        },
        send_email_receipt: true,
        show_description: true,
        show_line_items: true,
        cancel_url: cancelUrl,
        success_url: successUrl,
        line_items: formattedLineItems,
        payment_method_types: ['qrph', 'gcash', 'paymaya', 'card', 'billease', 'dob'],
        description: `Order #${orderId.slice(0, 8)} • ASYNC Development`,
        metadata: {
          order_id: orderId,
          discord_id: customerDiscordId || ''
        }
      }
    }
  };

  const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');

  const res = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const json = await res.json();

  if (!res.ok || json.errors) {
    const errorMsg = json.errors?.[0]?.detail || json.errors?.[0]?.code || 'PayMongo session creation failed';
    throw new Error(errorMsg);
  }

  const session = json.data;
  return {
    sessionId: session.id,
    checkoutUrl: session.attributes.checkout_url,
    paymentMethodTypes: session.attributes.payment_method_types
  };
}

