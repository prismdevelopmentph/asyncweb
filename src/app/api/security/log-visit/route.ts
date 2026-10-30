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
      deviceInfo = null,
    } = body;

    // Resolve IP address
    const ip = getClientIp(request.headers);

    // Resolve Edge Geolocation headers (Cloudflare & Vercel)
    const headers = request.headers;
    const country = (headers.get('cf-ipcountry') || headers.get('x-vercel-ip-country') || '').trim();
    const city = (headers.get('cf-ipcity') || headers.get('x-vercel-ip-city') || '').trim();
    const region = (headers.get('cf-region') || headers.get('x-vercel-ip-country-region') || '').trim();

    // Format clean location string (e.g. "Manila, Metro Manila, PH" or "Dallas, Texas, US")
    const geoParts = [city, region, country].filter(Boolean);
    const locationStr = geoParts.length > 0 ? geoParts.join(', ') : null;

    // Resolve verified Discord ID if session token exists
    const token = extractBearerToken(request);
    const verifiedDiscordId = await getVerifiedDiscordIdFromToken(token);

    const cleanDeviceId = typeof deviceId === 'string' ? deviceId.trim().slice(0, 64) : null;
    const cleanPath = typeof path === 'string' ? path.trim().slice(0, 128) : '/';

    // Enrich deviceInfo with geolocation and VPN detection flags
    let finalDeviceInfo = deviceInfo && typeof deviceInfo === 'object' ? { ...deviceInfo } : {};
    if (locationStr) {
      finalDeviceInfo.location = locationStr;
    }
    if (country) {
      finalDeviceInfo.country = country;
    }

    // Timezone & VPN Discrepancy Heuristic:
    // If IP is from US/EU, but client clock timezone is Asia/Manila, flag as possible VPN
    const clientTz = (finalDeviceInfo.timezone || '').toLowerCase();
    if (country && clientTz) {
      const isPhIp = country.toUpperCase() === 'PH';
      const isPhTz = clientTz.includes('manila') || clientTz.includes('singapore') || clientTz.includes('taipei');
      if (!isPhIp && isPhTz) {
        finalDeviceInfo.vpn_flag = true;
        finalDeviceInfo.vpn_note = `IP: ${country} vs Clock: ${finalDeviceInfo.timezone}`;
      }
    }

    const insertPayload: any = {
      ip_address: ip,
      device_id: cleanDeviceId,
      discord_id: verifiedDiscordId || null,
      path: cleanPath,
      visited_at: new Date().toISOString()
    };

    if (Object.keys(finalDeviceInfo).length > 0) {
      insertPayload.device_info = finalDeviceInfo;
    }

    // Insert visit log into Supabase asynchronously
    let { error } = await supabaseAdmin
      .from('visitor_logs')
      .insert(insertPayload);

    // Schema resilience: if device_info column does not exist yet, retry without it
    if (error && error.message?.toLowerCase().includes('device_info')) {
      delete insertPayload.device_info;
      const retry = await supabaseAdmin.from('visitor_logs').insert(insertPayload);
      error = retry.error;
    }

    if (error) {
      console.warn('[Visitor Logger] Insert warning:', error.message);
    }

    return NextResponse.json({ ok: true, ip });
  } catch (err: any) {
    console.warn('[Visitor Logger] Error:', err?.message || err);
    return NextResponse.json({ ok: true });
  }
}

