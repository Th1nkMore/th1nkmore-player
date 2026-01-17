import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function getSecret() {
  if (!ADMIN_SECRET) {
    throw new Error("ADMIN_SECRET environment variable is required");
  }
  return new TextEncoder().encode(ADMIN_SECRET);
}

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60; // 1 hour in seconds

/**
 * Verifies a JWT token using the ADMIN_SECRET
 * @param token - The JWT token to verify
 * @returns The payload if valid, null otherwise
 */
export async function verifyAuthToken(
  token: string,
): Promise<{ sub: string; exp: number } | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as { sub: string; exp: number };
  } catch (error) {
    console.error("Token verification failed:", error);
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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
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
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Generates a JWT token for admin access
 * @param userId - Optional user identifier (defaults to "admin")
 * @param expiresIn - Token expiration time in seconds (defaults to 1 hour)
 * @returns The signed JWT token
 */
export async function generateAuthToken(
  userId = "admin",
  expiresIn = 3600,
): Promise<string> {
  const secret = getSecret();
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secret);

  return token;
}
