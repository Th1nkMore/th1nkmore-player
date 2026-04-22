import { describe, expect, it, vi } from "vitest";
import { songOne, songThree, songTwo } from "@/../tests/fixtures/songs";
import {
  buildTagStats,
  getSongsByTag,
  normalizeSongTags,
  pickRandomSongsByTag,
} from "@/lib/tags";

describe("tags", () => {
  it("normalizes tags by trimming and deduplicating", () => {
    expect(normalizeSongTags([" Rap ", "rap", "", "Soul", "Soul"])).toEqual([
      "Rap",
      "Soul",
    ]);
  });

  it("builds tag stats against queued songs", () => {
    const songs = [
      { ...songOne, tags: ["Rap", "Soul"] },
      { ...songTwo, tags: ["Rap"] },
      { ...songThree, tags: ["Rock"] },
    ];

    expect(buildTagStats(songs, [songOne.id])).toEqual([
      { tag: "Rap", totalCount: 2, availableCount: 1, share: 0.5 },
      { tag: "Rock", totalCount: 1, availableCount: 1, share: 0.5 },
      { tag: "Soul", totalCount: 1, availableCount: 0, share: 0 },
    ]);
  });

  it("selects random tag songs without duplicates or queued tracks", () => {
    const songs = [
      { ...songOne, tags: ["Rap"] },
      { ...songTwo, tags: ["Rap"] },
      { ...songThree, tags: ["Rap"] },
    ];

    const random = vi
      .fn<() => number>()
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0);

    expect(
      pickRandomSongsByTag({
        songs,
        tag: "Rap",
        count: 2,
        queuedSongIds: [songTwo.id],
        random,
      }).map((song) => song.id),
    ).toEqual([songThree.id, songOne.id]);
  });

  it("handles legacy songs without tags without throwing", () => {
    const { tags: _tags, ...legacySong } = songOne;

    expect(() =>
      buildTagStats([legacySong as typeof songOne], []),
    ).not.toThrow();
    expect(getSongsByTag([legacySong as typeof songOne], "Rap")).toEqual([]);
  });
});
