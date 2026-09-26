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

    // 2. Parallel User License & Plan Query
    const userPlanPromise = (async () => {
      if (!userId) return;
      try {
        const { data: licenseData } = await supabaseAdmin
          .from('licenses')
          .select('*')
          .eq('redeemed_by', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (licenseData && licenseData.length > 0) {
          const lic = licenseData[0];
          response.userPlan.hasPlan = true;
          response.userPlan.name = lic.tier
            ? `${lic.tier.charAt(0).toUpperCase() + lic.tier.slice(1)} Gen Plan`
            : 'Active Gen Plan';
          response.userPlan.expiresAt = lic.expires_at || 'Never';
          response.userPlan.guildLock = lic.redeemed_guild_id || null;

          // Fetch limit & user daily count in parallel
          const [limitConfigRes, userLimitRes] = await Promise.all([
            lic.daily_limit !== null && lic.daily_limit !== undefined
              ? Promise.resolve({ limit: lic.daily_limit })
              : supabaseAdmin.from('guild_config').select('generate_limit').limit(1),
            supabaseAdmin.from('user_limits').select('count').eq('discord_user_id', userId).eq('license_id', String(lic.id)).limit(1)
          ]);

          if ('limit' in limitConfigRes) {
            response.userPlan.dailyLimit = limitConfigRes.limit;
          } else if (limitConfigRes.data && limitConfigRes.data.length > 0 && limitConfigRes.data[0].generate_limit) {
            response.userPlan.dailyLimit = limitConfigRes.data[0].generate_limit;
          } else {
            response.userPlan.dailyLimit = 15;
          }

          if (userLimitRes.data && userLimitRes.data.length > 0) {
            response.userPlan.dailyUsed = userLimitRes.data[0].count || 0;
          }
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
          response.history = combinedHistory.slice(0, 100).map(({ id, service, date, dataText }) => ({
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
