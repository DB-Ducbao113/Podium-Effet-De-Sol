interface RateBucket {
  count: number;
  resetAt: number;
}

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, RateBucket>();

  constructor(
    private readonly maximumRequests: number,
    private readonly windowMs: number,
    private readonly maximumBuckets = 5_000,
  ) {}

  consume(
    key: string,
    now = Date.now(),
  ): { allowed: boolean; retryAfterSeconds: number } {
    const existing = this.buckets.get(key);
    if (!existing || now >= existing.resetAt) {
      this.prune(now);
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    existing.count += 1;
    return {
      allowed: existing.count <= this.maximumRequests,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1_000),
      ),
    };
  }

  private prune(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (now >= bucket.resetAt) this.buckets.delete(key);
    }
    while (this.buckets.size >= this.maximumBuckets) {
      const oldestKey = this.buckets.keys().next().value as string | undefined;
      if (!oldestKey) break;
      this.buckets.delete(oldestKey);
    }
  }
}
