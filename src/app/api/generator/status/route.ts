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

    // Response structure supporting CyberGhost and Valorant
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

    // 1. Fetch live stock counts using RPC get_service_stock
    try {
      const { data: servicesData } = await supabaseAdmin
        .from('services')
        .select('id, name');

      if (servicesData && servicesData.length > 0) {
        for (const svc of servicesData) {
          const svcNameLower = svc.name.toLowerCase();

          const { data: stockCount } = await supabaseAdmin.rpc('get_service_stock', {
            p_service_name: svc.name
          });

          const totalStock = typeof stockCount === 'number' ? stockCount : 0;

          if (svcNameLower.includes('steam')) response.stock.steam = totalStock;
          else if (svcNameLower.includes('discord')) response.stock.discord = totalStock;
          else if (svcNameLower.includes('rockstar')) response.stock.rockstar = totalStock;
          else if (svcNameLower.includes('cyberghost') || svcNameLower.includes('vpn')) response.stock.cyberghost = totalStock;
          else if (svcNameLower.includes('netflix')) response.stock.netflix = totalStock;
          else if (svcNameLower.includes('valorant')) response.stock.valorant = totalStock;
        }
      }
    } catch (err) {
      console.warn('[Generator Status] Services RPC stock fetch warning:', err);
    }

    // 2. Fetch User Active License & Daily Limit
    if (userId) {
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

          if (lic.daily_limit !== null && lic.daily_limit !== undefined) {
            response.userPlan.dailyLimit = lic.daily_limit;
          } else {
            const { data: guildData } = await supabaseAdmin
              .from('guild_config')
              .select('generate_limit')
              .limit(1);

            response.userPlan.dailyLimit = guildData?.[0]?.generate_limit || 15;
          }

          const { data: limitData } = await supabaseAdmin
            .from('user_limits')
            .select('count')
            .eq('discord_user_id', userId)
            .eq('license_id', String(lic.id))
            .limit(1);

          if (limitData && limitData.length > 0) {
            response.userPlan.dailyUsed = limitData[0].count || 0;
          }
        }
      } catch (err) {
        console.warn('[Generator Status] Licenses fetch warning:', err);
      }

      // 3. Fetch User Generation History from per-service tables
      try {
        const { data: servicesData } = await supabaseAdmin.from('services').select('name');
        const historyItems: Array<{ id: string; service: string; date: string; timestamp: number; dataText: string }> = [];

        if (servicesData && servicesData.length > 0) {
          for (const svc of servicesData) {
            const tableName = getServiceTableName(svc.name);
            try {
              const { data: accLogs } = await supabaseAdmin
                .from(tableName)
                .select('id, data, claimed_at')
                .eq('claimed_by', userId)
                .order('claimed_at', { ascending: false })
                .limit(20);

              if (accLogs && accLogs.length > 0) {
                for (const acc of accLogs) {
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

                  historyItems.push({
                    id: acc.id,
                    service: svc.name,
                    date: dateStr,
                    timestamp: dateObj.getTime(),
                    dataText: rawText || 'No account credentials details found.'
                  });
                }
              }
            } catch (tableErr) {
              // Table may not exist yet if 0 accounts added
            }
          }
        }

        historyItems.sort((a, b) => b.timestamp - a.timestamp);
        response.history = historyItems.slice(0, 100).map(({ id, service, date, dataText }) => ({
          id,
          service,
          date,
          dataText
        }));
      } catch (err) {
        console.warn('[Generator Status] User history fetch warning:', err);
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Generator Status Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch generator status.' },
      { status: 500 }
    );
  }
}
