import { describe, it, expect } from 'vitest';
import { CALENDAR_2026, CALENDAR_2024, CALENDAR_2025, getCalendarBySeason } from './calendar';

describe('Race Calendar Multi-Season Support', () => {
  it('returns appropriate calendars per season via getCalendarBySeason', () => {
    const cal2024 = getCalendarBySeason(2024);
    expect(cal2024.length).toBe(24);
    expect(cal2024[0].name).toBe('Bahrain Grand Prix');
    expect(cal2024[0].season).toBe(2024);
    expect(cal2024.every((gp) => gp.status === 'completed')).toBe(true);

    const cal2025 = getCalendarBySeason(2025);
    expect(cal2025.length).toBe(24);
    expect(cal2025[0].name).toBe('Australian Grand Prix');
    expect(cal2025[0].season).toBe(2025);
    expect(cal2025.every((gp) => gp.status === 'completed')).toBe(true);

    const cal2026 = getCalendarBySeason(2026);
    expect(cal2026.length).toBe(23);
    expect(cal2026[0].name).toBe('Australian Grand Prix');
    expect(cal2026[0].season).toBe(2026);
  });

  it('verifies 2024 season has 6 sprint rounds with valid sessions', () => {
    const sprints2024 = CALENDAR_2024.filter((gp) => gp.hasSprint);
    expect(sprints2024.length).toBe(6);
    sprints2024.forEach((gp) => {
      expect(gp.sessions.fp1).toBeDefined();
      expect(gp.sessions.sprintQualifying).toBeDefined();
      expect(gp.sessions.sprint).toBeDefined();
      expect(gp.sessions.qualifying).toBeDefined();
      expect(gp.sessions.race).toBeDefined();
    });
  });

  it('verifies 2025 season has 6 sprint rounds with valid sessions', () => {
    const sprints2025 = CALENDAR_2025.filter((gp) => gp.hasSprint);
    expect(sprints2025.length).toBe(6);
    sprints2025.forEach((gp) => {
      expect(gp.sessions.fp1).toBeDefined();
      expect(gp.sessions.sprintQualifying).toBeDefined();
      expect(gp.sessions.sprint).toBeDefined();
      expect(gp.sessions.qualifying).toBeDefined();
      expect(gp.sessions.race).toBeDefined();
    });
  });
});

describe('2026 Race Calendar Weekend Sessions Completeness', () => {
  it('ensures every non-sprint round has full 5 sessions (FP1, FP2, FP3, Qualifying, Race)', () => {
    const nonSprintRounds = CALENDAR_2026.filter((gp) => !gp.hasSprint);
    expect(nonSprintRounds.length).toBeGreaterThan(0);

    nonSprintRounds.forEach((gp) => {
      expect(gp.sessions.fp1).toBeDefined();
      expect(gp.sessions.fp2).toBeDefined();
      expect(gp.sessions.fp3).toBeDefined();
      expect(gp.sessions.qualifying).toBeDefined();
      expect(gp.sessions.race).toBeDefined();

      expect(gp.sessions.fp1.name).toBe('Practice 1');
      expect(gp.sessions.fp2?.name).toBe('Practice 2');
      expect(gp.sessions.fp3?.name).toBe('Practice 3');
      expect(gp.sessions.qualifying.name).toBe('Qualifying');
      expect(gp.sessions.race.name).toMatch(/Race/);
    });
  });

  it('ensures every sprint round has full 5 sessions (FP1, Sprint Quali, Sprint, Qualifying, Race)', () => {
    const sprintRounds = CALENDAR_2026.filter((gp) => gp.hasSprint);
    expect(sprintRounds.length).toBe(6);

    sprintRounds.forEach((gp) => {
      expect(gp.sessions.fp1).toBeDefined();
      expect(gp.sessions.sprintQualifying).toBeDefined();
      expect(gp.sessions.sprint).toBeDefined();
      expect(gp.sessions.qualifying).toBeDefined();
      expect(gp.sessions.race).toBeDefined();
    });
  });

  it('keeps Singapore round 17 as a complete sprint weekend', () => {
    const singapore = CALENDAR_2026.find((gp) => gp.round === 17)!;
    expect(singapore.hasSprint).toBe(true);
    expect(singapore.sessions.fp1.timeStr).toBe('16:30');
    expect(singapore.sessions.sprintQualifying?.timeStr).toBe('20:30');
    expect(singapore.sessions.sprint?.timeStr).toBe('17:00');
    expect(singapore.sessions.qualifying.timeStr).toBe('21:00');
    expect(singapore.sessions.race.timeStr).toBe('20:00');
  });

  it('verifies round 1 (Albert Park) has all 3 practice sessions properly configured', () => {
    const r1 = CALENDAR_2026.find((gp) => gp.round === 1)!;
    expect(r1).toBeDefined();
    expect(r1.sessions.fp1.dateStr).toBe('Fri 06 Mar');
    expect(r1.sessions.fp2?.dateStr).toBe('Fri 06 Mar');
    expect(r1.sessions.fp3?.dateStr).toBe('Sat 07 Mar');
    expect(r1.sessions.fp1.status).toBe('finished');
    expect(r1.sessions.fp2?.status).toBe('finished');
    expect(r1.sessions.fp3?.status).toBe('finished');
  });
});
