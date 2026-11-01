import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser } from '@/lib/auth';
import { DEFAULT_BRAND_COLORS } from '@/lib/icon-resolver';

export const dynamic = 'force-dynamic';

function getServiceTableName(svcName: string): string {
  const normalized = svcName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `accounts_${normalized}`;
}

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');

    if (authHeader) {
      const auth = await requireUser(request);
      if (!auth.ok) return auth.response;
      userId = auth.data.discordId;
    }

    const response = {
      userPlan: {
        hasPlan: false,
        name: 'No active plan',
        expiresAt: null as string | null,
        dailyUsed: 0,
        dailyLimit: 0,
        guildLock: null as string | null,
        allowedServices: [] as string[] | 'all',
        vouchGiven: true,
        licenseId: null as string | null,
        licenses: [] as Array<{
          id: string;
          licenseKey: string;
          tier: string;
          quotaMode: 'isolated' | 'shared';
          dailyLimit: number;
          usedToday: number;
          remainingToday: number;
          expiresAt: string | null;
          services: string[];
        }>,
        serviceQuotas: {} as Record<string, {
          serviceName: string;
          isUnlocked: boolean;
          isolatedLimit: number;
          isolatedUsed: number;
          isolatedRemaining: number;
          sharedAvailable: number;
          totalAvailable: number;
          licenseKeys: string[];
        }>
      },
      stock: {
        steam: 0,
        discord: 0,
        rockstar: 0,
        cyberghost: 0,
        netflix: 0,
        valorant: 0,
      },
      services: [] as Array<{
        id: string | number;
        name: string;
        isEnabled: boolean;
        stockCount: number;
        brandColor: string;
        iconValue: string;
      }>,
      history: [] as Array<{
        id: string;
        service: string;
        date: string;
        dataText: string;
      }>
    };

    // 1. Parallel Stock Queries across all services
    const stockPromise = (async () => {
      try {
        const [{ data: servicesData }, { data: configRows }] = await Promise.all([
          supabaseAdmin.from('services').select('*').order('display_order', { ascending: true }),
          supabaseAdmin.from('config').select('key, value').or('key.like.service_enabled_%,key.like.service_color_%,key.like.service_icon_%')
        ]);

        const configMap = new Map<string, string>();
        (configRows || []).forEach((row: any) => configMap.set(row.key, String(row.value).trim()));

        if (servicesData && servicesData.length > 0) {
          const dynamicServices = await Promise.all(
            servicesData.map(async (svc: any) => {
              const idStr = String(svc.id);
              const nameStr = String(svc.name || '').trim();

              const configEnabled = configMap.get(`service_enabled_${idStr}`);
              const isEnabled = svc.is_enabled !== undefined && svc.is_enabled !== null
                ? Boolean(svc.is_enabled)
                : (configEnabled !== undefined ? configEnabled === 'true' : true);

              const nameLower = nameStr.toLowerCase();
              const brandColor = configMap.get(`service_color_${idStr}`)
                || (svc.brand_color && svc.brand_color !== '#a855f7' ? svc.brand_color : null)
                || DEFAULT_BRAND_COLORS[nameLower]
                || svc.brand_color
                || '#a855f7';
              const iconValue = configMap.get(`service_icon_${idStr}`) || svc.icon_value || svc.name?.toLowerCase() || 'gamepad';

              let count = 0;
              try {
                const { data: stockCount } = await supabaseAdmin.rpc('get_service_stock', {
                  p_service_name: nameStr
                });
                if (typeof stockCount === 'number') count = stockCount;
              } catch {}

              if (count === 0) {
                try {
                  const tbl = getServiceTableName(nameStr);
                  const { count: exactCount } = await supabaseAdmin
                    .from(tbl)
                    .select('id', { count: 'exact', head: true })
                    .eq('is_used', false);
                  count = exactCount ?? 0;
                } catch {}
              }

              return {
                id: svc.id,
                name: svc.name,
                isEnabled,
                stockCount: count,
                brandColor,
                iconValue,
                displayOrder: svc.display_order ?? 0,
              };
            })
          );

          const CANONICAL_SERVICE_ORDER = ['steam', 'discord', 'rockstar', 'cyberghost', 'netflix', 'valorant'];
          dynamicServices.sort((a, b) => {
            const orderA = a.displayOrder ?? 0;
            const orderB = b.displayOrder ?? 0;
            if (orderA > 0 && orderB > 0 && orderA !== orderB) return orderA - orderB;
            if (orderA > 0) return -1;
            if (orderB > 0) return 1;
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            const idxA = CANONICAL_SERVICE_ORDER.findIndex(k => nameA.includes(k));
            const idxB = CANONICAL_SERVICE_ORDER.findIndex(k => nameB.includes(k));
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return nameA.localeCompare(nameB);
          });

          response.services = dynamicServices;

          for (const item of dynamicServices) {
            const low = item.name.toLowerCase();
            if (low.includes('steam')) response.stock.steam = item.stockCount;
            else if (low.includes('discord')) response.stock.discord = item.stockCount;
            else if (low.includes('rockstar')) response.stock.rockstar = item.stockCount;
            else if (low.includes('cyberghost') || low.includes('vpn')) response.stock.cyberghost = item.stockCount;
            else if (low.includes('netflix')) response.stock.netflix = item.stockCount;
            else if (low.includes('valorant')) response.stock.valorant = item.stockCount;
          }
        }
      } catch (err) {
        console.warn('[Generator Status] Parallel stock fetch warning:', err);
      }
    })();

    // 2. Parallel User Multi-License & Stacked Quota Query
    const userPlanPromise = (async () => {
      if (!userId) return;
      try {
        const now = new Date();
        const todayPht = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

        // Query master reset date from config table
        const { data: resetCfg } = await supabaseAdmin
          .from('config')
          .select('value')
          .eq('key', 'last_reset_date')
          .maybeSingle();

        let activeResetDate = resetCfg?.value?.trim() || todayPht;

        // At or after 12:01 AM PHT: if a new calendar day started and last_reset_date is outdated, execute general reset
        if (activeResetDate < todayPht) {
          try {
            await supabaseAdmin.from('config').upsert({
              key: 'last_reset_date',
              value: todayPht,
              updated_at: new Date().toISOString()
            });

            await supabaseAdmin
              .from('user_limits')
              .update({ count: 0, updated_at: new Date().toISOString() })
              .gte('count', 0);

            await supabaseAdmin
              .from('license_daily_usages')
              .delete()
              .lt('usage_date', todayPht);

            activeResetDate = todayPht;
          } catch (resetErr) {
            console.warn('[Generator Status] Auto-reset sync exception:', resetErr);
          }
        }

        const todayStr = activeResetDate;

        const [
          { data: lockData },
          { data: licenseData },
          { data: servicesData },
          { data: packageServicesData }
        ] = await Promise.all([
          supabaseAdmin.from('user_guild_locks').select('guild_id').eq('discord_user_id', userId).limit(1),
          supabaseAdmin.from('licenses').select('*').eq('redeemed_by', userId).eq('is_active', true).order('created_at', { ascending: false }),
          supabaseAdmin.from('services').select('id, name'),
          supabaseAdmin.from('package_services').select('package_id, service_id')
        ]);

        const userGuildLock = lockData?.[0]?.guild_id ? String(lockData[0].guild_id) : null;
        const allServices = servicesData || [];
        const svcIdToName = new Map<string, string>();
        for (const s of allServices) {
          svcIdToName.set(String(s.id), s.name);
        }

        const activeLicenses = (licenseData || []).filter((lic: any) => {
          if (!lic.expires_at) return true;
          return new Date(lic.expires_at) > now;
        });

        if (activeLicenses.length > 0) {
          response.userPlan.hasPlan = true;
          const mainLic = activeLicenses[0];
          response.userPlan.name = activeLicenses.length > 1
            ? `Multi-License Plan (${activeLicenses.length} Active)`
            : mainLic.tier
            ? `${mainLic.tier.charAt(0).toUpperCase() + mainLic.tier.slice(1)} Gen Plan`
            : 'Active Gen Plan';

          // Latest expiration calculation
          let isLifetime = false;
          let maxExpiresAt: Date | null = null;
          for (const lic of activeLicenses) {
            if (!lic.expires_at) {
              isLifetime = true;
              break;
            } else {
              const exp = new Date(lic.expires_at);
              if (!maxExpiresAt || exp > maxExpiresAt) maxExpiresAt = exp;
            }
          }
          response.userPlan.expiresAt = isLifetime ? 'Never' : (maxExpiresAt ? maxExpiresAt.toISOString() : 'Never');
          response.userPlan.guildLock = userGuildLock;
          response.userPlan.licenseId = String(mainLic.id);
          response.userPlan.vouchGiven = Boolean(activeLicenses.some((lic: any) => lic.vouch_given));

          // Fetch daily usages and license_services for all active licenses
          const activeLicIds = activeLicenses.map((lic: any) => String(lic.id));
          const [
            { data: dailyUsagesData },
            { data: userLimitRows },
            { data: licServicesData }
          ] = await Promise.all([
            supabaseAdmin.from('license_daily_usages').select('license_id, service_name, used_count').in('license_id', activeLicIds).eq('usage_date', todayStr),
            supabaseAdmin.from('user_limits').select('license_id, count').eq('discord_user_id', userId).in('license_id', activeLicIds),
            supabaseAdmin.from('license_services').select('license_id, service_id').in('license_id', activeLicIds)
          ]);

          // Map usage per license (from license_daily_usages, with user_limits fallback)
          const usageMapByLicAndSvc = new Map<string, number>();
          const totalUsageByLic = new Map<string, number>();

          if (dailyUsagesData) {
            for (const u of dailyUsagesData) {
              const licId = String(u.license_id);
              const count = Number(u.used_count) || 0;
              const svcKey = `${licId}:${(u.service_name || 'general').toLowerCase()}`;
              usageMapByLicAndSvc.set(svcKey, (usageMapByLicAndSvc.get(svcKey) || 0) + count);
              totalUsageByLic.set(licId, (totalUsageByLic.get(licId) || 0) + count);
            }
          }

          // Fallback to user_limits if license_daily_usages has no entries for a license
          if (userLimitRows) {
            for (const ul of userLimitRows) {
              const licId = String(ul.license_id);
              if (!totalUsageByLic.has(licId) || (totalUsageByLic.get(licId) === 0 && Number(ul.count) > 0)) {
                totalUsageByLic.set(licId, Number(ul.count) || 0);
              }
            }
          }

          // Build individual license items and allowed scopes
          let hasGlobalAllAccess = false;
          const unionAllowedServiceNames = new Set<string>();
          const processedLicenses = [];

          for (const lic of activeLicenses) {
            const licIdStr = String(lic.id);
            const quotaMode = (lic.quota_mode || 'isolated') as 'isolated' | 'shared';
            const dailyLimit = Number(lic.daily_limit) || 15;
            const usedToday = totalUsageByLic.get(licIdStr) || 0;
            const remainingToday = Math.max(0, dailyLimit - usedToday);

            // Determine services covered by this specific license
            const coveredServiceNames: string[] = [];

            if (lic.package_id) {
              const pkgServices = (packageServicesData || []).filter((ps: any) => String(ps.package_id) === String(lic.package_id));
              for (const ps of pkgServices) {
                const sName = svcIdToName.get(String(ps.service_id));
                if (sName) coveredServiceNames.push(sName);
              }
            }

            const explicitLicServices = (licServicesData || []).filter((ls: any) => String(ls.license_id) === licIdStr);
            for (const ls of explicitLicServices) {
              const sName = svcIdToName.get(String(ls.service_id));
              if (sName && !coveredServiceNames.includes(sName)) {
                coveredServiceNames.push(sName);
              }
            }

            // If no package and no explicit license_services, it covers all services
            const isAllAccessLic = !lic.package_id && explicitLicServices.length === 0;
            if (isAllAccessLic) {
              hasGlobalAllAccess = true;
              coveredServiceNames.push('All Services');
            } else {
              for (const s of coveredServiceNames) unionAllowedServiceNames.add(s.toLowerCase());
            }

            processedLicenses.push({
              id: licIdStr,
              licenseKey: lic.license_key,
              tier: lic.tier || 'standard',
              quotaMode,
              dailyLimit,
              usedToday,
              remainingToday,
              expiresAt: lic.expires_at || null,
              services: coveredServiceNames
            });
          }

          response.userPlan.licenses = processedLicenses;

          if (hasGlobalAllAccess) {
            response.userPlan.allowedServices = 'all';
          } else {
            response.userPlan.allowedServices = Array.from(unionAllowedServiceNames);
          }

          // Compute Isolated vs Shared Quotas per service
          let totalStackedLimit = 0;
          let totalStackedUsed = 0;
          let sharedPoolLimit = 0;
          let sharedPoolUsed = 0;

          for (const lic of processedLicenses) {
            totalStackedLimit += lic.dailyLimit;
            totalStackedUsed += lic.usedToday;
            if (lic.quotaMode === 'shared') {
              sharedPoolLimit += lic.dailyLimit;
              sharedPoolUsed += lic.usedToday;
            }
          }

          const sharedAvailable = Math.max(0, sharedPoolLimit - sharedPoolUsed);
          const serviceQuotas: Record<string, any> = {};

          for (const svc of allServices) {
            const svcLower = svc.name.toLowerCase();
            let isUnlocked = false;
            let totalAvailableForService = 0;
            let serviceMaxLimit = 0;
            let serviceUsed = 0;
            const matchedKeyList: string[] = [];

            for (const lic of processedLicenses) {
              const coversThisSvc = lic.services.includes('All Services') || lic.services.some(s => s.toLowerCase() === svcLower);
              if (coversThisSvc) {
                isUnlocked = true;
                matchedKeyList.push(lic.licenseKey);
                serviceMaxLimit += lic.dailyLimit;
                serviceUsed += lic.usedToday;
                totalAvailableForService += Math.max(0, lic.dailyLimit - lic.usedToday);
              }
            }

            serviceQuotas[svcLower] = {
              serviceName: svc.name,
              isUnlocked,
              serviceLimit: serviceMaxLimit,
              serviceUsed,
              totalAvailable: totalAvailableForService,
              licenseKeys: matchedKeyList
            };
          }

          response.userPlan.serviceQuotas = serviceQuotas;
          response.userPlan.dailyLimit = totalStackedLimit;
          response.userPlan.dailyUsed = totalStackedUsed;
        }
      } catch (err) {
        console.warn('[Generator Status] User plan fetch warning:', err);
      }
    })();

    // 3. Parallel User History Query across all per-service account tables
    const userHistoryPromise = (async () => {
      if (!userId) return;
      try {
        const { data: servicesData } = await supabaseAdmin.from('services').select('name');
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        if (servicesData && servicesData.length > 0) {
          const historyPerService = await Promise.all(
            servicesData.map(async (svc) => {
              const tableName = getServiceTableName(svc.name);
              try {
                const { data: accLogs } = await supabaseAdmin
                  .from(tableName)
                  .select('id, data, claimed_at')
                  .eq('claimed_by', userId)
                  .gte('claimed_at', twentyFourHoursAgo)
                  .order('claimed_at', { ascending: false })
                  .limit(15);

                if (!accLogs) return [];

                return accLogs.map((acc: any) => {
                  const dateObj = acc.claimed_at ? new Date(acc.claimed_at) : new Date();
                  const dateStr = dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  let rawText = '';
                  if (acc.data && typeof acc.data === 'object') {
                    rawText = acc.data.raw || acc.data.data || JSON.stringify(acc.data);
                  } else if (typeof acc.data === 'string') {
                    try {
                      const parsed = JSON.parse(acc.data);
                      rawText = parsed.raw || parsed.data || acc.data;
                    } catch {
                      rawText = acc.data;
                    }
                  }

                  return {
                    id: acc.id,
                    service: svc.name,
                    date: dateStr,
                    timestamp: dateObj.getTime(),
                    dataText: rawText || 'No account credentials details found.'
                  };
                });
              } catch {
                return [];
              }
            })
          );

          const combinedHistory = historyPerService.flat();
          combinedHistory.sort((a, b) => b.timestamp - a.timestamp);
          response.history = combinedHistory.slice(0, 50).map(({ id, service, date, dataText }) => ({
            id,
            service,
            date,
            dataText
          }));
        }
      } catch (err) {
        console.warn('[Generator Status] User history fetch warning:', err);
      }
    })();

    // Await all operations concurrently
    await Promise.all([stockPromise, userPlanPromise, userHistoryPromise]);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Generator Status Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch generator status.' },
      { status: 500 }
    );
  }
}
