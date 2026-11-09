import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DRIVER_STANDINGS_2026,
  CONSTRUCTOR_STANDINGS_2026,
} from "../data/championship/standings";
import { DETAILED_RACE_RESULTS_2026 } from "../data/championship/detailedResults2026";
import { BASELINE_CUTOFF_BY_SEASON } from "../data/championship/baselineCutoff";
import {
  getCompleteRaceClassification,
  fastestLapBonusPoints,
} from "../data/championship/raceClassificationHelper";
import { DetailedRaceResult, UNKNOWN_TEAM_ID } from "../types";
import { mapConstructorId, syncF1SeasonData } from "./f1DataService";
import { recalculateStandingsFromRaces } from "./standingsEngine";
import openF1FetchHandler from "../../../api/src/interfaces/http/openf1";
import jolpicaFetchHandler from "../../../api/src/interfaces/http/jolpica";
import type { WorkerEnvironment } from "@peds/contracts";
import { openF1Service } from "./openF1Service";

const workerTestEnvironment: WorkerEnvironment = {
  APP_ENV: "test",
  ALLOWED_ORIGINS: "",
  ASSETS: { fetch: async () => new Response("asset") },
};

async function invokeFetchHandler(
  handler: (
    request: Request,
    environment: WorkerEnvironment,
  ) => Promise<Response>,
  request: any,
  response: any,
) {
  const host = String(request.headers?.host ?? "podium.example");
  const url = new URL(`https://${host}/api/test`);
  for (const [key, raw] of Object.entries(request.query ?? {})) {
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) url.searchParams.append(key, String(value));
  }
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers ?? {})) {
    if (value !== undefined) headers.set(key, String(value));
  }
  const result = await handler(
    new Request(url, { method: request.method ?? "GET", headers }),
    workerTestEnvironment,
  );
  response.statusCode = result.status;
  result.headers.forEach((value, key) => response.setHeader(key, value));
  if (result.status !== 204) response.body = await result.json();
  return response;
}

const openF1Handler = (request: any, response: any) =>
  invokeFetchHandler(openF1FetchHandler, request, response);
const jolpicaHandler = (request: any, response: any) =>
  invokeFetchHandler(jolpicaFetchHandler, request, response);

const russellBase = DRIVER_STANDINGS_2026.find(
  (d) => d.driverId === "russell",
)!.points;
const mercedesBase = CONSTRUCTOR_STANDINGS_2026.find(
  (c) => c.teamId === "mercedes",
)!.points;
const redbullBase = CONSTRUCTOR_STANDINGS_2026.find(
  (c) => c.teamId === "redbull",
)!.points;

function sprintRace(): DetailedRaceResult {
  return {
    id: "race-2026-r20-test",
    season: 2026,
    round: 20,
    grandPrix: "Test Grand Prix",
    officialName: "Test Grand Prix 2026",
    circuit: "Test Circuit",
    date: "01 Nov 2026",
    status: "completed",
    lapsTotal: 57,
    entries: [
      {
        position: 1,
        driverId: "russell",
        driverName: "George Russell",
        driverCode: "RUS",
        teamId: "mercedes",
        teamName: "Mercedes",
        laps: 57,
        status: "Finished",
        timeOrGap: "1:30:00.000",
        points: 10,
        sprintPoints: 8,
      },
    ],
  };
}

describe("critical fixes: sprint counted exactly once", () => {
  it("adds race + sprint points once each (10 + 8 = 18, not 26)", () => {
    const res = recalculateStandingsFromRaces(
      2026,
      [sprintRace()],
      DRIVER_STANDINGS_2026,
      CONSTRUCTOR_STANDINGS_2026,
    );
    expect(res.drivers.find((d) => d.driverId === "russell")?.points).toBe(
      russellBase + 18,
    );
    expect(res.constructors.find((c) => c.teamId === "mercedes")?.points).toBe(
      mercedesBase + 18,
    );
  });

  it("does not inflate constructors when only legacy sprintPoints exist", () => {
    const res = recalculateStandingsFromRaces(
      2026,
      [{ ...sprintRace(), sprintEntries: [] }],
      DRIVER_STANDINGS_2026,
      CONSTRUCTOR_STANDINGS_2026,
    );
    expect(res.constructors.find((c) => c.teamId === "mercedes")?.points).toBe(
      mercedesBase + 18,
    );
  });
});

