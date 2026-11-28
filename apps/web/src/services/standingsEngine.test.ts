import { describe, it, expect } from 'vitest';
import { DRIVER_STANDINGS_2026, CONSTRUCTOR_STANDINGS_2026 } from '../data/championship/standings';
import { recalculateStandingsFromRaces } from './standingsEngine';
import { DetailedRaceResult } from '../types';

describe('2026 Standings and Podiums Integrity', () => {
  it('contains exactly the 22 active 2026 race seats', () => {
    expect(DRIVER_STANDINGS_2026).toHaveLength(22);
    expect(DRIVER_STANDINGS_2026.some((driver) => driver.driverId === 'tsunoda')).toBe(false);
    expect(DRIVER_STANDINGS_2026.map((driver) => driver.rank)).toEqual(
      Array.from({ length: 22 }, (_, index) => index + 1),
    );
  });

  it('should have positive podium counts for top drivers in 2026', () => {
    const antonelli = DRIVER_STANDINGS_2026.find((d) => d.driverId === 'antonelli');
    const russell = DRIVER_STANDINGS_2026.find((d) => d.driverId === 'russell');
    const hamilton = DRIVER_STANDINGS_2026.find((d) => d.driverId === 'hamilton');

    expect(antonelli).toBeDefined();
    expect(antonelli!.podiums).toBeGreaterThan(0);
    expect(antonelli!.podiums).toBe(16);

    expect(russell).toBeDefined();
    expect(russell!.podiums).toBeGreaterThan(0);
    expect(russell!.podiums).toBe(8);

    expect(hamilton).toBeDefined();
    expect(hamilton!.podiums).toBeGreaterThan(0);
    expect(hamilton!.podiums).toBe(7);
  });

  it('should have positive podium counts for top constructors in 2026', () => {
    const mercedes = CONSTRUCTOR_STANDINGS_2026.find((c) => c.teamId === 'mercedes');
    const ferrari = CONSTRUCTOR_STANDINGS_2026.find((c) => c.teamId === 'ferrari');
    const mclaren = CONSTRUCTOR_STANDINGS_2026.find((c) => c.teamId === 'mclaren');

    expect(mercedes).toBeDefined();
    expect(mercedes!.podiums).toBeGreaterThan(0);
    expect(mercedes!.podiums).toBe(24);

    expect(ferrari).toBeDefined();
    expect(ferrari!.podiums).toBeGreaterThan(0);
    expect(ferrari!.podiums).toBe(13);

    expect(mclaren).toBeDefined();
    expect(mclaren!.podiums).toBeGreaterThan(0);
    expect(mclaren!.podiums).toBe(10);
  });

  it('only increments podiums for races beyond the baseline cutoff', () => {
    const sampleRound18Race: DetailedRaceResult = {
      id: 'race-2026-r18-united-states',
      season: 2026,
      round: 18,
      grandPrix: 'United States Grand Prix',
      officialName: 'United States Grand Prix 2026',
      circuit: 'Circuit of The Americas',
      date: '25 Oct 2026',
      status: 'completed',
      lapsTotal: 62,
      entries: [
        {
          position: 1,
          driverId: 'russell',
          driverName: 'George Russell',
          driverCode: 'RUS',
          teamId: 'mercedes',
          teamName: 'Mercedes',
          laps: 62,
          status: 'Finished',
          timeOrGap: '1:40:00.000',
          points: 25,
        },
        {
          position: 2,
          driverId: 'norris',
          driverName: 'Lando Norris',
          driverCode: 'NOR',
          teamId: 'mclaren',
          teamName: 'McLaren',
          laps: 62,
          status: 'Finished',
          timeOrGap: '+2.123s',
          points: 18,
        },
        {
          position: 3,
          driverId: 'antonelli',
          driverName: 'Andrea Kimi Antonelli',
          driverCode: 'ANT',
          teamId: 'mercedes',
          teamName: 'Mercedes',
          laps: 62,
          status: 'Finished',
          timeOrGap: '+4.567s',
          points: 15,
        },
      ],
    };

    const russellBase = DRIVER_STANDINGS_2026.find((d) => d.driverId === 'russell')!.podiums;
    const antonelliBase = DRIVER_STANDINGS_2026.find((d) => d.driverId === 'antonelli')!.podiums;
    const mercedesBase = CONSTRUCTOR_STANDINGS_2026.find((c) => c.teamId === 'mercedes')!.podiums;

    const res = recalculateStandingsFromRaces(
      2026,
      [{ ...sampleRound18Race, id: 'race-2026-r22-qatar', round: 22 }],
      DRIVER_STANDINGS_2026,
      CONSTRUCTOR_STANDINGS_2026,
    );

    const russell = res.drivers.find((d) => d.driverId === 'russell');
    const antonelli = res.drivers.find((d) => d.driverId === 'antonelli');
    const mercedes = res.constructors.find((c) => c.teamId === 'mercedes');

    // Russell got P1 (podium +1)
    expect(russell!.podiums).toBe(russellBase + 1);
    // Antonelli got P3 (podium +1)
    expect(antonelli!.podiums).toBe(antonelliBase + 1);
    // Mercedes got P1 & P3 (podiums +2)
    expect(mercedes!.podiums).toBe(mercedesBase + 2);

    const baselineRound = recalculateStandingsFromRaces(
      2026,
      [{ ...sampleRound18Race, id: 'race-2026-r21-las-vegas', round: 21 }],
      DRIVER_STANDINGS_2026,
      CONSTRUCTOR_STANDINGS_2026,
    );
    expect(baselineRound.drivers.find((d) => d.driverId === 'antonelli')?.podiums).toBe(antonelliBase);
    expect(baselineRound.constructors.find((c) => c.teamId === 'mercedes')?.podiums).toBe(mercedesBase);
  });

  it('recalculateStandingsFromRaces should defensively recover podiums if base has 0 podiums', () => {
    const zeroPodiumDrivers = DRIVER_STANDINGS_2026.map((d) => ({ ...d, podiums: 0 }));
    const zeroPodiumConstructors = CONSTRUCTOR_STANDINGS_2026.map((c) => ({ ...c, podiums: 0 }));

    const mockRace: DetailedRaceResult = {
      id: 'race-2026-r1',
      season: 2026,
      round: 1,
      grandPrix: 'Australian Grand Prix',
      officialName: 'Australian Grand Prix 2026',
      circuit: 'Albert Park',
      date: '08 Mar 2026',
      status: 'completed',
      lapsTotal: 58,
      entries: [
        {
          position: 1,
          driverId: 'antonelli',
          driverName: 'Andrea Kimi Antonelli',
          driverCode: 'ANT',
          teamId: 'mercedes',
          teamName: 'Mercedes',
          laps: 58,
          status: 'Finished',
          timeOrGap: '1:30:00.000',
          points: 25,
        },
        {
          position: 2,
          driverId: 'russell',
          driverName: 'George Russell',
          driverCode: 'RUS',
          teamId: 'mercedes',
          teamName: 'Mercedes',
          laps: 58,
          status: 'Finished',
          timeOrGap: '+1.000s',
          points: 18,
        },
        {
          position: 3,
          driverId: 'norris',
          driverName: 'Lando Norris',
          driverCode: 'NOR',
          teamId: 'mclaren',
          teamName: 'McLaren',
          laps: 58,
          status: 'Finished',
          timeOrGap: '+2.000s',
          points: 15,
        },
      ],
    };

    const res = recalculateStandingsFromRaces(
      2026,
      [mockRace],
      zeroPodiumDrivers,
      zeroPodiumConstructors,
    );

    const antonelli = res.drivers.find((d) => d.driverId === 'antonelli');
    const mercedes = res.constructors.find((c) => c.teamId === 'mercedes');

    expect(antonelli!.podiums).toBe(1);
    expect(mercedes!.podiums).toBe(2);
  });
});
