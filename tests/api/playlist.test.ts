import { beforeEach, describe, expect, it, vi } from "vitest";
import { songOne, songTwo } from "@/../tests/fixtures/songs";

const routeMocks = vi.hoisted(() => ({
  publicPlaylistUrl: "https://cdn.example.com/playlist.json" as string | null,
  r2BucketName: "test-bucket" as string | null,
  sendMock: vi.fn(),
}));

vi.mock("@/lib/r2", () => ({
  get R2_BUCKET_NAME() {
    return routeMocks.r2BucketName;
  },
  r2Client: {
    send: routeMocks.sendMock,
  },
}));

vi.mock("@/lib/storage", () => ({
  getPublicPlaylistUrl: () => routeMocks.publicPlaylistUrl,
}));

async function importRoute() {
  return import("@/app/api/playlist/route");
}

describe("public playlist route", () => {
  beforeEach(() => {
    routeMocks.publicPlaylistUrl = "https://cdn.example.com/playlist.json";
    routeMocks.r2BucketName = "test-bucket";
    routeMocks.sendMock.mockReset();
  });

  it("normalizes public playlist songs from R2", async () => {
    routeMocks.sendMock.mockResolvedValueOnce({
      Body: JSON.stringify([
        { ...songOne, language: "jp", tags: [" Rap ", "rap", "Soul"] },
        { ...songTwo, language: "zh" },
      ]),
    });
    const { GET } = await importRoute();

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { ...songOne, language: "ja", tags: ["Rap", "Soul"] },
      { ...songTwo, language: "zh", tags: [] },
    ]);
    expect(response.headers.get("cache-control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=900",
    );
  });

  it("returns an empty playlist when no public playlist source is configured", async () => {
    routeMocks.r2BucketName = null;
    routeMocks.publicPlaylistUrl = null;
    const { GET } = await importRoute();

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
    expect(response.headers.get("cache-control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=900",
    );
  });
});
