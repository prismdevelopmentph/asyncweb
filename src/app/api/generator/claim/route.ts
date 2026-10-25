import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser } from '@/lib/auth';

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
