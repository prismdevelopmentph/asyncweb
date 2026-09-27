import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function getServiceTableName(svcName: string): string {
  const normalized = svcName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `accounts_${normalized}`;
}

export async function POST(request: Request) {
  try {
    const { userId, serviceName } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required to generate accounts.' }, { status: 401 });
    }

    if (!serviceName) {
      return NextResponse.json({ error: 'Service name is required.' }, { status: 400 });
    }

    // 1. Verify active user license
    const { data: licenseData } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('redeemed_by', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!licenseData || licenseData.length === 0) {
      return NextResponse.json({
        error: 'You do not have an active license plan. Please redeem a key first.'
      }, { status: 403 });
    }

    const license = licenseData[0];

    // Determine daily limit: NULL daily_limit falls back to guild_config or default 15
    let dailyLimit = 15;
    let fallbackGuildId: string | null = null;
    if (license.daily_limit !== null && license.daily_limit !== undefined) {
      dailyLimit = license.daily_limit;
    } else {
      const { data: guildData } = await supabaseAdmin
        .from('guild_config')
        .select('guild_id, generate_limit')
        .limit(1);
      if (guildData && guildData.length > 0) {
        if (guildData[0].generate_limit) dailyLimit = guildData[0].generate_limit;
        if (guildData[0].guild_id) fallbackGuildId = String(guildData[0].guild_id);
      }
    }

    // 2. Check user limits today in user_limits (keyed by discord_user_id & license_id)
    const { data: limitData } = await supabaseAdmin
      .from('user_limits')
      .select('id, count')
      .eq('discord_user_id', userId)
      .eq('license_id', String(license.id))
      .limit(1);

    const currentCount = limitData?.[0]?.count || 0;
    if (dailyLimit > 0 && currentCount >= dailyLimit) {
      return NextResponse.json({
        error: `You have reached your daily generation limit (${currentCount}/${dailyLimit}). Resets at 12AM PHT.`
      }, { status: 429 });
    }

    // 3. Find service entry
    const { data: serviceData } = await supabaseAdmin
      .from('services')
      .select('id, name, fields')
      .ilike('name', serviceName)
      .limit(1);

    if (!serviceData || serviceData.length === 0) {
      return NextResponse.json({
        error: `${serviceName} is currently out of stock.`
      }, { status: 404 });
    }

    const matchedSvcName = serviceData[0].name;
    const tableName = getServiceTableName(matchedSvcName);

    // 3.5 Check per-service limit in guild_service_limits
    const targetGuildId = license.redeemed_guild_id || fallbackGuildId;
    if (targetGuildId && serviceData[0].id) {
      const { data: svcLimitRes } = await supabaseAdmin
        .from('guild_service_limits')
        .select('daily_limit')
        .eq('guild_id', String(targetGuildId))
        .eq('service_id', serviceData[0].id)
        .limit(1);

      if (svcLimitRes && svcLimitRes.length > 0 && svcLimitRes[0].daily_limit !== null && svcLimitRes[0].daily_limit !== undefined) {
        const perSvcDailyLimit = svcLimitRes[0].daily_limit;

        if (perSvcDailyLimit > 0) {
          // Start of today 12AM PHT
          const phtDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
          const phtMidnightIso = new Date(`${phtDateStr}T00:00:00+08:00`).toISOString();

          // Count claims by this user today for this specific service table
          const { count: svcClaimsCount } = await supabaseAdmin
            .from(tableName)
            .select('id', { count: 'exact', head: true })
            .eq('claimed_by', userId)
            .gte('claimed_at', phtMidnightIso);

          const currentSvcCount = svcClaimsCount || 0;
          if (currentSvcCount >= perSvcDailyLimit) {
            return NextResponse.json({
              error: `You've reached the ${matchedSvcName} daily limit (${currentSvcCount}/${perSvcDailyLimit}). Resets at 12AM PHT.`
            }, { status: 429 });
          }
        }
      }
    }

    // 4. Atomically claim 1 unused account from the per-service accounts table
    const { data: accountData, error: findAccErr } = await supabaseAdmin
      .from(tableName)
      .select('id, data')
      .eq('is_used', false)
      .limit(1);

    if (findAccErr || !accountData || accountData.length === 0) {
      return NextResponse.json({
        error: `${serviceName} is currently out of stock.`
      }, { status: 404 });
    }

    const account = accountData[0];
    const nowStr = new Date().toISOString();

    // Update per-service account table: is_used = true, claimed_by = userId, claimed_at = nowStr
    const { error: updateAccErr } = await supabaseAdmin
      .from(tableName)
      .update({
        is_used: true,
        claimed_by: userId,
        claimed_at: nowStr
      })
      .eq('id', account.id);

    if (updateAccErr) {
      console.error('[Account Claim Update Error]:', updateAccErr);
      return NextResponse.json({ error: 'Failed to claim account.' }, { status: 500 });
    }

    // 5. Upsert user_limits count keyed on (discord_user_id, license_id)
    if (limitData && limitData.length > 0) {
      await supabaseAdmin
        .from('user_limits')
        .update({
          count: currentCount + 1,
          updated_at: nowStr
        })
        .eq('id', limitData[0].id);
    } else {
      await supabaseAdmin
        .from('user_limits')
        .insert({
          discord_user_id: userId,
          license_id: String(license.id),
          count: 1,
          updated_at: nowStr
        });
    }

    // Extract raw string from JSONB data (data->>'raw')
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
      accountData: accountText,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });
  } catch (error: any) {
    console.error('[Account Claim Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate account.' },
      { status: 500 }
    );
  }
}
