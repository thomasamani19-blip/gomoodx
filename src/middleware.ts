
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_PAGES = ['/connexion', '/inscription'];
const APP_ROUTES_PREFIX = '/'; // Assuming logged-in routes are at the root now

// This middleware redirects logged in users from auth pages to the dashboard.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has('firebaseIdToken');

  const isAuthPage = AUTH_PAGES.some(page => pathname.startsWith(page));

  if (isAuthPage) {
    if (hasToken) {
      // Redirect logged-in users away from auth pages to the dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Allow unauthenticated users to access auth pages
    return NextResponse.next();
  }

  // For any other page that is not public, if the user is not authenticated,
  // redirect them to the home page.
  // This is a simple protection, more robust logic might be needed.
  if (!hasToken && pathname.startsWith(APP_ROUTES_PREFIX) && pathname !== '/' && !pathname.startsWith('/a-propos') && !pathname.startsWith('/cgu') && !pathname.startsWith('/contact') && !pathname.startsWith('/politique-de-confidentialite') && !pathname.startsWith('/annonces') && !pathname.startsWith('/boutique') && !pathname.startsWith('/blog') && !pathname.startsWith('/live')) {
     return NextResponse.redirect(new URL('/connexion', request.url));
  }


  return NextResponse.next();
}

export const config = {
  // Matcher to run the middleware on specific paths
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
