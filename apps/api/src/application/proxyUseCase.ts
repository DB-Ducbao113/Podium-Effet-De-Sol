import type { ProxyResult } from '@peds/contracts';
import type { ProxyPolicy } from '../domain/proxyPolicy';
import { BoundedCache } from '../infrastructure/boundedCache';
import { fetchJson, UpstreamError } from '../infrastructure/fetchJson';

export class ProxyUseCase {
  private readonly cache: BoundedCache<unknown>;
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(private readonly policy: ProxyPolicy) {
    this.cache = new BoundedCache(policy.maximumCacheEntries);
  }

  async execute(cacheKey: string): Promise<ProxyResult> {
    const now = Date.now();
    const cached = this.cache.get(cacheKey);
    if (cached && now - cached.storedAt < this.policy.cacheTtlMs) {
      return { status: 200, payload: cached.payload, cacheState: 'HIT' };
    }

    const existing = this.inflight.get(cacheKey);
    if (existing) return this.resolvePending(existing, cached, 'SHARED');

    const task = fetchJson(`${this.policy.origin}/${cacheKey}`, this.policy);
    this.inflight.set(cacheKey, task);
    try {
      const payload = await task;
      this.cache.set(cacheKey, payload);
      return { status: 200, payload, cacheState: 'MISS' };
    } catch (error) {
      if (cached && Date.now() - cached.storedAt < this.policy.staleMaxAgeMs) {
        return {
          status: 200,
          payload: cached.payload,
          cacheState: 'STALE',
          warning: '110 - Response is stale',
        };
      }
      return {
        status: error instanceof UpstreamError && error.status === 429 ? 429 : 503,
        payload: {
          error:
            error instanceof UpstreamError && error.status === 429
              ? 'rate-limited'
              : 'Upstream is temporarily unavailable',
        },
      };
    } finally {
      this.inflight.delete(cacheKey);
    }
  }

  private async resolvePending(
    pending: Promise<unknown>,
    cached: ReturnType<BoundedCache<unknown>['get']>,
    cacheState: 'SHARED',
  ): Promise<ProxyResult> {
    try {
      return { status: 200, payload: await pending, cacheState };
    } catch {
      if (cached && Date.now() - cached.storedAt < this.policy.staleMaxAgeMs) {
        return {
          status: 200,
          payload: cached.payload,
          cacheState: 'STALE',
          warning: '110 - Response is stale',
        };
      }
      return { status: 503, payload: { error: 'Upstream is temporarily unavailable' } };
    }
  }
}
