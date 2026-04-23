import { describe, expect, it } from "vitest";
import { songOne } from "@/../tests/fixtures/songs";
import {
  formatSongDuration,
  getUploadReadiness,
  getUploadSummaryNotices,
  hasSongChanges,
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
});
