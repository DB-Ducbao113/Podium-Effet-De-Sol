import { describe, expect, it } from 'vitest';
import { CALENDAR_2026 } from '../data/championship/calendar';
import { effectiveTimeZone, formatRaceSessionTime, formatZonedDate, validTimeZone, venueOffsetLabel, zoneOffsetLabel } from './championshipTimezone';

describe('championship timezone presentation', () => {
  it('validates preferences and falls back on an unsupported zone', () => {
    expect(validTimeZone('Europe/London')).toBe(true);
    expect(validTimeZone('Mars/Olympus')).toBe(false);
    expect(effectiveTimeZone('Mars/Olympus')).toBe('UTC');
  });
  it('uses the offset at the event timestamp through DST changes', () => {
    expect(zoneOffsetLabel(new Date('2026-01-15T12:00:00Z'), 'Europe/London')).toBe('UTC+00:00');
    expect(zoneOffsetLabel(new Date('2026-07-15T12:00:00Z'), 'Europe/London')).toBe('UTC+01:00');
    expect(zoneOffsetLabel(new Date('2026-03-08T06:30:00Z'), 'America/New_York')).toBe('UTC-05:00');
    expect(zoneOffsetLabel(new Date('2026-03-08T07:30:00Z'), 'America/New_York')).toBe('UTC-04:00');
  });
  it('preserves absolute instants across midnight and weekend dates', () => {
    const instant = new Date('2026-03-08T23:30:00Z');
    expect(formatZonedDate(instant, 'UTC', 'en')).toContain('08 Mar 2026');
    expect(formatZonedDate(instant, 'Asia/Bangkok', 'en')).toContain('09 Mar 2026');
    expect(formatRaceSessionTime(CALENDAR_2026[0], 'race', 'UTC', 'en')).toContain('UTC+00:00');
  });
  it('shows each race at its recorded venue time without asking for a zone', () => {
    const melbourne = CALENDAR_2026[0];
    expect(validTimeZone('venue')).toBe(true);
    expect(venueOffsetLabel(melbourne.venueUtcOffset!)).toBe('UTC+11:00');
    const display = formatRaceSessionTime(melbourne, 'race', 'venue', 'en');
    expect(display).toContain(melbourne.sessions.race.timeStr);
    expect(display).toContain('UTC+11:00');
    expect(venueOffsetLabel(-5.5)).toBe('UTC-05:30');
  });
});
