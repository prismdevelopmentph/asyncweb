import StorefrontClient from '@/components/StorefrontClient';
import { supabaseAdmin } from '@/lib/supabase';
import { getStoreCatalog } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const { products, liveRate } = await getStoreCatalog();

  // Fetch indexed reviews snapshot directly from Supabase
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
      highlightOnly={true}
    />
  );
}
