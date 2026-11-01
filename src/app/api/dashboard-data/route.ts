import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser, requireOwner } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isAdminRequest = searchParams.get('admin') === 'true';

  try {
    let authDiscordId = '';
    let isOwner = false;

    if (isAdminRequest) {
      const auth = await requireOwner(request);
      if (!auth.ok) return auth.response;
      authDiscordId = auth.data.discordId;
      isOwner = true;
    } else {
      const auth = await requireUser(request);
      if (!auth.ok) return auth.response;
      authDiscordId = auth.data.discordId;
      const rawOwners = process.env.OWNER_DISCORD_IDS || '';
      isOwner = rawOwners.split(',').map((s) => s.trim()).includes(authDiscordId);
    }

    const date7 = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const date30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    // If Owner requests Admin Panel Data: Fetch global database records
    if (isAdminRequest && isOwner) {
      const [
        lockoutsRes,
        generatorLicensesRes,
        servicesRes,
        packagesRes,
        apiLicensesRes,
        userLimitsRes,
        userGuildLocksRes,
        guildConfigRes,
        claimLogsRes,
        downloadLogsRes,
        discordUsersRes,
        authUsersRes,
        licenseServicesRes,
        packageServicesRes,
        visitorLogsRes,
        serviceConfigRes,
        dailyUsagesRes
      ] = await Promise.all([
        supabaseAdmin
          .from('security_lockouts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('licenses')
          .select('*')
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('services')
          .select('*')
          .order('id', { ascending: true }),
        supabaseAdmin
          .from('packages')
          .select('*')
          .order('id', { ascending: true }),
        supabaseAdmin
          .from('api_licenses')
          .select('*')
          .order('id', { ascending: false }),
        supabaseAdmin
          .from('user_limits')
          .select('*'),
        supabaseAdmin
          .from('user_guild_locks')
          .select('*'),
        supabaseAdmin
          .from('guild_config')
          .select('*'),
        supabaseAdmin
          .from('website_claim_logs')
          .select('*')
          .order('claimed_at', { ascending: false }),
        supabaseAdmin
          .from('client_download_logs')
          .select('*')
          .order('downloaded_at', { ascending: false }),
        Promise.resolve(supabaseAdmin.from('discord_users').select('*')).catch(() => ({ data: [], error: null })),
        supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }).catch(() => ({ data: { users: [] }, error: null })),
        supabaseAdmin.from('license_services').select('license_id, service_id, services(name)'),
        supabaseAdmin.from('package_services').select('package_id, service_id, services(name)'),
        Promise.resolve(supabaseAdmin.from('visitor_logs').select('*').order('visited_at', { ascending: false }).limit(100)).catch(() => ({ data: [], error: null })),
        Promise.resolve(
          supabaseAdmin
            .from('config')
            .select('key, value')
            .or('key.like.service_enabled_%,key.like.service_color_%,key.like.service_icon_%')
        ).catch(() => ({ data: [], error: null })),
        Promise.resolve(
          supabaseAdmin
            .from('license_daily_usages')
            .select('license_id, discord_id, used_count, usage_date')
            .in('usage_date', [
              new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }),
              new Date().toISOString().split('T')[0]
            ])
        ).catch(() => ({ data: [], error: null })),
      ]);

      // Count active licenses per user to prevent cross-contamination for multi-key users
      const userActiveLicCount = new Map<string, number>();
      (generatorLicensesRes.data || []).forEach((lic: any) => {
        if (lic.redeemed_by && lic.is_active) {
          const u = String(lic.redeemed_by);
          userActiveLicCount.set(u, (userActiveLicCount.get(u) || 0) + 1);
        }
      });

      // 1. Precise per-license usage map (summed across services for today)
      const licenseUsageMap = new Map<string, number>();
      (dailyUsagesRes?.data || []).forEach((du: any) => {
        if (du.license_id) {
          const licId = String(du.license_id);
          const cnt = Number(du.used_count) || 0;
          licenseUsageMap.set(licId, (licenseUsageMap.get(licId) || 0) + cnt);
        }
      });

      // 2. Legacy user_limits fallback
      const legacyLimitsByLicId = new Map<string, number>();
      const legacyLimitsByUserId = new Map<string, number>();
      (userLimitsRes.data || []).forEach((ul: any) => {
        if (ul.license_id) legacyLimitsByLicId.set(String(ul.license_id), Number(ul.count) || 0);
        if (ul.discord_user_id) {
          const u = String(ul.discord_user_id);
          legacyLimitsByUserId.set(u, Math.max(Number(ul.count) || 0, legacyLimitsByUserId.get(u) || 0));
        }
      });

      // Merge legacy license_id counts if license_daily_usages has none
      legacyLimitsByLicId.forEach((count, licId) => {
        if (!licenseUsageMap.has(licId) || licenseUsageMap.get(licId) === 0) {
          if (count > 0) licenseUsageMap.set(licId, count);
        }
      });

      // 3. Claims audit log per user (ONLY used for single-license accounts)
      const todayPht = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
      const claimsTodayByUser = new Map<string, number>();
      (claimLogsRes?.data || []).forEach((c: any) => {
        if (c.discord_user_id) {
          const uId = String(c.discord_user_id);
          const cDate = c.claimed_at ? String(c.claimed_at).slice(0, 10) : '';
          if (cDate >= todayPht) {
            claimsTodayByUser.set(uId, (claimsTodayByUser.get(uId) || 0) + 1);
          }
        }
      });

      const userGuildMap = new Map();
      (userGuildLocksRes.data || []).forEach((lock: any) => {
        if (lock.discord_user_id) userGuildMap.set(String(lock.discord_user_id), String(lock.guild_id));
      });

      const guildLimitMap = new Map();
      (guildConfigRes.data || []).forEach((gc: any) => {
        if (gc.guild_id && gc.generate_limit !== undefined && gc.generate_limit !== null) {
          guildLimitMap.set(String(gc.guild_id), parseInt(gc.generate_limit) || 15);
        }
      });

      const licenseServicesMap = new Map<string, string[]>();
      (licenseServicesRes?.data || []).forEach((ls: any) => {
        const lid = String(ls.license_id);
        const svcName = ls.services?.name;
        if (svcName) {
          const list = licenseServicesMap.get(lid) || [];
          list.push(svcName);
          licenseServicesMap.set(lid, list);
        }
      });

      const packageServicesMap = new Map<string, string[]>();
      (packageServicesRes?.data || []).forEach((ps: any) => {
        const pid = String(ps.package_id);
        const svcName = ps.services?.name;
        if (svcName) {
          const list = packageServicesMap.get(pid) || [];
          list.push(svcName);
          packageServicesMap.set(pid, list);
        }
      });

      const packagesMap = new Map<string, string>();
      const enrichedPackages = (packagesRes?.data || []).map((pkg: any) => {
        packagesMap.set(String(pkg.id), pkg.name);
        return {
          ...pkg,
          services: packageServicesMap.get(String(pkg.id)) || [],
        };
      });

      const augmentedGenLicenses = (generatorLicensesRes.data || []).map((lic: any) => {
        const licId = String(lic.id);
        const uId = lic.redeemed_by ? String(lic.redeemed_by) : null;
        const isSingleLicenseUser = uId ? (userActiveLicCount.get(uId) || 0) <= 1 : true;

        // Strict per-license usage: multi-license users NEVER clone user-level claims
        let finalUsedToday = licenseUsageMap.get(licId) || 0;

        // Fallback to user-level limits ONLY if user owns strictly one single license
        if (finalUsedToday === 0 && isSingleLicenseUser && uId) {
          const legacyUserCount = legacyLimitsByUserId.get(uId) || 0;
          const claimsCount = claimsTodayByUser.get(uId) || 0;
          finalUsedToday = Math.max(legacyUserCount, claimsCount);
        }

        let effectiveLimit = lic.daily_limit;
        if (effectiveLimit === null || effectiveLimit === undefined) {
          const userGuildId = lic.redeemed_by ? userGuildMap.get(String(lic.redeemed_by)) : null;
          const guildLimit = userGuildId ? guildLimitMap.get(userGuildId) : null;
          effectiveLimit = (guildLimit !== null && guildLimit !== undefined) ? guildLimit : 15;
        }

        const pkgName = lic.package_id ? packagesMap.get(String(lic.package_id)) : null;
        const boundServices = licenseServicesMap.get(String(lic.id)) || [];
        let scopeLabel = 'All Services';
        if (pkgName) {
          scopeLabel = `[Package] ${pkgName}`;
        } else if (boundServices.length > 0) {
          scopeLabel = boundServices.join(', ');
        }

        return {
          ...lic,
          used_today: finalUsedToday,
          effective_limit: effectiveLimit,
          scope_label: scopeLabel,
        };
      });

      const userProfiles: Record<string, { name: string; username?: string }> = {
        '719482630633947166': { name: 'Mark', username: 'Owner' },
        'ASYNC-V2': { name: 'ASYNC V2', username: 'Engine' },
      };

      (discordUsersRes?.data || []).forEach((u: any) => {
        if (u.discord_user_id) {
          userProfiles[String(u.discord_user_id)] = {
            name: u.display_name || u.username || 'Unknown',
            username: u.username || undefined,
          };
        }
      });

      (authUsersRes?.data?.users || []).forEach((u: any) => {
        const meta = u.user_metadata || {};
        const discordId =
          meta.provider_id ||
          meta.sub ||
          u.identities?.find((i: any) => i.provider === 'discord')?.id ||
          (u.email?.endsWith('@discord.user') ? u.email.split('@')[0] : null);

        if (discordId) {
          const fullName = meta.full_name || meta.custom_claims?.global_name || meta.name || '';
          const username = meta.user_name || meta.username || u.identities?.[0]?.identity_data?.user_name || '';
          const prev = userProfiles[String(discordId)];
          userProfiles[String(discordId)] = {
            name: fullName || prev?.name || username || u.email?.split('@')[0] || 'Unknown',
            username: username && username !== fullName ? username : prev?.username,
          };
        }
      });

      // Compute real-time available stock count per service
      const stockCounts = await Promise.all(
        (servicesRes.data || []).map(async (svc: any) => {
          let count = 0;
          try {
            const { data: stockRpc } = await supabaseAdmin.rpc('get_service_stock', {
              p_service_name: svc.name,
            });
            if (typeof stockRpc === 'number') {
              return { id: String(svc.id), count: stockRpc };
            }
          } catch {}

          try {
            const tbl = `accounts_${svc.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
            const { count: exactCount } = await supabaseAdmin
              .from(tbl)
              .select('id', { count: 'exact', head: true })
              .eq('is_used', false);
            count = exactCount ?? 0;
          } catch {}

          return { id: String(svc.id), count };
        })
      );

      const stockMap = new Map<string, number>();
      stockCounts.forEach((sc: any) => stockMap.set(String(sc.id), sc.count));

      const configMap = new Map<string, string>();
      (serviceConfigRes?.data || []).forEach((row: any) => {
        configMap.set(row.key, String(row.value).trim());
      });

      const enrichedServices = (servicesRes.data || []).map((svc: any) => {
        const idStr = String(svc.id);
        const configEnabled = configMap.get(`service_enabled_${idStr}`);
        const isEnabled = svc.is_enabled !== undefined && svc.is_enabled !== null
          ? Boolean(svc.is_enabled)
          : (configEnabled !== undefined ? configEnabled === 'true' : true);
        const brandColor = configMap.get(`service_color_${idStr}`) || svc.brand_color || '#a855f7';
        const iconValue = configMap.get(`service_icon_${idStr}`) || svc.icon_value || svc.name?.toLowerCase() || 'gamepad';

        return {
          ...svc,
          is_enabled: isEnabled,
          brand_color: brandColor,
          icon_value: iconValue,
          stock_count: stockMap.get(idStr) ?? 0,
        };
      });

      return NextResponse.json({
        isOwner: true,
        securityLockouts: lockoutsRes.data || [],
        generatorLicenses: augmentedGenLicenses,
        services: enrichedServices,
        packages: enrichedPackages,
        licenses: apiLicensesRes.data || [],
        claimLogs: claimLogsRes.data || [],
        downloadLogs: downloadLogsRes.data || [],
        visitorLogs: visitorLogsRes?.data || [],
        userProfiles,
      });
    }

    // Standard User Dashboard Data query
    const [decryptionsRes, fixesRes, plansRes, licensesRes, d7Res, f7Res, d30Res, f30Res] = await Promise.all([
      supabaseAdmin
        .from('decryptions')
        .select('*')
        .eq('user_id', authDiscordId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('fixes')
        .select('*')
        .eq('user_id', authDiscordId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('plan_subscriptions')
        .select('*')
        .eq('user_id', authDiscordId)
        .eq('active', 1)
        .order('expires_at', { ascending: false }),
      supabaseAdmin
        .from('api_licenses')
        .select('*')
        .eq('user_id', authDiscordId)
        .eq('revoked', 0),
      supabaseAdmin
        .from('decryptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authDiscordId)
        .gte('created_at', date7),
      supabaseAdmin
        .from('fixes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authDiscordId)
        .gte('created_at', date7),
      supabaseAdmin
        .from('decryptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authDiscordId)
        .gte('created_at', date30),
      supabaseAdmin
        .from('fixes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authDiscordId)
        .gte('created_at', date30),
    ]);

    const weeklyCount = (d7Res.count || 0) + (f7Res.count || 0);
    const monthlyCount = (d30Res.count || 0) + (f30Res.count || 0);

    return NextResponse.json({
      isOwner,
      decryptions: decryptionsRes.data || [],
      fixes: fixesRes.data || [],
      plans: plansRes.data || [],
      licenses: licensesRes.data || [],
      usage: {
        weekly: weeklyCount,
        monthly: monthlyCount,
      }
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
