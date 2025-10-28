import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_PAGES = ['/connexion', '/inscription'];
const APP_PAGES_PREFIX = '/';

// This middleware redirects logged in users from auth pages to the dashboard.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has('firebaseIdToken');

  const isAuthPage = AUTH_PAGES.some(page => pathname.startsWith(page));

  if (isAuthPage) {
    if (hasToken) {
      // Redirect logged-in users away from auth pages
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else if (pathname === '/') {
    // The root path is now the marketing homepage, no redirect needed if not logged in.
    // If logged in, you might want to redirect to the dashboard.
    if (hasToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Matcher to run the middleware on specific paths
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
