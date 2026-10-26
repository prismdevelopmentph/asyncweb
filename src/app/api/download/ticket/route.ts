import { NextRequest, NextResponse } from 'next/server';
import { requireUser, isOwnerDiscordId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createDownloadTicket } from '@/lib/download-tickets';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const discordId = auth.data.discordId;
    const isOwner = isOwnerDiscordId(discordId);

    // If not owner, verify caller owns at least one active, non-expired license
    if (!isOwner) {
      const nowStr = new Date().toISOString();
      const { data: licenses, error: licErr } = await supabaseAdmin
        .from('licenses')
        .select('id, expires_at')
        .eq('redeemed_by', discordId)
        .eq('is_active', true);

      if (licErr || !licenses || licenses.length === 0) {
        return NextResponse.json(
          { error: 'Access Denied: No active license found on this account.' },
          { status: 403 }
        );
      }

      const hasValid = licenses.some((l: any) => !l.expires_at || l.expires_at > nowStr);
      if (!hasValid) {
        return NextResponse.json(
          { error: 'Access Denied: Your license has expired. Please renew your subscription.' },
          { status: 403 }
        );
      }
    }

    const downloadCode = createDownloadTicket(discordId, isOwner);

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/download/client?code=${encodeURIComponent(downloadCode)}`,
      expiresIn: 60
    });
  } catch (err: any) {
    console.error('[Ticket API Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

