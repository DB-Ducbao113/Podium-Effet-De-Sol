import { describe, expect, it } from "vitest";
import { CALENDAR_2026 } from "../../data/championship";
import { getSessionTimeRange } from "../../utils/raceSchedule";
import {
  nextRaceRefreshDelay,
  selectNextRaceForCountdown,
} from "./useNextRace";

describe("selectNextRaceForCountdown", () => {
  const firstStart = getSessionTimeRange(
    CALENDAR_2026[0],
    "race",
  )!.start.getTime();

  it("keeps the current weekend until lights out, then moves to the next future race", () => {
    expect(
      selectNextRaceForCountdown(CALENDAR_2026, new Set(), firstStart - 1)
        ?.round,
    ).toBe(1);
    expect(
      selectNextRaceForCountdown(CALENDAR_2026, new Set(), firstStart + 1)
        ?.round,
    ).toBe(2);
  });

  it("skips verified completed rounds and has no countdown after the calendar ends", () => {
    expect(
      selectNextRaceForCountdown(CALENDAR_2026, new Set([1]), firstStart - 1)
        ?.round,
    ).toBe(2);
    expect(
      selectNextRaceForCountdown(
        CALENDAR_2026,
        new Set(),
        Date.parse("2027-01-01T00:00:00Z"),
      ),
    ).toBeUndefined();
  });

  it("refreshes at the race boundary without overflowing long browser timers", () => {
    expect(nextRaceRefreshDelay(firstStart, firstStart - 1)).toBe(1);
    expect(nextRaceRefreshDelay(firstStart, firstStart)).toBe(0);
    expect(nextRaceRefreshDelay(firstStart, firstStart + 1)).toBe(0);
    expect(
      nextRaceRefreshDelay(firstStart, firstStart - 30 * 24 * 60 * 60 * 1000),
    ).toBe(2_147_483_647);
  });
});
