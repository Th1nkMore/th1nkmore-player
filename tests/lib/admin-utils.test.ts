import { afterEach, describe, expect, it, vi } from "vitest";
import { songOne } from "@/../tests/fixtures/songs";
import {
  AdminPlaylistConflictError,
  createSongFromFormData,
  saveAdminPlaylist,
} from "@/lib/admin-utils";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("admin song creation", () => {
  it("persists cover credits and a combined Creator Note", () => {
    const song = createSongFromFormData(
      "New Song",
      "Owner",
      "Covers",
      "https://cdn.example.com/new-song.mp3",
      [songOne],
      {
        performanceType: "cover",
        originalArtist: " Original Artist ",
        shareSlug: " New Song Memory ",
        creatorNote: {
          body: " Personal writing ",
          language: "zh",
          audioUrl: "https://cdn.example.com/creator-note.webm",
          audioDuration: 31,
          audioTranscript: " Transcript ",
        },
      },
    );

    expect(song).toMatchObject({
      id: "owner-new-song",
      performanceType: "cover",
      originalArtist: "Original Artist",
      shareSlug: "new-song-memory",
      creatorNote: {
        body: "Personal writing",
        language: "zh",
        audioUrl: "https://cdn.example.com/creator-note.webm",
        audioDuration: 31,
        audioTranscript: "Transcript",
      },
    });
  });

  it("does not persist an empty Creator Note from a draft", () => {
    const song = createSongFromFormData(
      "New Song",
      "Owner",
      "Covers",
      "https://cdn.example.com/new-song.mp3",
      [],
      { creatorNote: { language: "en", audioDuration: 10 } },
    );

    expect(song).not.toHaveProperty("creatorNote");
  });

  it("saves the normalized admin playlist payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        playlist: [songOne],
        revision: "revision-2",
        count: 1,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await saveAdminPlaylist([songOne], "revision-1");

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/playlist", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "If-Match": '"revision-1"',
      },
      body: JSON.stringify([songOne]),
    });
  });

  it("surfaces the admin API error when a save fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: "Duplicate share slug" }, { status: 400 }),
        ),
    );

    await expect(saveAdminPlaylist([songOne], "revision-1")).rejects.toThrow(
      "Duplicate share slug",
    );
  });

  it("surfaces revision conflicts as a dedicated error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: "The playlist changed in another session",
            currentRevision: "revision-2",
          },
          { status: 412 },
        ),
      ),
    );

    await expect(
      saveAdminPlaylist([songOne], "revision-1"),
    ).rejects.toMatchObject({
      name: AdminPlaylistConflictError.name,
      currentRevision: "revision-2",
    });
  });
});
