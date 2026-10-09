import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { reason = 'DevTools Inspection Detected', url = 'https://asyncdevph.xyz', userAgent = '', userId = null } = body;

    // Resolve visitor IP address from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    let ip = forwarded ? forwarded.split(',')[0].trim() : realIp || '127.0.0.1';

    if (ip === '::1' || ip === '127.0.0.1') {
      ip = '112.204.180.1'; // fallback development IP
    }

    // Insert or update lockout record in Supabase security_lockouts
    const { data, error } = await supabaseAdmin
      .from('security_lockouts')
      .upsert(
        {
          ip_address: ip,
          reason,
          user_agent: userAgent || request.headers.get('user-agent') || 'Unknown',
          url,
          discord_user_id: userId,
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
