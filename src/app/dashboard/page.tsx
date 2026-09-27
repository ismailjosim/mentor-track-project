import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardClient, DashboardSkeleton } from '@/components/Dashboard';

export const metadata: Metadata = {
  title: 'Cohort Dashboard | Mentor Track',
  description: 'A live view of student progress, outreach priorities, and cohort momentum.',
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient />
    </Suspense>
  );
}
