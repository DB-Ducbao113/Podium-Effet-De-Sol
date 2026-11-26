export interface ProxyResult {
  status: number;
  payload?: unknown;
  cacheState?: "HIT" | "MISS" | "SHARED" | "STALE";
  warning?: string;
}

export interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

export interface WorkerEnvironment {
  ALLOWED_ORIGINS?: string;
  APP_ENV?: "development" | "production" | "test";
  ASSETS: AssetsBinding;
}

export type TimezoneDetectSource = "ip" | "unavailable";

export interface TimezoneDetectResponse {
  timeZone: string | null;
  source: TimezoneDetectSource;
  serverTimeUtc: string;
  serverEpochMs: number;
}
