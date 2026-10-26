import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireReseller } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireReseller(request);
    if (!auth.ok) return auth.response;

    const { reseller } = auth.data;

    // Reset legacy test balance if previously seeded at 100,000
    if (reseller && Number(reseller.credit_balance) === 100000) {
      await supabaseAdmin
        .from('resellers')
        .update({ credit_balance: 0.00, updated_at: new Date().toISOString() })
        .eq('id', reseller.id);
      reseller.credit_balance = 0.00;
    }

    const [pricingRes, prodsRes, licensesRes, txRes] = await Promise.all([
      supabaseAdmin
        .from('reseller_wholesale_pricing')
        .select('*'),
      supabaseAdmin
        .from('products')
        .select('id, title, description, image_url, tiers, service_scope, is_active')
        .eq('is_active', true)
        .order('title', { ascending: true }),
      supabaseAdmin
        .from('licenses')
        .select('id, license_key, tier, daily_limit, expires_at, is_active, hwid, last_hwid_reset_at, created_at, redeemed_by, package_id')
        .eq('reseller_id', reseller.id)
        .order('created_at', { ascending: false })
        .limit(200),
      supabaseAdmin
        .from('reseller_transactions')
        .select('*')
        .eq('reseller_id', reseller.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    // Build wholesale pricing map: `${productId}:${tierKey.toLowerCase()}` -> wholesale_price_php
    const wholesalePriceMap: Record<string, number> = {};
    (pricingRes.data || []).forEach((wp: any) => {
      const key = `${wp.product_id}:${(wp.tier_key || '').toLowerCase().trim()}`;
      wholesalePriceMap[key] = Number(wp.wholesale_price_php);
    });

    // Decorate products with their wholesale price alongside retail price
    const catalog = (prodsRes.data || []).map((prod: any) => {
      const rawTiers = Array.isArray(prod.tiers) ? prod.tiers : [];
      const tiersWithWholesale = rawTiers.map((t: any) => {
        const tierKey = (t.tier_key || t.tierKey || 'daily').toLowerCase();
        const retailPrice = Number(t.price || t.price_php || 0);
        const mapKey = `${prod.id}:${tierKey}`;
        const wholesalePrice = wholesalePriceMap[mapKey] !== undefined ? wholesalePriceMap[mapKey] : retailPrice;
        const profitMargin = retailPrice > wholesalePrice ? retailPrice - wholesalePrice : 0;

        return {
          ...t,
          tier_key: tierKey,
          retail_price: retailPrice,
          wholesale_price: wholesalePrice,
          profit_margin: profitMargin,
        };
      });

      return {
        ...prod,
        tiers: tiersWithWholesale,
      };
    });

    return NextResponse.json({
      ok: true,
      reseller,
      catalog,
      licenses: licensesRes.data || [],
      transactions: txRes.data || [],
    });
  } catch (err: any) {
    console.error('[Reseller Data API] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

