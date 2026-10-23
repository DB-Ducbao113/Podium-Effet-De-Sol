import type { WorkerEnvironment } from "@peds/contracts";
import {
  boundedInteger,
  firstQueryValue,
  validateQueryShape,
} from "@peds/security";
import { ProxyUseCase } from "../../application/proxyUseCase";
import { OPENF1_POLICY } from "../../domain/proxyPolicy";
import {
  corsHeaders,
  guardRequest,
  jsonResponse,
  queryFromUrl,
  sendResult,
} from "./shared";

const endpoints = new Set([
  "sessions",
  "drivers",
  "location",
  "car_data",
  "position",
  "race_control",
  "meetings",
]);
const allowedParameters = new Set([
  "endpoint",
  "session_key",
  "meeting_key",
  "driver_number",
  "year",
  "date>=",
  "date<=",
  "limit",
  "offset",
]);
const proxy = new ProxyUseCase(OPENF1_POLICY);

export default async function openF1Handler(
  request: Request,
  environment: WorkerEnvironment,
): Promise<Response> {
  const cors = corsHeaders(request, environment);
  if (cors instanceof Response) return cors;
  cors.set("Cache-Control", "public, s-maxage=12, stale-while-revalidate=60");
  const earlyResponse = guardRequest(request, cors);
  if (earlyResponse) return earlyResponse;

  const url = new URL(request.url);
  const query = queryFromUrl(url);
  const pathEndpoint = decodeURIComponent(
    url.pathname.slice("/api/openf1/".length),
  ).replace(/^\/+/, "");
  if (pathEndpoint) {
    if (query.endpoint !== undefined) {
      return jsonResponse(
        { error: "Endpoint must be specified once" },
        400,
        cors,
      );
    }
    query.endpoint = pathEndpoint;
  }

  const shape = validateQueryShape(query, allowedParameters, 10);
  if (!shape.ok) return jsonResponse({ error: shape.reason }, 400, cors);
  const endpoint = firstQueryValue(query.endpoint).replace(/^\/+/, "");
  if (!endpoints.has(endpoint)) {
    return jsonResponse({ error: "Unsupported OpenF1 endpoint" }, 400, cors);
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "endpoint" || key === "limit" || key === "offset") continue;
    const normalized = firstQueryValue(value);
    if (normalized) params.set(key, normalized);
  }
  params.set("limit", String(boundedInteger(query.limit, 500, 500)));
  if (query.offset !== undefined) {
    params.set("offset", String(boundedInteger(query.offset, 0, 10_000)));
  }
  return sendResult(
    await proxy.execute(`${endpoint}?${params.toString()}`),
    cors,
  );
}
