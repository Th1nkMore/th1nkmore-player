import { describe, expect, it } from "vitest";
import {
  getPlaybackRecoveryDelayMs,
  isRetryableMediaError,
  MAX_PLAYBACK_RECOVERY_ATTEMPTS,
  STALL_RECOVERY_TIMEOUT_MS,
} from "@/lib/playback-recovery";

describe("playback recovery", () => {
  it("uses capped exponential backoff", () => {
    expect(
      Array.from({ length: MAX_PLAYBACK_RECOVERY_ATTEMPTS }, (_, index) =>
        getPlaybackRecoveryDelayMs(index + 1),
      ),
    ).toEqual([1_000, 2_000, 4_000]);
  });

  it("only retries aborted and network media errors automatically", () => {
    expect(isRetryableMediaError(1)).toBe(true);
    expect(isRetryableMediaError("2")).toBe(true);
    expect(isRetryableMediaError(3)).toBe(false);
    expect(isRetryableMediaError(4)).toBe(false);
    expect(isRetryableMediaError("unknown")).toBe(false);
  });

  it("waits before treating an ordinary buffer stall as terminal", () => {
    expect(STALL_RECOVERY_TIMEOUT_MS).toBeGreaterThanOrEqual(10_000);
  });
});
