import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { areWorkplaceToolsEnabled, getInternalToolsAccessCode } from '@/lib/internal-tools-access';

const ACCESS_COOKIE = 'sb_access_token';
const SIMULATION_API_PREFIXES = [
  '/api/mining/',
  '/api/sc-gep/',
  '/api/analysis',
  '/api/centrality',
  '/api/enterprise/compliance',
  '/api/v1/constraint-scenarios',
];
const PROTECTED_API_PREFIXES = [
  '/api/procurement/',
  '/api/public-risk/',
  '/api/truth/maryland-procurement',
  '/api/internal-ops/',
  '/api/pdf/public-risk-memo',
  '/api/patterns',
  '/api/pilot/token',
  '/api/pilot/engagements/',
  '/api/pilot/submissions/',
  '/api/portfolio-upload/',
];
const INTERNAL_PAGE_PREFIXES = ['/internal-ops/', '/procurement-scanner'];

function isBypassPath(pathname: string) {
  // Allow the login page itself.
  if (pathname === '/login') return true;
  if (pathname === '/') return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname.startsWith('/claims')) return true;
  if (pathname.startsWith('/sample-dossier')) return true;
  if (pathname.startsWith('/free-scan')) return true;
  if (pathname.startsWith('/institutions')) return true;
  if (pathname.startsWith('/portfolio-intake')) return true;
  if (pathname.startsWith('/portfolio-upload')) return true;
  if (pathname.startsWith('/portfolio-report')) return true;
  if (pathname.startsWith('/pilot')) return true;
  if (pathname.startsWith('/risk-memo')) return true;

  // Allow static assets and Next internals.
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname.startsWith('/static/')) return true;
  if (pathname.startsWith('/public/')) return true;
  if (pathname.startsWith('/api/')) return true;

  return false;
}

function isProtectedApiPath(pathname: string) {
  return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isInternalOnlyPage(pathname: string) {
  return INTERNAL_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const workplaceToolsEnabled = areWorkplaceToolsEnabled();

  const allowSimulationApis = String(process.env.ALLOW_SIMULATION_APIS || '').toLowerCase() === 'true';
  if (pathname.startsWith('/api/') && !allowSimulationApis) {
    const isSimulationApi = SIMULATION_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (isSimulationApi) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Simulation endpoint disabled in production mode',
          path: pathname,
        },
        { status: 503 }
      );
    }
  }

  if (pathname.startsWith('/api/')) {
    if (!isProtectedApiPath(pathname)) {
      return NextResponse.next();
    }
  } else if (isBypassPath(pathname)) {
    return NextResponse.next();
  }

  if (workplaceToolsEnabled) {
    return NextResponse.next();
  }

  const expected = getInternalToolsAccessCode();
  const token = request.cookies.get(ACCESS_COOKIE)?.value ?? '';

  if (expected && token === expected) {
    return NextResponse.next();
  }

  const sessionToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (sessionToken) {
    return NextResponse.next();
  }

  const destination = `${pathname}${request.nextUrl.search}`;

  if (isInternalOnlyPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', destination);
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = '/auth/signin';
  url.searchParams.set('callbackUrl', destination);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on all routes (including API), but skip Next internals via the negative lookahead.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
