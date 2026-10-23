import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkerEnvironment } from "@peds/contracts";
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
  it("does not turn missing non-API assets into SPA HTML", async () => {
    const env = environment();
    const response = await worker.fetch(
      new Request("https://podium.example/models/missing.glb"),
      env,
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.text()).resolves.toBe("Model asset not found");
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it("serves only the approved production model through the asset binding", async () => {
    const env = environment("approved-glb");
    const response = await worker.fetch(
      new Request("https://podium.example/models/eds-g01.glb"),
      env,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("immutable");
    await expect(response.text()).resolves.toBe("approved-glb");
    expect(env.ASSETS.fetch).toHaveBeenCalledOnce();
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
