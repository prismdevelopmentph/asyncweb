import StorefrontClient from '@/components/StorefrontClient';
import { supabaseAdmin } from '@/lib/supabase';
import { getUsdToPhpRate, computePricing } from '@/lib/currency';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const liveRate = await getUsdToPhpRate();

  // 1. Fetch products from Supabase products table
  let dbProducts: any[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      dbProducts = data;
    } else {
      // Fallback to config table
      const { data: cfgRow } = await supabaseAdmin
        .from('config')
        .select('value')
        .eq('key', 'storefront_products')
        .maybeSingle();

      if (cfgRow?.value) {
        dbProducts = JSON.parse(cfgRow.value).filter((p: any) => p.isActive !== false);
      }
    }
  } catch (err) {
    console.error('[Server Page] Product query error:', err);
  }

  // 2. Map into Storefront format with live computed pricing
  const products = dbProducts.map((p: any) => {
    const isBundle = p.category?.toLowerCase().includes('bundle') || p.id?.includes('bundle') || p.id?.includes('all_access');
    const isStockPool = p.delivery_mode === 'stock_pool' || p.deliveryMode === 'stock_pool';
    const currentStock = isStockPool ? (Array.isArray(p.stock_pool) ? p.stock_pool.length : 0) : -1;

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

    const defaultTier = computedTiers[0];
    const flatPhp = Number(p.price_php ?? p.pricePHP ?? (defaultTier ? defaultTier.pricePHP : 0));
    const flatDiscount = Number(p.discount_percent ?? p.discountPercent ?? (defaultTier ? defaultTier.discountPercent : 0));
    const primaryPricing = defaultTier || computePricing(flatPhp, flatDiscount, liveRate);

    return {
      id: p.id,
      title: p.title,
      category: isBundle ? 'bundle' : 'single',
      categoryLabel: p.category || (isBundle ? 'Bundle Package' : 'Single Access Tier'),
      badge: p.badge || (p.highlight ? 'RECOMMENDED' : (isBundle ? 'POPULAR' : 'SINGLE ACCESS')),
      priceUSD: primaryPricing.priceUSD,
      pricePHP: primaryPricing.pricePHP,
      originalPriceUSD: primaryPricing.originalPriceUSD,
      originalPricePHP: primaryPricing.originalPricePHP,
      discountPercent: primaryPricing.discountPercent,
      hasDiscount: primaryPricing.hasDiscount,
      description: p.description || '',
      details: p.details || '',
      features: Array.isArray(p.features) ? p.features : [],
      deliveryType: p.delivery_type || p.deliveryType || (isStockPool ? 'Instant Credential Dispatch' : 'Instant Cryptographic Key'),
      deliveryTime: 'Instant Delivery',
      gradient: p.highlight
        ? 'from-purple-600/20 via-zinc-900/80 to-black'
        : 'from-purple-900/40 via-zinc-900/60 to-black',
      highlight: Boolean(p.highlight),
      imageUrl: p.image_url || p.imageUrl || '',
      deliveryMode: isStockPool ? 'stock_pool' : 'automated_license',
      stockCount: currentStock,
      isOutOfStock: isStockPool && currentStock <= 0,
      tierOptions: computedTiers
    };
  });

  // 3. Fetch indexed reviews snapshot directly from Supabase
  let reviews: any[] = [];
  try {
    const { data: dbConfig } = await supabaseAdmin
      .from('config')
      .select('value')
      .eq('key', 'indexed_reviews_cache')
      .maybeSingle();

    if (dbConfig?.value) {
      reviews = JSON.parse(dbConfig.value);
    }
  } catch (err) {
    console.warn('[Server Page] Reviews lookup warning:', err);
  }

  return (
    <StorefrontClient
      initialProducts={products}
      liveRate={liveRate}
      initialReviews={reviews}
    />
  );
}
