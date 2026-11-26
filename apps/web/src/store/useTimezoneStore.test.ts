import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.resetModules();
});

describe("useTimezoneStore (100% automatic IP-first detection & server clock sync)", () => {
  it("initializes immediately from browser IANA timezone, clears legacy localStorage override, and exposes no manual setPreference", async () => {
    const removeItem = vi.fn();
    vi.stubGlobal("localStorage", {
      getItem: () => "Europe/London",
      removeItem,
    });

    const { useTimezoneStore } = await import("./useTimezoneStore");
    const state = useTimezoneStore.getState();

    expect(removeItem).toHaveBeenCalledWith("peds-timezone");
    expect(state.status).toBe("device-initialized");
    expect(state.clockOffsetMs).toBe(0);
    expect(state.timeZone).toBeTruthy();
    expect("setPreference" in state).toBe(false);
  });

  it("upgrades cleanly to IP-detected timezone and computes clockOffsetMs correcting ±3600s client clock skew", async () => {
    vi.useFakeTimers();
    const trueUtc = Date.parse("2026-11-25T10:00:00.000Z");
    // Simulate client system clock skewed +3600s ahead
    vi.setSystemTime(trueUtc + 3_600_000);

    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            timeZone: "Asia/Tokyo",
            source: "ip",
            serverTimeUtc: new Date(trueUtc).toISOString(),
            serverEpochMs: trueUtc,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );

    const { useTimezoneStore, getSyncedNow } =
      await import("./useTimezoneStore");
    await useTimezoneStore.getState().bootstrapAutoTimezone(fetchMock);

    const state = useTimezoneStore.getState();
    expect(state.timeZone).toBe("Asia/Tokyo");
    expect(state.source).toBe("ip");
    expect(state.status).toBe("ip-synced");
    expect(Math.abs(state.clockOffsetMs - -3_600_000)).toBeLessThanOrEqual(
      1000,
    );
    expect(Math.abs(getSyncedNow() - trueUtc)).toBeLessThanOrEqual(1000);

    // Single-flight: subsequent bootstrap calls must NOT re-fetch
    await useTimezoneStore.getState().bootstrapAutoTimezone(fetchMock);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retains device timezone while still syncing server UTC clock when API returns timeZone: null (local dev)", async () => {
    vi.useFakeTimers();
    const trueUtc = Date.parse("2026-11-25T10:00:00.000Z");
    vi.setSystemTime(trueUtc - 3_600_000); // 1 hour behind

    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            timeZone: null,
            source: "unavailable",
            serverTimeUtc: new Date(trueUtc).toISOString(),
            serverEpochMs: trueUtc,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );

    const { useTimezoneStore } = await import("./useTimezoneStore");
    const initialZone = useTimezoneStore.getState().timeZone;
    await useTimezoneStore.getState().bootstrapAutoTimezone(fetchMock);

    const state = useTimezoneStore.getState();
    expect(state.timeZone).toBe(initialZone);
    expect(state.status).toBe("fallback-active");
    expect(Math.abs(state.clockOffsetMs - 3_600_000)).toBeLessThanOrEqual(1000);
  });

  it("QA-SEC-05: rejects malicious/invalid API timezone & NaN epoch and falls back safely on network failure", async () => {
    const badFetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            timeZone: "<img src=x onerror=1>",
            source: "ip",
            serverTimeUtc: "not-a-date",
            serverEpochMs: Number.NaN,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );

    const { useTimezoneStore } = await import("./useTimezoneStore");
    const initialZone = useTimezoneStore.getState().timeZone;
    await useTimezoneStore.getState().bootstrapAutoTimezone(badFetch);

    expect(useTimezoneStore.getState().timeZone).toBe(initialZone);
    expect(useTimezoneStore.getState().clockOffsetMs).toBe(0);
    expect(useTimezoneStore.getState().status).toBe("fallback-active");

    vi.resetModules();
    const failingFetch = vi.fn(async () => {
      throw new Error("Network offline");
    });
    const mod2 = await import("./useTimezoneStore");
    const initialZone2 = mod2.useTimezoneStore.getState().timeZone;
    await mod2.useTimezoneStore.getState().bootstrapAutoTimezone(failingFetch);

    expect(mod2.useTimezoneStore.getState().timeZone).toBe(initialZone2);
    expect(mod2.useTimezoneStore.getState().clockOffsetMs).toBe(0);
    expect(mod2.useTimezoneStore.getState().status).toBe("fallback-active");
  });
});
