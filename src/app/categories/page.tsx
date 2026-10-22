import { getStoreCatalog } from '@/lib/catalog';
import CategoriesClient from '@/components/CategoriesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoriesPage() {
  const { products, liveRate, categories } = await getStoreCatalog();

  // Aggregate category summaries with sample products and lowest pricing
  const categorySummaries = categories.map((cat) => {
    const prodsInCat = products.filter((p) => p.category.toLowerCase() === cat.label.toLowerCase() || p.categorySlug === cat.slug);
    const minPhp = prodsInCat.length > 0 ? Math.min(...prodsInCat.map((p) => p.pricePHP)) : 0;
    const minUsd = prodsInCat.length > 0 ? Math.min(...prodsInCat.map((p) => p.priceUSD)) : 0;
    const sampleProducts = prodsInCat.slice(0, 3).map((p) => p.title);

    return {
      id: cat.id,
      slug: cat.slug,
      label: cat.label,
      count: cat.count,
      hasHighlight: cat.hasHighlight,
      minPricePHP: minPhp,
      minPriceUSD: minUsd,
      sampleProducts
    };
  });

  return (
    <CategoriesClient
      categories={categorySummaries}
      products={products}
      liveRate={liveRate}
    />
  );
}
