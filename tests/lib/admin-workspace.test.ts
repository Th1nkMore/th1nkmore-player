import { describe, expect, it } from "vitest";
import { songOne } from "@/../tests/fixtures/songs";
import {
  filterAndSortAdminPlaylist,
  formatSongDuration,
  getPlaylistAttentionSummary,
  getSongAttentionIssues,
  getUploadReadiness,
  getUploadSummaryNotices,
  hasSongChanges,
  patchPlaylistSongs,
  reorderPlaylistSongs,
} from "@/lib/admin-workspace";
import { createEmptySongDraft } from "@/lib/song";

describe("admin workspace helpers", () => {
  it("marks upload as ready only when required fields and audio exist", () => {
    expect(
      getUploadReadiness(
        {
          ...createEmptySongDraft(),
          title: "Track",
          artist: "Artist",
          album: "Album",
        },
        new File(["demo"], "demo.mp3", { type: "audio/mpeg" }),
      ).canDeploy,
    ).toBe(true);

    expect(
      getUploadReadiness(
        {
          ...createEmptySongDraft(),
          title: "Track",
          artist: "Artist",
        },
        null,
      ).canDeploy,
    ).toBe(false);
  });

  it("detects song draft changes", () => {
    expect(hasSongChanges(songOne, { ...songOne, title: "Changed" })).toBe(
      true,
    );
    expect(hasSongChanges(songOne, { ...songOne })).toBe(false);
  });

  it("formats duration for compact summaries", () => {
    expect(formatSongDuration(185)).toBe("3:05");
    expect(formatSongDuration(0)).toBe("--:--");
  });

  it("builds summary notices from upload state", () => {
    const notices = getUploadSummaryNotices({
      audioFile: null,
      hasLyrics: true,
      isDeploying: false,
      isFetchingLyrics: false,
      readiness: getUploadReadiness(createEmptySongDraft(), null),
    });

    expect(notices.map((notice) => notice.title)).toEqual([
      "Incomplete draft",
      "No audio selected",
      "Lyrics attached",
    ]);
  });

  it("identifies incomplete track metadata and summarizes the library", () => {
    const incompleteSong = {
      ...songOne,
      duration: 0,
      tags: [],
      lyrics: "",
    };

    expect(getSongAttentionIssues(incompleteSong)).toEqual([
      "duration",
      "tags",
      "lyrics",
      "creatorNote",
    ]);
    expect(getPlaylistAttentionSummary([incompleteSong, songOne])).toEqual({
      songs: 2,
      duration: 1,
      tags: 2,
      lyrics: 1,
      creatorNote: 2,
    });
  });

  it("filters and sorts the admin playlist without changing manual order", () => {
    const archivedSong = {
      ...songOne,
      id: "archived",
      title: "Zulu",
      assetStatus: "archived" as const,
    };
    const readySong = {
      ...songOne,
      id: "ready",
      title: "Alpha",
      tags: ["Featured"],
      creatorNote: { body: "Complete" },
    };

    expect(
      filterAndSortAdminPlaylist([archivedSong, readySong], {
        filter: "all",
        query: "",
        sort: "manual",
      }).map((song) => song.id),
    ).toEqual(["archived", "ready"]);
    expect(
      filterAndSortAdminPlaylist([archivedSong, readySong], {
        filter: "ready",
        query: "featured",
        sort: "title",
      }).map((song) => song.id),
    ).toEqual(["ready"]);
  });

  it("reorders and patches selected songs immutably", () => {
    const secondSong = { ...songOne, id: "second", title: "Second" };
    const playlist = [songOne, secondSong];

    expect(
      reorderPlaylistSongs(playlist, secondSong.id, songOne.id).map(
        (song) => song.id,
      ),
    ).toEqual([secondSong.id, songOne.id]);
    expect(
      patchPlaylistSongs(playlist, [songOne.id], {
        assetStatus: "archived",
      }),
    ).toEqual([{ ...songOne, assetStatus: "archived" }, secondSong]);
    expect(playlist[0].assetStatus).toBe("ready");
  });
});
