import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { songOne, songTwo } from "@/../tests/fixtures/songs";

const routeMocks = vi.hoisted(() => ({
  publicPlaylistUrl: "https://cdn.example.com/playlist.json" as string | null,
  r2BucketName: "test-bucket" as string | null,
  sendMock: vi.fn(),
  unstableCacheMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: routeMocks.unstableCacheMock,
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
    vi.resetModules();
    routeMocks.publicPlaylistUrl = "https://cdn.example.com/playlist.json";
    routeMocks.r2BucketName = "test-bucket";
    routeMocks.sendMock.mockReset();
    routeMocks.unstableCacheMock.mockReset();
    routeMocks.unstableCacheMock.mockImplementation(
      (callback: (...args: unknown[]) => Promise<unknown>) => {
        let cachedValue: unknown;
        let hasCachedValue = false;

        return async (...args: unknown[]) => {
          if (hasCachedValue) return cachedValue;
          cachedValue = await callback(...args);
          hasCachedValue = true;
          return cachedValue;
        };
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes public playlist songs from R2", async () => {
    routeMocks.sendMock.mockResolvedValueOnce({
      Body: JSON.stringify([
        {
          ...songOne,
          language: "jp",
          tags: [" Rap ", "rap", "Soul"],
          visibility: undefined,
          assetStatus: undefined,
        },
        { ...songTwo, language: "zh" },
        { ...songTwo, id: "private", visibility: "private" },
        { ...songTwo, id: "unlisted", visibility: "unlisted" },
        { ...songTwo, id: "draft", assetStatus: "draft" },
        { ...songTwo, id: "archived", assetStatus: "archived" },
        { ...songTwo, id: "missing-audio", audioUrl: "  " },
        { ...songTwo, id: "invalid-audio", audioUrl: "not a url" },
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

  it("caches the R2 SDK read for 300 seconds", async () => {
    routeMocks.sendMock.mockResolvedValueOnce({
      Body: JSON.stringify([songOne]),
    });
    const { GET } = await importRoute();

    const firstResponse = await GET();
    const secondResponse = await GET();

    await expect(firstResponse.json()).resolves.toEqual([songOne]);
    await expect(secondResponse.json()).resolves.toEqual([songOne]);
    expect(routeMocks.sendMock).toHaveBeenCalledTimes(1);
    expect(routeMocks.unstableCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      ["public-playlist-r2", "test-bucket"],
      {
        revalidate: 300,
        tags: ["public-playlist"],
      },
    );
  });

  it("applies the public playable filter to the external fallback", async () => {
    routeMocks.r2BucketName = null;
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify([
            songOne,
            { ...songTwo, visibility: "private" },
            { ...songTwo, id: "not-ready", assetStatus: "draft" },
          ]),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await importRoute();

    const response = await GET();

    await expect(response.json()).resolves.toEqual([songOne]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cdn.example.com/playlist.json",
      { next: { revalidate: 300, tags: ["public-playlist"] } },
    );
  });

  it("backs off briefly after an R2 failure before using the fallback again", async () => {
    routeMocks.sendMock.mockRejectedValue(new Error("R2 unavailable"));
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify([songOne]), {
          status: 200,
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await importRoute();

    const firstResponse = await GET();
    const secondResponse = await GET();

    await expect(firstResponse.json()).resolves.toEqual([songOne]);
    await expect(secondResponse.json()).resolves.toEqual([songOne]);
    expect(routeMocks.sendMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
