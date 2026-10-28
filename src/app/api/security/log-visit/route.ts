import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getVerifiedDiscordIdFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function getClientIp(headers: Headers): string {
  // 1. Cloudflare real visitor IP header
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) return cfIp.trim();

  // 2. Standard forwarded-for header
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((i) => i.trim());
    // Filter out Cloudflare proxy IP ranges
    const realVisitorIp = ips.find(
      (i) =>
        !i.startsWith('172.68.') &&
        !i.startsWith('172.69.') &&
        !i.startsWith('172.70.') &&
        !i.startsWith('172.71.') &&
        !i.startsWith('108.162.')
    );
    if (realVisitorIp) return realVisitorIp;
    return ips[0];
  }

  // 3. Real IP header fallback
  const realIp = headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();

  return '127.0.0.1';
}

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      path = '/',
      deviceId = null,
    } = body;

    // Resolve IP address
    const ip = getClientIp(request.headers);

    // Resolve verified Discord ID if session token exists
    const token = extractBearerToken(request);
    const verifiedDiscordId = await getVerifiedDiscordIdFromToken(token);

    const userAgent = (request.headers.get('user-agent') || '').slice(0, 255);
    const cleanDeviceId = typeof deviceId === 'string' ? deviceId.trim().slice(0, 64) : null;
    const cleanPath = typeof path === 'string' ? path.trim().slice(0, 128) : '/';

    // Insert visit log into Supabase asynchronously
    const { error } = await supabaseAdmin
      .from('visitor_logs')
      .insert({
        ip_address: ip,
        device_id: cleanDeviceId,
        discord_id: verifiedDiscordId || null,
        path: cleanPath,
        user_agent: userAgent,
        visited_at: new Date().toISOString()
      });

    if (error) {
      console.warn('[Visitor Logger] Insert warning:', error.message);
    }

    return NextResponse.json({ ok: true, ip });
  } catch (err: any) {
    console.warn('[Visitor Logger] Error:', err?.message || err);
    return NextResponse.json({ ok: true });
  }
}
