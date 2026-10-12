import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getServiceTableName(svcName: string): string {
  const normalized = svcName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `accounts_${normalized}`;
}

async function resolveDiscordUserId(request: Request, body: any): Promise<string> {
  try {
    // 1. Direct explicit Discord user ID passed in body or headers
    const directId = body.userId || body.discord_user_id || body.discordUserId || request.headers.get('x-user-id');
    if (directId && typeof directId === 'string' && directId.trim()) {
      return directId.trim();
    }

    // 2. Resolve via Authorization Bearer token (session token issued by /api/v2/auth/verify)
    const authHeader = request.headers.get('authorization') || request.headers.get('x-session-token');
    let tokenLicenseId: string | null = null;

    if (authHeader) {
      const rawToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
      try {
        const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'async-v2-production-key';
        const decoded = JSON.parse(Buffer.from(rawToken, 'base64url').toString('utf8'));
        const { payload, signature } = decoded;
        const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        if (signature === expectedSig) {
          const [licId] = payload.split(':');
          if (licId) tokenLicenseId = licId;
        }
      } catch {
        // Ignored, proceed to next resolver
      }
    }

    // 3. Resolve via License Key passed in body or headers
    const rawKey = body.key || body.license_key || request.headers.get('x-license-key');
    const licenseKey = typeof rawKey === 'string' && rawKey.trim() ? rawKey.trim() : null;

    if (tokenLicenseId || licenseKey) {
      let query = supabaseAdmin.from('licenses').select('id, redeemed_by, license_key');
      if (tokenLicenseId) {
        query = query.eq('id', tokenLicenseId);
      } else if (licenseKey) {
        query = query.eq('license_key', licenseKey);
      }

      const { data: licenseRow } = await query.limit(1).maybeSingle();
      if (licenseRow) {
        if (licenseRow.redeemed_by) {
          return String(licenseRow.redeemed_by);
        }
        // If unredeemed on website, record the license key so logs show which license generated it
        return String(licenseRow.license_key);
      }
    }
  } catch (err) {
    console.warn('[/api/v2/accounts/generate] User resolution warning:', err);
  }

  // 4. Default fallback if anonymous
  return 'ASYNC-V2';
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const service = body.service || body.serviceName;

    if (!service || typeof service !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: "service".' },
        { status: 400 }
      );
    }

    const serviceName = service.trim();

    // Resolve User Identity (Discord ID from session token, license key, or body)
    const claimedBy = await resolveDiscordUserId(request, body);

    // 1. Attempt Atomic PostgreSQL RPC claim with SKIP LOCKED
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('claim_account_direct', {
      p_service_name: serviceName,
      p_claimed_by: claimedBy,
    });

    if (!rpcError && rpcData) {
      if (!rpcData.success) {
        return NextResponse.json(
          { success: false, error: rpcData.error || `${serviceName} is out of stock.` },
          { status: rpcData.status || 404 }
        );
      }

      return NextResponse.json({
        success: true,
        service: rpcData.service || serviceName,
        account: rpcData.account || '',
        claimedBy,
        message: 'Account generated successfully.',
      });
    }

    // 2. Node Fallback if RPC function is not yet created
    const { data: serviceData } = await supabaseAdmin
      .from('services')
      .select('id, name')
      .ilike('name', serviceName)
      .limit(1);

    if (!serviceData || serviceData.length === 0) {
      return NextResponse.json(
        { success: false, error: `Service "${serviceName}" not found or out of stock.` },
        { status: 404 }
      );
    }

    const matchedSvcName = serviceData[0].name;
    const tableName = getServiceTableName(matchedSvcName);

    // Select 1 unused account
    const { data: accountData, error: findErr } = await supabaseAdmin
      .from(tableName)
      .select('id, data')
      .eq('is_used', false)
      .limit(1);

    if (findErr || !accountData || accountData.length === 0) {
      return NextResponse.json(
        { success: false, error: `${matchedSvcName} is currently out of stock.` },
        { status: 404 }
      );
    }

    const account = accountData[0];
    const nowStr = new Date().toISOString();

    // Mark account as used with the resolved user ID
    await supabaseAdmin
      .from(tableName)
      .update({
        is_used: true,
        claimed_by: claimedBy,
        claimed_at: nowStr,
      })
      .eq('id', account.id);

    // Extract raw string from data JSON
    let accountText = '';
    if (account.data && typeof account.data === 'object') {
      accountText = account.data.raw || account.data.data || JSON.stringify(account.data);
    } else if (typeof account.data === 'string') {
      try {
        const parsed = JSON.parse(account.data);
        accountText = parsed.raw || parsed.data || account.data;
      } catch {
        accountText = account.data;
      }
    }

    // Log to website_claim_logs for admin tracking in Node fallback
    try {
      await supabaseAdmin.from('website_claim_logs').insert({
        service_name: matchedSvcName,
        account_id: String(account.id),
        raw_data: accountText,
        discord_user_id: claimedBy,
        claimed_at: nowStr,
        notified_discord: false,
        source: 'App Generator',
      });
    } catch {
      // Non-critical fallback logging error
    }

    return NextResponse.json({
      success: true,
      service: matchedSvcName,
      account: accountText,
      claimedBy,
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
