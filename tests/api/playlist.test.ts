import { beforeEach, describe, expect, it, vi } from "vitest";
import { songOne, songTwo } from "@/../tests/fixtures/songs";

const sendMock = vi.fn();

vi.mock("@/lib/r2", () => ({
  R2_BUCKET_NAME: "test-bucket",
  r2Client: {
    send: sendMock,
  },
}));

vi.mock("@/lib/storage", () => ({
  getPublicPlaylistUrl: () => "https://cdn.example.com/playlist.json",
}));

async function importRoute() {
  return import("@/app/api/playlist/route");
}

describe("public playlist route", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("normalizes public playlist songs from R2", async () => {
    sendMock.mockResolvedValueOnce({
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
});
