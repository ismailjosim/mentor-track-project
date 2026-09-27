import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReportsClient, ReportsLoading } from '@/components/Reports';

export const metadata: Metadata = {
  title: 'Cohort Reports | Mentor Track',
  description: 'Pick sections, generate cohort analytics reports, and export CSV/Excel sheets.',
};

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <ReportsClient />
    </Suspense>
  );
}
