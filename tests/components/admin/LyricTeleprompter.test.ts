import { describe, expect, it } from "vitest";
import {
  getActiveLyricIndex,
  getLyricScrollTop,
} from "@/components/admin/LyricTeleprompter";
import type { LrcLine } from "@/lib/lrcParser";

describe("getActiveLyricIndex", () => {
  const lines: LrcLine[] = [
    { time: 0, content: "line 1" },
    { time: 5, content: "line 2" },
    { time: 9.5, content: "line 3" },
  ];

  it("returns -1 before the first line starts", () => {
    expect(getActiveLyricIndex(lines, -0.1)).toBe(-1);
    expect(getActiveLyricIndex(lines, 0)).toBe(0);
  });

  it("tracks the latest active line as time advances", () => {
    expect(getActiveLyricIndex(lines, 4.9)).toBe(0);
    expect(getActiveLyricIndex(lines, 5)).toBe(1);
    expect(getActiveLyricIndex(lines, 12)).toBe(2);
  });

  it("handles empty lyric arrays safely", () => {
    expect(getActiveLyricIndex([], 10)).toBe(-1);
  });

  it("centers the active lyric without introducing tiny scroll oscillations", () => {
    expect(
      getLyricScrollTop({
        containerHeight: 400,
        currentScrollTop: 118,
        nodeHeight: 36,
        nodeOffsetTop: 300,
      }),
    ).toBe(118);

    expect(
      getLyricScrollTop({
        containerHeight: 400,
        currentScrollTop: 0,
        nodeHeight: 36,
        nodeOffsetTop: 300,
      }),
    ).toBe(118);
  });
});
