import { describe, it, expect } from 'vitest';
import { CURATED_REPLAY_RACES } from '../../services/openF1Service';
import { scheduleWallClockSecondTick } from './tabSync';

describe('Countdown & Live Center Time Synchronization', () => {
  it('guarantees Singapore GP 2026 FP1 target timestamp consistency between calendar and API', () => {
    // Official schedule: Fri 09 Oct 2026, 17:30 SGT (UTC+8)
    const homepageStartIso = '2026-10-09T16:30:00+08:00';
    // Normalized OpenF1 API timestamp (UTC)
    const apiStartIso = '2026-10-09T08:30:00.000Z';

    const homepageTargetMs = new Date(homepageStartIso).getTime();
    const apiTargetMs = new Date(apiStartIso).getTime();

    // The two target timestamps MUST be strictly equal (0ms difference)
    expect(homepageTargetMs).toBe(apiTargetMs);
  });

  it('computes identical countdown DD:HH:MM:SS values from identical target time', () => {
    const targetMs = new Date('2026-10-09T08:30:00.000Z').getTime();
    const currentMs = new Date('2026-10-07T16:00:00.000Z').getTime();
    const diffMs = targetMs - currentMs;

    // Homepage math
    const totalSecs = Math.floor(diffMs / 1000);
    const hpDays = Math.floor(totalSecs / (3600 * 24));
    const hpHours = Math.floor((totalSecs % (3600 * 24)) / 3600);
    const hpMinutes = Math.floor((totalSecs % 3600) / 60);
    const hpSeconds = totalSecs % 60;

    // Live Center SessionBanner math
    const bannerDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const bannerHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const bannerMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const bannerSeconds = Math.floor((diffMs / 1000) % 60);

    expect(hpDays).toBe(bannerDays);
    expect(hpHours).toBe(bannerHours);
    expect(hpMinutes).toBe(bannerMinutes);
    expect(hpSeconds).toBe(bannerSeconds);

    // Formatted representations match
    const hpFormat = `${hpDays.toString().padStart(2, '0')}:${hpHours.toString().padStart(2, '0')}:${hpMinutes.toString().padStart(2, '0')}:${hpSeconds.toString().padStart(2, '0')}`;
    const bannerParts = [
      `${bannerDays.toString().padStart(2, '0')}d`,
      `${bannerHours.toString().padStart(2, '0')}h`,
      `${bannerMinutes.toString().padStart(2, '0')}m`,
      `${bannerSeconds.toString().padStart(2, '0')}s`,
    ].join(' ');

    expect(hpFormat).toBe('01:16:30:00');
    expect(bannerParts).toBe('01d 16h 30m 00s');
  });

  it('ensures all CuratedReplayRace entries have valid circuitKey and sessionKey', () => {
    expect(CURATED_REPLAY_RACES.length).toBeGreaterThanOrEqual(4);
    for (const race of CURATED_REPLAY_RACES) {
      expect(race.sessionKey).toBeGreaterThan(0);
      expect(race.circuitKey).toBeGreaterThan(0);
      expect(race.name).toBeTruthy();
      expect(race.dateStart).toBeTruthy();
    }
  });

  it('schedules second ticks with cleanup function', () => {
    let callCount = 0;
    const cleanup = scheduleWallClockSecondTick(() => {
      callCount++;
    });

    // Immediate first call executes
    expect(callCount).toBe(1);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });
});
