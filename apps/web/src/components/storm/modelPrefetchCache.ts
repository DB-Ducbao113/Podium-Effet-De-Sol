const prefetchedBuffers = new Map<string, Promise<ArrayBuffer>>();

function resolveGlbFetchCacheMode(): RequestCache {
  return import.meta.env?.DEV ? "no-store" : "default";
}

/**
 * Pure Fetch-API single-flight GLB ArrayBuffer prefetcher (zero Three.js imports).
 * Allows route hover/focus prefetchers to warm `.glb` downloads before 3D chunks mount
 * without pulling `vendor-three` into non-3D routes.
 */
export function prefetchGlbArrayBuffer(url: string): Promise<ArrayBuffer> {
  const existing = prefetchedBuffers.get(url);
  if (existing) return existing;

  const task = fetch(url, {
    credentials: "same-origin",
    cache: resolveGlbFetchCacheMode(),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`GLB prefetch HTTP ${res.status} loading ${url}`);
      }
      return res.arrayBuffer();
    })
    .catch((err) => {
      prefetchedBuffers.delete(url);
      throw err;
    });

  prefetchedBuffers.set(url, task);
  return task;
}

export function getPrefetchedGlbArrayBuffer(
  url: string,
): Promise<ArrayBuffer> | undefined {
  return prefetchedBuffers.get(url);
}

export function consumePrefetchedGlbArrayBuffer(
  url: string,
): Promise<ArrayBuffer> | undefined {
  const existing = prefetchedBuffers.get(url);
  if (existing) {
    prefetchedBuffers.delete(url);
  }
  return existing;
}

export function hasPrefetchedGlbArrayBuffer(url: string): boolean {
  return prefetchedBuffers.has(url);
}

export function clearPrefetchedGlbCache(): void {
  prefetchedBuffers.clear();
}
