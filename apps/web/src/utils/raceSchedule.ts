import { GrandPrixRound } from '../types';

export type RaceSessionKey = keyof GrandPrixRound['sessions'];

export interface SessionTimeRange {
  start: Date;
  end: Date;
}

const SESSION_DURATIONS_MINUTES: Record<RaceSessionKey, number> = {
  fp1: 90,
  fp2: 90,
  fp3: 90,
  sprintQualifying: 90,
  sprint: 90,
  qualifying: 120,
  race: 180,
};

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function getSessionStart(gp: GrandPrixRound, key: RaceSessionKey): Date | null {
  const session = gp.sessions[key];
  if (!session || gp.venueUtcOffset === undefined) return null;

  const isoDate = session.dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const textDate = session.dateStr.match(
    /^(?:[A-Za-z]{3}\s+)?(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?$/,
  );
  const dateParts = isoDate
    ? {
        year: Number(isoDate[1]),
        month: Number(isoDate[2]) - 1,
        day: Number(isoDate[3]),
      }
    : textDate
      ? {
          year: Number(textDate[3] || gp.season),
          month: MONTHS[textDate[2]],
          day: Number(textDate[1]),
        }
      : null;
  const time = session.timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!dateParts || dateParts.month === undefined || !time) return null;

  const hour = Number(time[1]);
  const minute = Number(time[2]);
  if (hour > 23 || minute > 59) return null;

  const timestamp =
    Date.UTC(dateParts.year, dateParts.month, dateParts.day, hour, minute) -
    gp.venueUtcOffset * 60 * 60 * 1000;
  const start = new Date(timestamp);
  return Number.isNaN(start.getTime()) ? null : start;
}

export function getSessionTimeRange(
  gp: GrandPrixRound,
  key: RaceSessionKey,
): SessionTimeRange | null {
  const start = getSessionStart(gp, key);
  if (!start) return null;
  const end = new Date(start.getTime() + SESSION_DURATIONS_MINUTES[key] * 60_000);
  return { start, end };
}

export type CalendarRaceState = 'completed' | 'current' | 'upcoming';

export function getCalendarRaceState(gp: GrandPrixRound, now = Date.now()): CalendarRaceState {
  const raceRange = getSessionTimeRange(gp, 'race');
  if (!raceRange) return gp.status;

  if (gp.status === 'completed' || now >= raceRange.end.getTime()) return 'completed';
  if (gp.status === 'current') return 'current';

  const sessionStarts = (Object.keys(gp.sessions) as RaceSessionKey[])
    .map((key) => getSessionStart(gp, key)?.getTime())
    .filter((timestamp): timestamp is number => timestamp !== undefined);
  const weekendStart = sessionStarts.length > 0 ? Math.min(...sessionStarts) : null;

  return weekendStart !== null && now >= weekendStart ? 'current' : 'upcoming';
}
