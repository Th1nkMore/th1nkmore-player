import { beforeEach, describe, expect, it, vi } from "vitest";
import { songOne, songTwo } from "@/../tests/fixtures/songs";
import {
  createPlaylistRevision,
  serializeAdminPlaylist,
} from "@/lib/admin-playlist.server";
import type { Song } from "@/types/music";

const cacheMocks = vi.hoisted(() => ({ revalidateTagMock: vi.fn() }));
const sendMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  revalidateTag: cacheMocks.revalidateTagMock,
}));

vi.mock("@/lib/r2", () => ({
  R2_BUCKET_NAME: "test-bucket",
  r2Client: { send: sendMock },
}));

async function importRoute() {
  return import("@/app/api/admin/playlist/route");
}

function revisionFor(playlist: Song[]) {
  return createPlaylistRevision(serializeAdminPlaylist(playlist));
}

function playlistRequest(
  method: "PATCH" | "POST" | "PUT",
  payload: unknown,
  revision?: string,
) {
  return new Request("http://localhost/api/admin/playlist", {
    method,
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json",
      ...(revision ? { "if-match": `"${revision}"` } : {}),
    },
  });
}

function mockExistingPlaylist(playlist: Song[]) {
  sendMock.mockResolvedValueOnce({ Body: JSON.stringify(playlist) });
}

function mockSuccessfulMutation(playlist: Song[]) {
  mockExistingPlaylist(playlist);
  sendMock.mockResolvedValueOnce({});
  sendMock.mockResolvedValueOnce({});
}

