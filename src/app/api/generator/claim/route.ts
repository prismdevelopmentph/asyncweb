import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId, serviceName } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required to generate accounts.' }, { status: 401 });
    }

    if (!serviceName) {
      return NextResponse.json({ error: 'Service name is required.' }, { status: 400 });
    }

    // Single Atomic PostgreSQL Transaction RPC (Sub-200ms with row-level SKIP LOCKED)
    const { data, error } = await supabaseAdmin.rpc('claim_service_account', {
      p_user_id: String(userId).trim(),
      p_service_name: String(serviceName).trim()
    });

    if (error) {
      console.error('[claim_service_account RPC Error]:', error);
      return NextResponse.json({ error: error.message || 'Failed to claim account.' }, { status: 500 });
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
