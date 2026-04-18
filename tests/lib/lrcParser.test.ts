import { describe, expect, it } from "vitest";
import {
  formatLrcTime,
  normalizeLrcText,
  parseLrc,
  plainLyricsToLrcText,
} from "@/lib/lrcParser";

describe("lrcParser", () => {
  it("parses timestamps with two or three decimal digits", () => {
    const lines = parseLrc("[00:01.00]Line one\n[00:02.345]Line two");

    expect(lines[0]).toEqual({ time: 1, content: "Line one" });
    expect(lines[1]?.content).toBe("Line two");
    expect(lines[1]?.time).toBeCloseTo(2.345, 6);
  });

  it("expands multiple timestamps on the same lyric line", () => {
    const lines = parseLrc("[00:01.00][00:02.50]Echo line");

    expect(lines).toEqual([
      { time: 1, content: "Echo line" },
      { time: 2.5, content: "Echo line" },
    ]);
  });

  it("normalizes parsed lrc back to sorted centisecond precision", () => {
    expect(normalizeLrcText("[00:02.345]Line two\n[00:01.00]Line one")).toBe(
      "[00:01.00]Line one\n[00:02.35]Line two",
    );
  });

  it("converts plain lyrics into estimated lrc text", () => {
    expect(plainLyricsToLrcText("First line\nSecond line", 10)).toBe(
      "[00:00.00]First line\n[00:05.00]Second line",
    );
  });

  it("formats times as lrc-compatible timestamps", () => {
    expect(formatLrcTime(65.239)).toBe("[01:05.24]");
  });
});
