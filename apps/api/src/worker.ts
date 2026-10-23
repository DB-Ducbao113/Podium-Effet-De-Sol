import type { WorkerEnvironment } from "@peds/contracts";
import { FixedWindowRateLimiter } from "./infrastructure/rateLimiter";
import jolpicaHandler from "./interfaces/http/jolpica";
import openF1Handler from "./interfaces/http/openf1";
import { corsHeaders, jsonResponse } from "./interfaces/http/shared";

const limiter = new FixedWindowRateLimiter(120, 60_000);

const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'none'; frame-ancestors 'self'; base-uri 'none'; object-src 'none'",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
} as const;

function harden(response: Response): Response {
  const hardened = new Response(response.body, response);
  for (const [name, value] of Object.entries(securityHeaders))
    hardened.headers.set(name, value);
  return hardened;
}

function rateLimitKey(request: Request): string {
  return request.headers.get("CF-Connecting-IP") ?? "local-or-unidentified";
}

async function route(
  request: Request,
  environment: WorkerEnvironment,
): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith("/models/")) {
    if (
      pathname !== "/models/eds-g01.glb" ||
      !["GET", "HEAD"].includes(request.method)
    ) {
      return new Response("Model asset not found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }
    const asset = await environment.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
    return response;
  }
  if (!pathname.startsWith("/api/")) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  if (request.method !== "OPTIONS") {
    const cors = corsHeaders(request, environment);
    if (cors instanceof Response) return cors;
    const limit = limiter.consume(rateLimitKey(request));
    if (!limit.allowed) {
      cors.set("Retry-After", String(limit.retryAfterSeconds));
      cors.set("Cache-Control", "no-store");
      return jsonResponse({ error: "Too many requests" }, 429, cors);
    }
  }

  if (pathname === "/api/openf1" || pathname.startsWith("/api/openf1/")) {
    return openF1Handler(request, environment);
  }
  if (pathname === "/api/jolpica" || pathname.startsWith("/api/jolpica/")) {
    return jolpicaHandler(request, environment);
  }
  return jsonResponse(
    { error: "API route not found" },
    404,
    new Headers({ "Cache-Control": "no-store" }),
  );
}

export default {
  async fetch(
    request: Request,
    environment: WorkerEnvironment,
  ): Promise<Response> {
    try {
      return harden(await route(request, environment));
    } catch {
      return harden(
        jsonResponse(
          { error: "Internal service error" },
          500,
          new Headers({ "Cache-Control": "no-store" }),
        ),
      );
    }
  },
};
