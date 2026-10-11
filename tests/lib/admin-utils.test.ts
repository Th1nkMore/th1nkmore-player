import { afterEach, describe, expect, it, vi } from "vitest";
import { songOne } from "@/../tests/fixtures/songs";
import {
  AdminPlaylistConflictError,
  createSongFromFormData,
  mergeFetchedSongInfo,
  persistSongAssetToLibrary,
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

  it("blocks an already deployed cover package before requesting an upload URL", async () => {
    const duplicate = {
      ...songOne,
      metadata: { coverPackageId: "pkg_test_123" },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json([duplicate], {
        headers: { ETag: '"revision-1"' },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      persistSongAssetToLibrary({
        addLog: vi.fn(),
        file: new File(["ID3"], "publish.mp3", { type: "audio/mpeg" }),
        formData: {
          title: "Test Song",
          artist: "Huang",
          album: "Cover",
          metadata: { coverPackageId: "pkg_test_123" },
        },
      }),
    ).rejects.toThrow("already deployed as");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/playlist");
  });
});

describe("lyrics source credit merging", () => {
  const source = {
    title: "Track",
    artist: "Original Artist",
    album: "Source album",
    duration: 180,
  };

  it("keeps the cover performer and records the fetched artist as original credit", () => {
    const draft = {
      ...songOne,
      artist: "Huang",
      performanceType: "cover" as const,
    };
    const result = mergeFetchedSongInfo(draft, source);
    expect(result.artist).toBe("Huang");
    expect(result.originalArtist).toBe("Original Artist");
    expect(draft.artist).toBe("Huang");
    expect(draft.originalArtist).toBeUndefined();
  });

  it("uses the cover credit contract for legacy drafts without a performance type", () => {
    const result = mergeFetchedSongInfo(
      { ...songOne, artist: "Huang" },
      source,
    );
    expect(result.artist).toBe("Huang");
    expect(result.originalArtist).toBe("Original Artist");
  });

  it.each([
    "original",
    "listening",
  ] as const)("imports the source performer for %s tracks", (performanceType) => {
    const result = mergeFetchedSongInfo(
      { ...songOne, performanceType },
      source,
    );
    expect(result.artist).toBe("Original Artist");
    expect(result.originalArtist).toBeUndefined();
  });
});
