import { afterEach, describe, expect, it, vi } from 'vitest';
import { DRIVER_STANDINGS_2026, CONSTRUCTOR_STANDINGS_2026 } from '../data/championship/standings';
import { DetailedRaceResult } from '../types';
import { normalizeDriverId, syncF1SeasonData } from './f1DataService';
import { recalculateStandingsFromRaces } from './standingsEngine';

describe('Jolpica driver ID normalization', () => {
  afterEach(() => vi.restoreAllMocks());

  it('bounds HTTP 503 retries and keeps the saved snapshot without claiming success', async () => {
    const saved: DetailedRaceResult[] = [{
      id: 'saved-round', season: 2026, round: 1, grandPrix: 'Saved race',
      officialName: 'Saved race', circuit: 'Saved circuit', date: '2026-03-01',
      status: 'completed', lapsTotal: 57, entries: [],
    }];
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 503, headers: { 'Retry-After': '0' } }),
    );
    const result = await syncF1SeasonData(2026, saved);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(false);
    expect(result.results).toBe(saved);
    expect(result.source).toBe('Local saved snapshot');
  });
  it.each([
    ['kimi_antonelli', 'antonelli'],
    ['isack_hadjar', 'hadjar'],
    ['max_verstappen', 'verstappen'],
    ['arvid_lindblad', 'lindblad'],
    ['ryo_hirakawa', 'hirakawa'],
  ])('normalizes %s to the championship ID %s', (providerId, expectedId) => {
    expect(normalizeDriverId(providerId)).toBe(expectedId);
  });

  it('credits new race points to the existing driver and constructor standings', () => {
    const antonelliBase = DRIVER_STANDINGS_2026.find((d) => d.driverId === 'antonelli')!.points;
    const mercedesBase = CONSTRUCTOR_STANDINGS_2026.find((t) => t.teamId === 'mercedes')!.points;
    const race: DetailedRaceResult = {
      id: 'race-2026-r22-next-grand-prix',
      season: 2026,
      round: 22,
      grandPrix: 'Next Grand Prix',
      officialName: 'Next Grand Prix 2026',
      circuit: 'Next Circuit',
      date: '29 Nov 2026',
      status: 'completed',
      lapsTotal: 57,
      entries: [
        {
          position: 1,
          driverId: normalizeDriverId('kimi_antonelli'),
          driverName: 'Andrea Kimi Antonelli',
          driverCode: 'ANT',
          teamId: 'mercedes',
          teamName: 'Mercedes',
          laps: 57,
          status: 'Finished',
          timeOrGap: '1:40:00.000',
          points: 25,
        },
      ],
    };

    const standings = recalculateStandingsFromRaces(
      2026,
      [race],
      DRIVER_STANDINGS_2026,
      CONSTRUCTOR_STANDINGS_2026,
    );

    expect(standings.drivers.find((driver) => driver.driverId === 'antonelli')?.points).toBe(
      antonelliBase + 25,
    );
    expect(standings.drivers.filter((driver) => driver.driverId === 'kimi_antonelli')).toHaveLength(
      0,
    );
    expect(standings.constructors.find((team) => team.teamId === 'mercedes')?.points).toBe(
      mercedesBase + 25,
    );
  });

  it('credits sprint-only results without counting them as Grand Prix wins or podiums', () => {
    const antonelliBase = DRIVER_STANDINGS_2026.find((d) => d.driverId === 'antonelli')!;
    const russellBase = DRIVER_STANDINGS_2026.find((d) => d.driverId === 'russell')!;
    const mercedesBase = CONSTRUCTOR_STANDINGS_2026.find((t) => t.teamId === 'mercedes')!;
    const sprintWeekend: DetailedRaceResult = {
      id: 'race-2026-r23-abu-dhabi',
      season: 2026,
      round: 23,
      grandPrix: 'Abu Dhabi Grand Prix',
      officialName: 'Abu Dhabi Grand Prix 2026',
      circuit: 'Yas Marina Circuit',
      date: '06 Dec 2026',
      status: 'scheduled',
      lapsTotal: 58,
      entries: [],
      sprintEntries: [
        {
          position: 1,
          driverId: 'antonelli',
          driverName: 'Andrea Kimi Antonelli',
          driverCode: 'ANT',
          teamId: 'mercedes',
          teamName: 'Mercedes',
          laps: 19,
          status: 'Finished',
          timeOrGap: '30:00.000',
          points: 8,
        },
        {
          position: 2,
          driverId: 'russell',
          driverName: 'George Russell',
          driverCode: 'RUS',
          teamId: 'mercedes',
          teamName: 'Mercedes',
          laps: 19,
          status: 'Finished',
          timeOrGap: '+1.000s',
          points: 7,
        },
      ],
    };

    const standings = recalculateStandingsFromRaces(
      2026,
      [sprintWeekend],
      DRIVER_STANDINGS_2026,
      CONSTRUCTOR_STANDINGS_2026,
    );

    const antonelli = standings.drivers.find((driver) => driver.driverId === 'antonelli');
    const russell = standings.drivers.find((driver) => driver.driverId === 'russell');
    const mercedes = standings.constructors.find((team) => team.teamId === 'mercedes');

    expect(antonelli?.points).toBe(antonelliBase.points + 8);
    expect(antonelli?.wins).toBe(antonelliBase.wins);
    expect(antonelli?.podiums).toBe(antonelliBase.podiums);
    expect(russell?.points).toBe(russellBase.points + 7);
    expect(mercedes?.points).toBe(mercedesBase.points + 15);
    expect(mercedes?.wins).toBe(mercedesBase.wins);
    expect(mercedes?.podiums).toBe(mercedesBase.podiums);
  });
});
