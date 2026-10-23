import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreProduct } from '@/lib/catalog';
import ProductDetailClient from '@/components/ProductDetailClient';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getStoreProduct(id);

  if (!data) {
    return {
      title: 'Product Not Found | ASYNC',
      description: 'The requested product could not be found in the ASYNC catalog.'
    };
  }

  const { product } = data;
  const title = `${product.title} | ASYNC Store`;
  const description = product.description.slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: product.imageUrl ? [{ url: product.imageUrl, alt: product.title }] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined
    }
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getStoreProduct(id);

  if (!data) {
    notFound();
  }

  return (
    <ProductDetailClient
      product={data.product}
      liveRate={data.liveRate}
      related={data.related}
    />
  );
}

