import type {
  TimezoneDetectResponse,
  WorkerEnvironment,
} from "@peds/contracts";
import { validateQueryShape } from "@peds/security";
import {
  corsHeaders,
  guardRequest,
  jsonResponse,
  queryFromUrl,
} from "./shared";

const EMPTY_QUERY_KEYS: ReadonlySet<string> = new Set();
const SAFE_IANA_PATTERN = /^[A-Za-z0-9_/+\\-]+$/;
const MAX_IANA_LENGTH = 64;

type RequestWithCf = Request & {
  cf?: {
    timezone?: unknown;
  };
};

function resolveValidatedCfTimeZone(request: Request): string | null {
  const candidate = (request as RequestWithCf).cf?.timezone;
  if (
    typeof candidate !== "string" ||
    candidate.length === 0 ||
    candidate.length > MAX_IANA_LENGTH ||
    !SAFE_IANA_PATTERN.test(candidate)
  ) {
    return null;
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: candidate });
    return candidate;
  } catch {
    return null;
  }
}

export default async function timezoneHandler(
  request: Request,
  environment: WorkerEnvironment,
): Promise<Response> {
  const headers = corsHeaders(request, environment);
  if (headers instanceof Response) return headers;

  const blocked = guardRequest(request, headers);
  if (blocked) return blocked;

  const queryCheck = validateQueryShape(
    queryFromUrl(new URL(request.url)),
    EMPTY_QUERY_KEYS,
    0,
  );
  if (!queryCheck.ok) {
    return jsonResponse(
      { error: "Unexpected query parameters", code: "INVALID_QUERY" },
      400,
      headers,
    );
  }

  const timeZone = resolveValidatedCfTimeZone(request);
  const serverEpochMs = Date.now();
  const payload: TimezoneDetectResponse = {
    timeZone,
    source: timeZone ? "ip" : "unavailable",
    serverTimeUtc: new Date(serverEpochMs).toISOString(),
    serverEpochMs,
  };

  headers.set("Cache-Control", "no-store");
  headers.set("Pragma", "no-cache");
  return jsonResponse(payload, 200, headers);
}
