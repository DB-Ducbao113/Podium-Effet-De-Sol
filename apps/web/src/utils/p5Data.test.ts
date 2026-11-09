import { describe, expect, it } from 'vitest';
import type { DetailedRaceResult, DetailedRaceResultEntry } from '../types';
import { driverPodiumResults, podiumForm, roundsWithResults } from './p5Data';

const entry = (
  position: number,
  driverId: string,
  driverName: string,
  points: number,
  timeOrGap: string,
): DetailedRaceResultEntry => ({
  position,
  driverId,
  driverName,
  driverCode: driverId.slice(0, 3).toUpperCase(),
  teamId: 'ferrari',
  teamName: 'Ferrari',
  laps: 57,
  status: 'Finished',
  timeOrGap,
  points,
});

const race = (
  round: number,
  entries: DetailedRaceResultEntry[],
  winnerTime = '1:30:00.000',
): DetailedRaceResult => ({
  id: `race-2026-r${round}`,
  season: 2026,
  round,
  grandPrix: `Round ${round} Grand Prix`,
  officialName: `Round ${round} Grand Prix`,
  circuit: `Round ${round} Circuit`,
  date: '01 Nov 2026',
  status: 'completed',
  lapsTotal: 57,
  winner: { driver: entries[0]?.driverName ?? '', team: 'Ferrari', time: winnerTime },
  entries,
});

describe('p5Data podium sources', () => {
  it('falls back to published summaries when no detailed races exist', () => {
    const form = podiumForm(2026, ['Charles Leclerc']);
    expect(form).toHaveLength(5);
    expect(form[form.length - 1]).toEqual({ round: 17, position: 2, source: 'summary' });

    const results = driverPodiumResults(2026, ['Charles Leclerc']);
    expect(results[results.length - 1]?.round).toBe(17);
    expect(results[results.length - 1]?.position).toBe(2);
    expect(results[results.length - 1]?.source).toBe('summary');
  });

  it('extends the last-five window with newer detailed rounds', () => {
    const races = [
      race(18, [
        entry(1, 'leclerc', 'Charles Leclerc', 25, '1:30:00.000'),
        entry(2, 'hamilton', 'Lewis Hamilton', 18, '+3.200s'),
      ]),
      race(19, [
        entry(1, 'hamilton', 'Lewis Hamilton', 25, '1:31:00.000'),
        entry(5, 'leclerc', 'Charles Leclerc', 10, '+22.000s'),
      ]),
    ];

    const form = podiumForm(2026, ['Charles Leclerc'], 5, races);
    expect(form.map((item) => item.round)).toEqual([15, 16, 17, 18, 19]);
    expect(form[form.length - 2]).toEqual({ round: 18, position: 1, source: 'detailed' });
    expect(form[form.length - 1]).toEqual({ round: 19, position: null, source: 'detailed' });

    const results = driverPodiumResults(2026, ['Charles Leclerc'], 5, races);
    expect(results[results.length - 2]).toMatchObject({
      round: 18,
      position: 1,
      points: 25,
      gap: '1:30:00.000',
      source: 'detailed',
    });
    expect(results[results.length - 1]).toMatchObject({
      round: 19,
      position: null,
      points: null,
      gap: null,
      source: 'detailed',
    });
    expect(roundsWithResults(2026, races)).toBe(19);
  });

  it('lets a detailed classification override the static summary for the same round', () => {
    const detailedRound17 = race(17, [
      entry(1, 'hamilton', 'Lewis Hamilton', 25, '1:30:00.000'),
      entry(4, 'leclerc', 'Charles Leclerc', 12, '+14.000s'),
    ]);

    expect(podiumForm(2026, ['Charles Leclerc'], 1, [detailedRound17])).toEqual([
      { round: 17, position: null, source: 'detailed' },
    ]);
    expect(driverPodiumResults(2026, ['Charles Leclerc'], 1, [detailedRound17])[0]).toMatchObject({
      round: 17,
      position: null,
      points: null,
      source: 'detailed',
    });
    expect(roundsWithResults(2026, [detailedRound17])).toBe(17);
  });

  it('ignores sprint-only shells that have no Grand Prix classification', () => {
    const sprintShell: DetailedRaceResult = {
      ...race(18, []),
      status: 'scheduled',
      entries: [],
      sprintEntries: [entry(1, 'leclerc', 'Charles Leclerc', 8, '')],
    };

    expect(podiumForm(2026, ['Charles Leclerc'], 1, [sprintShell])).toEqual([
      { round: 17, position: 2, source: 'summary' },
    ]);
    expect(roundsWithResults(2026, [sprintShell])).toBe(17);
  });
});