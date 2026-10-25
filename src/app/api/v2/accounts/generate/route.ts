import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

async function verifySessionToken(request: Request): Promise<{ claimedBy: string; licenseId: string } | null> {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('x-session-token');
    if (!authHeader) return null;

    const rawToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    if (!rawToken) return null;

    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      console.error('[/api/v2/accounts/generate] SESSION_SECRET is not configured in server environment.');
      return null;
    }

    const decoded = JSON.parse(Buffer.from(rawToken, 'base64url').toString('utf8'));
    const { payload, signature } = decoded;
    if (!payload || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const sigBuffer = Buffer.from(signature, 'utf8');
    const expBuffer = Buffer.from(expectedSig, 'utf8');
    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      return null;
    }

    const [licId, hwid, timestampStr] = payload.split(':');
    if (!licId) return null;

    const tokenTime = Number(timestampStr);
    // Reject tokens older than 24 hours
    if (!tokenTime || Date.now() - tokenTime > 24 * 60 * 60 * 1000) {
      return null;
    }

    // Re-verify that the license is still active, not revoked, not expired, and HWID matches
    const { data: license, error: licErr } = await supabaseAdmin
      .from('licenses')
      .select('id, is_active, expires_at, redeemed_by, license_key, hwid')
      .eq('id', licId)
      .limit(1)
      .maybeSingle();

    if (licErr || !license || !license.is_active) {
      return null;
    }

    if (license.expires_at && new Date(license.expires_at) <= new Date()) {
      return null;
    }

    if (hwid && license.hwid && String(license.hwid).trim().toUpperCase() !== hwid.trim().toUpperCase()) {
      return null;
    }

    const claimedBy = license.redeemed_by ? String(license.redeemed_by) : String(license.license_key);
    return { claimedBy, licenseId: license.id };
  } catch (err) {
    console.warn('[/api/v2/accounts/generate] Session token verification error:', err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const verified = await verifySessionToken(request);
    if (!verified) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: valid v2 desktop session token required.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const service = body.service || body.serviceName;

    if (!service || typeof service !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: "service".' },
        { status: 400 }
      );
    }

    const serviceName = service.trim();

    // Single Atomic PostgreSQL Transaction RPC (row-level SKIP LOCKED)
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('claim_service_account', {
      p_user_id: verified.claimedBy,
      p_service_name: serviceName,
    });

    if (rpcError) {
      console.error('[/api/v2/accounts/generate RPC Error]:', rpcError);
      return NextResponse.json(
        { success: false, error: 'Generator temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    if (!rpcData || !rpcData.success) {
      return NextResponse.json(
        { success: false, error: rpcData?.error || `${serviceName} is out of stock.` },
        { status: rpcData?.status || 404 }
      );
    }

    return NextResponse.json({
      success: true,
      service: rpcData.service || serviceName,
      account: rpcData.account || rpcData.accountData || '',
      claimedBy: verified.claimedBy,
      message: 'Account generated successfully.',
    });
  } catch (err: any) {
    console.error('[/api/v2/accounts/generate Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
