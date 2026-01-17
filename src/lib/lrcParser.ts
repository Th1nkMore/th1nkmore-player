export type LrcLine = {
  time: number;
  content: string;
};

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
  const regex = /\[(\d{2}):(\d{2})\.(\d{2})\](.*)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(lrcString)) !== null) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const centiseconds = parseInt(match[3], 10);
    const content = match[4].trim();

    const timeInSeconds = minutes * 60 + seconds + centiseconds / 100;

    if (content) {
      lines.push({
        time: timeInSeconds,
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
