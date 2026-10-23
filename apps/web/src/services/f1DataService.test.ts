import { describe, expect, it } from 'vitest';
import { DRIVER_STANDINGS_2026, CONSTRUCTOR_STANDINGS_2026 } from '../data/championship/standings';
import { DetailedRaceResult } from '../types';
import { normalizeDriverId } from './f1DataService';
import { recalculateStandingsFromRaces } from './standingsEngine';

describe('Jolpica driver ID normalization', () => {
  it.each([
    ['kimi_antonelli', 'antonelli'],
    ['isack_hadjar', 'hadjar'],
    ['max_verstappen', 'verstappen'],
    ['arvid_lindblad', 'lindblad'],
  ])('normalizes %s to the championship ID %s', (providerId, expectedId) => {
    expect(normalizeDriverId(providerId)).toBe(expectedId);
  });

  it('credits new race points to the existing driver and constructor standings', () => {
    const race: DetailedRaceResult = {
      id: 'race-2026-r18-next-grand-prix',
      season: 2026,
      round: 18,
      grandPrix: 'Next Grand Prix',
      officialName: 'Next Grand Prix 2026',
      circuit: 'Next Circuit',
      date: '18 Oct 2026',
      status: 'completed',
      lapsTotal: 62,
      entries: [
        {
          position: 1,
          driverId: normalizeDriverId('kimi_antonelli'),
          driverName: 'Andrea Kimi Antonelli',
          driverCode: 'ANT',
          teamId: 'mercedes',
          teamName: 'Mercedes',
          laps: 62,
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

    expect(standings.drivers.find((driver) => driver.driverId === 'antonelli')?.points).toBe(365);
    expect(standings.drivers.filter((driver) => driver.driverId === 'kimi_antonelli')).toHaveLength(
      0,
    );
    expect(standings.constructors.find((team) => team.teamId === 'mercedes')?.points).toBe(603);
  });

  it('credits sprint-only results without counting them as Grand Prix wins or podiums', () => {
    const sprintWeekend: DetailedRaceResult = {
      id: 'race-2026-r19-austin',
      season: 2026,
      round: 19,
      grandPrix: 'United States Grand Prix',
      officialName: 'United States Grand Prix 2026',
      circuit: 'Circuit of The Americas',
      date: '10 Oct 2026',
      status: 'scheduled',
      lapsTotal: 56,
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

    expect(antonelli?.points).toBe(348);
    expect(antonelli?.wins).toBe(8);
    expect(antonelli?.podiums).toBe(14);
    expect(russell?.points).toBe(245);
    expect(mercedes?.points).toBe(593);
    expect(mercedes?.wins).toBe(11);
    expect(mercedes?.podiums).toBe(22);
  });
});
