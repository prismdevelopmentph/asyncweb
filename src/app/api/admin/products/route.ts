import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export interface ProductTierOption {
  id: string;
  tierKey: 'daily' | 'weekly' | 'monthly' | 'lifetime';
  name: string;
  priceUSD: number;
  pricePHP: number;
  originalPriceUSD?: number;
  originalPricePHP?: number;
  dailyLimit?: number;
}

export interface DigitalProduct {
  id: string;
  title: string;
  category: string;
  priceUSD: number;
  pricePHP: number;
  originalPriceUSD?: number;
  originalPricePHP?: number;
  description: string;
  features: string[];
  imageUrl?: string;
  deliveryMode: 'automated_license' | 'stock_pool';
  licenseTier?: 'daily' | 'weekly' | 'monthly' | 'lifetime';
  dailyLimit?: number;
  serviceScope?: 'all' | 'fivem' | 'single';
  packageId?: string;
  stockPool?: string[];
  badge?: string;
  deliveryType?: string;
  tierOptions?: ProductTierOption[];
  isActive: boolean;
  highlight?: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_PRODUCTS: DigitalProduct[] = [
  {
    id: 'prod_gen_per_service',
    title: 'Single Service Generator License',
    category: 'Generator Licenses',
    priceUSD: 1.0,
    pricePHP: 50.0,
    originalPriceUSD: 2.0,
    originalPricePHP: 100.0,
    description: 'Dedicated license key for 1 selected game or service tier.',
    features: [
      '1 Target Service of Choice (e.g. Rockstar, Steam, Discord)',
      '15 Generations per Day limit',
      'Daily 00:00 UTC automated quota reset',
      'Instant cryptographic key issuance',
      '100% Replacement warranty guarantee',
      'Direct Discord bot + Web dashboard access'
    ],
    imageUrl: '',
    deliveryMode: 'automated_license',
    licenseTier: 'daily',
    dailyLimit: 15,
    serviceScope: 'single',
    stockPool: [],
    badge: 'SINGLE ACCESS',
    deliveryType: 'Instant Cryptographic Key',
    tierOptions: [
      { id: 'opt_single_daily', tierKey: 'daily', name: '1 Day', priceUSD: 1.0, pricePHP: 50.0, originalPriceUSD: 2.0, originalPricePHP: 100.0, dailyLimit: 15 },
      { id: 'opt_single_weekly', tierKey: 'weekly', name: '7 Days', priceUSD: 5.0, pricePHP: 250.0, originalPriceUSD: 7.0, originalPricePHP: 350.0, dailyLimit: 15 },
      { id: 'opt_single_monthly', tierKey: 'monthly', name: '30 Days', priceUSD: 15.0, pricePHP: 750.0, originalPriceUSD: 20.0, originalPricePHP: 1000.0, dailyLimit: 15 },
      { id: 'opt_single_lifetime', tierKey: 'lifetime', name: 'Lifetime', priceUSD: 30.0, pricePHP: 1500.0, originalPriceUSD: 40.0, originalPricePHP: 2000.0, dailyLimit: 25 }
    ],
    isActive: true,
    highlight: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_gen_fivem_bundle',
    title: 'FiveM Bundle Generator License',
    category: 'Generator Licenses',
    priceUSD: 1.5,
    pricePHP: 75.0,
    originalPriceUSD: 3.0,
    originalPricePHP: 150.0,
    description: 'Full unban & bypass bundle covering Rockstar, Steam, and Discord.',
    features: [
      'Full Rockstar Games account generator',
      'Steam verified account pool access',
      'Discord aged unflagged accounts',
      '15 Generations per Day shared limit',
      'Real-time automated stock sync',
      'Priority delivery routing'
    ],
    imageUrl: '',
    deliveryMode: 'automated_license',
    licenseTier: 'daily',
    dailyLimit: 15,
    serviceScope: 'fivem',
    stockPool: [],
    badge: 'POPULAR BUNDLE',
    deliveryType: 'Instant Cryptographic Key',
    tierOptions: [
      { id: 'opt_fivem_daily', tierKey: 'daily', name: '1 Day', priceUSD: 1.5, pricePHP: 75.0, originalPriceUSD: 3.0, originalPricePHP: 150.0, dailyLimit: 15 },
      { id: 'opt_fivem_weekly', tierKey: 'weekly', name: '7 Days', priceUSD: 7.0, pricePHP: 350.0, originalPriceUSD: 10.0, originalPricePHP: 500.0, dailyLimit: 15 },
      { id: 'opt_fivem_monthly', tierKey: 'monthly', name: '30 Days', priceUSD: 20.0, pricePHP: 1000.0, originalPriceUSD: 25.0, originalPricePHP: 1250.0, dailyLimit: 20 },
      { id: 'opt_fivem_lifetime', tierKey: 'lifetime', name: 'Lifetime', priceUSD: 40.0, pricePHP: 2000.0, originalPriceUSD: 50.0, originalPricePHP: 2500.0, dailyLimit: 30 }
    ],
    isActive: true,
    highlight: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_gen_all_access',
    title: 'All-Access Pass Generator License',
    category: 'Generator Licenses',
    priceUSD: 2.5,
    pricePHP: 125.0,
    originalPriceUSD: 5.0,
    originalPricePHP: 250.0,
    description: 'Unrestricted generator access covering every service in our pool.',
    features: [
      'Complete catalog access (Rockstar, Steam, Discord, VPN, Netflix, Valorant)',
      '20 Generations per Day VIP quota',
      'Daily automated stock priority restocks',
      'Multi-device session persistence',
      'Guaranteed replacement coverage',
      'Direct priority support ticket channel'
    ],
    imageUrl: '',
    deliveryMode: 'automated_license',
    licenseTier: 'daily',
    dailyLimit: 20,
    serviceScope: 'all',
    stockPool: [],
    badge: 'VIP ACCESS',
    deliveryType: 'Instant Cryptographic Key',
    tierOptions: [
      { id: 'opt_all_daily', tierKey: 'daily', name: '1 Day', priceUSD: 2.5, pricePHP: 125.0, originalPriceUSD: 5.0, originalPricePHP: 250.0, dailyLimit: 20 },
      { id: 'opt_all_weekly', tierKey: 'weekly', name: '7 Days', priceUSD: 10.0, pricePHP: 500.0, originalPriceUSD: 15.0, originalPricePHP: 750.0, dailyLimit: 20 },
      { id: 'opt_all_monthly', tierKey: 'monthly', name: '30 Days', priceUSD: 25.0, pricePHP: 1250.0, originalPriceUSD: 35.0, originalPricePHP: 1750.0, dailyLimit: 25 },
      { id: 'opt_all_lifetime', tierKey: 'lifetime', name: 'Lifetime', priceUSD: 50.0, pricePHP: 2500.0, originalPriceUSD: 70.0, originalPricePHP: 3500.0, dailyLimit: 50 }
    ],
    isActive: true,
    highlight: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function getStoredProducts(): Promise<DigitalProduct[]> {
  try {
    const { data: row } = await supabaseAdmin
      .from('config')
      .select('value')
      .eq('key', 'storefront_products')
      .maybeSingle();

    if (row?.value) {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Seed default products into Supabase config if not present
    await supabaseAdmin
      .from('config')
      .upsert({
        key: 'storefront_products',
        value: JSON.stringify(DEFAULT_PRODUCTS)
      }, { onConflict: 'key' });

    return DEFAULT_PRODUCTS;
  } catch (err) {
    console.error('[Products API] Error reading products:', err);
    return DEFAULT_PRODUCTS;
  }
}

async function saveProducts(products: DigitalProduct[]): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('config')
    .upsert({
      key: 'storefront_products',
      value: JSON.stringify(products)
    }, { onConflict: 'key' });

  if (error) {
    console.error('[Products API] Error saving products:', error);
    return false;
  }
  return true;
}

export async function GET() {
  try {
    const products = await getStoredProducts();
    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('[Products API] GET Error:', error);
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

    const products = await getStoredProducts();

    if (action === 'save_product') {
      if (!product || !product.title) {
        return NextResponse.json({ error: 'Missing product title or payload' }, { status: 400 });
      }

      const now = new Date().toISOString();
      const isNew = !product.id;
      const productId = isNew ? `prod_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` : product.id;

      // Clean stock pool lines if in manual resupply mode
      let cleanStockPool: string[] = [];
      if (Array.isArray(product.stockPool)) {
        cleanStockPool = product.stockPool.map((s: string) => s.trim()).filter(Boolean);
      } else if (typeof product.stockPool === 'string') {
        cleanStockPool = (product.stockPool as string)
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
      }

      // Clean tier options if in automated license mode
      let cleanTierOptions: ProductTierOption[] = [];
      if (Array.isArray(product.tierOptions) && product.tierOptions.length > 0) {
        cleanTierOptions = product.tierOptions.map((t: any, idx: number) => {
          const key = (t.tierKey || 'daily').toLowerCase() as 'daily' | 'weekly' | 'monthly' | 'lifetime';
          const defaultName =
            key === 'daily' ? '1 Day' : key === 'weekly' ? '7 Days' : key === 'monthly' ? '30 Days' : 'Lifetime';
          return {
            id: t.id || `tier_${key}_${idx}`,
            tierKey: key,
            name: (t.name || defaultName).trim(),
            priceUSD: Number(t.priceUSD) || 0,
            pricePHP: Number(t.pricePHP) || 0,
            originalPriceUSD: t.originalPriceUSD ? Number(t.originalPriceUSD) : undefined,
            originalPricePHP: t.originalPricePHP ? Number(t.originalPricePHP) : undefined,
            dailyLimit: t.dailyLimit ? Number(t.dailyLimit) : 15
          };
        });
      }

      const defaultPriceUSD = cleanTierOptions.length > 0 ? cleanTierOptions[0].priceUSD : (Number(product.priceUSD) || 0);
      const defaultPricePHP = cleanTierOptions.length > 0 ? cleanTierOptions[0].pricePHP : (Number(product.pricePHP) || 0);

      const formattedProduct: DigitalProduct = {
        id: productId,
        title: product.title.trim(),
        category: product.category?.trim() || 'General',
        priceUSD: Number(product.priceUSD) || defaultPriceUSD,
        pricePHP: Number(product.pricePHP) || defaultPricePHP,
        originalPriceUSD: product.originalPriceUSD ? Number(product.originalPriceUSD) : cleanTierOptions[0]?.originalPriceUSD,
        originalPricePHP: product.originalPricePHP ? Number(product.originalPricePHP) : cleanTierOptions[0]?.originalPricePHP,
        description: product.description?.trim() || '',
        features: Array.isArray(product.features) ? product.features.map((f: string) => f.trim()).filter(Boolean) : [],
        imageUrl: product.imageUrl?.trim() || '',
        deliveryMode: product.deliveryMode === 'stock_pool' ? 'stock_pool' : 'automated_license',
        licenseTier: product.licenseTier || 'daily',
        dailyLimit: product.dailyLimit ? Number(product.dailyLimit) : 15,
        serviceScope: product.serviceScope || 'all',
        packageId: product.packageId || undefined,
        stockPool: cleanStockPool,
        badge: product.badge?.trim() || '',
        deliveryType: product.deliveryType?.trim() || (product.deliveryMode === 'stock_pool' ? 'Instant Credential Dispatch' : 'Instant Cryptographic Key'),
        tierOptions: cleanTierOptions,
        isActive: product.isActive !== undefined ? Boolean(product.isActive) : true,
        highlight: Boolean(product.highlight),
        createdAt: isNew ? now : (product.createdAt || now),
        updatedAt: now
      };

      let updatedList: DigitalProduct[];
      const existingIdx = products.findIndex((p) => p.id === productId);
      if (existingIdx >= 0) {
        updatedList = [...products];
        updatedList[existingIdx] = formattedProduct;
      } else {
        updatedList = [formattedProduct, ...products];
      }

      const saved = await saveProducts(updatedList);
      if (!saved) {
        return NextResponse.json({ error: 'Failed to write product changes to database' }, { status: 500 });
      }

      return NextResponse.json({ success: true, product: formattedProduct });
    }

    if (action === 'toggle_status') {
      const { productId } = body;
      const target = products.find((p) => p.id === productId);
      if (!target) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

      target.isActive = !target.isActive;
      target.updatedAt = new Date().toISOString();

      await saveProducts(products);
      return NextResponse.json({ success: true, product: target });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Products API] POST Error:', error);
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

    const products = await getStoredProducts();
    const updated = products.filter((p) => p.id !== productId);

    await saveProducts(updated);
    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    console.error('[Products API] DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

