import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookie: null as string | null,
  verify: vi.fn(),
  playlist: vi.fn(),
  snapshot: vi.fn(),
  write: vi.fn(),
  history: vi.fn(),
  restore: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  getAdminCookieFromRequest: () => mocks.cookie,
  verifyAuthToken: mocks.verify,
}));
vi.mock("@/lib/admin-playlist.server", () => ({
  readAdminPlaylistSnapshot: mocks.playlist,
}));
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/repertoire.server", () => ({
  readRepertoireSnapshot: mocks.snapshot,
  readRepertoireHistory: mocks.history,
  writeRepertoire: mocks.write,
  restoreRepertoire: mocks.restore,
  RepertoireConflictError: class extends Error {},
  RepertoireRevisionRequiredError: class extends Error {},
}));

beforeEach(() => {
  mocks.cookie = null;
  mocks.verify.mockReset();
  mocks.playlist.mockReset();
  mocks.snapshot.mockReset();
  mocks.write.mockReset();
  mocks.history.mockReset();
  mocks.restore.mockReset();
});
const request = (method: string, path = "") =>
  new NextRequest(`http://localhost/api/admin/repertoire${path}`, {
    method,
    ...(method === "PUT"
      ? {
          body: JSON.stringify({ entries: [] }),
          headers: {
            "If-Match": '"revision"',
            "Content-Type": "application/json",
          },
        }
      : {}),
  });

describe("private repertoire API authorization", () => {
  it("rejects anonymous reads, history and writes before accessing any private storage", async () => {
    const { GET, PUT } = await import("@/app/api/admin/repertoire/route");
    expect((await GET(request("GET"))).status).toBe(401);
    expect((await GET(request("GET", "?history=1"))).status).toBe(401);
    expect((await PUT(request("PUT"))).status).toBe(401);
    expect(mocks.snapshot).not.toHaveBeenCalled();
    expect(mocks.history).not.toHaveBeenCalled();
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("rejects invalid sessions before reading recording or note data", async () => {
    mocks.cookie = "invalid";
    mocks.verify.mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/repertoire/route");
    expect((await GET(request("GET"))).status).toBe(401);
    expect(mocks.playlist).not.toHaveBeenCalled();
  });
  it("allows a verified owner session and marks responses private and uncacheable", async () => {
    mocks.cookie = "valid";
    mocks.verify.mockResolvedValue({ sub: "admin" });
    mocks.playlist.mockResolvedValue({ playlist: [] });
    mocks.snapshot.mockResolvedValue({ entries: [], revision: "revision" });
    const { GET } = await import("@/app/api/admin/repertoire/route");
    const response = await GET(request("GET"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("etag")).toBe('"revision"');
  });
});
