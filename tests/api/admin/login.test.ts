import { describe, expect, it } from "vitest";

async function importRoute() {
  return import("@/app/api/admin/login/route");
}

describe("admin login route", () => {
  it("rejects missing passwords", async () => {
    process.env.ADMIN_SECRET = "12345678901234567890123456789012";
    process.env.ADMIN_PASSWORD = "correct horse battery staple";

    const { POST } = await importRoute();
    const request = new Request("http://localhost/api/admin/login", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A valid password is required",
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects invalid passwords", async () => {
    process.env.ADMIN_SECRET = "12345678901234567890123456789012";
    process.env.ADMIN_PASSWORD = "correct horse battery staple";

    const { POST } = await importRoute();
    const request = new Request("http://localhost/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password: "wrong password" }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid admin password",
    });
  });

  it("sets an admin session cookie for valid passwords", async () => {
    process.env.ADMIN_SECRET = "12345678901234567890123456789012";
    process.env.ADMIN_PASSWORD = "correct horse battery staple";

    const { POST } = await importRoute();
    const request = new Request("http://localhost/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password: "correct horse battery staple" }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request as never);
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(setCookie).toContain("admin_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Max-Age=28800");
    expect(setCookie).toContain("SameSite=strict");
  });

  it("does not expose authentication configuration errors", async () => {
    process.env.ADMIN_SECRET = "too-short";
    process.env.ADMIN_PASSWORD = "also-too-short";

    const { POST } = await importRoute();
    const request = new Request("http://localhost/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password: "also-too-short" }),
      headers: {
        "content-type": "application/json",
        "x-real-ip": "203.0.113.26",
      },
    });

    const response = await POST(request as never);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Admin authentication is not configured",
    });
  });

  it("temporarily blocks repeated failures from the same client", async () => {
    process.env.ADMIN_SECRET = "12345678901234567890123456789012";
    process.env.ADMIN_PASSWORD = "correct horse battery staple";

    const { POST } = await importRoute();
    const responses = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const request = new Request("http://localhost/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password: "wrong password" }),
        headers: {
          "content-type": "application/json",
          "x-real-ip": "203.0.113.25",
        },
      });
      responses.push(await POST(request as never));
    }

    expect(responses.slice(0, 4).map((response) => response.status)).toEqual([
      401, 401, 401, 401,
    ]);
    expect(responses[4]?.status).toBe(429);
    expect(responses[4]?.headers.get("retry-after")).toBe("900");
  });
});
