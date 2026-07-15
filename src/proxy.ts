import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const userId = request.cookies.get('spendwise-userid')?.value;
  const { pathname } = request.nextUrl;

  // Protected paths (pages that require authentication)
  const isProtectedPath = 
    pathname === '/' ||
    pathname.startsWith('/accounts') ||
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/cards') ||
    pathname.startsWith('/budgets') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/settings');

  // Auth pages (login, register)
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If the path is protected and the user is NOT logged in, redirect to login page
  if (isProtectedPath && !userId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user IS logged in and tries to access login/register, redirect to dashboard
  if (isAuthPath && userId) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Config to specify which paths this middleware applies to (excluding static assets)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
