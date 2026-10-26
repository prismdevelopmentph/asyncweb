import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Generator Panel | ASYNC DEVELOPMENT',
  description: 'Digital asset, account generation, and credential fulfillment portal for ASYNC DEVELOPMENT.',
};

export default function GeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

