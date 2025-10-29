import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_PAGES = ['/connexion', '/inscription'];

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
  }

  return NextResponse.next();
}

export const config = {
  // Matcher to run the middleware on specific paths
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
