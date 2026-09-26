import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Default response structure matching exact DB schema
    const response = {
      userPlan: {
        hasPlan: false,
        name: 'No active plan',
        expiresAt: null as string | null,
        dailyUsed: 0,
        dailyLimit: 0,
      },
      stock: {
        steam: 0,
        discord: 0,
        rockstar: 0,
        vpn: 0,
        netflix: 0,
      },
      history: [] as Array<{
        id: string;
        service: string;
        date: string;
        dataText: string;
      }>
    };

    // 1. Fetch live stock counts per service
    try {
      const { data: servicesData } = await supabaseAdmin
        .from('services')
        .select('id, name, fields, generate_limit');

      if (servicesData && servicesData.length > 0) {
        for (const svc of servicesData) {
          const svcNameLower = svc.name.toLowerCase();
          const { count } = await supabaseAdmin
            .from('accounts')
            .select('id', { count: 'exact', head: true })
            .eq('service_id', svc.id)
            .eq('is_used', false);

          const totalStock = count || 0;
          if (svcNameLower.includes('steam')) response.stock.steam = totalStock;
          else if (svcNameLower.includes('discord')) response.stock.discord = totalStock;
          else if (svcNameLower.includes('rockstar')) response.stock.rockstar = totalStock;
          else if (svcNameLower.includes('vpn')) response.stock.vpn = totalStock;
          else if (svcNameLower.includes('netflix')) response.stock.netflix = totalStock;
        }
      }
    } catch (err) {
      console.warn('[Generator Status] Services/Accounts stock fetch warning:', err);
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

          // Handle nullable daily_limit: if NULL, check config table or fallback
          if (lic.daily_limit !== null && lic.daily_limit !== undefined) {
            response.userPlan.dailyLimit = lic.daily_limit;
          } else {
            // Check server config default limit
            const { data: configData } = await supabaseAdmin
              .from('config')
              .select('value')
              .ilike('key', 'generate_limit%')
              .limit(1);

            response.userPlan.dailyLimit = configData?.[0]?.value ? parseInt(configData[0].value, 10) : 15;
          }

          // Fetch user limits count today
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

      // 3. Fetch User Generation History (claimed_by & claimed_at, reading data->>'raw')
      try {
        const { data: historyData } = await supabaseAdmin
          .from('accounts')
          .select('id, data, claimed_at, service_id, services(name)')
          .eq('claimed_by', userId)
          .order('claimed_at', { ascending: false })
          .limit(100);

        if (historyData && historyData.length > 0) {
          response.history = historyData.map((acc: any) => {
            const svcName = acc.services?.name || 'Account';
            const dateStr = acc.claimed_at
              ? new Date(acc.claimed_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recently';

            // Extract string from JSONB data (e.g. data->>'raw')
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
              service: svcName,
              date: dateStr,
              dataText: rawText || 'No account credentials details found.'
            };
          });
        }
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
