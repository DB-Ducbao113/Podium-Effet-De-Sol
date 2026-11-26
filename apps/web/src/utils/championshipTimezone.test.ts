import { afterEach, describe, expect, it, vi } from "vitest";
import { CALENDAR_2026 } from "../data/championship/calendar";
import {
  clearLegacyTimezonePreference,
  computeClockOffsetMs,
  effectiveTimeZone,
  formatRaceSessionTime,
  formatZonedDate,
  TIMEZONE_STORAGE_KEY,
  validIanaTimeZone,
  zoneOffsetLabel,
} from "./championshipTimezone";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("championship timezone presentation (universal automatic UTC)", () => {
  it("validates strict IANA identifiers and rejects legacy manual keys or malicious strings", () => {
    expect(validIanaTimeZone("Europe/London")).toBe(true);
    expect(validIanaTimeZone("Asia/Kolkata")).toBe(true);
    expect(validIanaTimeZone("America/Los_Angeles")).toBe(true);
    expect(validIanaTimeZone("UTC")).toBe(true);
    expect(validIanaTimeZone("Mars/Olympus")).toBe(false);
    expect(validIanaTimeZone("local")).toBe(false);
    expect(validIanaTimeZone("venue")).toBe(false);
    expect(validIanaTimeZone("vietnam")).toBe(false);
    expect(validIanaTimeZone("<script>alert(1)</script>")).toBe(false);
    expect(validIanaTimeZone("")).toBe(false);
    expect(validIanaTimeZone("A".repeat(80))).toBe(false);
    expect(effectiveTimeZone("Mars/Olympus")).toBeTruthy();
    expect(validIanaTimeZone(effectiveTimeZone("Mars/Olympus"))).toBe(true);
  });

  it("formats accurate UTC offsets across negative, zero, fractional, positive, and DST timezones", () => {
    const winter = new Date("2026-01-15T12:00:00Z");
    const summer = new Date("2026-07-15T12:00:00Z");

    expect(zoneOffsetLabel(winter, "America/Los_Angeles")).toBe("UTC-08:00");
    expect(zoneOffsetLabel(summer, "America/Los_Angeles")).toBe("UTC-07:00");
    expect(zoneOffsetLabel(winter, "UTC")).toBe("UTC+00:00");
    expect(zoneOffsetLabel(winter, "Asia/Kolkata")).toBe("UTC+05:30");
    expect(zoneOffsetLabel(winter, "Asia/Ho_Chi_Minh")).toBe("UTC+07:00");
    expect(zoneOffsetLabel(winter, "Asia/Tokyo")).toBe("UTC+09:00");
    expect(zoneOffsetLabel(winter, "Europe/London")).toBe("UTC+00:00");
    expect(zoneOffsetLabel(summer, "Europe/London")).toBe("UTC+01:00");
    expect(
      zoneOffsetLabel(new Date("2026-03-08T06:30:00Z"), "America/New_York"),
    ).toBe("UTC-05:00");
    expect(
      zoneOffsetLabel(new Date("2026-03-08T07:30:00Z"), "America/New_York"),
    ).toBe("UTC-04:00");
  });

  it("preserves absolute instants across midnight and converts sessions into any global IANA timezone", () => {
    const instant = new Date("2026-03-08T23:30:00Z");
    expect(formatZonedDate(instant, "UTC", "en")).toContain("08 Mar 2026");
    expect(formatZonedDate(instant, "Asia/Ho_Chi_Minh", "en")).toContain(
      "09 Mar 2026",
    );
    expect(formatZonedDate(instant, "Asia/Kolkata", "en")).toContain("05:00");

    const melbourne = CALENDAR_2026[0];
    expect(formatRaceSessionTime(melbourne, "race", "UTC", "en")).toContain(
      "UTC+00:00",
    );
    expect(
      formatRaceSessionTime(melbourne, "race", "Asia/Kolkata", "en"),
    ).toContain("UTC+05:30");
    expect(
      formatRaceSessionTime(melbourne, "race", "America/Los_Angeles", "vi"),
    ).toMatch(/UTC-0[78]:00/);
  });

  it("computes NTP-midpoint clock offset accurately for skewed clocks and guards invalid inputs", () => {
    const trueServerMs = Date.parse("2026-11-25T10:00:00.000Z");
    // Client clock 1 hour (+3600s) ahead, 100ms RTT
    const aheadStart = trueServerMs + 3_600_000 - 50;
    const aheadEnd = trueServerMs + 3_600_000 + 50;
    expect(computeClockOffsetMs(trueServerMs, aheadStart, aheadEnd)).toBe(
      -3_600_000,
    );

    // Client clock 1 hour (-3600s) behind, 80ms RTT
    const behindStart = trueServerMs - 3_600_000 - 40;
    const behindEnd = trueServerMs - 3_600_000 + 40;
    expect(computeClockOffsetMs(trueServerMs, behindStart, behindEnd)).toBe(
      3_600_000,
    );

    // Invalid inputs safely return 0
    expect(computeClockOffsetMs(Number.NaN, 1000, 1100)).toBe(0);
    expect(computeClockOffsetMs(-1, 1000, 1100)).toBe(0);
    expect(computeClockOffsetMs(trueServerMs, Number.NaN, 1100)).toBe(0);
  });

  it("removes legacy manual peds-timezone localStorage key safely even when storage throws", () => {
    const removeItem = vi.fn();
    vi.stubGlobal("localStorage", { removeItem });
    clearLegacyTimezonePreference();
    expect(removeItem).toHaveBeenCalledExactlyOnceWith(TIMEZONE_STORAGE_KEY);

    vi.stubGlobal("localStorage", {
      removeItem: () => {
        throw new Error("SecurityError");
      },
    });
    expect(() => clearLegacyTimezonePreference()).not.toThrow();
  });
});
