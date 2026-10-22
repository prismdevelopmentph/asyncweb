import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const discordId = searchParams.get('discordId');

    if (!discordId) {
      return NextResponse.json({ ok: false, balancePHP: 0, balanceUSD: 0 });
    }

    const { data: row } = await supabaseAdmin
      .from('user_balances')
      .select('balance_php, balance_usd')
      .eq('discord_id', discordId.trim())
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      balancePHP: Number(row?.balance_php || 0),
      balanceUSD: Number(row?.balance_usd || 0)
    });
  } catch (err) {
    return NextResponse.json({ ok: false, balancePHP: 0, balanceUSD: 0 });
  }
}