describe("admin playlist route", () => {
  beforeEach(() => {
    sendMock.mockReset();
    cacheMocks.revalidateTagMock.mockReset();
  });

  it("returns an empty revisioned playlist when the file does not exist", async () => {
    sendMock.mockRejectedValueOnce({ name: "NoSuchKey" });
    const { GET } = await importRoute();

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("etag")).toBe(`"${revisionFor([])}"`);
    await expect(response.json()).resolves.toEqual([]);
  });

  it("normalizes stored data and exposes its current revision", async () => {
    const storedPlaylist = [
      { ...songOne, language: "jp" as const, tags: [" Rap ", "rap", "Soul"] },
      { ...songTwo, language: "zh" as const },
    ];
    mockExistingPlaylist(storedPlaylist);
    const { GET } = await importRoute();

    const response = await GET();
    const normalizedPlaylist = [
      { ...songOne, language: "ja", tags: ["Rap", "Soul"] },
      { ...songTwo, language: "zh" },
    ];

    expect(response.headers.get("etag")).toBe(
      `"${revisionFor(normalizedPlaylist as Song[])}"`,
    );
    await expect(response.json()).resolves.toEqual(normalizedPlaylist);
  });

  it("returns 404 when R2 returns no playlist body", async () => {
    sendMock.mockResolvedValueOnce({ Body: null });
    const { GET } = await importRoute();

    const response = await GET();

    expect(response.status).toBe(404);
  });

  it("rejects non-array replacement payloads", async () => {
    const { PUT } = await importRoute();
    const response = await PUT(
      playlistRequest(
        "PUT",
        { songs: [songOne] },
        revisionFor([songOne]),
      ) as never,
    );

    expect(response.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("requires If-Match and rejects stale playlist revisions", async () => {
    mockExistingPlaylist([songOne]);
    const { PUT } = await importRoute();
    const missingRevisionResponse = await PUT(
      playlistRequest("PUT", [songOne]) as never,
    );

    expect(missingRevisionResponse.status).toBe(428);

    mockExistingPlaylist([songOne]);
    const staleResponse = await PUT(
      playlistRequest(
        "PUT",
        [{ ...songOne, title: "Changed" }],
        "stale",
      ) as never,
    );

    expect(staleResponse.status).toBe(412);
    await expect(staleResponse.json()).resolves.toMatchObject({
      currentRevision: revisionFor([songOne]),
    });
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("validates required fields before writing", async () => {
    mockExistingPlaylist([songOne]);
    const { PUT } = await importRoute();
    const response = await PUT(
      playlistRequest(
        "PUT",
        [{ ...songOne, audioUrl: "" }],
        revisionFor([songOne]),
      ) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid song data: missing required fields",
    });
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("backs up the prior revision before writing a normalized playlist", async () => {
    mockSuccessfulMutation([songOne]);
    const { PUT } = await importRoute();
    const replacement = [
      { ...songOne, language: "jp" as const, tags: [" Rock "] },
    ];
    const response = await PUT(
      playlistRequest("PUT", replacement, revisionFor([songOne])) as never,
    );
    const [, historyCommand, playlistCommand] = sendMock.mock.calls.map(
      ([command]) => command,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      count: 1,
      playlist: [{ ...songOne, language: "ja", tags: ["Rock"] }],
    });
    expect(historyCommand.input.Key).toMatch(/^playlist-history\/.+\.json$/);
    expect(JSON.parse(historyCommand.input.Body as string)).toEqual([songOne]);
    expect(playlistCommand.input).toMatchObject({
      Bucket: "test-bucket",
      Key: "playlist.json",
      ContentType: "application/json",
    });
    expect(cacheMocks.revalidateTagMock).toHaveBeenCalledWith(
      "public-playlist",
      { expire: 0 },
    );
  });

  it("normalizes Creator Note fields in a single-song PATCH", async () => {
    mockSuccessfulMutation([songOne, songTwo]);
    const { PATCH } = await importRoute();
    const updatedSong = {
      ...songOne,
      shareSlug: " My Memory ",
      creatorNote: {
        body: " A written note. ",
        language: "jp" as const,
        audioUrl: "https://cdn.example.com/creator-note.webm",
        audioDuration: 21.8,
      },
    };
    const response = await PATCH(
      playlistRequest(
        "PATCH",
        { type: "updateSong", song: updatedSong },
        revisionFor([songOne, songTwo]),
      ) as never,
    );
    const playlistCommand = sendMock.mock.calls[2]?.[0];
    const [savedSong] = JSON.parse(playlistCommand.input.Body as string);

    expect(response.status).toBe(200);
    expect(savedSong).toMatchObject({
      shareSlug: "my-memory",
      creatorNote: {
        body: "A written note.",
        language: "ja",
        audioDuration: 22,
      },
    });
  });

  it("rejects unsafe Creator Note URLs and duplicate share slugs", async () => {
    mockExistingPlaylist([songOne]);
    const { PUT } = await importRoute();
    const unsafeResponse = await PUT(
      playlistRequest(
        "PUT",
        [{ ...songOne, creatorNote: { audioUrl: "javascript:alert(1)" } }],
        revisionFor([songOne]),
      ) as never,
    );

    expect(unsafeResponse.status).toBe(400);

    mockExistingPlaylist([songOne]);
    const duplicateResponse = await PUT(
      playlistRequest(
        "PUT",
        [
          { ...songOne, shareSlug: "My Memory" },
          { ...songTwo, shareSlug: "my-memory" },
        ],
        revisionFor([songOne]),
      ) as never,
    );

    expect(duplicateResponse.status).toBe(400);
    await expect(duplicateResponse.json()).resolves.toEqual({
      error: "Duplicate share slug: my-memory",
    });
  });

  it("appends a song with POST without accepting duplicate IDs", async () => {
    mockSuccessfulMutation([songOne]);
    const { POST } = await importRoute();
    const response = await POST(
      playlistRequest(
        "POST",
        { song: songTwo },
        revisionFor([songOne]),
      ) as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ count: 2 });

    sendMock.mockReset();
    mockExistingPlaylist([songOne]);
    const duplicateResponse = await POST(
      playlistRequest(
        "POST",
        { song: songOne },
        revisionFor([songOne]),
      ) as never,
    );
    expect(duplicateResponse.status).toBe(400);
  });

  it("keeps a successful write successful when cache invalidation fails", async () => {
    mockSuccessfulMutation([songOne]);
    cacheMocks.revalidateTagMock.mockImplementationOnce(() => {
      throw new Error("cache unavailable");
    });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { PUT } = await importRoute();
    const response = await PUT(
      playlistRequest(
        "PUT",
        [{ ...songOne, title: "Changed" }],
        revisionFor([songOne]),
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(warning).toHaveBeenCalledWith(
      "Playlist saved, but cache invalidation failed:",
      expect.any(Error),
    );
    warning.mockRestore();
  });
});
