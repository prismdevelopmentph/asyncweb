import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    const callerDiscordId = auth.data.discordId;
    const body = await request.json().catch(() => ({}));
    const key = body.key || body.license_key;

    if (!key || typeof key !== 'string' || !key.trim()) {
      return NextResponse.json({ error: 'Please enter a valid license key.' }, { status: 400 });
    }

    const trimmedKey = key.trim().toUpperCase();

    // Key format prefix check
    if (!trimmedKey.startsWith('LIC-')) {
      return NextResponse.json({
        error: 'Invalid license key format. Key must start with LIC- (e.g. LIC-XXXX-XXXX-XXXX).'
      }, { status: 400 });
    }

    // 1. Query licenses table by column 'license_key'
    const { data: license, error: fetchErr } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('license_key', trimmedKey)
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.error('[Redeem Key Fetch Error]:', fetchErr);
      return NextResponse.json({ error: 'Database query failed.' }, { status: 500 });
    }

    if (!license) {
      return NextResponse.json({ error: 'Invalid license key. Please check and try again.' }, { status: 404 });
    }

    // Reject reseller licenses
    if (license.license_type === 'reseller') {
      return NextResponse.json({
        error: 'This is a reseller license. Please use the reseller activation panel.'
      }, { status: 400 });
    }

    // Audit H13: Revoked license protection
    // If an admin deactivates a license (is_active === false), it must NOT be reactivatable by anyone
    if (license.is_active === false) {
      return NextResponse.json({
        error: 'This license has been revoked or suspended. Contact an administrator.'
      }, { status: 403 });
    }

    // Check if already redeemed
    if (license.redeemed_by) {
      if (String(license.redeemed_by) === callerDiscordId) {
        return NextResponse.json({
          success: true,
          message: 'You have already activated this license key.',
          license
        });
      }
      return NextResponse.json({
        error: 'This license key has already been redeemed by another user.'
      }, { status: 400 });
    }

    // 2. Atomically redeem license for caller (prevents concurrent race conditions)
    const { data: updatedLic, error: updateErr } = await supabaseAdmin
      .from('licenses')
      .update({
        redeemed_by: callerDiscordId,
        redeemed_at: new Date().toISOString()
      })
      .eq('id', license.id)
      .is('redeemed_by', null)
      .select('*')
      .maybeSingle();

    if (updateErr) {
      console.error('[Redeem Key Update Error]:', updateErr);
      return NextResponse.json({ error: 'Failed to redeem license key.' }, { status: 500 });
    }

    if (!updatedLic) {
      return NextResponse.json({
        error: 'This license key has already been redeemed by another user.'
      }, { status: 409 });
    }

    const tierName = updatedLic.tier ? updatedLic.tier.toUpperCase() : 'STANDARD';

    return NextResponse.json({
      success: true,
      message: `License activated successfully! ${tierName} access granted.`,
      license: updatedLic
    });
  } catch (error: any) {
    console.error('[Redeem Key Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to redeem license key.' },
      { status: 500 }
    );
  }
}
