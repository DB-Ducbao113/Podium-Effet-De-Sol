import type { ProxyResult, WorkerEnvironment } from "@peds/contracts";
import { isOriginAllowed } from "@peds/security";

function configuredOrigins(environment: WorkerEnvironment): string[] {
  return (environment.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function queryFromUrl(url: URL): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  for (const [key, value] of url.searchParams) {
    const current = query[key];
    query[key] =
      current === undefined
        ? value
        : Array.isArray(current)
          ? [...current, value]
          : [current, value];
  }
  return query;
}

export function corsHeaders(
  request: Request,
  environment: WorkerEnvironment,
): Headers | Response {
  const origin = request.headers.get("Origin") ?? "";
  const host = new URL(request.url).host;
  const headers = new Headers({
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Access-Control-Max-Age": "86400",
  });
  if (!isOriginAllowed(origin, host, configuredOrigins(environment))) {
    return jsonResponse({ error: "Origin not allowed" }, 403, headers);
  }
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

export function guardRequest(
  request: Request,
  headers: Headers,
): Response | undefined {
  if (request.method === "OPTIONS") {
    headers.set("Cache-Control", "no-store");
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "GET") {
    headers.set("Allow", "GET, OPTIONS");
    return jsonResponse({ error: "Method not allowed" }, 405, headers);
  }
  return undefined;
}

export function jsonResponse(
  payload: unknown,
  status: number,
  headers = new Headers(),
): Response {
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("X-Content-Type-Options", "nosniff");
  if (status >= 400) headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(payload), { status, headers });
}

export function sendResult(result: ProxyResult, headers: Headers): Response {
  if (result.cacheState) headers.set("X-Cache", result.cacheState);
  if (result.warning) headers.set("Warning", result.warning);
  return jsonResponse(result.payload, result.status, headers);
}
