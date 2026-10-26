import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reseller Panel | ASYNC DEVELOPMENT',
  description: 'Wholesale distributor portal, batch key minting, and credit balance ledger for ASYNC DEVELOPMENT.',
};

export default function ResellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

