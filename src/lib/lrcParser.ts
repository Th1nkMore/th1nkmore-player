export type LrcLine = {
  time: number;
  content: string;
};

const LRC_LINE_PATTERN = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

function parseTimestampToSeconds(match: RegExpExecArray): number {
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const fraction = match[3] || "0";
  const milliseconds =
    fraction.length === 3
      ? parseInt(fraction, 10)
      : parseInt(fraction, 10) * 10;

  return (minutes * 60_000 + seconds * 1_000 + milliseconds) / 1_000;
}

export function hasLrcTimestamps(input: string): boolean {
  return LRC_LINE_PATTERN.test(input);
}

export function countLyricLines(input: string): number {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
}

export function formatLrcTime(timeInSeconds: number): string {
  const safeTime = Math.max(0, timeInSeconds);
  const totalCentiseconds = Math.round((safeTime + Number.EPSILON) * 100);
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centiseconds = totalCentiseconds % 100;

  return `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}]`;
}

/**
 * Parses LRC (Lyrics) format string into structured lines with timestamps.
 * Handles standard [mm:ss.xx] format.
 *
 * @param lrcString - The LRC formatted string
 * @returns Array of LRC lines with time (in seconds) and content
 *
 * @example
 * parseLrc("[00:12.50]Hello World\n[00:15.30]This is a test")
 * // Returns: [
 * //   { time: 12.5, content: "Hello World" },
 * //   { time: 15.3, content: "This is a test" }
 * // ]
 */
export function parseLrc(lrcString: string): LrcLine[] {
  const lines: LrcLine[] = [];
  const inputLines = lrcString.split("\n");

  for (const rawLine of inputLines) {
    const timestampMatches = [...rawLine.matchAll(LRC_LINE_PATTERN)];
    if (timestampMatches.length === 0) {
      continue;
    }

    const content = rawLine.replace(LRC_LINE_PATTERN, "").trim();
    if (!content) {
      continue;
    }

    for (const match of timestampMatches) {
      lines.push({
        time: parseTimestampToSeconds(match),
        content,
      });
    }
  }

  // Sort by time in case lines are out of order
  lines.sort((a, b) => a.time - b.time);

  return lines;
}

/**
 * Converts plain text lyrics (without timestamps) to LRC format.
 * Splits by newlines and assigns approximate timestamps based on line count.
 *
 * @param lyrics - Plain text lyrics
 * @param duration - Total duration in seconds
 * @returns Array of LRC lines with estimated timestamps
 */
export function lyricsToLrc(lyrics: string, duration: number): LrcLine[] {
  const lines = lyrics.split("\n");
  const totalLines = lines.filter((line) => line.trim().length > 0).length;

  if (totalLines === 0) return [];

  const timePerLine = duration / totalLines;
  const result: LrcLine[] = [];

  let currentTime = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      result.push({
        time: currentTime,
        content: trimmed,
      });
      currentTime += timePerLine;
    }
  }

  return result;
}

export function normalizeLrcText(lyrics: string): string {
  return parseLrc(lyrics)
    .map((line) => `${formatLrcTime(line.time)}${line.content}`)
    .join("\n");
}

export function plainLyricsToLrcText(lyrics: string, duration: number): string {
  return lyricsToLrc(lyrics, duration)
    .map((line) => `${formatLrcTime(line.time)}${line.content}`)
    .join("\n");
}
