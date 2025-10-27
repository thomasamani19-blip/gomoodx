import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware redirects users from the root path ("/") to the feed page ("/feed").
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/feed', request.url));
  }
}

export const config = {
  matcher: '/',
};
