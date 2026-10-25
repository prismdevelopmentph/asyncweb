import { supabaseAdmin } from '@/lib/supabase';
import { getUsdToPhpRate, computePricing } from '@/lib/currency';

export interface CatalogProduct {
  id: string;
  title: string;
  category: string;
  categorySlug: string;
  categoryLabel: string;
  badge?: string;
  priceUSD: number;
  pricePHP: number;
  originalPriceUSD?: number;
  originalPricePHP?: number;
  discountPercent?: number;
  hasDiscount?: boolean;
  description: string;
  details?: string;
  features: string[];
  deliveryType: string;
  deliveryTime: string;
  gradient: string;
  highlight: boolean;
  imageUrl: string;
  deliveryMode: 'automated_license' | 'stock_pool';
  stockCount: number;
  isOutOfStock: boolean;
  tierOptions: Array<{
    id: string;
    tierKey: string;
    name: string;
    pricePHP: number;
    priceUSD: number;
    originalPricePHP?: number;
    originalPriceUSD?: number;
    discountPercent?: number;
    hasDiscount?: boolean;
    dailyLimit?: number;
  }>;
  specs?: {
    platform?: string;
    deliveryLabel?: string;
    quotaLabel?: string;
    accessLevel?: string;
  };
}

export function slugifyCategory(cat: string): string {
  return (cat || 'general')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getStoreCatalog(): Promise<{
  products: CatalogProduct[];
  liveRate: number;
  categories: Array<{ id: string; slug: string; label: string; count: number; hasHighlight: boolean }>;
}> {
  const liveRate = await getUsdToPhpRate();

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
    console.error('[Catalog] Product query error:', err);
  }

  const products: CatalogProduct[] = dbProducts.map((p: any) => {
    const rawCategory = (p.category || 'Generator Licenses').trim();
    const isBundle = rawCategory.toLowerCase().includes('bundle') || p.id?.includes('bundle') || p.id?.includes('all_access');
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

    let parsedSpecs: any = null;
    if (p.delivery_type && typeof p.delivery_type === 'string' && p.delivery_type.startsWith('{')) {
      try { parsedSpecs = JSON.parse(p.delivery_type); } catch { parsedSpecs = null; }
    } else if (p.specs && typeof p.specs === 'object') {
      parsedSpecs = p.specs;
    }

    const defaultTier = computedTiers[0];
    const flatPhp = Number(p.price_php ?? p.pricePHP ?? (defaultTier ? defaultTier.pricePHP : 0));
    const flatDiscount = Number(p.discount_percent ?? p.discountPercent ?? (defaultTier ? defaultTier.discountPercent : 0));
    const primaryPricing = defaultTier || computePricing(flatPhp, flatDiscount, liveRate);

    const deliveryLabel = parsedSpecs?.deliveryLabel || (isStockPool ? 'Instant Delivery' : 'Instant License');
    const platform = parsedSpecs?.platform || 'Windows 10 / 11';
    const quotaLabel = parsedSpecs?.quotaLabel || (isStockPool ? '1 Item per Unit' : (defaultTier?.dailyLimit ? `${defaultTier.dailyLimit} Accounts / Day` : 'Standard Quota'));
    const accessLevel = parsedSpecs?.accessLevel || 'Full Unrestricted';

    return {
      id: p.id,
      title: p.title,
      category: rawCategory,
      categorySlug: slugifyCategory(rawCategory),
      categoryLabel: rawCategory,
      badge: p.badge || (p.highlight ? 'RECOMMENDED' : (isBundle ? 'POPULAR' : 'OFFICIAL')),
      priceUSD: primaryPricing.priceUSD,
      pricePHP: primaryPricing.pricePHP,
      originalPriceUSD: primaryPricing.originalPriceUSD,
      originalPricePHP: primaryPricing.originalPricePHP,
      discountPercent: primaryPricing.discountPercent,
      hasDiscount: primaryPricing.hasDiscount,
      description: p.description || '',
      details: p.details || '',
      features: Array.isArray(p.features) ? p.features : [],
      deliveryType: deliveryLabel,
      deliveryTime: 'Instant Delivery',
      gradient: p.highlight
        ? 'from-purple-600/20 via-zinc-900/80 to-black'
        : 'from-purple-900/40 via-zinc-900/60 to-black',
      highlight: Boolean(p.highlight),
      imageUrl: p.image_url || p.imageUrl || '',
      deliveryMode: isStockPool ? 'stock_pool' : 'automated_license',
      stockCount: currentStock,
      isOutOfStock: isStockPool && currentStock <= 0,
      tierOptions: computedTiers,
      specs: {
        platform,
        deliveryLabel,
        quotaLabel,
        accessLevel,
      }
    };
  });

  // Unique categories list with highlight detection
  const categoryMap = new Map<string, { label: string; count: number; hasHighlight: boolean }>();
  for (const prod of products) {
    const slug = prod.categorySlug;
    const existing = categoryMap.get(slug);
    if (!existing) {
      categoryMap.set(slug, {
        label: prod.category,
        count: 1,
        hasHighlight: prod.highlight
      });
    } else {
      existing.count += 1;
      if (prod.highlight) existing.hasHighlight = true;
    }
  }

  const categories = Array.from(categoryMap.entries()).map(([slug, data]) => ({
    id: slug,
    slug,
    label: data.label,
    count: data.count,
    hasHighlight: data.hasHighlight
  }));

  return { products, liveRate, categories };
}

export async function getStoreProduct(idOrSlug: string): Promise<{ product: CatalogProduct; liveRate: number; related: CatalogProduct[] } | null> {
  const { products, liveRate } = await getStoreCatalog();
  const normalized = decodeURIComponent(idOrSlug).toLowerCase().trim();
  
  const product = products.find((p) => {
    return (
      p.id.toLowerCase() === normalized ||
      p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === normalized ||
      slugifyCategory(p.title) === normalized
    );
  });

  if (!product) return null;

  const related = products
    .filter((p) => p.id !== product.id && (p.categorySlug === product.categorySlug || p.highlight))
    .slice(0, 3);

  return { product, liveRate, related };
}

