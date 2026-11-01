import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Sliding-window IP rate limiter: 15 verification checks per 60 seconds per IP
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const verifyRateLimitStore: Map<string, RateLimitBucket> =
  (globalThis as any).__async_verify_ratelimit_store ||
  ((globalThis as any).__async_verify_ratelimit_store = new Map<string, RateLimitBucket>());

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 15;

function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) return cfIp.trim();
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();
  return '127.0.0.1';
}

function checkVerifyRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  if (!ip) return { allowed: true, retryAfter: 0 };
  const now = Date.now();
  const bucket = verifyRateLimitStore.get(ip);

  // Prune map if size exceeds 5000 entries
  if (verifyRateLimitStore.size > 5000) {
    for (const [k, v] of verifyRateLimitStore.entries()) {
      if (v.resetAt <= now) verifyRateLimitStore.delete(k);
    }
  }

  if (!bucket || bucket.resetAt <= now) {
    verifyRateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (bucket.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkVerifyRateLimit(clientIp);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          found: false,
          valid: false,
          error: `Rate limit exceeded. Please wait ${rateCheck.retryAfter}s before verifying more keys.`,
          code: 'RATE_LIMITED'
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.retryAfter)
          }
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawKey = body.key || body.license_key || body.licenseKey;

    if (!rawKey || typeof rawKey !== 'string' || !rawKey.trim()) {
      return NextResponse.json(
        { found: false, valid: false, error: 'Please enter a license key to verify.' },
        { status: 400 }
      );
    }

    const key = rawKey.trim().toUpperCase();

    // Fast structural check: Reject obvious non-keys before hitting PostgreSQL
    if (!key.startsWith('LIC-') || key.length < 8) {
      return NextResponse.json({
        found: false,
        valid: false,
        message: 'License token not recognized in ASYNC database. Beware of unauthorized resellers.'
      });
    }

    // Query production licenses table
    const { data: license, error } = await supabaseAdmin
      .from('licenses')
      .select('license_key, is_active, tier, daily_limit, expires_at, redeemed_by, redeemed_at, vouch_given, created_at')
      .eq('license_key', key)
      .maybeSingle();

    if (error) {
      console.error('License lookup error:', error);
      return NextResponse.json(
        { found: false, valid: false, error: 'Database query failed during verification.' },
        { status: 500 }
      );
    }

    if (!license) {
      return NextResponse.json({
        found: false,
        valid: false,
        message: 'License token not recognized in ASYNC database. Beware of unauthorized resellers.'
      });
    }

    // Format tier display label
    let tierLabel = 'Single Access Tier';
    const tierRaw = (license.tier || '').toLowerCase();
    if (tierRaw.includes('all') || tierRaw.includes('unlimited')) {
      tierLabel = 'All-Access Unlimited Pass';
    } else if (tierRaw.includes('fivem') || tierRaw.includes('bundle')) {
      tierLabel = 'FiveM Package Bundle';
    } else if (tierRaw.includes('per-service') || tierRaw.includes('single')) {
      tierLabel = 'Single Service Generator License';
    } else if (license.tier) {
      tierLabel = license.tier.toUpperCase();
    }

    const maskedOwner = license.redeemed_by
      ? `${license.redeemed_by.slice(0, 4)}...${license.redeemed_by.slice(-4)}`
      : 'Unclaimed // Ready for Activation';

    return NextResponse.json({
      found: true,
      valid: Boolean(license.is_active),
      tier: tierLabel,
      dailyLimit: license.daily_limit ?? 'Standard Limit',
      expiresAt: license.expires_at
        ? new Date(license.expires_at).toLocaleDateString()
        : (license.redeemed_by ? 'Lifetime Access' : 'Starts upon activation'),
      createdAt: license.created_at ? new Date(license.created_at).toLocaleDateString() : 'N/A',
      isRedeemed: Boolean(license.redeemed_by),
      maskedOwner,
      vouchGiven: Boolean(license.vouch_given)
    });
  } catch (err: any) {
    console.error('Verify endpoint error:', err);
    return NextResponse.json(
      { found: false, valid: false, error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Only return real licenses with vouch_given = true
    const { data: vouches, error } = await supabaseAdmin
      .from('licenses')
      .select('id, tier, redeemed_by, created_at')
      .eq('vouch_given', true)
      .limit(10);

    if (error || !vouches) {
      return NextResponse.json({ vouches: [] });
    }

    return NextResponse.json({ vouches });
  } catch {
    return NextResponse.json({ vouches: [] });
  }
}

