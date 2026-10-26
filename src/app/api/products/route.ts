import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUsdToPhpRate, computePricing } from '@/lib/currency';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const liveRate = await getUsdToPhpRate();

    // 1. Primary: Query the unified single `products` table
    const { data: dbProducts, error: dbError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    let rawList: any[] = [];

    if (!dbError && Array.isArray(dbProducts) && dbProducts.length > 0) {
      rawList = dbProducts;
    } else {
      // Fallback if table is not yet migrated in Supabase
      const { data: configRow } = await supabaseAdmin
        .from('config')
        .select('value')
        .eq('key', 'storefront_products')
        .maybeSingle();

      if (configRow?.value) {
        try {
          rawList = JSON.parse(configRow.value).filter((p: any) => p.isActive !== false);
        } catch {
          rawList = [];
        }
      }
    }

    // 2. Sanitize and compute dynamic pricing (PHP base + live USD + discount %)
    const sanitized = rawList.map((p: any) => {
      const isStockPool = p.delivery_mode === 'stock_pool' || p.deliveryMode === 'stock_pool';
      const stockPool = Array.isArray(p.stock_pool) ? p.stock_pool : (Array.isArray(p.stockPool) ? p.stockPool : []);
      const currentStock = isStockPool ? stockPool.length : -1;

      // Parse tiers
      const rawTiers = Array.isArray(p.tiers) ? p.tiers : (Array.isArray(p.tierOptions) ? p.tierOptions : []);
      const computedTiers = rawTiers.map((t: any, idx: number) => {
        const tierKey = t.tier_key || t.tierKey || 'daily';
        const basePhp = Number(t.price_php ?? t.pricePHP ?? 0);
        const discountPct = Number(t.discount_percent ?? t.discountPercent ?? 0);

        const pricing = computePricing(basePhp, discountPct, liveRate);

        return {
          id: t.id || `tier_${tierKey}_${idx}`,
          tierKey,
          name: t.name || (tierKey === 'daily' ? '1 Day' : tierKey === 'weekly' ? '7 Days' : tierKey === 'monthly' ? '30 Days' : 'Lifetime'),
          pricePHP: pricing.pricePHP,
          priceUSD: pricing.priceUSD,
          originalPricePHP: pricing.originalPricePHP,
          originalPriceUSD: pricing.originalPriceUSD,
          discountPercent: pricing.discountPercent,
          hasDiscount: pricing.hasDiscount,
          dailyLimit: t.daily_limit !== undefined ? Number(t.daily_limit) : (t.dailyLimit !== undefined ? Number(t.dailyLimit) : 15)
        };
      });

      // Default product pricing from tier 0 or flat fields
      const defaultTier = computedTiers[0];
      const flatPhp = Number(p.price_php ?? p.pricePHP ?? (defaultTier ? defaultTier.pricePHP : 0));
      const flatDiscount = Number(p.discount_percent ?? p.discountPercent ?? (defaultTier ? defaultTier.discountPercent : 0));
      const primaryPricing = defaultTier || computePricing(flatPhp, flatDiscount, liveRate);

      let parsedSpecs: any = null;
      if (p.delivery_type && typeof p.delivery_type === 'string' && p.delivery_type.trim().startsWith('{')) {
        try {
          parsedSpecs = JSON.parse(p.delivery_type);
        } catch {
          parsedSpecs = null;
        }
      } else if (p.specs && typeof p.specs === 'object') {
        parsedSpecs = p.specs;
      }

      const cleanDeliveryLabel =
        parsedSpecs?.deliveryLabel ||
        (p.delivery_type && !p.delivery_type.startsWith('{') ? p.delivery_type : null) ||
        (isStockPool ? 'Instant Credential Dispatch' : 'Instant Cryptographic Key');

      return {
        id: p.id,
        title: p.title,
        category: p.category || 'General',
        description: p.description || '',
        details: p.details || '',
        features: Array.isArray(p.features) ? p.features : [],
        badge: p.badge || '',
        imageUrl: p.image_url || p.imageUrl || '',
        deliveryMode: isStockPool ? 'stock_pool' : 'automated_license',
        deliveryType: cleanDeliveryLabel,
        specs: parsedSpecs,
        serviceScope: p.service_scope || p.serviceScope || 'all',
        tiers: computedTiers,
        tierOptions: computedTiers,
        pricePHP: primaryPricing.pricePHP,
        priceUSD: primaryPricing.priceUSD,
        originalPricePHP: primaryPricing.originalPricePHP,
        originalPriceUSD: primaryPricing.originalPriceUSD,
        discountPercent: primaryPricing.discountPercent,
        hasDiscount: primaryPricing.hasDiscount,
        highlight: Boolean(p.highlight),
        stockCount: currentStock,
        isOutOfStock: isStockPool && currentStock <= 0
      };
    });

    return new NextResponse(
      JSON.stringify({
        products: sanitized,
        liveRate,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    );
  } catch (error: any) {
    console.error('[Public Products API] Error:', error);
    return NextResponse.json({ products: [], error: error.message }, { status: 500 });
  }
}
