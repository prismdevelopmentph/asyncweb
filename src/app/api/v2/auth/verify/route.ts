import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const HWID_REGEX = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

function generateSessionToken(licenseId: string, hwid: string): string {
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'async-v2-production-key';
  const timestamp = Date.now();
  const payload = `${licenseId}:${hwid}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64url');
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawKey = body.key || body.license_key;
    const rawHwid = body.hwid;

    if (!rawKey || typeof rawKey !== 'string' || !rawKey.trim()) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: "key".' },
        { status: 400 }
      );
    }

    if (!rawHwid || typeof rawHwid !== 'string' || !rawHwid.trim()) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: "hwid".' },
        { status: 400 }
      );
    }

    const key = rawKey.trim();
    const hwid = rawHwid.trim().toUpperCase();

    if (!HWID_REGEX.test(hwid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid HWID format. Expected standard UUID format (8-4-4-4-12).' },
        { status: 400 }
      );
    }

    // 1. Fetch license by key
    const { data: license, error: fetchErr } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('license_key', key)
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.error('[/api/v2/auth/verify DB Error]:', fetchErr);
      return NextResponse.json(
        { success: false, error: 'Database query failed.' },
        { status: 500 }
      );
    }

    if (!license) {
      return NextResponse.json(
        { success: false, error: 'License key not found. Please verify your key on the dashboard.' },
        { status: 404 }
      );
    }

    // 2. Validate active status
    if (!license.is_active) {
      return NextResponse.json(
        { success: false, error: 'This license has been suspended or deactivated.' },
        { status: 403 }
      );
    }

    // 3. Validate expiration
    if (license.expires_at) {
      const expirationDate = new Date(license.expires_at);
      if (expirationDate <= new Date()) {
        return NextResponse.json(
          { success: false, error: 'License has expired. Please renew your subscription.' },
          { status: 403 }
        );
      }
    }

    // 4. HWID Binding and Verification
    if (!license.hwid) {
      // First activation: bind to this machine
      const { error: bindErr } = await supabaseAdmin
        .from('licenses')
        .update({ hwid: hwid })
        .eq('id', license.id);

      if (bindErr) {
        console.error('[/api/v2/auth/verify Bind Error]:', bindErr);
        return NextResponse.json(
          { success: false, error: 'Failed to bind hardware identifier.' },
          { status: 500 }
        );
      }
    } else if (license.hwid.toUpperCase() !== hwid) {
      // Hardware mismatch: license is locked to another machine
      return NextResponse.json(
        {
          success: false,
          error: 'Hardware Mismatch. License bound to another device. Contact support for an HWID reset.',
        },
        { status: 403 }
      );
    }

    // 5. Generate authenticated session
    const token = generateSessionToken(license.id, hwid);

    return NextResponse.json({
      success: true,
      message: 'Hardware authenticated successfully.',
      license: {
        key: license.license_key,
        tier: license.tier || 'Standard',
        daily_limit: license.daily_limit || 15,
        expires_at: license.expires_at || null,
        bound_hwid: hwid,
      },
      token,
    });
  } catch (err: any) {
    console.error('[/api/v2/auth/verify Exception]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
