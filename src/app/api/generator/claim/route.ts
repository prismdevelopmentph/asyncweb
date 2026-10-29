import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser, isOwnerDiscordId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const serviceName = body.serviceName || body.service;

    if (!serviceName || typeof serviceName !== 'string') {
      return NextResponse.json({ error: 'Service name is required.' }, { status: 400 });
    }

    // ── Hardware ID (HWID) Device-Binding Security Gate ──
    // Neutralizes stolen tokens: claims are locked to the user's physical hardware profile
    const callerDiscordId = auth.data.discordId;
    const isOwner = isOwnerDiscordId(callerDiscordId);

    if (!isOwner) {
      const clientHwid = (
        request.cookies.get('async_hwid')?.value ||
        request.headers.get('x-hwid') ||
        ''
      ).trim();

      // Retrieve user's active license(s)
      const { data: activeLicenses } = await supabaseAdmin
        .from('licenses')
        .select('id, hwid')
        .eq('redeemed_by', callerDiscordId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (activeLicenses && activeLicenses.length > 0) {
        const boundLic = activeLicenses.find((l) => l.hwid && l.hwid.trim().length > 0);

        if (boundLic && boundLic.hwid) {
          // License is bound to a specific hardware ID -> verify match
          if (!clientHwid || boundLic.hwid.toLowerCase() !== clientHwid.toLowerCase()) {
            return NextResponse.json(
              {
                error: 'Hardware ID mismatch: This session or license is locked to another device. If you changed PCs, please open a ticket to reset your HWID.',
                code: 'HWID_MISMATCH'
              },
              { status: 403 }
            );
          }
        } else if (clientHwid && clientHwid.startsWith('hw_')) {
          // First claim on active license without bound HWID: auto-bind current device
          const targetLic = activeLicenses[0];
          await supabaseAdmin
            .from('licenses')
            .update({ hwid: clientHwid })
            .eq('id', targetLic.id);
        }
      }
    }

    // Single Atomic PostgreSQL Transaction RPC (row-level SKIP LOCKED)
    const { data, error } = await supabaseAdmin.rpc('claim_service_account', {
      p_user_id: auth.data.discordId,
      p_service_name: String(serviceName).trim()
    });

    if (error) {
      console.error('[claim_service_account RPC Error]:', error);
      return NextResponse.json({ error: 'Generator temporarily unavailable. Please try again later.' }, { status: 503 });
    }

    if (!data || !data.success) {
      return NextResponse.json(
        { error: data?.error || 'Failed to generate account.' },
        { status: data?.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      service: data.service,
      accountData: data.accountData,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });
  } catch (error: any) {
    console.error('[Account Claim Route Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate account.' },
      { status: 500 }
    );
  }
}
