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
        packageServicesRes
      ] = await Promise.all([
        supabaseAdmin
          .from('security_lockouts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(150),
        supabaseAdmin
          .from('licenses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(150),
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
          .order('claimed_at', { ascending: false })
          .limit(200),
        supabaseAdmin
          .from('client_download_logs')
          .select('*')
          .order('downloaded_at', { ascending: false })
          .limit(100),
        Promise.resolve(supabaseAdmin.from('discord_users').select('*')).catch(() => ({ data: [], error: null })),
        supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }).catch(() => ({ data: { users: [] }, error: null })),
        supabaseAdmin.from('license_services').select('license_id, service_id, services(name)'),
        supabaseAdmin.from('package_services').select('package_id, service_id, services(name)'),
      ]);

      const limitsMap = new Map();
      (userLimitsRes.data || []).forEach((ul: any) => {
        if (ul.license_id) limitsMap.set(String(ul.license_id), ul.count || 0);
        if (ul.discord_user_id) limitsMap.set(String(ul.discord_user_id), Math.max(ul.count || 0, limitsMap.get(String(ul.discord_user_id)) || 0));
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
        const usedByLicId = limitsMap.get(String(lic.id)) || 0;
        const usedByUserId = lic.redeemed_by ? (limitsMap.get(String(lic.redeemed_by)) || 0) : 0;

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
          used_today: Math.max(usedByLicId, usedByUserId),
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
      stockCounts.forEach((sc) => stockMap.set(String(sc.id), sc.count));

      const enrichedServices = (servicesRes.data || []).map((svc: any) => ({
        ...svc,
        stock_count: stockMap.get(String(svc.id)) ?? 0,
      }));

      return NextResponse.json({
        isOwner: true,
        securityLockouts: lockoutsRes.data || [],
        generatorLicenses: augmentedGenLicenses,
        services: enrichedServices,
        packages: enrichedPackages,
        licenses: apiLicensesRes.data || [],
        claimLogs: claimLogsRes.data || [],
        downloadLogs: downloadLogsRes.data || [],
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
