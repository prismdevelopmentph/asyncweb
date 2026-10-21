import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: row } = await supabaseAdmin
      .from('config')
      .select('value')
      .eq('key', 'storefront_products')
      .maybeSingle();

    if (!row?.value) {
      return NextResponse.json({ products: [] });
    }

    const allProducts = JSON.parse(row.value);
    if (!Array.isArray(allProducts)) {
      return NextResponse.json({ products: [] });
    }

    // Filter active and sanitize (strip raw stockPool serials from public view)
    const publicProducts = allProducts
      .filter((p: any) => p.isActive)
      .map((p: any) => {
        const isStockPool = p.deliveryMode === 'stock_pool';
        const currentStock = isStockPool ? (Array.isArray(p.stockPool) ? p.stockPool.length : 0) : -1;

        return {
          id: p.id,
          title: p.title,
          category: p.category || 'General',
          priceUSD: Number(p.priceUSD) || 0,
          pricePHP: Number(p.pricePHP) || 0,
          originalPriceUSD: p.originalPriceUSD ? Number(p.originalPriceUSD) : undefined,
          originalPricePHP: p.originalPricePHP ? Number(p.originalPricePHP) : undefined,
          description: p.description || '',
          features: Array.isArray(p.features) ? p.features : [],
          imageUrl: p.imageUrl || '',
          deliveryMode: p.deliveryMode || 'automated_license',
          licenseTier: p.licenseTier || '1day',
          badge: p.badge || '',
          deliveryType: p.deliveryType || (isStockPool ? 'Instant Credential Dispatch' : 'Instant Cryptographic Key'),
          tierOptions: Array.isArray(p.tierOptions) ? p.tierOptions : [],
          highlight: Boolean(p.highlight),
          stockCount: currentStock, // -1 means infinite automated generation
          isOutOfStock: isStockPool && currentStock <= 0
        };
      });

    return NextResponse.json({ products: publicProducts });
  } catch (error: any) {
    console.error('[Public Products API] Error:', error);
    return NextResponse.json({ products: [] });
  }
}

