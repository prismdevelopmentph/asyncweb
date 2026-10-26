import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const callerDiscordId = auth.data.discordId;

    // 1. Fetch or initialize Web Balance
    const { data: balRow } = await supabaseAdmin
      .from('user_balances')
      .select('balance_php, updated_at')
      .eq('discord_id', callerDiscordId)
      .maybeSingle();

    let balancePhp = 0;
    if (balRow) {
      balancePhp = Number(balRow.balance_php || 0);
    } else {
      // Initialize row with 0.00
      try {
        await supabaseAdmin.from('user_balances').insert({
          discord_id: callerDiscordId,
          balance_php: 0.00,
          updated_at: new Date().toISOString()
        });
      } catch {}
    }

    // 2. Fetch User Orders (Storefront purchases & top-ups)
    const { data: ordersData, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_type,
        product_id,
        tier_key,
        amount,
        currency,
        provider,
        provider_label,
        status,
        license_key,
        payment_details,
        paid_at,
        created_at
      `)
      .eq('discord_id', callerDiscordId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (ordersErr) {
      console.warn('[User Dashboard API] Orders query warning:', ordersErr.message);
    }

    // 3. Fetch Active Licenses & Subscriptions
    const [genLicsRes, plansRes] = await Promise.all([
      supabaseAdmin
        .from('licenses')
        .select(`
          id,
          license_key,
          license_type,
          tier,
          daily_limit,
          quota_mode,
          expires_at,
          is_active,
          created_at
        `)
        .eq('redeemed_by', callerDiscordId)
        .order('created_at', { ascending: false }),

      supabaseAdmin
        .from('plan_subscriptions')
        .select(`
          id,
          plan_name,
          expires_at,
          active,
          created_at
        `)
        .eq('user_id', callerDiscordId)
        .order('created_at', { ascending: false })
    ]);

    // 4. Resolve Discord Community Invite
    const { data: cfgRow } = await supabaseAdmin
      .from('config')
      .select('value')
      .eq('key', 'discord_invite_url')
      .maybeSingle();

    const discordInvite = cfgRow?.value?.trim() || 'https://discord.gg/async';

    // 5. User Referral Code
    // Deterministic referral code based on their verified Discord ID
    const referralCode = `ASYNC-${callerDiscordId.slice(-6).toUpperCase()}`;

    // Get count of orders that used this referral code if applicable
    const { count: referralUses } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .contains('payment_details', { referral_code: referralCode });

    return NextResponse.json({
      success: true,
      user: {
        discordId: callerDiscordId,
        username: auth.data.user.user_metadata?.custom_claims?.global_name || auth.data.user.user_metadata?.full_name || auth.data.user.user_metadata?.name || 'Customer',
        avatarUrl: auth.data.user.user_metadata?.avatar_url || null,
        email: auth.data.user.email || null,
      },
      balance: {
        balancePhp,
        currency: 'PHP',
      },
      referral: {
        code: referralCode,
        timesUsed: referralUses || 0,
        inviteUrl: discordInvite,
      },
      orders: ordersData || [],
      licenses: genLicsRes.data || [],
      plans: plansRes.data || [],
    });
  } catch (err: any) {
    console.error('[User Dashboard API Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

