import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StudentsPageClient } from '@/components/Students/StudentsPageClient';
import { StudentsLoading } from '@/components/Students/StudentsLoading';

export const metadata: Metadata = {
  title: 'Students | Mentor Track',
  description: 'Manage students, track assignments, review status, and initiate outreach.',
};

export default function StudentsPage() {
  return (
    <Suspense fallback={<StudentsLoading />}>
      <StudentsPageClient />
    </Suspense>
  );
}
