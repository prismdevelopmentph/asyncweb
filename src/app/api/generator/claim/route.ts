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

    const now = new Date();

    // 1. Fetch active licenses for the user
    const { data: licenseRows } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('redeemed_by', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const activeLicenses = (licenseRows || []).filter((lic: any) => {
      if (!lic.expires_at) return true;
      return new Date(lic.expires_at) > now;
    });

    if (activeLicenses.length === 0) {
      return NextResponse.json({
        error: 'You do not have an active license plan. Please redeem a key first.'
      }, { status: 403 });
    }

    // 2. Fetch User Guild Lock (user_guild_locks) & Default Guild Config
    const [{ data: lockData }, { data: guildConfigData }] = await Promise.all([
      supabaseAdmin.from('user_guild_locks').select('guild_id').eq('discord_user_id', userId).limit(1),
      supabaseAdmin.from('guild_config').select('guild_id, generate_limit').limit(1)
    ]);

    const defaultGuildLimit = guildConfigData?.[0]?.generate_limit || 15;
    const defaultGuildId = guildConfigData?.[0]?.guild_id ? String(guildConfigData[0].guild_id) : null;
    let userGuildId = lockData?.[0]?.guild_id ? String(lockData[0].guild_id) : null;

    // 3. Find target service entry
    const { data: serviceData } = await supabaseAdmin
      .from('services')
      .select('id, name')
      .ilike('name', serviceName)
      .limit(1);

    if (!serviceData || serviceData.length === 0) {
      return NextResponse.json({
        error: `${serviceName} is currently out of stock.`
      }, { status: 404 });
    }

    const matchedSvc = serviceData[0];
    const targetServiceId = matchedSvc.id;
    const matchedSvcName = matchedSvc.name;
    const tableName = getServiceTableName(matchedSvcName);

    // 4. Filter Active Licenses that Cover targetServiceId (license_services check)
    const licenseIds = activeLicenses.map((lic: any) => String(lic.id));
    const { data: licServicesData } = await supabaseAdmin
      .from('license_services')
      .select('license_id, service_id')
      .in('license_id', licenseIds);

    const licServicesMap = new Map<string, string[]>();
    if (licServicesData) {
      for (const row of licServicesData) {
        const licIdStr = String(row.license_id);
        if (!licServicesMap.has(licIdStr)) licServicesMap.set(licIdStr, []);
        licServicesMap.get(licIdStr)!.push(String(row.service_id));
      }
    }

    // 0 rows = all-access, 1+ rows = must contain targetServiceId
    const matchingLics = activeLicenses.filter((lic: any) => {
      const licIdStr = String(lic.id);
      const serviceList = licServicesMap.get(licIdStr);
      if (!serviceList || serviceList.length === 0) {
        return true;
      }
      return serviceList.includes(String(targetServiceId));
    });

    if (matchingLics.length === 0) {
      return NextResponse.json({
        error: `Your active license plan does not grant access to ${matchedSvcName}.`
      }, { status: 403 });
    }

    // 5. Select Best License with Most Capacity & Check Limits
    const matchingLicIds = matchingLics.map((lic: any) => String(lic.id));
    const { data: userLimitsData } = await supabaseAdmin
      .from('user_limits')
      .select('id, license_id, count')
      .eq('discord_user_id', userId)
      .in('license_id', matchingLicIds);

    const limitMap = new Map<string, { id?: any; count: number }>();
    if (userLimitsData) {
      for (const row of userLimitsData) {
        limitMap.set(String(row.license_id), { id: row.id, count: Number(row.count) || 0 });
      }
    }

    let bestLic: any = null;
    let bestLicRemaining = -Infinity;
    let bestLicUsed = 0;

    let totalAllowedAcrossMatching = 0;
    let totalUsedAcrossMatching = 0;

    for (const lic of matchingLics) {
      const licIdStr = String(lic.id);
      const licLimit = (lic.daily_limit !== null && lic.daily_limit !== undefined)
        ? Number(lic.daily_limit)
        : defaultGuildLimit;

      const usedInfo = limitMap.get(licIdStr) || { count: 0 };
      const usedCount = usedInfo.count;
      const remaining = licLimit - usedCount;

      totalAllowedAcrossMatching += licLimit;
      totalUsedAcrossMatching += usedCount;

      if (remaining > bestLicRemaining) {
        bestLicRemaining = remaining;
        bestLic = lic;
        bestLicUsed = usedCount;
      }
    }

    if (!bestLic || bestLicRemaining <= 0) {
      return NextResponse.json({
        error: `You have reached your daily generation limit (${totalUsedAcrossMatching}/${totalAllowedAcrossMatching}). Resets at 12AM PHT.`
      }, { status: 429 });
    }

    // 6. Check per-service limit in guild_service_limits
    const targetGuildId = userGuildId || defaultGuildId;
    if (targetGuildId && targetServiceId) {
      const { data: svcLimitRes } = await supabaseAdmin
        .from('guild_service_limits')
        .select('daily_limit')
        .eq('guild_id', String(targetGuildId))
        .eq('service_id', String(targetServiceId))
        .limit(1);

      if (svcLimitRes && svcLimitRes.length > 0 && svcLimitRes[0].daily_limit !== null && svcLimitRes[0].daily_limit !== undefined) {
        const perSvcDailyLimit = Number(svcLimitRes[0].daily_limit);

        if (perSvcDailyLimit > 0) {
          // Start of today 12AM PHT
          const phtDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
          const phtMidnightIso = new Date(`${phtDateStr}T00:00:00+08:00`).toISOString();

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

    // 7. Atomically claim 1 unused account from the per-service accounts table
    const { data: accountData, error: findAccErr } = await supabaseAdmin
      .from(tableName)
      .select('id, data')
      .eq('is_used', false)
      .limit(1);

    if (findAccErr || !accountData || accountData.length === 0) {
      return NextResponse.json({
        error: `${matchedSvcName} is currently out of stock.`
      }, { status: 404 });
    }

    const account = accountData[0];
    const nowStr = new Date().toISOString();

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

    // 8. Upsert user_limits count for chosen license
    await supabaseAdmin
      .from('user_limits')
      .upsert({
        discord_user_id: userId,
        license_id: String(bestLic.id),
        count: bestLicUsed + 1,
        updated_at: nowStr
      }, { onConflict: 'discord_user_id,license_id' });

    // 9. Guild Lock Lazy Registration (user_guild_locks)
    if (!userGuildId && defaultGuildId) {
      await supabaseAdmin
        .from('user_guild_locks')
        .upsert({
          discord_user_id: userId,
          guild_id: defaultGuildId
        }, { onConflict: 'discord_user_id' });
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
