import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId, key } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User is not authenticated.' }, { status: 401 });
    }

    if (!key || typeof key !== 'string' || !key.trim()) {
      return NextResponse.json({ error: 'Please enter a valid license key.' }, { status: 400 });
    }

    const trimmedKey = key.trim().toUpperCase();

    // Mirror accountgenerator.py prefix check
    if (!trimmedKey.startsWith('LIC-')) {
      return NextResponse.json({
        error: 'Invalid license key format. Key must start with LIC- (e.g. LIC-XXXX-XXXX-XXXX).'
      }, { status: 400 });
    }

    // 1. Query licenses table by column 'license_key'
    const { data: licenseData, error: fetchErr } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('license_key', trimmedKey)
      .limit(1);

    if (fetchErr) {
      console.error('[Redeem Key Fetch Error]:', fetchErr);
      return NextResponse.json({ error: 'Database query failed.' }, { status: 500 });
    }

    if (!licenseData || licenseData.length === 0) {
      return NextResponse.json({ error: 'Invalid license key. Please check and try again.' }, { status: 404 });
    }

    const license = licenseData[0];

    // Mirror accountgenerator.py: Reject reseller licenses
    if (license.license_type === 'reseller') {
      return NextResponse.json({
        error: 'This is a reseller license. Please use the reseller activation panel.'
      }, { status: 400 });
    }

    // Mirror accountgenerator.py: Check revoked licenses
    if (license.is_active === false && !license.redeemed_by) {
      return NextResponse.json({
        error: 'This license has been revoked. Contact an admin.'
      }, { status: 400 });
    }

    // Check if redeemed by another user
    if (license.redeemed_by && String(license.redeemed_by) !== String(userId)) {
      return NextResponse.json({
        error: 'This license key has already been redeemed by another user.'
      }, { status: 400 });
    }

    // Already redeemed by this user
    if (license.is_active && String(license.redeemed_by) === String(userId)) {
      return NextResponse.json({
        success: true,
        message: 'You have already activated this license key.',
        license
      });
    }

    // 2. Redeem license for user
    const { data: updatedLic, error: updateErr } = await supabaseAdmin
      .from('licenses')
      .update({
        redeemed_by: String(userId),
        is_active: true,
        redeemed_at: new Date().toISOString()
      })
      .eq('id', license.id)
      .select();

    if (updateErr) {
      console.error('[Redeem Key Update Error]:', updateErr);
      return NextResponse.json({ error: 'Failed to redeem license key.' }, { status: 500 });
    }

    const activeLic = updatedLic?.[0] || license;
    const tierName = activeLic.tier ? activeLic.tier.toUpperCase() : 'STANDARD';

    return NextResponse.json({
      success: true,
      message: `License activated successfully! ${tierName} access granted.`,
      license: activeLic
    });
  } catch (error: any) {
    console.error('[Redeem Key Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to redeem license key.' },
      { status: 500 }
    );
  }
}
