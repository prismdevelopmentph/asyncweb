import 'server-only';
import crypto from 'crypto';

const HMAC_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.DISCORD_CLIENT_SECRET ||
  'async-order-cryptographic-salt-v1';

/**
 * Generates a signed cryptographic token establishing client possession of an order.
 */
export function generateOrderAccessToken(orderId: string, createdAt: string): string {
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(`${orderId}:${createdAt}`)
    .digest('hex');
}

/**
 * Validates the HMAC signature for guest order authorization.
 */
export function verifyOrderAccessToken(
  orderId: string,
  createdAt: string,
  providedToken: string
): boolean {
  if (!providedToken || typeof providedToken !== 'string') return false;
  const expected = generateOrderAccessToken(orderId, createdAt);
  try {
    const a = Buffer.from(providedToken, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
