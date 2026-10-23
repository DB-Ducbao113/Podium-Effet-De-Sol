import { describe, expect, it } from 'vitest';
import { CALENDAR_2026 } from '../data/championship';
import { getCalendarRaceState, getSessionTimeRange } from './raceSchedule';

describe('race weekend schedule state', () => {
  const singapore = CALENDAR_2026.find((race) => race.round === 17)!;
  const unitedStates = CALENDAR_2026.find((race) => race.round === 18)!;

  it('uses each round schedule and venue offset to create session times', () => {
    const singaporeRace = getSessionTimeRange(singapore, 'race');
    const unitedStatesRace = getSessionTimeRange(unitedStates, 'race');

    expect(singaporeRace?.start.toISOString()).toBe('2026-10-11T12:00:00.000Z');
    expect(unitedStatesRace?.start.toISOString()).toBe('2026-10-25T19:00:00.000Z');
  });

  it('marks the race weekend active and the race in progress only during its scheduled window', () => {
    const raceRange = getSessionTimeRange(unitedStates, 'race')!;

    expect(getCalendarRaceState(unitedStates, raceRange.start.getTime() - 1)).toBe('current');
    expect(getCalendarRaceState(unitedStates, raceRange.start.getTime())).toBe('current');
    expect(getCalendarRaceState(unitedStates, raceRange.end.getTime() - 1)).toBe('current');
    expect(getCalendarRaceState(unitedStates, raceRange.end.getTime())).toBe('completed');
  });

  it('advances to the next scheduled round after a race ends', () => {
    const mexico = CALENDAR_2026.find((race) => race.round === 19)!;
    const unitedStatesRace = getSessionTimeRange(unitedStates, 'race')!;

    expect(getCalendarRaceState(unitedStates, unitedStatesRace.end.getTime())).toBe('completed');
    expect(getCalendarRaceState(mexico, unitedStatesRace.end.getTime())).toBe('upcoming');
  });
});
