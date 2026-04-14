import { beforeEach, describe, expect, it, vi } from "vitest";

async function importRoute() {
  return import("@/app/api/admin/fetch-lyrics/route");
}

describe("admin fetch-lyrics route", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("requires a NetEase URL", async () => {
    const { POST } = await importRoute();
    const request = new Request("http://localhost/api/admin/fetch-lyrics", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "NetEase Music URL is required",
    });
  });

  it("rejects URLs that do not contain a NetEase song id", async () => {
    const { POST } = await importRoute();
    const request = new Request("http://localhost/api/admin/fetch-lyrics", {
      method: "POST",
      body: JSON.stringify({ url: "https://music.163.com/#/song?foo=bar" }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid NetEase Music URL. Could not extract song ID.",
    });
  });

  it("surfaces upstream fetch failures", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("upstream error", { status: 502 }),
    );
    const { POST } = await importRoute();
    const request = new Request("http://localhost/api/admin/fetch-lyrics", {
      method: "POST",
      body: JSON.stringify({ url: "https://music.163.com/#/song?id=123456" }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request as never);

    expect(fetch).toHaveBeenCalledWith(
      "https://music.163.com/api/song/media?id=123456",
      expect.objectContaining({
        headers: expect.objectContaining({
          Referer: "https://music.163.com/",
        }),
      }),
    );
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch lyrics: 502",
    });
  });

  it("keeps only valid lrc timestamp lines", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        lyric: [
          "[00:01.00]Line one",
          "Composer: Example",
          "[00:02.345]Line two",
          "[00:03]Invalid timestamp",
        ].join("\n"),
      }),
    );
    const { POST } = await importRoute();
    const request = new Request("http://localhost/api/admin/fetch-lyrics", {
      method: "POST",
      body: JSON.stringify({ url: "https://music.163.com/#/song?id=123456" }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      songId: "123456",
      lyrics: "[00:01.00]Line one\n[00:02.345]Line two",
    });
  });

  it("returns 404 when the upstream response has no lyrics", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ lyric: "" }));
    const { POST } = await importRoute();
    const request = new Request("http://localhost/api/admin/fetch-lyrics", {
      method: "POST",
      body: JSON.stringify({ url: "https://music.163.com/#/song?id=123456" }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request as never);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "No lyrics found for this song",
    });
  });
});