describe("critical fixes: unknown constructor and sparse grid", () => {
  it("maps unmapped constructors to 'unknown', never to redbull", () => {
    expect(mapConstructorId("newteam11")).toBe("unknown");
    expect(mapConstructorId(undefined)).toBe("unknown");
    expect(mapConstructorId("red_bull")).toBe("redbull");
  });

  it("keeps redbull points unchanged when an unknown team scores", () => {
    const race = sprintRace();
    race.entries[0]!.teamId = UNKNOWN_TEAM_ID;
    race.entries[0]!.teamName = "New Team 11";
    const res = recalculateStandingsFromRaces(
      2026,
      [race],
      DRIVER_STANDINGS_2026,
      CONSTRUCTOR_STANDINGS_2026,
    );
    expect(res.constructors.find((c) => c.teamId === "redbull")?.points).toBe(
      redbullBase,
    );
    expect(res.drivers.find((d) => d.driverId === "russell")?.points).toBe(
      russellBase + 18,
    );
  });

  it("creates no phantom drivers, teams or points for unmatched podium names", () => {
    const race = getCompleteRaceClassification(2024, 16);
    expect(race?.isSynthesized).toBe(true);
    const ids = (race?.entries || []).map((e) => e.driverId);
    expect(ids).not.toContain("p1");
    expect(ids).not.toContain("p2");
    expect(ids).not.toContain("p3");
    // Only the official podium rows are forwarded — no fabricated P4+ field.
    expect(race?.entries.map((e) => e.position)).toEqual([1, 2, 3]);
    expect(race?.entries.every((e) => e.status === "Finished")).toBe(true);
  });

  it("forwards a sparse real classification instead of replacing it", () => {
    const sparse: DetailedRaceResult = {
      id: "race-2026-r18-sparse",
      season: 2026,
      round: 18,
      grandPrix: "Sparse Grand Prix",
      officialName: "Sparse Grand Prix 2026",
      circuit: "Sparse Circuit",
      date: "01 Nov 2026",
      status: "completed",
      lapsTotal: 57,
      entries: [
        {
          position: 1,
          driverId: "russell",
          driverName: "George Russell",
          driverCode: "RUS",
          teamId: "mercedes",
          teamName: "Mercedes",
          laps: 57,
          status: "Finished",
          timeOrGap: "1:30:00.000",
          points: 25,
        },
      ],
    };
    const race = getCompleteRaceClassification(2026, 18, [sparse]);
    expect(race).toBe(sparse);
    expect(race?.isSynthesized).toBeUndefined();
  });
});

