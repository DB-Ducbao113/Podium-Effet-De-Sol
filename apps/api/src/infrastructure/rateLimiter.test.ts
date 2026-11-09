import { describe, expect, it } from "vitest";
import { FixedWindowRateLimiter } from "./rateLimiter";

describe("FixedWindowRateLimiter", () => {
  it("rejects excess requests and resets after the window", () => {
    const limiter = new FixedWindowRateLimiter(2, 1_000, 10);
    expect(limiter.consume("client", 0).allowed).toBe(true);
    expect(limiter.consume("client", 1).allowed).toBe(true);
    expect(limiter.consume("client", 2)).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
    expect(limiter.consume("client", 1_000).allowed).toBe(true);
  });

  it("bounds the number of retained client buckets", () => {
    const limiter = new FixedWindowRateLimiter(2, 10_000, 2);
    limiter.consume("first", 0);
    limiter.consume("second", 0);
    expect(limiter.consume("third", 0).allowed).toBe(true);
    expect(limiter.consume("first", 1).allowed).toBe(true);
  });
});
