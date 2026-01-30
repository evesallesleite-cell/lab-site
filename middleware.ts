import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple password protection - change this to your preferred passcode
const SITE_PASSWORD = 'lab2024';

export function middleware(request: NextRequest) {
  // Only protect production deployments
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  // Check if user has the password cookie
  const hasCookie = request.cookies.get('lab-access');

  // Allow access to login page
  if (request.nextUrl.pathname === '/login') {
    if (hasCookie?.value === SITE_PASSWORD) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    return NextResponse.next();
  }

  // Redirect to login if no valid cookie
  if (!hasCookie || hasCookie.value !== SITE_PASSWORD) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/whoop/:path*', '/blood-tests/:path*', '/medical/:path*', '/supplement-stack/:path*', '/data-management/:path*'],
};