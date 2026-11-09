import type { WorkerEnvironment } from "@peds/contracts";
import {
  boundedInteger,
  firstQueryValue,
  validateQueryShape,
} from "@peds/security";
import { ProxyUseCase } from "../../application/proxyUseCase";
import { JOLPICA_POLICY } from "../../domain/proxyPolicy";
import {
  corsHeaders,
  guardRequest,
  jsonResponse,
  queryFromUrl,
  sendResult,
} from "./shared";

const allowedPath = /^ergast\/f1\/(2024|2025|2026)\/(results|sprint)\.json$/;
const allowedParameters = new Set(["path", "limit", "offset"]);
const proxy = new ProxyUseCase(JOLPICA_POLICY);

export default async function jolpicaHandler(
  request: Request,
  environment: WorkerEnvironment,
): Promise<Response> {
  const cors = corsHeaders(request, environment);
  if (cors instanceof Response) return cors;
  cors.set(
    "Cache-Control",
    "public, s-maxage=900, stale-while-revalidate=86400",
  );
  const earlyResponse = guardRequest(request, cors);
  if (earlyResponse) return earlyResponse;

  const url = new URL(request.url);
  const query = queryFromUrl(url);
  const pathSuffix = decodeURIComponent(
    url.pathname.slice("/api/jolpica/".length),
  ).replace(/^\/+/, "");
  if (pathSuffix) {
    if (query.path !== undefined) {
      return jsonResponse({ error: "Path must be specified once" }, 400, cors);
    }
    query.path = pathSuffix;
  }

  const shape = validateQueryShape(query, allowedParameters, 3);
  if (!shape.ok) return jsonResponse({ error: shape.reason }, 400, cors);
  const path = firstQueryValue(query.path).replace(/^\/+/, "");
  if (!allowedPath.test(path)) {
    return jsonResponse({ error: "Unsupported Jolpica endpoint" }, 400, cors);
  }
  const limit = boundedInteger(query.limit, 100, 100);
  const offset = boundedInteger(query.offset, 0, 10_000);
  return sendResult(
    await proxy.execute(`${path}?limit=${limit}&offset=${offset}`),
    cors,
  );
}
