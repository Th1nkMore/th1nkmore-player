import { describe, expect, it } from "vitest";
import {
  getAdminSessionCookieName,
  getSafeAdminNextPath,
  HOST_ADMIN_COOKIE_NAME,
  LEGACY_ADMIN_COOKIE_NAME,
} from "@/lib/admin-auth-policy";

describe("admin auth policy", () => {
  it("uses a host-bound cookie name for secure deployments", () => {
    expect(getAdminSessionCookieName(true)).toBe(HOST_ADMIN_COOKIE_NAME);
    expect(getAdminSessionCookieName(false)).toBe(LEGACY_ADMIN_COOKIE_NAME);
  });

  it("allows local admin destinations", () => {
    expect(getSafeAdminNextPath("/admin")).toBe("/admin");
    expect(getSafeAdminNextPath("/admin/library?tab=notes#editor")).toBe(
      "/admin/library?tab=notes#editor",
    );
  });

  it.each([
    undefined,
    "https://evil.example/admin",
    "//evil.example/admin",
    "/\\evil.example/admin",
    "/admin\\evil",
    "/en",
  ])("rejects unsafe admin destinations: %s", (nextPath) => {
    expect(getSafeAdminNextPath(nextPath)).toBe("/admin");
  });
});
