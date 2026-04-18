import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Checks if a pathname matches admin routes
 */
function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function isAdminApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/admin");
}

function isAdminAuthBypassRoute(pathname: string): boolean {
  return (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  );
}

function getUnauthorizedResponse(request: NextRequest): NextResponse {
  if (isAdminApiRoute(request.nextUrl.pathname)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (nextPath !== "/admin/login") {
    loginUrl.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(loginUrl);
}

function getUnconfiguredResponse(request: NextRequest): NextResponse {
  if (isAdminApiRoute(request.nextUrl.pathname)) {
    return new NextResponse("Admin authentication not configured", {
      status: 503,
    });
  }

  return NextResponse.redirect(new URL("/", request.url));
}

async function handleAdminRequest(request: NextRequest): Promise<NextResponse> {
  const { verifyAuthToken, getAdminCookieFromRequest } = await import(
    "./src/lib/auth"
  );
  const { pathname } = request.nextUrl;
  const isBypassRoute = isAdminAuthBypassRoute(pathname);

  const cookieToken = getAdminCookieFromRequest(request);
  const session = cookieToken ? await verifyAuthToken(cookieToken) : null;

  if (isBypassRoute) {
    if (pathname === "/admin/login" && session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (session) {
    return NextResponse.next();
  }

  return getUnauthorizedResponse(request);
}

/**
 * Middleware that handles admin authentication and i18n routing
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle admin routes
  if (isAdminRoute(pathname)) {
    try {
      return await handleAdminRequest(request);
    } catch (error) {
      console.error("Admin authentication not configured:", error);
      return getUnconfiguredResponse(request);
    }
  }

  // Non-admin routes, use intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api` (but allow `/api/admin`), `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (but allow /api/admin)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions (e.g. .png, .jpg, etc.)
     */
    "/((?!api/(?!admin)|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/admin/:path*",
  ],
};
