import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public paths
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Employee routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/employee')) {
    const hasEmpSession = request.cookies.has('emp_session');
    if (!hasEmpSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Root path redirect
  if (pathname === '/') {
    if (request.cookies.has('analyst_session')) {
      return NextResponse.redirect(new URL('/analyst', request.url));
    }
    if (request.cookies.has('emp_session')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Analyst routes
  const analystRoutes = ['/analyst', '/analyst/alerts', '/analyst/users', '/analyst/access-requests', '/analyst/incidents', '/analyst/pending-signups'];
  const isAnalystRoute = analystRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
  const isAnalystApi = pathname.startsWith('/api/analyst');
  
  if (isAnalystRoute || isAnalystApi) {
    const hasAnalystSession = request.cookies.has('analyst_session');
    if (!hasAnalystSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
}
