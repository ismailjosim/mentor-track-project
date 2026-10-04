import { cache } from 'react';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { UnauthorizedError } from '@/lib/errors';

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
