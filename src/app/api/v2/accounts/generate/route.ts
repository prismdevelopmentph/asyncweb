import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function getServiceTableName(svcName: string): string {
  const normalized = svcName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `accounts_${normalized}`;
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

    // 1. Attempt Atomic PostgreSQL RPC claim with SKIP LOCKED
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('claim_account_direct', {
      p_service_name: serviceName,
      p_claimed_by: 'ASYNC-V2',
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

    // Mark account as used
    await supabaseAdmin
      .from(tableName)
      .update({
        is_used: true,
        claimed_by: 'ASYNC-V2',
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

    return NextResponse.json({
      success: true,
      service: matchedSvcName,
      account: accountText,
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
