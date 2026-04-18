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
      error: "password is required",
    });
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
  });
});
