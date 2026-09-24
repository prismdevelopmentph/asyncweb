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

    const trimmedKey = key.trim();

    // 1. Query licenses table for key
    const { data: licenseData, error: fetchErr } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('key', trimmedKey)
      .limit(1);

    if (fetchErr) {
      console.error('[Redeem Key Fetch Error]:', fetchErr);
      return NextResponse.json({ error: 'Database query failed.' }, { status: 500 });
    }

    if (!licenseData || licenseData.length === 0) {
      return NextResponse.json({ error: 'Invalid license key. Key does not exist.' }, { status: 404 });
    }

    const license = licenseData[0];

    if (license.redeemed_by && license.redeemed_by !== userId) {
      return NextResponse.json({ error: 'This license key has already been redeemed by another account.' }, { status: 400 });
    }

    if (license.is_active && license.redeemed_by === userId) {
      return NextResponse.json({ message: 'You have already redeemed this key.', license });
    }

    // 2. Redeem license for user
    const { data: updatedLic, error: updateErr } = await supabaseAdmin
      .from('licenses')
      .update({
        redeemed_by: userId,
        is_active: true,
        redeemed_at: new Date().toISOString()
      })
      .eq('id', license.id)
      .select();

    if (updateErr) {
      console.error('[Redeem Key Update Error]:', updateErr);
      return NextResponse.json({ error: 'Failed to redeem license key.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'License key redeemed successfully!',
      license: updatedLic?.[0] || license
    });
  } catch (error: any) {
    console.error('[Redeem Key Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to redeem license key.' },
      { status: 500 }
    );
  }
}
