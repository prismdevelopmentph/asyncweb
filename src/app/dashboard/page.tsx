import { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'Customer Dashboard - ASYNC Development',
  description: 'Manage your ASYNC orders, delivered licenses, web wallet balance, and generator access.',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
