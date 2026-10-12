import { redirect } from 'next/navigation';
import { getCurrentSession, hasAdminPrivileges } from '@/lib/auth-utils';
import { AdminClient } from '@/components/Admin/AdminClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Administration - MentorTrack',
  description:
    'System overview, users, batches, and activities for Super Admin and Administrators.',
};

export default async function AdminPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect('/auth/login');
  }

  if (!hasAdminPrivileges(session.user)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminClient />
    </div>
  );
}
