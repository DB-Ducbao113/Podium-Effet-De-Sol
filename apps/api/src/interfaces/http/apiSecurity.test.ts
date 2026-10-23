import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkerEnvironment } from "@peds/contracts";
import jolpicaHandler from "./jolpica";
import openF1Handler from "./openf1";

const environment: WorkerEnvironment = {
  APP_ENV: "test",
  ALLOWED_ORIGINS: "https://trusted.example",
  ASSETS: { fetch: async () => new Response("asset") },
};

afterEach(() => vi.restoreAllMocks());

describe("Cloudflare Fetch API security boundary", () => {
  it("rejects an arbitrary Jolpica path without fetching", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await jolpicaHandler(
      new Request("https://podium.example/api/jolpica?path=admin/secrets"),
      environment,
    );
    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts the legacy Jolpica path-query contract and caps page size", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"MRData":{}}', {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const response = await jolpicaHandler(
      new Request(
        "https://podium.example/api/jolpica?path=ergast%2Ff1%2F2026%2Fresults.json&limit=999",
      ),
      environment,
    );
    expect(response.status).toBe(200);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("limit=100");
  });

  it("accepts the frontend Jolpica path contract", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"MRData":{}}', {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const response = await jolpicaHandler(
      new Request(
        "https://podium.example/api/jolpica/ergast/f1/2025/sprint.json?offset=2",
      ),
      environment,
    );
    expect(response.status).toBe(200);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(
      "ergast/f1/2025/sprint.json",
    );
  });

  it("rejects unknown OpenF1 parameters without fetching", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await openF1Handler(
      new Request("https://podium.example/api/openf1/sessions?upstream=evil"),
      environment,
    );
    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("caps OpenF1 page size before forwarding", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("[]", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const response = await openF1Handler(
      new Request(
        "https://podium.example/api/openf1/sessions?limit=999999&meeting_key=123456",
      ),
      environment,
    );
    expect(response.status).toBe(200);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("limit=500");
  });

  it("rejects an untrusted browser origin", async () => {
    const response = await openF1Handler(
      new Request("https://podium.example/api/openf1/sessions", {
        headers: { Origin: "https://evil.example" },
      }),
      environment,
    );
    expect(response.status).toBe(403);
  });

  it("answers CORS preflight without contacting upstream", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await openF1Handler(
      new Request("https://podium.example/api/openf1/sessions", {
        method: "OPTIONS",
        headers: { Origin: "https://trusted.example" },
      }),
      environment,
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://trusted.example",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns JSON for unsupported methods", async () => {
    const response = await openF1Handler(
      new Request("https://podium.example/api/openf1/sessions", {
        method: "POST",
      }),
      environment,
    );
    expect(response.status).toBe(405);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Method not allowed",
    });
  });
});
