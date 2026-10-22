import { Suspense } from 'react';
import { getStoreCatalog } from '@/lib/catalog';
import ProductsCatalogClient from '@/components/ProductsCatalogClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductsPage() {
  const { products, liveRate, categories } = await getStoreCatalog();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <div className="text-zinc-500 font-mono text-xs animate-pulse">Loading ASYNC Catalog...</div>
      </div>
    }>
      <ProductsCatalogClient
        initialProducts={products}
        liveRate={liveRate}
        initialCategories={categories}
      />
    </Suspense>
  );
}

