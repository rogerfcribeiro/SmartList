import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/lists') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
  if (authPaths.some((p) => pathname.startsWith(p)) && isLoggedIn) {
    return NextResponse.redirect(new URL('/lists', req.url));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
