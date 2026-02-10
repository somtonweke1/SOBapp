import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Public routes that should NOT require authentication (marketing/lead gen pages)
const publicRoutes = [
  '/compliance',
  '/critical-minerals',
  '/entity-list-scanner',
  '/entity-list-report',
  '/supply-chain-risk',
  '/risk-report',
  '/weekly-briefing-sample',
];

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/analytics',
  '/supply-chain',
  '/optimization',
  '/settings',
  '/api/networks',
  '/api/scenarios',
  '/api/analyses',
];

// Routes that require specific roles
const roleProtectedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/api/admin': ['admin'],
  '/api/users': ['admin', 'manager'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without authentication
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to signin if not authenticated
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check role-based access
  for (const [route, allowedRoles] of Object.entries(roleProtectedRoutes)) {
    if (pathname.startsWith(route)) {
      const userRole = token.role as string;
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }
  }

  // Check subscription limits for premium features
  if (pathname.startsWith('/analytics/advanced') || pathname.startsWith('/supply-chain/optimization')) {
    const subscription = token.subscription as string;
    if (subscription === 'free') {
      return NextResponse.redirect(new URL('/pricing', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth routes (signin, register, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth).*)',
  ],
};
