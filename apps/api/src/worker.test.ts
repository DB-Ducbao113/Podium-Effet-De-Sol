import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  TimezoneDetectResponse,
  WorkerEnvironment,
} from "@peds/contracts";
import worker from "./worker";

function environment(
  asset = "<!doctype html><title>PEDS</title>",
): WorkerEnvironment {
  return {
    APP_ENV: "test",
    ALLOWED_ORIGINS: "",
    ASSETS: {
      fetch: vi.fn(
        async () =>
          new Response(asset, { headers: { "Content-Type": "text/html" } }),
      ),
    },
  };
}

afterEach(() => vi.restoreAllMocks());

describe("Cloudflare Worker router", () => {
  it("does not turn missing or retired non-API assets (including retired Model B) into SPA HTML", async () => {
    for (const missingPath of [
      "/models/missing.glb",
      "/models/model-b-eds-optimized-v1.glb",
    ]) {
      const env = environment();
      const response = await worker.fetch(
        new Request(`https://podium.example${missingPath}`, {
          headers: {
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Dest": "empty",
          },
        }),
        env,
      );
      expect(response.status).toBe(404);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      await expect(response.text()).resolves.toBe("Model asset not found");
      expect(env.ASSETS.fetch).not.toHaveBeenCalled();
    }
  });

  it("serves only the approved FP-04 RB production models through the asset binding", async () => {
    for (const modelPath of [
      "/models/fp04rb-engineering-v1.glb",
      "/models/fp04rb-showroom-desktop.glb",
      "/models/fp04rb-showroom-mobile.glb",
      "/models/fp04rb-pit-crew-v1.glb",
    ]) {
      const env = environment("approved-glb");
      const response = await worker.fetch(
        new Request(`https://podium.example${modelPath}`, {
          headers: {
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Dest": "empty",
          },
        }),
        env,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toContain("immutable");
      expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
      expect(response.headers.get("Cross-Origin-Resource-Policy")).toBe(
        "same-origin",
      );
      await expect(response.text()).resolves.toBe("approved-glb");
      expect(env.ASSETS.fetch).toHaveBeenCalledOnce();
    }
  });

  it("blocks cross-site scraping, direct navigation, and non-GET/HEAD methods to .glb assets", async () => {
    const env = environment("approved-glb");
    for (const modelPath of [
      "/models/fp04rb-engineering-v1.glb",
      "/models/fp04rb-showroom-desktop.glb",
      "/models/fp04rb-showroom-mobile.glb",
      "/models/fp04rb-pit-crew-v1.glb",
    ]) {
      const crossSite = await worker.fetch(
        new Request(`https://podium.example${modelPath}`, {
          headers: { "Sec-Fetch-Site": "cross-site" },
        }),
        env,
      );
      expect(crossSite.status).toBe(403);
      expect(crossSite.headers.get("Cache-Control")).toBe("no-store");

      const directNav = await worker.fetch(
        new Request(`https://podium.example${modelPath}`, {
          headers: {
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Dest": "document",
          },
        }),
        env,
      );
      expect(directNav.status).toBe(403);
      expect(directNav.headers.get("X-Robots-Tag")).toContain("noindex");

      const postReq = await worker.fetch(
        new Request(`https://podium.example${modelPath}`, {
          method: "POST",
          headers: { "Sec-Fetch-Site": "same-origin" },
        }),
        env,
      );
      expect(postReq.status).toBe(404);
    }
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it("returns an explicit JSON 404 for unknown API routes", async () => {
    const response = await worker.fetch(
      new Request("https://podium.example/api/not-a-route"),
      environment(),
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "API route not found",
    });
  });

  it("adds security headers to Worker-generated responses", async () => {
    const response = await worker.fetch(
      new Request("https://podium.example/api/not-a-route"),
      environment(),
    );
    expect(response.headers.get("Strict-Transport-Security")).toContain(
      "max-age=31536000",
    );
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "default-src 'none'",
    );
  });

  it("routes /api/timezone with no-store and hardened security headers, rejecting subpaths and disallowed origins", async () => {
    const req = new Request("https://podium.example/api/timezone", {
      headers: {
        Origin: "https://podium.example",
        "CF-Connecting-IP": "198.51.100.7",
      },
    });
    Object.defineProperty(req, "cf", {
      value: { timezone: "Europe/London" },
      configurable: true,
    });
    const ok = await worker.fetch(req, environment());
    expect(ok.status).toBe(200);
    expect(ok.headers.get("Cache-Control")).toBe("no-store");
    expect(ok.headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
    expect(ok.headers.get("Content-Security-Policy")).toContain(
      "default-src 'none'",
    );
    const data = (await ok.json()) as TimezoneDetectResponse;
    expect(data.timeZone).toBe("Europe/London");
    expect(data.source).toBe("ip");
    expect(typeof data.serverEpochMs).toBe("number");

    const subpath = await worker.fetch(
      new Request("https://podium.example/api/timezone/extra"),
      environment(),
    );
    expect(subpath.status).toBe(404);

    const forbidden = await worker.fetch(
      new Request("https://podium.example/api/timezone", {
        headers: { Origin: "https://evil.example" },
      }),
      environment(),
    );
    expect(forbidden.status).toBe(403);
  });

  it("does not expose internal exceptions", async () => {
    const env = environment();
    const invalidRequest = {
      url: "not a URL",
      method: "GET",
      headers: new Headers(),
    } as Request;
    const response = await worker.fetch(invalidRequest, env);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('{"error":"Internal service error"}');
  });
});
