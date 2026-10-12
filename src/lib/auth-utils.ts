/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from 'react';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { UnauthorizedError } from '@/lib/errors';

export const SUPER_ADMIN_EMAILS = ['ismailjosim99@gmail.com'];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export function hasAdminPrivileges(
  user?: { role?: string | null; email?: string | null } | null
): boolean {
  if (!user) return false;
  if (isSuperAdminEmail(user.email)) return true;
  const role = user.role?.toLowerCase();
  return role === 'super_admin' || role === 'admin' || role === 'system_admin';
}

/**
 * Pure read, memoized session retrieval per request lifecycle (Rule 19.2)
 */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return session?.user?.id ?? null;
  } catch {
    return null;
  }
});

/**
 * Pure read, memoized full session retrieval
 */
export const getCurrentSession = cache(async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user) {
      if (isSuperAdminEmail(session.user.email)) {
        (session.user as any).role = 'super_admin';
      }
    }

    return session ?? null;
  } catch {
    return null;
  }
});

/**
 * Asserts authentication for server actions / services, throwing typed UnauthorizedError.
 */
export async function assertAuthenticated(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new UnauthorizedError('You must be logged in to perform this action.');
  }
  return userId;
}

/**
 * Safe auth check for API routes returning a standardized 401 response if unauthenticated.
 * Pure read: never performs side-effects or DB writes (Rule 19.1).
 */
export async function requireCurrentUserId(): Promise<
  { userId: string; response: null } | { userId: null; response: NextResponse }
> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      userId: null,
      response: NextResponse.json(
        {
          success: false,
          code: 'UNAUTHENTICATED',
          message: 'Unauthorized',
        },
        { status: 401 }
      ),
    };
  }

  return { userId, response: null };
}

/**
 * Requires super_admin or admin role for system administration.
 */
export async function requireAdminUser(): Promise<
  { user: any; response: null } | { user: null; response: NextResponse }
> {
  const session = await getCurrentSession();

  if (!session?.user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          code: 'UNAUTHENTICATED',
          message: 'You must be logged in to access this resource.',
        },
        { status: 401 }
      ),
    };
  }

  if (!hasAdminPrivileges(session.user)) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Access denied: Super Admin or Admin privileges required.',
        },
        { status: 403 }
      ),
    };
  }

  return { user: session.user, response: null };
}
