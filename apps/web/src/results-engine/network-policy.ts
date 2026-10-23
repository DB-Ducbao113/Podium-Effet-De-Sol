export interface ObservationRequestPolicy {
  timeoutMs: number;
  maxAttempts: number;
  baseDelayMs: number;
  maxRetryDelayMs: number;
}

export const defaultObservationRequestPolicy: ObservationRequestPolicy = {
  timeoutMs: 10_000,
  maxAttempts: 3,
  baseDelayMs: 500,
  maxRetryDelayMs: 5_000,
};

export class ObservationRequestError extends Error {
  readonly status: number | null;
  readonly retryAfterMs: number | null;

  constructor(message: string, status: number | null = null, retryAfterMs: number | null = null) {
    super(message);
    this.name = 'ObservationRequestError';
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export type ObservationFetchJson = (url: string, signal?: AbortSignal) => Promise<unknown>;

export async function requestJsonWithPolicy(input: {
  url: string;
  fetchJson: ObservationFetchJson;
  policy?: Partial<ObservationRequestPolicy>;
  sleep?: (milliseconds: number) => Promise<void>;
}): Promise<unknown> {
  const policy = validatedPolicy(input.policy);
  const sleep =
    input.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  let lastError: unknown;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    try {
      return await withTimeout(input.url, policy.timeoutMs, input.fetchJson);
    } catch (error) {
      lastError = error;
      if (attempt === policy.maxAttempts || !retryable(error)) throw error;
      const requestedDelay =
        error instanceof ObservationRequestError && error.retryAfterMs !== null
          ? error.retryAfterMs
          : policy.baseDelayMs * 2 ** (attempt - 1);
      await sleep(Math.min(requestedDelay, policy.maxRetryDelayMs));
    }
  }
  throw lastError;
}

async function withTimeout(
  url: string,
  timeoutMs: number,
  fetchJson: ObservationFetchJson,
): Promise<unknown> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fetchJson(url, controller.signal),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new ObservationRequestError(`Observation request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function retryable(error: unknown): boolean {
  if (!(error instanceof ObservationRequestError)) return false;
  return (
    error.status === null ||
    error.status === 408 ||
    error.status === 425 ||
    error.status === 429 ||
    error.status >= 500
  );
}

function validatedPolicy(
  override: Partial<ObservationRequestPolicy> | undefined,
): ObservationRequestPolicy {
  const policy = { ...defaultObservationRequestPolicy, ...override };
  if (
    !Number.isInteger(policy.timeoutMs) ||
    policy.timeoutMs <= 0 ||
    !Number.isInteger(policy.maxAttempts) ||
    policy.maxAttempts <= 0 ||
    !Number.isInteger(policy.baseDelayMs) ||
    policy.baseDelayMs < 0 ||
    !Number.isInteger(policy.maxRetryDelayMs) ||
    policy.maxRetryDelayMs < 0
  ) {
    throw new Error('Observation request policy is invalid');
  }
  return policy;
}
