import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_TTL_SECONDS,
  ADMIN_TOKEN_AUDIENCE,
  ADMIN_TOKEN_ISSUER,
  ADMIN_TOKEN_SUBJECT,
  getAdminSessionCookieName,
  LEGACY_ADMIN_COOKIE_NAME,
} from "@/lib/admin-auth-policy";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function getSecret() {
  if (!ADMIN_SECRET) {
    throw new Error("ADMIN_SECRET environment variable is required");
  }
  const encodedSecret = new TextEncoder().encode(ADMIN_SECRET);
  if (encodedSecret.byteLength < 32) {
    throw new Error("ADMIN_SECRET must contain at least 32 bytes");
  }
  return encodedSecret;
}

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const COOKIE_NAME = getAdminSessionCookieName(IS_PRODUCTION);

/**
 * Verifies a JWT token using the ADMIN_SECRET
 * @param token - The JWT token to verify
 * @returns The payload if valid, null otherwise
 */
export async function verifyAuthToken(
  token: string,
): Promise<{ sub: string; exp: number } | null> {
  const secret = getSecret();
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      audience: ADMIN_TOKEN_AUDIENCE,
      issuer: ADMIN_TOKEN_ISSUER,
      subject: ADMIN_TOKEN_SUBJECT,
    });
    if (typeof payload.exp !== "number" || typeof payload.iat !== "number") {
      return null;
    }
    return payload as { sub: string; exp: number };
  } catch {
    return null;
  }
}

/**
 * Middleware-compatible function to get admin session cookie from request
 * @param request - Next.js request object
 * @returns The token string or null if not found
 */
export function getAdminCookieFromRequest(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_NAME)?.value || null;
}

/**
 * Middleware-compatible function to set admin session cookie in response
 * @param response - Next.js response object
 * @param token - The JWT token to store in the cookie
 * @returns The modified response object
 */
export function setAdminCookieInResponse(
  response: NextResponse,
  token: string,
): NextResponse {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
    path: "/",
    priority: "high",
  });
  if (COOKIE_NAME !== LEGACY_ADMIN_COOKIE_NAME) {
    expireCookie(response, LEGACY_ADMIN_COOKIE_NAME, false);
  }
  return response;
}

function expireCookie(
  response: NextResponse,
  cookieName: string,
  secure: boolean,
) {
  response.cookies.set(cookieName, "", {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure,
  });
}

export function clearAdminCookieInResponse(
  response: NextResponse,
): NextResponse {
  expireCookie(response, COOKIE_NAME, IS_PRODUCTION);
  if (COOKIE_NAME !== LEGACY_ADMIN_COOKIE_NAME) {
    expireCookie(response, LEGACY_ADMIN_COOKIE_NAME, false);
  }
  return response;
}

/**
 * Sets a secure, httpOnly cookie for admin session
 * @param token - The JWT token to store in the cookie
 */
export async function setUserCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
    path: "/",
    priority: "high",
  });
  if (COOKIE_NAME !== LEGACY_ADMIN_COOKIE_NAME) {
    cookieStore.delete(LEGACY_ADMIN_COOKIE_NAME);
  }
}

/**
 * Gets the admin session cookie value
 * @returns The token string or null if not found
 */
export async function getUserCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Removes the admin session cookie
 */
export async function clearUserCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: IS_PRODUCTION,
  });
  if (COOKIE_NAME !== LEGACY_ADMIN_COOKIE_NAME) {
    cookieStore.delete(LEGACY_ADMIN_COOKIE_NAME);
  }
}

/**
 * Generates a JWT token for admin access
 * @param expiresIn - Token expiration time in seconds (defaults to 8 hours)
 * @returns The signed JWT token
 */
export async function generateAuthToken(
  expiresIn = ADMIN_SESSION_TTL_SECONDS,
): Promise<string> {
  const secret = getSecret();
  const token = await new SignJWT({ sub: ADMIN_TOKEN_SUBJECT })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(ADMIN_TOKEN_AUDIENCE)
    .setIssuer(ADMIN_TOKEN_ISSUER)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secret);

  return token;
}
