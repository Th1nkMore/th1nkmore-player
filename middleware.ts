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

function getUnauthorizedResponse(request: NextRequest): NextResponse {
  if (isAdminApiRoute(request.nextUrl.pathname)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.redirect(new URL("/", request.url));
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
  const {
    verifyAuthToken,
    getAdminCookieFromRequest,
    setAdminCookieInResponse,
  } = await import("./src/lib/auth");
  const { searchParams } = request.nextUrl;

  const cookieToken = getAdminCookieFromRequest(request);
  if (cookieToken && (await verifyAuthToken(cookieToken))) {
    return NextResponse.next();
  }

  const queryToken = searchParams.get("token");
  if (queryToken && (await verifyAuthToken(queryToken))) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("token");
    const response = NextResponse.redirect(url);
    return setAdminCookieInResponse(response, queryToken);
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
