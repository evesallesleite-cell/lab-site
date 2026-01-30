import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Allow login page and static assets
  if (path === '/login' || path.startsWith('/_next') || path.startsWith('/static')) {
    return NextResponse.next();
  }
  
  // Check for auth cookie
  const hasCookie = request.cookies.get('lab-access');
  
  // If no cookie, redirect to login
  if (!hasCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/whoop/:path*', '/blood-tests/:path*', '/medical/:path*', '/supplement-stack/:path*', '/data-management/:path*'],
};
