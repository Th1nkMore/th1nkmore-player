import { beforeEach, describe, expect, it, vi } from "vitest";
import { songOne, songTwo } from "@/../tests/fixtures/songs";

const sendMock = vi.fn();

vi.mock("@/lib/r2", () => ({
  R2_BUCKET_NAME: "test-bucket",
  r2Client: {
    send: sendMock,
  },
}));

async function importRoute() {
  return import("@/app/api/admin/playlist/route");
}

describe("admin playlist route", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("returns an empty playlist when the file does not exist", async () => {
    sendMock.mockRejectedValueOnce({ name: "NoSuchKey" });
    const { GET } = await importRoute();

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
  });

  it("normalizes legacy language codes from stored playlist data", async () => {
    sendMock.mockResolvedValueOnce({
      Body: JSON.stringify([
        { ...songOne, language: "jp", tags: [" Rap ", "rap", "Soul"] },
        { ...songTwo, language: "zh" },
      ]),
    });
    const { GET } = await importRoute();

    const response = await GET();

    await expect(response.json()).resolves.toEqual([
      { ...songOne, language: "ja", tags: ["Rap", "Soul"] },
      { ...songTwo, language: "zh" },
    ]);
  });

  it("returns 404 when R2 returns no body", async () => {
    sendMock.mockResolvedValueOnce({ Body: null });
    const { GET } = await importRoute();

    const response = await GET();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Playlist file not found",
    });
  });

  it("rejects non-array payloads", async () => {
    const { PUT } = await importRoute();
    const request = new Request("http://localhost/api/admin/playlist", {
      method: "PUT",
      body: JSON.stringify({ songs: [songOne] }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await PUT(request as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Playlist must be an array",
    });
  });

  it("rejects songs with missing required fields", async () => {
    const { PUT } = await importRoute();
    const request = new Request("http://localhost/api/admin/playlist", {
      method: "PUT",
      body: JSON.stringify([
        {
          ...songOne,
          audioUrl: "",
        },
      ]),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await PUT(request as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid song data: missing required fields",
    });
  });

  it("writes a normalized playlist back to R2", async () => {
    sendMock.mockResolvedValueOnce({});
    const { PUT } = await importRoute();
    const request = new Request("http://localhost/api/admin/playlist", {
      method: "PUT",
      body: JSON.stringify([{ ...songOne, language: "jp", tags: [" Rock "] }]),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await PUT(request as never);
    const [command] = sendMock.mock.calls[0] ?? [];

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, count: 1 });
    expect(command.input).toMatchObject({
      Bucket: "test-bucket",
      Key: "playlist.json",
      ContentType: "application/json",
    });
    expect(JSON.parse(command.input.Body as string)).toEqual([
      { ...songOne, language: "ja", tags: ["Rock"] },
    ]);
  });
});
