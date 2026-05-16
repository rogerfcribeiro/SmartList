import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];
const PUBLIC_ROUTES = ['/api/v1/auth/signup', '/api/v1/auth/login', '/api/v1/auth/forgot-password', '/api/v1/auth/reset-password'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicApi = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  if (isPublicApi) return NextResponse.next();

  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (isLoggedIn && (isAuthRoute || pathname === '/')) {
    return NextResponse.redirect(new URL('/lists', req.url));
  }
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
