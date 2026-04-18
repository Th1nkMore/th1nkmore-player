import {
  countLyricLines,
  hasLrcTimestamps,
  normalizeLrcText,
  plainLyricsToLrcText,
} from "@/lib/lrcParser";

export function describeLyrics(input: string): {
  format: "lrc" | "plain" | "empty";
  lineCount: number;
} {
  const lineCount = countLyricLines(input);
  if (lineCount === 0) {
    return { format: "empty", lineCount: 0 };
  }

  return {
    format: hasLrcTimestamps(input) ? "lrc" : "plain",
    lineCount,
  };
}

export function normalizeLyricsWorkflow(input: string): string {
  if (!input.trim()) {
    return "";
  }

  return hasLrcTimestamps(input)
    ? normalizeLrcText(input)
    : input
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n");
}

export function convertPlainLyricsWorkflow(
  input: string,
  duration: number,
): string {
  if (!input.trim()) {
    return "";
  }

  return plainLyricsToLrcText(input, duration);
}
