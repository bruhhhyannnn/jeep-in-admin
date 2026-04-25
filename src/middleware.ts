import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware runs on the Edge runtime — Firebase Admin SDK is NOT available here.
 * Strategy: on sign-in we create a session cookie (via /api/auth/session) that contains
 * the user's role as a custom claim. We verify the cookie server-side in API routes.
 * Here in middleware we do a lightweight check: if no session cookie → redirect to signin.
 * Role-specific page protection is handled in the layout via the AuthProvider.
 */

const PUBLIC_PATHS = ['/signin', '/unauthorized', '/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Check for session cookie presence (existence check only — full verification in layouts)
  const session = request.cookies.get('jeep-in-session');

  if (!session?.value) {
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
