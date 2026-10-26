import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel | ASYNC DEVELOPMENT',
  description: 'Owner command center, license fulfillment, order management, and operational telemetry for ASYNC DEVELOPMENT.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
