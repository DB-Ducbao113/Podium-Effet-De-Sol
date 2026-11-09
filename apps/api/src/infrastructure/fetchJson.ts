import type { ProxyPolicy } from '../domain/proxyPolicy';

export class UpstreamError extends Error {
  constructor(
    public readonly status: number,
    message = 'Upstream request failed',
  ) {
    super(message);
  }
}

export async function fetchJson(
  url: string,
  policy: ProxyPolicy,
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= policy.maximumRetries; attempt += 1) {
    try {
      const response = await fetcher(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'PODIUM-Effet-de-Sol/1.0' },
        signal: AbortSignal.timeout(policy.timeoutMs),
      });
      if (!response.ok) throw new UpstreamError(response.status);
      return await response.json();
    } catch (error) {
      lastError = error;
      const retryable = !(error instanceof UpstreamError) || error.status >= 500;
      if (!retryable || attempt === policy.maximumRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
    }
  }
  throw lastError;
}
