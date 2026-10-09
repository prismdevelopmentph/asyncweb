import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function getClientIp(headers: Headers): string {
  // 1. Cloudflare real visitor IP header (Highest priority)
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) return cfIp.trim();

  // 2. Standard forwarded-for header
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((i) => i.trim());
    // Filter out Cloudflare proxy IP ranges (172.68.x.x - 172.71.x.x, 108.162.x.x)
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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      reason = 'DevTools Inspection Detected',
      url = 'https://asyncdevph.xyz',
      userAgent = '',
      userId = null,
      deviceId = null,
    } = body;

    // Resolve visitor IP address using Cloudflare & Vercel headers
    let ip = getClientIp(request.headers);

    if (ip === '::1' || ip === '127.0.0.1') {
      ip = '112.204.180.1'; // fallback development IP
    }

    // Insert or update lockout record in Supabase security_lockouts
    const targetUserId = userId || deviceId || null;

    const { data, error } = await supabaseAdmin
      .from('security_lockouts')
      .upsert(
        {
          ip_address: ip,
          reason,
          user_agent: userAgent || request.headers.get('user-agent') || 'Unknown',
          url,
          discord_user_id: targetUserId,
          is_banned: true,
          notified_discord: false,
          created_at: new Date().toISOString()
        },
        { onConflict: 'ip_address' }
      )
      .select();

    if (error) {
      console.error('[Security Lockout API] Database error:', error);
      return NextResponse.json({ error: 'Database record failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ip, record: data?.[0] });
  } catch (err: any) {
    console.error('[Security Lockout API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
