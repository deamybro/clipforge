import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/clips', '/account'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if route is protected
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  
  if (isProtected) {
    // Check for auth cookie (Firebase sets this)
    // We rely on client-side auth redirect for simplicity
    // The actual auth check happens in the page components
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
