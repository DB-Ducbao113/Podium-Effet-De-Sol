import { describe, expect, it } from 'vitest';
import { getStandings } from '../data/championship';
import type { DetailedRaceResult } from '../types';
import { recalculateStandingsFromRaces } from '../services/standingsEngine';
import { verifiedMovement } from './standingsMovement';

const baseline = getStandings(2026);
const race: DetailedRaceResult = {
  id: 'test-r18', season: 2026, round: 18, grandPrix: 'Test round', officialName: 'Test round',
  circuit: 'Test circuit', date: '2026-10-25', status: 'completed', lapsTotal: 1,
  entries: [{ position: 1, driverId: 'russell', driverName: 'George Russell', driverCode: 'RUS',
    teamId: 'mercedes', teamName: 'Mercedes', laps: 1, status: 'Finished', timeOrGap: '1:00', points: 110 }],
};

describe('verified standings movement', () => {
  it('derives rank change from comparable scoring cutoffs, not point delta', () => {
    const current = recalculateStandingsFromRaces(2026, [race], baseline.drivers, baseline.constructors);
    const movement = verifiedMovement(2026, [race], current, baseline);
    expect(movement.cutoff).toBe(18);
    expect(movement.drivers.get('russell')?.change).toBe(1);
    expect(movement.drivers.get('antonelli')?.change).toBe(-1);
    expect(movement.drivers.get('russell')?.previousPoints).toBe(baseline.drivers.find((row) => row.driverId === 'russell')?.points);
  });
  it('withholds movement when results are synthesized or current totals disagree', () => {
    const current = recalculateStandingsFromRaces(2026, [race], baseline.drivers, baseline.constructors);
    expect(verifiedMovement(2026, [{ ...race, isSynthesized: true }], current, baseline).cutoff).toBeNull();
    expect(verifiedMovement(2026, [race], baseline, baseline).cutoff).toBeNull();
  });
  it('does not compare completed seasons against arbitrary cached data', () => {
    const final = getStandings(2025);
    expect(verifiedMovement(2025, [], final, final).cutoff).toBeNull();
  });
});
