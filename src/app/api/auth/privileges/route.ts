import { NextResponse } from 'next/server';
import { getCurrentSession, hasAdminPrivileges, isSuperAdminEmail } from '@/lib/auth-utils';

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const isSuperAdmin =
    isSuperAdminEmail(session.user.email) || session.user.role?.toLowerCase() === 'super_admin';

  return NextResponse.json({
    isAdmin: hasAdminPrivileges(session.user),
    isSuperAdmin,
  });
}
