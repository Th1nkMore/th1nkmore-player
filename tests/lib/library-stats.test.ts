import { describe, expect, it } from "vitest";
import { songOne } from "@/../tests/fixtures/songs";
import { buildLibraryStats } from "@/lib/library-stats";

describe("buildLibraryStats", () => {
  it("counts published playable songs once and excludes hidden or incomplete work", () => {
    const stats = buildLibraryStats([
      songOne,
      songOne,
      { ...songOne, id: "private", visibility: "private" },
      { ...songOne, id: "unlisted", visibility: "unlisted" },
      { ...songOne, id: "draft", assetStatus: "draft" },
      { ...songOne, id: "archived", assetStatus: "archived" },
      { ...songOne, id: "missing-audio", audioUrl: "" },
    ]);
    expect(stats.total).toBe(1);
    expect(stats.durationSeconds).toBe(180);
    expect(stats.withLyrics).toBe(1);
  });

  it("counts overlapping tags against the whole library, deduplicating case and whitespace", () => {
    const stats = buildLibraryStats([
      { ...songOne, tags: ["Cover", " cover ", "Rap", " "] },
      { ...songOne, id: "two", tags: ["COVER", "Guitar"] },
      { ...songOne, id: "three", tags: [] },
    ]);
    expect(stats.total).toBe(3);
    expect(stats.tags).toEqual([
      { key: "cover", label: "Cover", count: 2 },
      { key: "guitar", label: "Guitar", count: 1 },
      { key: "rap", label: "Rap", count: 1 },
    ]);
    expect(stats.untagged).toBe(1);
    expect(stats.tags.reduce((sum, tag) => sum + tag.count, 0)).toBe(4);
  });

  it("normalizes legacy language and default covers, and reports available duration and lyrics", () => {
    const stats = buildLibraryStats([
      { ...songOne, language: "ja", duration: 120.5 },
      {
        ...songOne,
        id: "two",
        language: "jp",
        duration: Number.NaN,
        lyrics: "  ",
        performanceType: "original",
      },
      {
        ...songOne,
        id: "three",
        language: "zh",
        duration: -1,
        performanceType: "listening",
      },
      {
        ...songOne,
        id: "four",
        duration: Number.POSITIVE_INFINITY,
        lyrics: "",
      },
      { ...songOne, id: "five", duration: 0, lyrics: "" },
    ]);
    expect(stats.durationSeconds).toBe(120.5);
    expect(stats.durationKnown).toBe(1);
    expect(stats.withLyrics).toBe(2);
    expect(stats.languages).toEqual([
      { key: "en", label: "en", count: 2 },
      { key: "ja", label: "ja", count: 2 },
      { key: "zh", label: "zh", count: 1 },
    ]);
    expect(stats.performances.find((row) => row.key === "cover")?.count).toBe(
      3,
    );
  });

  it("has no thousand-song cap and recomputes from new library entries", () => {
    const songs = Array.from({ length: 1200 }, (_, index) => ({
      ...songOne,
      id: `song-${index}`,
      tags: ["Cover", `Style ${index % 12}`],
    }));
    const stats = buildLibraryStats(songs);
    expect(stats.total).toBe(1200);
    expect(stats.durationSeconds).toBe(216000);
    expect(stats.tags).toHaveLength(13);
    expect(stats.tags[0].count).toBe(1200);
    expect(stats.tags.slice(1).every((row) => row.count === 100)).toBe(true);
    expect(buildLibraryStats([...songs, { ...songOne, id: "new" }]).total).toBe(
      1201,
    );
  });

  it("returns a genuine empty library without invalid totals", () => {
    expect(buildLibraryStats([])).toEqual({
      total: 0,
      durationSeconds: 0,
      durationKnown: 0,
      withLyrics: 0,
      untagged: 0,
      tags: [],
      languages: [],
      performances: [],
    });
  });
});
