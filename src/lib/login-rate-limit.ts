type LoginAttempt = {
  blockedUntil: number;
  failureCount: number;
  windowStartedAt: number;
};

type LoginRateLimiterOptions = {
  blockDurationMs?: number;
  maxFailures?: number;
  maxTrackedClients?: number;
  windowMs?: number;
};

export type LoginRateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const DEFAULT_BLOCK_DURATION_MS = 15 * 60 * 1000;
const DEFAULT_MAX_FAILURES = 5;
const DEFAULT_MAX_TRACKED_CLIENTS = 10_000;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

function allowedDecision(): LoginRateLimitDecision {
  return { allowed: true, retryAfterSeconds: 0 };
}

export function createLoginRateLimiter({
  blockDurationMs = DEFAULT_BLOCK_DURATION_MS,
  maxFailures = DEFAULT_MAX_FAILURES,
  maxTrackedClients = DEFAULT_MAX_TRACKED_CLIENTS,
  windowMs = DEFAULT_WINDOW_MS,
}: LoginRateLimiterOptions = {}) {
  const attempts = new Map<string, LoginAttempt>();

  const removeOldestClientIfFull = (clientId: string) => {
    if (attempts.has(clientId) || attempts.size < maxTrackedClients) return;
    const oldestClientId = attempts.keys().next().value;
    if (oldestClientId) attempts.delete(oldestClientId);
  };

  const check = (
    clientId: string,
    now = Date.now(),
  ): LoginRateLimitDecision => {
    const attempt = attempts.get(clientId);
    if (!attempt) return allowedDecision();

    if (attempt.blockedUntil > now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((attempt.blockedUntil - now) / 1000),
        ),
      };
    }

    if (now - attempt.windowStartedAt >= windowMs) {
      attempts.delete(clientId);
    }

    return allowedDecision();
  };

  const recordFailure = (
    clientId: string,
    now = Date.now(),
  ): LoginRateLimitDecision => {
    removeOldestClientIfFull(clientId);
    const existingAttempt = attempts.get(clientId);
    const attempt =
      existingAttempt && now - existingAttempt.windowStartedAt < windowMs
        ? existingAttempt
        : { blockedUntil: 0, failureCount: 0, windowStartedAt: now };

    attempt.failureCount += 1;
    if (attempt.failureCount >= maxFailures) {
      attempt.blockedUntil = now + blockDurationMs;
    }
    attempts.set(clientId, attempt);
    return check(clientId, now);
  };

  const reset = (clientId: string) => {
    attempts.delete(clientId);
  };

  return { check, recordFailure, reset };
}

export function getLoginClientId(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientId =
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    forwardedFor ||
    "unknown";
  return clientId.slice(0, 128);
}

export const adminLoginRateLimiter = createLoginRateLimiter();
