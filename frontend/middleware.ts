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

  // Analyst routes (Dashboard, alerts, users, etc.)
  const analystRoutes = ['/', '/alerts', '/users', '/access-requests', '/incidents', '/pending-signups'];
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
