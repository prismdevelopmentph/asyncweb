import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: servicesData, error: svcError } = await supabaseAdmin
      .from('services')
      .select('id, name');

    if (svcError) {
      return NextResponse.json({ success: false, error: svcError.message }, { status: 500 });
    }

    const stockMap: Record<string, number> = {
      steam: 0,
      discord: 0,
      rockstar: 0,
      cyberghost: 0,
      netflix: 0,
      valorant: 0,
    };

    if (servicesData && servicesData.length > 0) {
      await Promise.all(
        servicesData.map(async (svc) => {
          try {
            const { data: stockCount } = await supabaseAdmin.rpc('get_service_stock', {
              p_service_name: svc.name,
            });
            const key = svc.name.toLowerCase();
            const count = typeof stockCount === 'number' ? stockCount : 0;

            if (key.includes('steam')) stockMap.steam = count;
            else if (key.includes('discord')) stockMap.discord = count;
            else if (key.includes('rockstar')) stockMap.rockstar = count;
            else if (key.includes('cyberghost') || key.includes('vpn')) stockMap.cyberghost = count;
            else if (key.includes('netflix')) stockMap.netflix = count;
            else if (key.includes('valorant')) stockMap.valorant = count;
            else stockMap[key] = count;
          } catch {
            // Service stock query fallback
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      stock: stockMap,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