describe("critical fixes: fastest-lap rule by season", () => {
  it("keeps +1 for 2024 top-10 fastest lap only", () => {
    expect(fastestLapBonusPoints(2024, 9, true)).toBe(1);
    expect(fastestLapBonusPoints(2024, 11, true)).toBe(0);
    expect(fastestLapBonusPoints(2024, 5, false)).toBe(0);
  });

  it("removes fastest-lap points from 2025 onwards", () => {
    expect(fastestLapBonusPoints(2025, 1, true)).toBe(0);
    expect(fastestLapBonusPoints(2026, 5, true)).toBe(0);
  });

  it("keeps official podium points and fastest-lap flags without inventing rows", () => {
    // 2024 R1: Verstappen wins with the fastest lap -> official 26 points.
    const r2024 = getCompleteRaceClassification(2024, 1);
    const verstappen = r2024?.entries.find((e) => e.driverId === "verstappen");
    expect(verstappen?.position).toBe(1);
    expect(verstappen?.fastestLap).toBe(true);
    expect(verstappen?.points).toBe(26);
    // No fabricated rows for drivers outside the podium.
    expect(r2024?.entries).toHaveLength(3);
    // 2026 R1: Verstappen holds the fastest lap but is not on the podium ->
    // he gets no invented entry; only the race header reports the fastest lap.
    const r2026 = getCompleteRaceClassification(2026, 1);
    expect(
      r2026?.entries.find((e) => e.driverId === "verstappen"),
    ).toBeUndefined();
    expect(r2026?.fastestLap?.driver).toBe("Max Verstappen");
    expect(r2026?.entries).toHaveLength(3);
  });

  it("uses per-season laps (Monza 2024 = 53)", () => {
    expect(getCompleteRaceClassification(2024, 16)?.lapsTotal).toBe(53);
  });
});

describe("critical fixes: synthesized data never drives standings", () => {
  it("excludes synthesized races from recalculation", () => {
    const synth: DetailedRaceResult = {
      ...sprintRace(),
      round: 21,
      id: "race-2026-r21-synth",
      isSynthesized: true,
    };
    const res = recalculateStandingsFromRaces(
      2026,
      [synth],
      DRIVER_STANDINGS_2026,
      CONSTRUCTOR_STANDINGS_2026,
    );
    expect(res.drivers.find((d) => d.driverId === "russell")?.points).toBe(
      russellBase,
    );
    expect(res.constructors.find((c) => c.teamId === "mercedes")?.points).toBe(
      mercedesBase,
    );
  });

  it("documents the per-season baseline cutoff with source and meaning", () => {
    expect(BASELINE_CUTOFF_BY_SEASON[2026].completedRounds).toBe(17);
    expect(BASELINE_CUTOFF_BY_SEASON[2026].source.length).toBeGreaterThan(10);
    expect(BASELINE_CUTOFF_BY_SEASON[2026].meaning.length).toBeGreaterThan(10);
    expect(BASELINE_CUTOFF_BY_SEASON[2024].final).toBe(true);
  });
});

