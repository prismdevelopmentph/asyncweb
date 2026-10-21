import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

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
  licenseTier?: '1day' | '7day' | '30day' | 'lifetime';
  dailyLimit?: number;
  serviceScope?: 'all' | 'fivem' | 'single';
  packageId?: string;
  stockPool?: string[];
  badge?: string;
  deliveryType?: string;
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
    description: '24-hour dedicated license key for 1 selected game or service tier.',
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
    licenseTier: '1day',
    dailyLimit: 15,
    serviceScope: 'single',
    stockPool: [],
    badge: 'SINGLE ACCESS',
    deliveryType: 'Instant Cryptographic Key',
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
    licenseTier: '1day',
    dailyLimit: 15,
    serviceScope: 'fivem',
    stockPool: [],
    badge: 'POPULAR BUNDLE',
    deliveryType: 'Instant Cryptographic Key',
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
    licenseTier: '1day',
    dailyLimit: 20,
    serviceScope: 'all',
    stockPool: [],
    badge: 'VIP ACCESS',
    deliveryType: 'Instant Cryptographic Key',
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

      const formattedProduct: DigitalProduct = {
        id: productId,
        title: product.title.trim(),
        category: product.category?.trim() || 'General',
        priceUSD: Number(product.priceUSD) || 0,
        pricePHP: Number(product.pricePHP) || 0,
        originalPriceUSD: product.originalPriceUSD ? Number(product.originalPriceUSD) : undefined,
        originalPricePHP: product.originalPricePHP ? Number(product.originalPricePHP) : undefined,
        description: product.description?.trim() || '',
        features: Array.isArray(product.features) ? product.features.map((f: string) => f.trim()).filter(Boolean) : [],
        imageUrl: product.imageUrl?.trim() || '',
        deliveryMode: product.deliveryMode === 'stock_pool' ? 'stock_pool' : 'automated_license',
        licenseTier: product.licenseTier || '1day',
        dailyLimit: product.dailyLimit ? Number(product.dailyLimit) : 15,
        serviceScope: product.serviceScope || 'all',
        packageId: product.packageId || undefined,
        stockPool: cleanStockPool,
        badge: product.badge?.trim() || '',
        deliveryType: product.deliveryType?.trim() || (product.deliveryMode === 'stock_pool' ? 'Instant Credential Dispatch' : 'Instant Cryptographic Key'),
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
