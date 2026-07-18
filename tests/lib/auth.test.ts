import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_TOKEN_AUDIENCE,
  ADMIN_TOKEN_ISSUER,
  ADMIN_TOKEN_SUBJECT,
} from "@/lib/admin-auth-policy";

const TEST_SECRET = "12345678901234567890123456789012";

async function importAuth() {
  process.env.ADMIN_SECRET = TEST_SECRET;
  return import("@/lib/auth");
}

describe("admin auth tokens", () => {
  it("generates and verifies a scoped admin token", async () => {
    const { generateAuthToken, verifyAuthToken } = await importAuth();
    const token = await generateAuthToken(60);

    await expect(verifyAuthToken(token)).resolves.toMatchObject({
      sub: ADMIN_TOKEN_SUBJECT,
    });
  });

  it("rejects a token issued for another audience", async () => {
    const { verifyAuthToken } = await importAuth();
    const secret = new TextEncoder().encode(TEST_SECRET);
    const token = await new SignJWT({ sub: ADMIN_TOKEN_SUBJECT })
      .setProtectedHeader({ alg: "HS256" })
      .setAudience("another-service")
      .setIssuer(ADMIN_TOKEN_ISSUER)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(secret);

    await expect(verifyAuthToken(token)).resolves.toBeNull();
  });

  it("rejects a token without an expiration", async () => {
    const { verifyAuthToken } = await importAuth();
    const secret = new TextEncoder().encode(TEST_SECRET);
    const token = await new SignJWT({ sub: ADMIN_TOKEN_SUBJECT })
      .setProtectedHeader({ alg: "HS256" })
      .setAudience(ADMIN_TOKEN_AUDIENCE)
      .setIssuer(ADMIN_TOKEN_ISSUER)
      .setIssuedAt()
      .sign(secret);

    await expect(verifyAuthToken(token)).resolves.toBeNull();
  });

  it("fails closed when the signing secret is too short", async () => {
    process.env.ADMIN_SECRET = "public-example";
    const { generateAuthToken } = await import("@/lib/auth");

    await expect(generateAuthToken()).rejects.toThrow(
      "ADMIN_SECRET must contain at least 32 bytes",
    );
  });

  it("uses a secure host-bound cookie in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { setAdminCookieInResponse } = await importAuth();
    const response = setAdminCookieInResponse(
      NextResponse.json({ success: true }),
      "signed-token",
    );
    const setCookie = response.headers.get("set-cookie");

    expect(setCookie).toContain("__Host-admin_session=signed-token");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=strict");
  });
});