describe("critical fixes: jolpica proxy rejects bad origins and paths (no network)", () => {
  function mockReqRes(query: unknown, method = "GET", headers: unknown = {}) {
    const res: any = {
      statusCode: 200,
      body: undefined as unknown,
      setHeader: () => undefined,
      status: (c: number) => {
        res.statusCode = c;
        return res;
      },
      json: (b: unknown) => {
        res.body = b;
        return res;
      },
      end: () => res,
    };
    return { req: { method, query, headers } as any, res };
  }

  it("rejects unsupported endpoints without calling upstream", async () => {
    const { req, res } = mockReqRes({ path: "ergast/f1/2023/results.json" });
    await jolpicaHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("rejects unlisted origins (no wildcard)", async () => {
    const { req, res } = mockReqRes(
      { path: "ergast/f1/2026/results.json" },
      "GET",
      {
        origin: "https://evil.example",
        host: "podium-preview.workers.dev",
      },
    );
    await jolpicaHandler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("rejects non-GET methods", async () => {
    const { req, res } = mockReqRes(
      { path: "ergast/f1/2026/results.json" },
      "POST",
    );
    await jolpicaHandler(req, res);
    expect(res.statusCode).toBe(405);
  });
});

describe("critical fixes: openf1 proxy allowlist (no network)", () => {
  function mockReqRes(query: unknown, method = "GET", headers: unknown = {}) {
    const sent: Record<string, string> = {};
    const res: any = {
      statusCode: 200,
      body: undefined as unknown,
      setHeader: (k: string, v: string) => {
        sent[k] = v;
      },
      status: (c: number) => {
        res.statusCode = c;
        return res;
      },
      json: (b: unknown) => {
        res.body = b;
        return res;
      },
      end: () => res,
    };
    return { req: { method, query, headers } as any, res };
  }

  it("rejects unsupported endpoints without calling upstream", async () => {
    const { req, res } = mockReqRes({ endpoint: "telemetry" });
    await openF1Handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("rejects unlisted preview origins (no *.workers.dev wildcard)", async () => {
    const { req, res } = mockReqRes({ endpoint: "sessions" }, "GET", {
      origin: "https://attacker.workers.dev",
      host: "podium-preview.workers.dev",
    });
    await openF1Handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("lets same-origin requests through CORS to the allowlist check", async () => {
    const { req, res } = mockReqRes({ endpoint: "nope" }, "GET", {
      origin: "https://podium-preview.workers.dev",
      host: "podium-preview.workers.dev",
    });
    await openF1Handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("rejects non-GET methods", async () => {
    const { req, res } = mockReqRes({ endpoint: "sessions" }, "POST");
    await openF1Handler(req, res);
    expect(res.statusCode).toBe(405);
  });
});

function jsonResponse(
  payload: unknown,
  status = 200,
  retryAfter: string | null = null,
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => (name === "Retry-After" ? retryAfter : null),
    },
    json: async () => payload,
  };
}

function jolpicaPage(races: unknown[], total: number) {
  return jsonResponse({
    MRData: { RaceTable: { Races: races }, total: String(total) },
  });
}

describe("critical fixes: honest sync (no partial success)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports failure and keeps the old snapshot when a later page fails", async () => {
    const race = {
      round: "1",
      raceName: "Test GP",
      date: "2026-03-08",
      Circuit: {
        circuitName: "Test",
        Location: { locality: "X", country: "Y" },
      },
      Results: [],
    };
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(url);
        if (url.includes("/results.json")) {
          if (url.includes("offset=0")) return jolpicaPage([race], 200);
          return jsonResponse({}, 429, "0");
        }
        return jsonResponse({}, 429, "0");
      }),
    );
    const existing = DETAILED_RACE_RESULTS_2026;
    const res = await syncF1SeasonData(2026, existing);
    expect(res.success).toBe(false);
    expect(res.results).toBe(existing);
  }, 15000);

  it("retries a transient 429 once and then succeeds", async () => {
    const fresh = {
      round: "15",
      raceName: "Fresh Synced GP",
      date: "2026-09-01",
      Circuit: {
        circuitName: "Fresh",
        Location: { locality: "X", country: "Y" },
      },
      Results: [],
    };
    let attempts = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/sprint.json")) return jolpicaPage([], 0);
        attempts += 1;
        if (attempts === 1) return jsonResponse({}, 429, "0");
        return jolpicaPage([fresh], 1);
      }),
    );
    const res = await syncF1SeasonData(2026, DETAILED_RACE_RESULTS_2026);
    expect(res.success).toBe(true);
    expect(res.results.find((r) => r.round === 15)?.grandPrix).toBe(
      "Fresh Synced GP",
    );
  }, 15000);

  it("keeps freshly synced rounds instead of overwriting with baseline", async () => {
    const fresh = {
      round: "15",
      raceName: "Fresh Synced GP",
      date: "2026-09-01",
      Circuit: {
        circuitName: "Fresh",
        Location: { locality: "X", country: "Y" },
      },
      Results: [],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/sprint.json")) return jolpicaPage([], 0);
        return jolpicaPage([fresh], 1);
      }),
    );
    const res = await syncF1SeasonData(2026, DETAILED_RACE_RESULTS_2026);
    expect(res.success).toBe(true);
    expect(res.results.find((r) => r.round === 15)?.grandPrix).toBe(
      "Fresh Synced GP",
    );
  }, 15000);

  it("never reports empty upstream payloads as success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jolpicaPage([], 0)),
    );
    const existing = DETAILED_RACE_RESULTS_2026;
    const res = await syncF1SeasonData(2026, existing);
    expect(res.success).toBe(false);
    expect(res.results).toBe(existing);
  }, 15000);

  it("reports over-cap totals as partial instead of truncated success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jolpicaPage([], 10000)),
    );
    const res = await syncF1SeasonData(2026, DETAILED_RACE_RESULTS_2026);
    expect(res.success).toBe(false);
    expect(res.partial).toBe(true);
  }, 15000);

  it("bounds attempts on persistent failure and honors huge Retry-After fast", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(url);
        return jsonResponse({}, 500, "120");
      }),
    );
    const res = await syncF1SeasonData(2026, DETAILED_RACE_RESULTS_2026);
    expect(res.success).toBe(false);
    // 1 attempt: huge Retry-After exceeds the 30s budget at once (no 120s sleep).
    expect(calls.length).toBe(1);
  }, 15000);
});

