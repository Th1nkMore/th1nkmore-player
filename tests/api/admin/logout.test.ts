import { describe, expect, it } from "vitest";

async function importRoute() {
  return import("@/app/api/admin/logout/route");
}

describe("admin logout route", () => {
  it("clears the admin session cookie", async () => {
    const { POST } = await importRoute();
    const response = await POST();
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(setCookie).toContain("admin_session=;");
  });
});
