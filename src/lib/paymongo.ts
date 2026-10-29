import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export interface PayMongoConfig {
  secretKey: string | null;
  webhookSecret: string | null;
  isAutomated: boolean;
}

const sanitizeKey = (val?: string | null): string | null => {
  if (!val) return null;
  const cleaned = val.trim().replace(/^["']|["']$/g, '');
  return cleaned.length > 0 ? cleaned : null;
};

/**
 * Retrieves PayMongo API keys from environment or Supabase config table
 */
export async function getPayMongoConfig(): Promise<PayMongoConfig> {
  const envSecretKey = sanitizeKey(
    process.env.PAYMONGO_SECRET_KEY ||
    process.env.PAYMONGO_SECRET ||
    process.env.PAYMONGO_SECRET_TOKEN
  );

  const envWebhookSecret = sanitizeKey(
    process.env.PAYMONGO_WEBHOOK_SECRET ||
    process.env.PAYMONGO_WEBHOOK_SECRET_KEY ||
    process.env.PAYMONGO_WEBHOOK_SIGNING_SECRET ||
    process.env.PAYMONGO_SIGNING_SECRET ||
    process.env.PAYMONGO_WEBHOOK_KEY ||
    process.env.PAYMONGO_WEBHOOK_SECRET_TEST
  );

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
        const val = sanitizeKey(String(row.value));
        if (row.key === 'payment_paymongo_secret_key') dbSecretKey = val;
        if (row.key === 'payment_paymongo_webhook_secret') dbWebhookSecret = val;
        if (row.key === 'payment_paymongo_automated') isAutomated = row.value !== 'false';
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

  const cleanSecret = sanitizeKey(webhookSecret) || webhookSecret.trim();

  // Parse t, te, and li from header
  const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, item) => {
    const idx = item.indexOf('=');
    if (idx !== -1) {
      const k = item.slice(0, idx).trim();
      const v = item.slice(idx + 1).trim();
      if (k && v) acc[k] = v;
    }
    return acc;
  }, {});

  const timestamp = parts['t'];
  const testSig = parts['te'];
  const liveSig = parts['li'];

  // 1. Replay attack verification:
  // Allow generous tolerance for webhook retries and test simulations (up to 24h past).
  // Reject only if timestamp is >15 minutes in the future.
  if (timestamp) {
    const eventTimeSec = parseInt(timestamp, 10);
    const currentTimeSec = Math.floor(Date.now() / 1000);
    if (!isNaN(eventTimeSec)) {
      const skew = currentTimeSec - eventTimeSec;
      if (skew < -900) {
        return { isValid: false, error: 'Webhook timestamp is in the future (>900s clock skew)' };
      }
      if (skew > 86400 && !testSig) {
        return { isValid: false, error: 'Webhook timestamp expired (>24h)' };
      }
    }
  }

  // 2. Candidate payload strings: PayMongo standard is `${timestamp}.${rawBody}`
  const candidatePayloads = timestamp ? [`${timestamp}.${rawBody}`, rawBody] : [rawBody];
  const targetSignatures = [testSig, liveSig, signatureHeader.trim()].filter(Boolean) as string[];

  for (const payload of candidatePayloads) {
    const computedHash = crypto
      .createHmac('sha256', cleanSecret)
      .update(payload)
      .digest('hex');

    const computedBuffer = Buffer.from(computedHash, 'utf8');

    for (const sig of targetSignatures) {
      const sigBuffer = Buffer.from(sig, 'utf8');
      if (sigBuffer.length === computedBuffer.length && crypto.timingSafeEqual(computedBuffer, sigBuffer)) {
        return { isValid: true };
      }
    }
  }

  return { isValid: false, error: 'Signature mismatch' };
}

/**
 * Direct PayMongo API lookup for checkout session
 */
export async function getPayMongoCheckoutSession(secretKey: string, sessionId: string) {
  const cleanKey = sanitizeKey(secretKey);
  if (!cleanKey || !sessionId) return null;
  const basicAuth = Buffer.from(`${cleanKey}:`).toString('base64');
  try {
    const res = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn(`[PayMongo] getPayMongoCheckoutSession failed for ${sessionId}:`, err);
    return null;
  }
}

/**
 * Direct PayMongo API lookup for payment
 */
export async function getPayMongoPayment(secretKey: string, paymentId: string) {
  const cleanKey = sanitizeKey(secretKey);
  if (!cleanKey || !paymentId) return null;
  const basicAuth = Buffer.from(`${cleanKey}:`).toString('base64');
  try {
    const res = await fetch(`https://api.paymongo.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn(`[PayMongo] getPayMongoPayment failed for ${paymentId}:`, err);
    return null;
  }
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

  // Single consolidated line item matching exact server-calculated total
  const formattedLineItems = [
    {
      currency: 'PHP',
      amount: totalCentavos,
      name: productName || 'ASYNC Product License',
      quantity: 1
    }
  ];

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

