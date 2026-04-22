import { describe, expect, it } from "vitest";
import { resolveRecordingSessionTime } from "@/lib/recordingSession";

describe("resolveRecordingSessionTime", () => {
  it("uses accompaniment time only after the accompaniment is ready", () => {
    expect(
      resolveRecordingSessionTime({
        accompanimentCurrentTime: 0,
        elapsedSeconds: 7,
        hasAccompaniment: true,
        isAccompanimentReady: false,
      }),
    ).toBe(7);

    expect(
      resolveRecordingSessionTime({
        accompanimentCurrentTime: 6.5,
        elapsedSeconds: 7,
        hasAccompaniment: true,
        isAccompanimentReady: true,
      }),
    ).toBe(6.5);
  });

  it("falls back to recorder time when using a mock dry-run without accompaniment", () => {
    expect(
      resolveRecordingSessionTime({
        accompanimentCurrentTime: 0,
        elapsedSeconds: 12,
        hasAccompaniment: false,
        isAccompanimentReady: false,
      }),
    ).toBe(12);
  });
});
