import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, balancePHP: 0, balanceUSD: 0 }, { status: 401 });
    }

    const discordId = auth.data.discordId;

    const { data: row } = await supabaseAdmin
      .from('user_balances')
      .select('balance_php, balance_usd')
      .eq('discord_id', discordId)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      balancePHP: Number(row?.balance_php || 0),
      balanceUSD: Number(row?.balance_usd || 0)
    });
  } catch (err) {
    return NextResponse.json({ ok: false, balancePHP: 0, balanceUSD: 0 }, { status: 500 });
  }
}