describe("critical fixes: sprint counted once with both sources present", () => {
  it("prefers explicit sprintEntries over legacy sprintPoints (10 + 8 = 18)", () => {
    const race = sprintRace();
    race.sprintEntries = [
      {
        position: 1,
        driverId: "russell",
        driverName: "George Russell",
        driverCode: "RUS",
        teamId: "mercedes",
        teamName: "Mercedes",
        laps: 19,
        status: "Finished",
        timeOrGap: "30:00.000",
        points: 8,
      },
    ];
    const res = recalculateStandingsFromRaces(
      2026,
      [race],
      DRIVER_STANDINGS_2026,
      CONSTRUCTOR_STANDINGS_2026,
    );
    expect(res.drivers.find((d) => d.driverId === "russell")?.points).toBe(
      russellBase + 18,
    );
    expect(res.constructors.find((c) => c.teamId === "mercedes")?.points).toBe(
      mercedesBase + 18,
    );
  });
});

describe("critical fixes: openf1 client uses proxy only with coded errors", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("never calls the direct upstream URL and reports rate limits", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(url);
        return { ok: false, status: 429, json: async () => ({}) };
      }),
    );
    const positions = await openF1Service.getPositions(987001);
    expect(positions).toEqual([]);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.startsWith("/api/openf1/")).toBe(true);
    expect(openF1Service.lastErrorCode).toBe("upstream-rate-limited");
  });

  it("resets the error code after recovery", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          { driver_number: 1, position: 1, date: "2024-01-01" },
        ],
      })),
    );
    const positions = await openF1Service.getPositions(987002);
    expect(positions).toHaveLength(1);
    expect(openF1Service.lastErrorCode).toBe("ok");
  });

  it("reports client timeouts with a distinct code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: { signal?: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("signal timed out", "TimeoutError"));
            });
          }),
      ),
    );
    const pending = openF1Service.getPositions(987003);
    expect(await pending).toEqual([]);
    expect(openF1Service.lastErrorCode).toBe("timeout");
  }, 15000);

  it("refetches after the 2s client TTL expires", async () => {
    vi.useFakeTimers();
    try {
      let calls = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          calls += 1;
          return {
            ok: true,
            status: 200,
            json: async () => [
              { driver_number: 1, position: calls, date: "2024-01-01" },
            ],
          };
        }),
      );
      await openF1Service.getPositions(987004);
      await openF1Service.getPositions(987004);
      expect(calls).toBe(1);
      await vi.advanceTimersByTimeAsync(2500);
      await openF1Service.getPositions(987004);
      expect(calls).toBe(2);
      expect(openF1Service.lastErrorCode).toBe("ok");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("critical fixes: openf1 proxy cache, stale bound and single-flight", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function reqRes(query: unknown, headers: unknown = {}) {
    const res: any = {
      statusCode: 200,
      body: undefined as unknown,
      setHeader: () => undefined,
      status: (c: number) => {
        res.statusCode = c;
        return res;
      },
      json: (b: unknown) => {
        res.body = b;
        return res;
      },
      end: () => res,
    };
    return { req: { method: "GET", query, headers } as any, res };
  }

  it("serves HIT from cache and isolates sessions by query key", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        return { ok: true, status: 200, json: async () => [{ n: 1 }] };
      }),
    );
    const a = reqRes({ endpoint: "position", session_key: "993001" });
    await openF1Handler(a.req, a.res);
    expect(a.res.statusCode).toBe(200);
    const b = reqRes({ endpoint: "position", session_key: "993001" });
    await openF1Handler(b.req, b.res);
    expect(b.res.statusCode).toBe(200);
    expect(calls).toBe(1);
    // Different session key -> different cache key -> new upstream call.
    const c = reqRes({ endpoint: "position", session_key: "993002" });
    await openF1Handler(c.req, c.res);
    expect(calls).toBe(2);
  });

  it("serves bounded STALE then fails loudly when stale is too old", async () => {
    vi.useFakeTimers();
    let fail = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        if (fail) return { ok: false, status: 500, json: async () => ({}) };
        return { ok: true, status: 200, json: async () => [{ n: 1 }] };
      }),
    );
    const key = { endpoint: "position", session_key: "993003" };
    const a = reqRes(key);
    await openF1Handler(a.req, a.res);
    expect(a.res.statusCode).toBe(200);
    // Past TTL (12s) but within stale window (5min): STALE.
    vi.advanceTimersByTime(60_000);
    fail = true;
    const b = reqRes(key);
    await openF1Handler(b.req, b.res);
    expect(b.res.statusCode).toBe(200);
    expect(b.res.body).toEqual([{ n: 1 }]);
    // Past stale window: loud 503, no fossil data.
    vi.advanceTimersByTime(10 * 60_000);
    const c = reqRes(key);
    await openF1Handler(c.req, c.res);
    expect(c.res.statusCode).toBe(503);
  });

  it("aborts stale upstream attempts (timeout) instead of hanging", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: { signal?: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              const err = new DOMException("signal timed out", "TimeoutError");
              reject(err);
            });
          }),
      ),
    );
    const key = { endpoint: "position", session_key: "993010" };
    const a = reqRes(key);
    await openF1Handler(a.req, a.res);
    expect(a.res.statusCode).toBe(503);
  }, 15000);

  it("dedups concurrent requests and clears the slot after errors", async () => {
    let calls = 0;
    let release!: (v: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) {
          await new Promise((r) => {
            release = r as (v: unknown) => void;
          });
          return { ok: true, status: 200, json: async () => [{ n: 1 }] };
        }
        return { ok: true, status: 200, json: async () => [{ n: 2 }] };
      }),
    );
    const key = { endpoint: "position", session_key: "993004" };
    const a = reqRes(key);
    const b = reqRes(key);
    const pa = openF1Handler(a.req, a.res);
    const pb = openF1Handler(b.req, b.res);
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
    expect(calls).toBe(1);
    release({ ok: true, status: 200, json: async () => [{ n: 1 }] });
    await Promise.all([pa, pb]);
    expect(a.res.statusCode).toBe(200);
    expect(b.res.statusCode).toBe(200);

    // Error path: both concurrent callers get 503, slot is released.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        throw new Error("down");
      }),
    );
    const key2 = { endpoint: "position", session_key: "993005" };
    const c = reqRes(key2);
    const d = reqRes(key2);
    await Promise.all([
      openF1Handler(c.req, c.res),
      openF1Handler(d.req, d.res),
    ]);
    expect(c.res.statusCode).toBe(503);
    expect(d.res.statusCode).toBe(503);
    // Next request starts a fresh attempt (proves cleanup).
    const before = calls;
    const e = reqRes(key2);
    await openF1Handler(e.req, e.res);
    expect(calls).toBe(before + 1);
  });
});
