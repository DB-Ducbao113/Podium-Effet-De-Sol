export interface ProxyPolicy {
  origin: string;
  cacheTtlMs: number;
  staleMaxAgeMs: number;
  timeoutMs: number;
  maximumCacheEntries: number;
  maximumRetries: number;
}

export const JOLPICA_POLICY: ProxyPolicy = {
  origin: 'https://api.jolpi.ca',
  cacheTtlMs: 15 * 60_000,
  staleMaxAgeMs: 24 * 60 * 60_000,
  timeoutMs: 10_000,
  maximumCacheEntries: 200,
  maximumRetries: 1,
};

export const OPENF1_POLICY: ProxyPolicy = {
  origin: 'https://api.openf1.org/v1',
  cacheTtlMs: 12_000,
  staleMaxAgeMs: 5 * 60_000,
  timeoutMs: 8_000,
  maximumCacheEntries: 200,
  maximumRetries: 0,
};
