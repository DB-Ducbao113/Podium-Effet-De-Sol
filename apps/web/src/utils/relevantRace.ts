import type { GrandPrixRound } from '../types';
import { getCalendarRaceState } from './raceSchedule';

export function relevantRound(calendar: GrandPrixRound[], now: number): number | null {
  const current = calendar.find((race) => getCalendarRaceState(race, now) === 'current');
  const upcoming = calendar.find((race) => getCalendarRaceState(race, now) === 'upcoming');
  return (current || upcoming || calendar[calendar.length - 1])?.round ?? null;
}
