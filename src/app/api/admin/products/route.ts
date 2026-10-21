import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUsdToPhpRate, computePricing } from '@/lib/currency';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface ProductTier {
  id?: string;
  tier_key: 'daily' | 'weekly' | 'monthly' | 'lifetime';
  name: string;
  price_php: number;
  discount_percent: number;
  daily_limit?: number;
}

export interface UnifiedProduct {
  id: string;
  title: string;
  category: string;
  description: string;
  details?: string;
  features: string[];
  badge?: string;
  image_url?: string;
  delivery_mode: 'automated_license' | 'stock_pool';
  delivery_type?: string;
  service_scope?: 'all' | 'fivem' | 'single';
  tiers: ProductTier[];
  stock_pool?: string[];
  is_active: boolean;
  highlight?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export async function GET() {
  try {
    const liveRate = await getUsdToPhpRate();

    // 1. Try unified `products` table
    const { data: dbProducts, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });

    let productsList: any[] = [];

    if (!error && Array.isArray(dbProducts) && dbProducts.length > 0) {
      productsList = dbProducts;
    } else {
      // Fallback to config table
      const { data: row } = await supabaseAdmin
        .from('config')
        .select('value')
        .eq('key', 'storefront_products')
        .maybeSingle();

      if (row?.value) {
        try {
          productsList = JSON.parse(row.value);
        } catch {
          productsList = [];
        }
      }
    }

    // Attach computed pricing for admin review
    const enriched = productsList.map((p: any) => {
      const rawTiers = Array.isArray(p.tiers) ? p.tiers : (Array.isArray(p.tierOptions) ? p.tierOptions : []);
      const tiers = rawTiers.map((t: any, idx: number) => {
        const tierKey = t.tier_key || t.tierKey || 'daily';
        const basePhp = Number(t.price_php ?? t.pricePHP ?? 0);
        const discountPct = Number(t.discount_percent ?? t.discountPercent ?? 0);
        const pricing = computePricing(basePhp, discountPct, liveRate);

        return {
          id: t.id || `tier_${tierKey}_${idx}`,
          tier_key: tierKey,
          tierKey,
          name: t.name || (tierKey === 'daily' ? '1 Day' : tierKey === 'weekly' ? '7 Days' : tierKey === 'monthly' ? '30 Days' : 'Lifetime'),
          price_php: basePhp,
          pricePHP: pricing.pricePHP,
          priceUSD: pricing.priceUSD,
          originalPricePHP: pricing.originalPricePHP,
          originalPriceUSD: pricing.originalPriceUSD,
          discount_percent: discountPct,
          discountPercent: discountPct,
          hasDiscount: pricing.hasDiscount,
          daily_limit: t.daily_limit !== undefined ? Number(t.daily_limit) : (t.dailyLimit !== undefined ? Number(t.dailyLimit) : 15),
          dailyLimit: t.daily_limit !== undefined ? Number(t.daily_limit) : (t.dailyLimit !== undefined ? Number(t.dailyLimit) : 15)
        };
      });

      const defaultTier = tiers[0];
      const flatPhp = Number(p.price_php ?? p.pricePHP ?? (defaultTier ? defaultTier.price_php : 0));
      const flatDiscount = Number(p.discount_percent ?? p.discountPercent ?? (defaultTier ? defaultTier.discount_percent : 0));
      const primaryPricing = defaultTier || computePricing(flatPhp, flatDiscount, liveRate);

      return {
        ...p,
        imageUrl: p.image_url || p.imageUrl || '',
        deliveryMode: p.delivery_mode || p.deliveryMode || 'automated_license',
        deliveryType: p.delivery_type || p.deliveryType || 'Instant Cryptographic Key',
        serviceScope: p.service_scope || p.serviceScope || 'all',
        stockPool: Array.isArray(p.stock_pool) ? p.stock_pool : (Array.isArray(p.stockPool) ? p.stockPool : []),
        isActive: p.is_active !== undefined ? Boolean(p.is_active) : (p.isActive !== undefined ? Boolean(p.isActive) : true),
        tiers,
        tierOptions: tiers,
        pricePHP: primaryPricing.pricePHP,
        priceUSD: primaryPricing.priceUSD,
        originalPricePHP: primaryPricing.originalPricePHP,
        originalPriceUSD: primaryPricing.originalPriceUSD,
        discountPercent: primaryPricing.discountPercent,
        hasDiscount: primaryPricing.hasDiscount
      };
    });

    return new NextResponse(
      JSON.stringify({ products: enriched, liveRate }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    );
  } catch (error: any) {
    console.error('[Admin Products API] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerUserId, action, product } = body;

    const isOwner =
      ownerUserId === '719482630633947166' ||
      ownerUserId === process.env.OWNER_USER_ID ||
      ownerUserId === process.env.NEXT_PUBLIC_OWNER_USER_ID;

    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized: Owner access required' }, { status: 403 });
    }

    if (action === 'save_product') {
      if (!product || !product.title) {
        return NextResponse.json({ error: 'Missing product title or payload' }, { status: 400 });
      }

      const now = new Date().toISOString();
      const isNew = !product.id;
      const productId = isNew ? `prod_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` : product.id;

      // Clean stock pool lines
      let cleanStockPool: string[] = [];
      if (Array.isArray(product.stockPool)) {
        cleanStockPool = product.stockPool.map((s: string) => s.trim()).filter(Boolean);
      } else if (typeof product.stockPool === 'string') {
        cleanStockPool = (product.stockPool as string).split('\n').map((s) => s.trim()).filter(Boolean);
      }

      // Clean tiers with standard PHP and discount percentage
      const incomingTiers = Array.isArray(product.tiers) ? product.tiers : (Array.isArray(product.tierOptions) ? product.tierOptions : []);
      const cleanTiers: ProductTier[] = incomingTiers.map((t: any, idx: number) => {
        const key = (t.tier_key || t.tierKey || 'daily').toLowerCase() as 'daily' | 'weekly' | 'monthly' | 'lifetime';
        const defaultName = key === 'daily' ? '1 Day' : key === 'weekly' ? '7 Days' : key === 'monthly' ? '30 Days' : 'Lifetime';
        return {
          id: t.id || `tier_${key}_${idx}`,
          tier_key: key,
          name: (t.name || defaultName).trim(),
          price_php: Math.max(0, parseFloat(t.price_php ?? t.pricePHP) || 0),
          discount_percent: Math.min(100, Math.max(0, parseFloat(t.discount_percent ?? t.discountPercent) || 0)),
          daily_limit: t.daily_limit !== undefined ? parseInt(t.daily_limit, 10) : (t.dailyLimit !== undefined ? parseInt(t.dailyLimit, 10) : 15)
        };
      });

      const dbRow = {
        id: productId,
        title: product.title.trim(),
        category: product.category?.trim() || 'General',
        description: product.description?.trim() || '',
        details: product.details?.trim() || '',
        features: Array.isArray(product.features) ? product.features.map((f: string) => f.trim()).filter(Boolean) : [],
        badge: product.badge?.trim() || '',
        image_url: product.imageUrl?.trim() || product.image_url?.trim() || '',
        delivery_mode: product.deliveryMode === 'stock_pool' ? 'stock_pool' : 'automated_license',
        delivery_type: product.deliveryType?.trim() || (product.deliveryMode === 'stock_pool' ? 'Instant Credential Dispatch' : 'Instant Cryptographic Key'),
        service_scope: product.serviceScope || 'all',
        tiers: cleanTiers,
        stock_pool: cleanStockPool,
        is_active: product.isActive !== undefined ? Boolean(product.isActive) : true,
        highlight: Boolean(product.highlight),
        sort_order: product.sortOrder !== undefined ? Number(product.sortOrder) : 0,
        updated_at: now
      };

      // 1. Try Upsert into `products` table
      const { error: upsertErr } = await supabaseAdmin
        .from('products')
        .upsert({ ...dbRow, created_at: isNew ? now : (product.createdAt || now) });

      if (upsertErr) {
        console.warn('[Admin Products API] Upsert into products table skipped/failed, keeping config in sync:', upsertErr.message);
      }

      // 2. Also keep `config.storefront_products` synced as bulletproof fallback
      const { data: configRow } = await supabaseAdmin
        .from('config')
        .select('value')
        .eq('key', 'storefront_products')
        .maybeSingle();

      let currentConfig: any[] = [];
      if (configRow?.value) {
        try { currentConfig = JSON.parse(configRow.value); } catch { currentConfig = []; }
      }

      const existingConfigIdx = currentConfig.findIndex((p: any) => p.id === productId);
      if (existingConfigIdx >= 0) {
        currentConfig[existingConfigIdx] = dbRow;
      } else {
        currentConfig.push(dbRow);
      }

      await supabaseAdmin.from('config').upsert({
        key: 'storefront_products',
        value: JSON.stringify(currentConfig),
        updated_at: now
      });

      return NextResponse.json({ success: true, product: dbRow });
    }

    if (action === 'toggle_status') {
      const { productId } = body;
      // Toggle in products table
      const { data: prod } = await supabaseAdmin.from('products').select('is_active').eq('id', productId).maybeSingle();
      if (prod) {
        await supabaseAdmin.from('products').update({ is_active: !prod.is_active, updated_at: new Date().toISOString() }).eq('id', productId);
      }

      // Toggle in config table
      const { data: configRow } = await supabaseAdmin.from('config').select('value').eq('key', 'storefront_products').maybeSingle();
      if (configRow?.value) {
        try {
          const list = JSON.parse(configRow.value);
          const item = list.find((p: any) => p.id === productId);
          if (item) {
            item.is_active = !item.is_active;
            item.isActive = item.is_active;
            item.updated_at = new Date().toISOString();
            await supabaseAdmin.from('config').upsert({ key: 'storefront_products', value: JSON.stringify(list), updated_at: new Date().toISOString() });
          }
        } catch {}
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin Products API] POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    const ownerUserId = searchParams.get('ownerUserId');

    const isOwner =
      ownerUserId === '719482630633947166' ||
      ownerUserId === process.env.OWNER_USER_ID ||
      ownerUserId === process.env.NEXT_PUBLIC_OWNER_USER_ID;

    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized: Owner access required' }, { status: 403 });
    }

    if (!productId) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    // Delete from products table
    await supabaseAdmin.from('products').delete().eq('id', productId);

    // Delete from config table
    const { data: configRow } = await supabaseAdmin.from('config').select('value').eq('key', 'storefront_products').maybeSingle();
    if (configRow?.value) {
      try {
        const list = JSON.parse(configRow.value).filter((p: any) => p.id !== productId);
        await supabaseAdmin.from('config').upsert({ key: 'storefront_products', value: JSON.stringify(list), updated_at: new Date().toISOString() });
      } catch {}
    }

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    console.error('[Admin Products API] DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
