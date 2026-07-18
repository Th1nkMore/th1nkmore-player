import { describe, expect, it } from "vitest";
import {
  createLoginRateLimiter,
  getLoginClientId,
} from "@/lib/login-rate-limit";

describe("admin login rate limiting", () => {
  it("blocks a client after repeated failures", () => {
    const limiter = createLoginRateLimiter({
      blockDurationMs: 60_000,
      maxFailures: 3,
      windowMs: 60_000,
    });

    expect(limiter.recordFailure("client", 1_000).allowed).toBe(true);
    expect(limiter.recordFailure("client", 2_000).allowed).toBe(true);
    expect(limiter.recordFailure("client", 3_000)).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect(limiter.check("client", 33_000)).toEqual({
      allowed: false,
      retryAfterSeconds: 30,
    });
  });

  it("resets failures after a successful login", () => {
    const limiter = createLoginRateLimiter({ maxFailures: 2 });
    limiter.recordFailure("client", 1_000);
    limiter.reset("client");

    expect(limiter.recordFailure("client", 2_000).allowed).toBe(true);
  });

  it("starts a new window after the old attempt window expires", () => {
    const limiter = createLoginRateLimiter({
      maxFailures: 2,
      windowMs: 1_000,
    });
    limiter.recordFailure("client", 1_000);

    expect(limiter.recordFailure("client", 2_001).allowed).toBe(true);
  });

  it("prefers Cloudflare's client address", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.2, 198.51.100.3",
      "x-real-ip": "192.0.2.4",
    });

    expect(getLoginClientId(headers)).toBe("203.0.113.10");
  });
});
