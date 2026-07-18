import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/admin-password";
import { generateAuthToken, setAdminCookieInResponse } from "@/lib/auth";
import {
  adminLoginRateLimiter,
  getLoginClientId,
  type LoginRateLimitDecision,
} from "@/lib/login-rate-limit";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unknown authentication error";
}

function jsonResponse(body: Record<string, boolean | string>, status: number) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function rateLimitedResponse(decision: LoginRateLimitDecision) {
  const response = jsonResponse(
    { error: "Too many login attempts. Try again later." },
    429,
  );
  response.headers.set("Retry-After", String(decision.retryAfterSeconds));
  return response;
}

export async function POST(request: NextRequest) {
  const clientId = getLoginClientId(request.headers);
  const initialDecision = adminLoginRateLimiter.check(clientId);
  if (!initialDecision.allowed) return rateLimitedResponse(initialDecision);

  try {
    const body = await request.json();
    const { password } = body as { password?: unknown };

    if (
      typeof password !== "string" ||
      password.length === 0 ||
      password.length > 512
    ) {
      return jsonResponse({ error: "A valid password is required" }, 400);
    }

    if (!verifyAdminPassword(password)) {
      const failedDecision = adminLoginRateLimiter.recordFailure(clientId);
      if (!failedDecision.allowed) return rateLimitedResponse(failedDecision);
      return jsonResponse({ error: "Invalid admin password" }, 401);
    }

    const token = await generateAuthToken();
    adminLoginRateLimiter.reset(clientId);
    const response = jsonResponse({ success: true }, 200);
    return setAdminCookieInResponse(response, token);
  } catch (error) {
    const message = getErrorMessage(error);
    const isConfigurationError = /ADMIN_(?:PASSWORD|SECRET)/.test(message);

    return jsonResponse(
      {
        error: isConfigurationError
          ? "Admin authentication is not configured"
          : "Authentication request failed",
      },
      isConfigurationError ? 503 : 500,
    );
  }
}
