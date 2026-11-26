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
const JOLPICA_CACHE_CONTROL =
  "public, max-age=300, s-maxage=900, stale-while-revalidate=86400";

function getEdgeCache(): Cache | null {
  const cacheStorage = (globalThis as { caches?: { default?: Cache } }).caches;
  return cacheStorage?.default ?? null;
}

export default async function jolpicaHandler(
  request: Request,
  environment: WorkerEnvironment,
): Promise<Response> {
  const cors = corsHeaders(request, environment);
  if (cors instanceof Response) return cors;
  cors.set("Cache-Control", JOLPICA_CACHE_CONTROL);
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
  const upstreamKey = `${path}?limit=${limit}&offset=${offset}`;
  const edgeCache = getEdgeCache();
  const edgeCacheKey = new Request(
    `https://edge-cache.podiumeds.internal/jolpica/${upstreamKey}`,
    { method: "GET" },
  );

  if (edgeCache) {
    try {
      const edgeHit = await edgeCache.match(edgeCacheKey);
      if (edgeHit) {
        const hitHeaders = new Headers(cors);
        hitHeaders.set("Content-Type", "application/json; charset=utf-8");
        hitHeaders.set("X-Content-Type-Options", "nosniff");
        hitHeaders.set("X-Cache", "EDGE-HIT");
        return new Response(edgeHit.body, {
          status: edgeHit.status,
          headers: hitHeaders,
        });
      }
    } catch {
      // Fall through to isolate cache + upstream when Edge Cache is unavailable.
    }
  }

  const result = await proxy.execute(upstreamKey);
  const response = sendResult(result, cors);

  if (edgeCache && result.status === 200) {
    try {
      const cacheable = new Response(response.clone().body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": JOLPICA_CACHE_CONTROL,
        },
      });
      await edgeCache.put(edgeCacheKey, cacheable);
    } catch {
      // Ignore edge cache write failures so API responses stay reliable.
    }
  }

  return response;
}
