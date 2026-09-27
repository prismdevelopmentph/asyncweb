import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function getServiceTableName(svcName: string): string {
  const normalized = svcName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `accounts_${normalized}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const response = {
      userPlan: {
        hasPlan: false,
        name: 'No active plan',
        expiresAt: null as string | null,
        dailyUsed: 0,
        dailyLimit: 0,
        guildLock: null as string | null,
        allowedServices: [] as string[] | 'all',
      },
      stock: {
        steam: 0,
        discord: 0,
        rockstar: 0,
        cyberghost: 0,
        netflix: 0,
        valorant: 0,
      },
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
        const { data: servicesData } = await supabaseAdmin
          .from('services')
          .select('id, name');

        if (servicesData && servicesData.length > 0) {
          const stockResults = await Promise.all(
            servicesData.map(async (svc) => {
              const { data: stockCount } = await supabaseAdmin.rpc('get_service_stock', {
                p_service_name: svc.name
              });
              return {
                name: svc.name.toLowerCase(),
                count: typeof stockCount === 'number' ? stockCount : 0
              };
            })
          );

          for (const item of stockResults) {
            if (item.name.includes('steam')) response.stock.steam = item.count;
            else if (item.name.includes('discord')) response.stock.discord = item.count;
            else if (item.name.includes('rockstar')) response.stock.rockstar = item.count;
            else if (item.name.includes('cyberghost') || item.name.includes('vpn')) response.stock.cyberghost = item.count;
            else if (item.name.includes('netflix')) response.stock.netflix = item.count;
            else if (item.name.includes('valorant')) response.stock.valorant = item.count;
          }
        }
      } catch (err) {
        console.warn('[Generator Status] Parallel stock fetch warning:', err);
      }
    })();

    // 2. Parallel User License & Plan Query (Schema v2)
    const userPlanPromise = (async () => {
      if (!userId) return;
      try {
        const now = new Date();
        const [{ data: lockData }, { data: licenseData }, { data: guildConfigData }] = await Promise.all([
          supabaseAdmin.from('user_guild_locks').select('guild_id').eq('discord_user_id', userId).limit(1),
          supabaseAdmin.from('licenses').select('*').eq('redeemed_by', userId).eq('is_active', true).order('created_at', { ascending: false }),
          supabaseAdmin.from('guild_config').select('generate_limit').limit(1)
        ]);

        const userGuildLock = lockData?.[0]?.guild_id ? String(lockData[0].guild_id) : null;
        const defaultGuildLimit = guildConfigData?.[0]?.generate_limit || 15;

        const activeLicenses = (licenseData || []).filter((lic: any) => {
          if (!lic.expires_at) return true;
          return new Date(lic.expires_at) > now;
        });

        if (activeLicenses.length > 0) {
          response.userPlan.hasPlan = true;
          const mainLic = activeLicenses[0];
          response.userPlan.name = mainLic.tier
            ? `${mainLic.tier.charAt(0).toUpperCase() + mainLic.tier.slice(1)} Gen Plan`
            : 'Active Gen Plan';

          // Determine latest expiration date
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

          // Fetch user limits across all active licenses & license_services
          const activeLicIds = activeLicenses.map((lic: any) => String(lic.id));
          const [{ data: userLimitRows }, { data: licServicesData }] = await Promise.all([
            supabaseAdmin.from('user_limits').select('license_id, count').eq('discord_user_id', userId).in('license_id', activeLicIds),
            supabaseAdmin.from('license_services').select('license_id, service_id').in('license_id', activeLicIds)
          ]);

          let hasAllAccess = false;
          const allowedServiceIdsSet = new Set<string>();

          for (const lic of activeLicenses) {
            const licIdStr = String(lic.id);
            const rowsForLic = licServicesData?.filter(r => String(r.license_id) === licIdStr) || [];
            if (rowsForLic.length === 0) {
              hasAllAccess = true;
              break;
            } else {
              for (const r of rowsForLic) {
                allowedServiceIdsSet.add(String(r.service_id));
              }
            }
          }

          if (hasAllAccess) {
            response.userPlan.allowedServices = 'all';
          } else {
            const { data: servicesTable } = await supabaseAdmin.from('services').select('id, name');
            const allowedNames: string[] = [];
            if (servicesTable) {
              for (const s of servicesTable) {
                if (allowedServiceIdsSet.has(String(s.id))) {
                  allowedNames.push(s.name.toLowerCase());
                }
              }
            }
            response.userPlan.allowedServices = allowedNames;
          }

          const limitMap = new Map<string, number>();
          if (userLimitRows) {
            for (const row of userLimitRows) {
              limitMap.set(String(row.license_id), Number(row.count) || 0);
            }
          }

          let totalLimit = 0;
          let totalUsed = 0;
          for (const lic of activeLicenses) {
            const licLimit = (lic.daily_limit !== null && lic.daily_limit !== undefined)
              ? Number(lic.daily_limit)
              : defaultGuildLimit;
            const used = limitMap.get(String(lic.id)) || 0;
            totalLimit += licLimit;
            totalUsed += used;
          }

          response.userPlan.dailyLimit = totalLimit;
          response.userPlan.dailyUsed = totalUsed;
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
        if (servicesData && servicesData.length > 0) {
          const historyPerService = await Promise.all(
            servicesData.map(async (svc) => {
              const tableName = getServiceTableName(svc.name);
              try {
                const { data: accLogs } = await supabaseAdmin
                  .from(tableName)
                  .select('id, data, claimed_at')
                  .eq('claimed_by', userId)
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

    // Await all 3 major operations concurrently in parallel
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
