export const MAX_PLAYBACK_RECOVERY_ATTEMPTS = 3;
export const STALL_RECOVERY_TIMEOUT_MS = 12_000;

export function getPlaybackRecoveryDelayMs(attempt: number) {
  const safeAttempt = Math.max(1, Math.floor(attempt));
  return Math.min(4_000, 2 ** (safeAttempt - 1) * 1_000);
}

export function isRetryableMediaError(error: unknown) {
  const code =
    typeof error === "number"
      ? error
      : typeof error === "string"
        ? Number.parseInt(error, 10)
        : Number.NaN;
  return code === 1 || code === 2;
}
