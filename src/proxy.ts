// src/proxy.ts

import { getSessionCookie } from 'better-auth/cookies';
import { NextRequest, NextResponse } from 'next/server';

// Public routes
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/error',
  '/health',
  '/login',
  '/register',
];

const authRoutes = ['/auth/login', '/auth/register', '/login', '/register'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  // If already logged in and visiting login or register, redirect to dashboard
  if (sessionCookie && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow public routes for non-logged-in users
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  if (!sessionCookie) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - static assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
