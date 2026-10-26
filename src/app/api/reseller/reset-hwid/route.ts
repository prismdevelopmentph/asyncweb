import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireReseller } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireReseller(request);
    if (!auth.ok) return auth.response;

    const { reseller } = auth.data;
    const body = await request.json().catch(() => ({}));
    const { licenseId } = body;

    if (!licenseId) {
      return NextResponse.json({ ok: false, error: 'License ID is required.' }, { status: 400 });
    }

    // Verify license ownership
    const { data: license, error: licErr } = await supabaseAdmin
      .from('licenses')
      .select('id, license_key, hwid, last_hwid_reset_at, reseller_id')
      .eq('id', licenseId)
      .single();

    if (licErr || !license) {
      return NextResponse.json({ ok: false, error: 'License not found.' }, { status: 404 });
    }

    if (license.reseller_id !== reseller.id) {
      return NextResponse.json(
        { ok: false, error: 'Access denied: This license was not issued by your reseller account.' },
        { status: 403 }
      );
    }

    // Check 7-day cooldown
    if (license.last_hwid_reset_at) {
      const lastResetTime = new Date(license.last_hwid_reset_at).getTime();
      const elapsed = Date.now() - lastResetTime;

      if (elapsed < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - elapsed;
        const remainingDays = Math.floor(remainingMs / (24 * 3600 * 1000));
        const remainingHours = Math.floor((remainingMs % (24 * 3600 * 1000)) / (3600 * 1000));
        const remainingMins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));

        const formattedTime = remainingDays > 0
          ? `${remainingDays}d ${remainingHours}h`
          : remainingHours > 0
          ? `${remainingHours}h ${remainingMins}m`
          : `${remainingMins}m`;

        return NextResponse.json(
          {
            ok: false,
            error: `HWID reset cooldown active. Next reset available in ${formattedTime}. Enforced limit: 1 reset every 7 days.`,
            cooldownRemainingMs: remainingMs,
          },
          { status: 429 }
        );
      }
    }

    // Reset HWID
    const nowIso = new Date().toISOString();
    const { error: updateErr } = await supabaseAdmin
      .from('licenses')
      .update({
        hwid: null,
        last_hwid_reset_at: nowIso,
      })
      .eq('id', licenseId);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      ok: true,
      message: `HWID cleared successfully for key ${license.license_key}. The customer may now launch and bind their new hardware.`,
      resetAt: nowIso,
    });
  } catch (err: any) {
    console.error('[Reseller HWID Reset API] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
