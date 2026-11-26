import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  TimezoneDetectResponse,
  WorkerEnvironment,
} from "@peds/contracts";
import timezoneHandler from "./timezone";

const environment: WorkerEnvironment = {
  APP_ENV: "test",
  ALLOWED_ORIGINS: "https://trusted.example",
  ASSETS: { fetch: async () => new Response("asset") },
};

function requestWithCf(
  url: string,
  init?: RequestInit,
  cf?: Record<string, unknown>,
): Request {
  const req = new Request(url, init);
  if (cf !== undefined) {
    Object.defineProperty(req, "cf", {
      value: cf,
      configurable: true,
    });
  }
  return req;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("GET /api/timezone security & contract", () => {
  it("QA-SEC-01: returns strictly 4 allowlisted fields for a valid Cloudflare IP timezone without leaking IP or extra geo data", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-25T09:30:00.250Z"));

    const req = requestWithCf(
      "https://podium.example/api/timezone",
      {
        headers: {
          "CF-Connecting-IP": "203.0.113.9",
          Origin: "https://podium.example",
        },
      },
      {
        timezone: "Asia/Tokyo",
        city: "Tokyo",
        country: "JP",
        latitude: "35.6895",
        longitude: "139.6917",
        asn: 12345,
      },
    );

    const response = await timezoneHandler(req, environment);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Pragma")).toBe("no-cache");
    expect(response.headers.get("Vary")).toBe("Origin");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");

    const rawText = await response.text();
    expect(rawText).not.toContain("203.0.113.9");
    expect(rawText).not.toContain("35.6895");
    expect(rawText).not.toContain("12345");

    const body = JSON.parse(rawText);
    expect(Object.keys(body).sort()).toEqual([
      "serverEpochMs",
      "serverTimeUtc",
      "source",
      "timeZone",
    ]);
    expect(body).toEqual({
      timeZone: "Asia/Tokyo",
      source: "ip",
      serverTimeUtc: "2026-11-25T09:30:00.250Z",
      serverEpochMs: Date.parse("2026-11-25T09:30:00.250Z"),
    });
  });

  it("supports fractional and negative IANA zones (Asia/Kolkata, America/Los_Angeles)", async () => {
    for (const tz of ["Asia/Kolkata", "America/Los_Angeles", "UTC"]) {
      const response = await timezoneHandler(
        requestWithCf("https://podium.example/api/timezone", undefined, {
          timezone: tz,
        }),
        environment,
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as TimezoneDetectResponse;
      expect(body.timeZone).toBe(tz);
      expect(body.source).toBe("ip");
    }
  });

  it("returns timeZone: null and source: unavailable with valid serverTimeUtc when edge cf metadata is absent (local dev)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-25T10:00:00.000Z"));

    const response = await timezoneHandler(
      new Request("https://podium.example/api/timezone"),
      environment,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      timeZone: null,
      source: "unavailable",
      serverTimeUtc: "2026-11-25T10:00:00.000Z",
      serverEpochMs: Date.parse("2026-11-25T10:00:00.000Z"),
    });
  });

  it("QA-SEC-01: falls back to null when cf.timezone contains invalid or XSS payload strings", async () => {
    for (const badTz of [
      "Mars/Olympus",
      "<script>alert(1)</script>",
      "A".repeat(120),
      12345,
      "",
    ]) {
      const response = await timezoneHandler(
        requestWithCf("https://podium.example/api/timezone", undefined, {
          timezone: badTz,
        }),
        environment,
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as TimezoneDetectResponse;
      expect(body.timeZone).toBeNull();
      expect(body.source).toBe("unavailable");
    }
  });

  it("QA-SEC-03: rejects disallowed cross-origin requests with 403 and no-store", async () => {
    const response = await timezoneHandler(
      new Request("https://podium.example/api/timezone", {
        headers: { Origin: "https://evil.example" },
      }),
      environment,
    );
    expect(response.status).toBe(403);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("answers CORS preflight OPTIONS with 204 and no-store", async () => {
    const response = await timezoneHandler(
      new Request("https://podium.example/api/timezone", {
        method: "OPTIONS",
        headers: { Origin: "https://trusted.example" },
      }),
      environment,
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://trusted.example",
    );
  });

  it("QA-SEC-04: rejects non-GET methods with 405 and unexpected query parameters with 400 INVALID_QUERY", async () => {
    const postRes = await timezoneHandler(
      new Request("https://podium.example/api/timezone", { method: "POST" }),
      environment,
    );
    expect(postRes.status).toBe(405);
    expect(postRes.headers.get("Allow")).toBe("GET, OPTIONS");
    expect(postRes.headers.get("Cache-Control")).toBe("no-store");

    const queryRes = await timezoneHandler(
      new Request("https://podium.example/api/timezone?tz=UTC"),
      environment,
    );
    expect(queryRes.status).toBe(400);
    expect(queryRes.headers.get("Cache-Control")).toBe("no-store");
    await expect(queryRes.json()).resolves.toEqual({
      error: "Unexpected query parameters",
      code: "INVALID_QUERY",
    });
  });
});
