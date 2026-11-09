import { describe, expect, it, vi, afterEach } from 'vitest';
import { DRIVER_STANDINGS_2026, CONSTRUCTOR_STANDINGS_2026 } from '../data/championship/standings';
import {
  attachOpenF1SprintResults,
  sprintPointsForPosition,
  OpenF1SprintSource,
} from '../data/championship/openF1SprintBridge';
import { DetailedRaceResult, DetailedRaceResultEntry, TeamId } from '../types';
import { recalculateStandingsFromRaces } from './standingsEngine';
import { syncF1SeasonData, reconcileSeasonRaces } from './f1DataService';
import { BASELINE_CUTOFF_BY_SEASON } from '../data/championship/baselineCutoff';

const emptySource: OpenF1SprintSource = { getFinishedSprintEntries: () => null };
const firstRoundAfterBaseline = BASELINE_CUTOFF_BY_SEASON[2026].completedRounds + 1;

function totals(results: DetailedRaceResult[]) {
  // The sprint fixtures model newly received results, not races already in the baseline.
  const additionalRaces = results.map((race) =>
    race.round > BASELINE_CUTOFF_BY_SEASON[2026].completedRounds
      ? race
      : { ...race, round: firstRoundAfterBaseline },
  );
  return recalculateStandingsFromRaces(
    2026,
    additionalRaces,
    DRIVER_STANDINGS_2026,
    CONSTRUCTOR_STANDINGS_2026,
  );
}

function driverPoints(res: ReturnType<typeof totals>, id: string) {
  return res.drivers.find((d) => d.driverId === id)?.points;
}

function teamPoints(res: ReturnType<typeof totals>, id: string) {
  return res.constructors.find((c) => c.teamId === id)?.points;
}

function baseDriverPoints(id: string) {
  return DRIVER_STANDINGS_2026.find((d) => d.driverId === id)!.points;
}

function baseTeamPoints(id: string) {
  return CONSTRUCTOR_STANDINGS_2026.find((c) => c.teamId === id)!.points;
}

describe('sprint standings: no sprint yet', () => {
  it('1. leaves standings untouched when no sprint session finished', () => {
    const attached = attachOpenF1SprintResults({ 2024: [], 2025: [], 2026: [] }, emptySource);
    expect(attached[2026]).toEqual([]);
    const res = totals(attached[2026]);
    expect(driverPoints(res, 'verstappen')).toBe(baseDriverPoints('verstappen'));
    expect(teamPoints(res, 'redbull')).toBe(baseTeamPoints('redbull'));
  });

  it('9. leaves non-sprint weekends untouched', () => {
    // Round 18 has no sprint sessions anywhere: nothing may be attached.
    const attached = attachOpenF1SprintResults({ 2024: [], 2025: [], 2026: [] });
    expect(attached[2026].some((r) => r.round === 18)).toBe(false);
  });
});

describe('sprint standings: sprint completed before main race', () => {
  it('2. reflects sprint points in both championships without waiting for the race', () => {
    const attached = attachOpenF1SprintResults({ 2024: [], 2025: [], 2026: [] });
    const r17 = attached[2026].find((r) => r.round === 17);
    expect(r17).toBeDefined();
    expect(r17!.status).toBe('scheduled');
    expect(r17!.entries).toEqual([]);
    expect((r17!.sprintEntries || []).length).toBeGreaterThan(0);

    const res = totals(attached[2026]);
    // Expected deltas derived from the attached entries, not hardcoded.
    const byDriver = new Map<string, number>();
    const byTeam = new Map<string, number>();
    for (const e of r17!.sprintEntries || []) {
      byDriver.set(e.driverId, (byDriver.get(e.driverId) || 0) + (e.points || 0));
      byTeam.set(e.teamId, (byTeam.get(e.teamId) || 0) + (e.points || 0));
    }
    for (const [id, delta] of byDriver) {
      expect(driverPoints(res, id)).toBe(baseDriverPoints(id) + delta);
    }
    for (const [id, delta] of byTeam) {
      expect(teamPoints(res, id)).toBe(baseTeamPoints(id) + delta);
    }
    // Sprint points are real: P1 got 8, the field shares exactly 36.
    const total = [...byDriver.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(36);
    expect(byDriver.get('verstappen')).toBe(8);
  });

  it('3. reads the sprint race, never sprint qualifying', () => {
    const attached = attachOpenF1SprintResults({ 2024: [], 2025: [], 2026: [] });
    const res = totals(attached[2026]);
    // Sprint-qualifying order (VER, RUS, ...) differs from the sprint race
    // (VER, HAM, ...): Hamilton must gain 7, Russell must gain nothing.
    expect(driverPoints(res, 'hamilton')).toBe(baseDriverPoints('hamilton') + 7);
    expect(driverPoints(res, 'russell')).toBe(baseDriverPoints('russell'));
  });

  it('4. refreshing twice never accumulates points', () => {
    const once = attachOpenF1SprintResults({ 2024: [], 2025: [], 2026: [] });
    const twice = attachOpenF1SprintResults({
      2024: [],
      2025: [],
      2026: once[2026],
    });
    const a = totals(once[2026]);
    const b = totals(twice[2026]);
    expect(JSON.stringify(b.drivers)).toBe(JSON.stringify(a.drivers));
    expect(JSON.stringify(b.constructors)).toBe(JSON.stringify(a.constructors));
  });

  it('8. credits constructors from their eligible drivers exactly once', () => {
    const attached = attachOpenF1SprintResults({ 2024: [], 2025: [], 2026: [] });
    const res = totals(attached[2026]);
    // Ferrari: HAM 7 + LEC 6 = 13; Red Bull: VER 8; Mercedes: ANT 5.
    expect(teamPoints(res, 'ferrari')).toBe(baseTeamPoints('ferrari') + 13);
    expect(teamPoints(res, 'redbull')).toBe(baseTeamPoints('redbull') + 8);
    expect(teamPoints(res, 'mercedes')).toBe(baseTeamPoints('mercedes') + 5);
  });
});

describe('sprint standings: official data priority', () => {
  function officialRound(): DetailedRaceResult {
    const entry = (over: Partial<DetailedRaceResultEntry>): DetailedRaceResultEntry => ({
      position: 1,
      driverId: 'verstappen',
      driverName: 'Max Verstappen',
      driverCode: 'VER',
      teamId: 'redbull',
      teamName: 'Red Bull',
      laps: 19,
      status: 'Finished',
      timeOrGap: '30:00.000',
      points: 8,
      ...over,
    });
    return {
      id: 'race-2026-r17-singapore',
      season: 2026,
      round: 17,
      grandPrix: 'Singapore Grand Prix',
      officialName: 'Singapore Grand Prix',
      circuit: 'Marina Bay',
      date: '10 Oct 2026',
      status: 'scheduled',
      lapsTotal: 62,
      entries: [],
      sprintEntries: [
        entry({}),
        entry({
          position: 2,
          driverId: 'hamilton',
          driverName: 'Lewis Hamilton',
          driverCode: 'HAM',
          teamId: 'ferrari',
          teamName: 'Ferrari',
          points: 7,
        }),
      ],
      dataSource: 'Jolpica F1 API',
    };
  }

  it('5. never adds provisional points on top of official sprint entries', () => {
    const attached = attachOpenF1SprintResults({ 2024: [], 2025: [], 2026: [officialRound()] });
    const r17 = attached[2026].find((r) => r.round === 17)!;
    // Official entries kept verbatim (2 entries), provisional ignored.
    expect(r17.sprintEntries).toHaveLength(2);
    expect(r17.dataSource).toBe('Jolpica F1 API');
    const res = totals(attached[2026]);
    expect(driverPoints(res, 'verstappen')).toBe(baseDriverPoints('verstappen') + 8);
    expect(driverPoints(res, 'hamilton')).toBe(baseDriverPoints('hamilton') + 7);
  });

  it('6. adds race points on top of sprint points after the main race', () => {
    const race: DetailedRaceResult = {
      ...officialRound(),
      status: 'completed',
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
      ],
    };
    const attached = attachOpenF1SprintResults({ 2024: [], 2025: [], 2026: [race] });
    const res = totals(attached[2026]);
    const russell = res.drivers.find((d) => d.driverId === 'russell')!;
    const mercedes = res.constructors.find((c) => c.teamId === 'mercedes')!;
    // Russell: 25 race + 0 sprint (absent from these sprint entries); win and podium from race only.
    expect(russell.points).toBe(baseDriverPoints('russell') + 25);
    expect(russell.wins).toBe(
      DRIVER_STANDINGS_2026.find((d) => d.driverId === 'russell')!.wins + 1,
    );
    expect(mercedes.points).toBe(baseTeamPoints('mercedes') + 25);
  });

  it('7. follows official corrections instead of keeping stale points', () => {
    const v1: OpenF1SprintSource = {
      getFinishedSprintEntries: (_season, round) =>
        round === 17
          ? [
              {
                position: 1,
                driverId: 'verstappen',
                driverName: 'Max Verstappen',
                driverCode: 'VER',
                teamId: 'redbull',
                teamName: 'Red Bull',
                laps: 19,
                status: 'Finished',
                timeOrGap: '',
                points: 8,
              },
            ]
          : null,
    };
    const v2: OpenF1SprintSource = {
      getFinishedSprintEntries: (_season, round) =>
        round === 17
          ? [
              {
                position: 1,
                driverId: 'hamilton',
                driverName: 'Lewis Hamilton',
                driverCode: 'HAM',
                teamId: 'ferrari',
                teamName: 'Ferrari',
                laps: 19,
                status: 'Finished',
                timeOrGap: '',
                points: 8,
              },
            ]
          : null,
    };
    const before = totals(attachOpenF1SprintResults({ 2024: [], 2025: [], 2026: [] }, v1)[2026]);
    expect(driverPoints(before, 'verstappen')).toBe(baseDriverPoints('verstappen') + 8);
    const after = totals(attachOpenF1SprintResults({ 2024: [], 2025: [], 2026: [] }, v2)[2026]);
    expect(driverPoints(after, 'verstappen')).toBe(baseDriverPoints('verstappen'));
    expect(driverPoints(after, 'hamilton')).toBe(baseDriverPoints('hamilton') + 8);
  });
});

describe('sprint standings: FIA countback for ties', () => {
  it('10. orders equal points and wins by P2 finishes, not by podium totals', () => {
    const base = [
      {
        rank: 1,
        driverId: 'aaa',
        driverName: 'Aaa',
        driverCode: 'AAA',
        teamId: 'mercedes',
        teamName: 'Mercedes',
        points: 100,
        wins: 1,
        podiums: 1,
        countryFlag: '',
      },
      {
        rank: 2,
        driverId: 'bbb',
        driverName: 'Bbb',
        driverCode: 'BBB',
        teamId: 'ferrari',
        teamName: 'Ferrari',
        points: 103,
        wins: 1,
        podiums: 5,
        countryFlag: '',
      },
    ] as typeof DRIVER_STANDINGS_2026;
    const teams = [
      {
        rank: 1,
        teamId: 'mercedes',
        teamName: 'Mercedes',
        points: 100,
        wins: 1,
        podiums: 1,
        engine: '',
      },
      {
        rank: 2,
        teamId: 'ferrari',
        teamName: 'Ferrari',
        points: 103,
        wins: 1,
        podiums: 5,
        engine: '',
      },
    ] as typeof CONSTRUCTOR_STANDINGS_2026;
    const mk = (
      driverId: string,
      teamId: 'mercedes' | 'ferrari',
      position: number,
      points: number,
    ): DetailedRaceResultEntry => ({
      position,
      driverId,
      driverName: driverId,
      driverCode: 'X',
      teamId,
      teamName: teamId,
      laps: 50,
      status: 'Finished',
      timeOrGap: '',
      points,
    });
    const races: DetailedRaceResult[] = [
      {
        id: 'r1',
        season: 2026,
        round: 18,
        grandPrix: 'GP',
        officialName: 'GP',
        circuit: 'C',
        date: '',
        status: 'completed',
        lapsTotal: 50,
        entries: [mk('aaa', 'mercedes', 2, 18), mk('bbb', 'ferrari', 3, 15)],
      },
    ];
    const res = recalculateStandingsFromRaces(2026, races, base, teams);
    // Both 118 pts / 1 win; aaa owns a P2, bbb's best is P3 — aaa leads even
    // though bbb holds more total podiums (6 vs 2). Old points→podiums logic
    // would have ranked bbb first.
    expect(res.drivers[0].driverId).toBe('aaa');
    expect(res.drivers[1].driverId).toBe('bbb');
  });
});

describe('sprint points table', () => {
  it('awards 8..1 for P1..P8 and 0 beyond, preferring official values', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((p) => sprintPointsForPosition(p))).toEqual([
      8, 7, 6, 5, 4, 3, 2, 1,
    ]);
    expect(sprintPointsForPosition(9)).toBe(0);
    expect(sprintPointsForPosition(22)).toBe(0);
    expect(sprintPointsForPosition(1, 8)).toBe(8);
  });
});

describe('sprint provenance: provisional refresh vs official protection', () => {
  const prov = (round: number, driverId: string, points: number): DetailedRaceResult => ({
    id: `race-2026-r${round}-sprint-provisional`,
    season: 2026,
    round,
    grandPrix: 'Singapore Grand Prix',
    officialName: 'Singapore Grand Prix',
    circuit: 'Marina Bay',
    date: '10 Oct 2026',
    status: 'scheduled',
    lapsTotal: 62,
    entries: [],
    sprintEntries: [
      {
        position: 1,
        driverId,
        driverName: driverId,
        driverCode: 'X',
        teamId: 'redbull',
        teamName: 'Red Bull',
        laps: 19,
        status: 'Finished',
        timeOrGap: '',
        points,
      },
    ],
    sprintProvenance: 'provisional',
    dataSource: 'OpenF1 live timing (provisional)',
  });

  it('replaces saved provisional data after a JSON persist round-trip', () => {
    const first = attachOpenF1SprintResults({
      2024: [],
      2025: [],
      2026: [prov(17, 'verstappen', 8)],
    });
    // Simulate localStorage persist: serialize + parse, then refresh.
    const reloaded = JSON.parse(JSON.stringify(first)) as typeof first;
    const newer: OpenF1SprintSource = {
      getFinishedSprintEntries: (_s, r) =>
        r === 17
          ? [{ ...reloaded[2026][0].sprintEntries![0], driverId: 'hamilton', points: 8 }]
          : null,
    };
    const refreshed = attachOpenF1SprintResults(reloaded, newer);
    const res = totals(refreshed[2026]);
    expect(driverPoints(res, 'verstappen')).toBe(baseDriverPoints('verstappen'));
    expect(driverPoints(res, 'hamilton')).toBe(baseDriverPoints('hamilton') + 8);
  });

  it('never overwrites marked official entries with provisional data', () => {
    const official: DetailedRaceResult = {
      ...prov(17, 'verstappen', 8),
      sprintProvenance: 'official',
      dataSource: 'Jolpica F1 API',
    };
    const newer: OpenF1SprintSource = {
      getFinishedSprintEntries: (_s, r) =>
        r === 17 ? [{ ...official.sprintEntries![0], driverId: 'hamilton' }] : null,
    };
    const attached = attachOpenF1SprintResults({ 2024: [], 2025: [], 2026: [official] }, newer);
    const r17 = attached[2026].find((r) => r.round === 17)!;
    expect(r17.sprintEntries![0].driverId).toBe('verstappen');
    expect(r17.sprintProvenance).toBe('official');
  });

  it('preserves unmarked legacy official entries', () => {
    const legacy: DetailedRaceResult = { ...prov(17, 'verstappen', 8) };
    delete (legacy as Partial<DetailedRaceResult>).sprintProvenance;
    const newer: OpenF1SprintSource = {
      getFinishedSprintEntries: (_s, r) =>
        r === 17 ? [{ ...legacy.sprintEntries![0], driverId: 'hamilton' }] : null,
    };
    const attached = attachOpenF1SprintResults({ 2024: [], 2025: [], 2026: [legacy] }, newer);
    expect(attached[2026].find((r) => r.round === 17)!.sprintEntries![0].driverId).toBe(
      'verstappen',
    );
  });
});

describe('sprint constructor mapping and repeated syncs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it('parks unknown teams under the sentinel without inflating Red Bull', () => {
    const alien: OpenF1SprintSource = {
      getFinishedSprintEntries: (_s, round) =>
        round === 17
          ? [
              {
                position: 1,
                driverId: 'newdriver',
                driverName: 'New Driver',
                driverCode: 'NEW',
                teamId: 'newteam' as unknown as TeamId,
                teamName: 'New Team 11',
                laps: 19,
                status: 'Finished',
                timeOrGap: '',
                points: 8,
              },
            ]
          : null,
    };
    const attached = attachOpenF1SprintResults({ 2024: [], 2025: [], 2026: [] }, alien);
    const entry = attached[2026].find((r) => r.round === 17)!.sprintEntries![0];
    expect(entry.teamId).toBe('unknown');
    const res = totals(attached[2026]);
    expect(teamPoints(res, 'redbull')).toBe(baseTeamPoints('redbull'));
  });

  it('produces identical totals across repeated official syncs', async () => {
    const fresh = {
      round: '17',
      raceName: 'Singapore Grand Prix',
      date: '2026-10-11',
      Circuit: { circuitName: 'Marina Bay', Location: { locality: 'X', country: 'Y' } },
      Results: [],
      SprintResults: [
        {
          position: '1',
          Driver: {
            driverId: 'max_verstappen',
            givenName: 'Max',
            familyName: 'Verstappen',
            code: 'VER',
            permanentNumber: '33',
          },
          Constructor: { constructorId: 'red_bull', name: 'Red Bull' },
          laps: '19',
          status: 'Finished',
          Time: { time: '30:00.000' },
          points: '8',
          grid: '1',
        },
      ],
    };
    const page = (races: unknown[], total: number) => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ MRData: { RaceTable: { Races: races }, total: String(total) } }),
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/sprint.json')) return page([fresh], 1);
        return page([], 0);
      }),
    );
    try {
      const first = await syncF1SeasonData(2026, []);
      const second = await syncF1SeasonData(2026, first.results);
      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      // dataUpdatedAt legitimately refreshes; everything else must be stable.
      const strip = (results: DetailedRaceResult[]) =>
        results.map(({ dataUpdatedAt: _t, ...rest }) => rest);
      expect(strip(second.results)).toEqual(strip(first.results));
      const a = totals(first.results);
      const b = totals(second.results);
      expect(JSON.stringify(b.drivers)).toBe(JSON.stringify(a.drivers));
      expect(JSON.stringify(b.constructors)).toBe(JSON.stringify(a.constructors));
      const res = recalculateStandingsFromRaces(
        2026,
        second.results,
        DRIVER_STANDINGS_2026,
        CONSTRUCTOR_STANDINGS_2026,
      );
      expect(driverPoints(res, 'verstappen')).toBe(baseDriverPoints('verstappen'));
    } finally {
      vi.unstubAllGlobals();
    }
  }, 15000);
});

describe('reload reconciliation: applied results must survive a refresh', () => {
  const entry = (position: number, timeOrGap: string) => ({
    position,
    driverId: 'russell',
    driverName: 'George Russell',
    driverCode: 'RUS',
    teamId: 'mercedes' as TeamId,
    teamName: 'Mercedes',
    laps: 51,
    status: 'Finished',
    timeOrGap,
    points: 25,
  });

  const baselineRace: DetailedRaceResult = {
    id: 'race-2026-r15-azerbaijan',
    season: 2026,
    round: 15,
    grandPrix: 'Azerbaijan Grand Prix',
    officialName: 'AZERBAIJAN GP',
    circuit: 'Baku City Circuit',
    date: '26 Sep 2026',
    status: 'completed',
    lapsTotal: 51,
    entries: [entry(1, '+0.196s')],
  };

  const appliedRace: DetailedRaceResult = {
    ...baselineRace,
    entries: [entry(1, '+0.196')],
    dataUpdatedAt: '2026-10-11T00:00:00.000Z',
  };

  it('keeps the synced/applied classification instead of rolling back to baseline', () => {
    const reconciled = reconcileSeasonRaces([baselineRace], [appliedRace]);
    expect(reconciled).toHaveLength(1);
    expect(reconciled[0].entries[0].timeOrGap).toBe('+0.196');
    expect(reconciled[0].dataUpdatedAt).toBe('2026-10-11T00:00:00.000Z');
  });

  it('still fills rounds the cache has never seen from the baseline', () => {
    const cachedOnlyRound17: DetailedRaceResult = {
      ...baselineRace,
      id: 'race-2026-r17-singapore',
      round: 17,
      entries: [entry(1, '1:40:00.000')],
    };
    const reconciled = reconcileSeasonRaces([baselineRace], [cachedOnlyRound17]);
    expect(reconciled.map((race) => race.round)).toEqual([15, 17]);
    expect(reconciled[0].entries[0].timeOrGap).toBe('+0.196s');
  });

  it('lets baseline win when the cached round has no classification yet', () => {
    const emptyShell: DetailedRaceResult = {
      ...baselineRace,
      entries: [],
      status: 'scheduled',
    };
    const reconciled = reconcileSeasonRaces([baselineRace], [emptyShell]);
    expect(reconciled).toHaveLength(1);
    expect(reconciled[0].entries).toHaveLength(1);
    expect(reconciled[0].status).toBe('completed');
  });

  it('keeps cached scheduled shells that the baseline does not cover', () => {
    const futureShell: DetailedRaceResult = {
      ...baselineRace,
      id: 'race-2026-r17-singapore',
      round: 17,
      entries: [],
      status: 'scheduled',
    };
    const reconciled = reconcileSeasonRaces([baselineRace], [futureShell]);
    expect(reconciled.map((race) => race.round)).toEqual([15, 17]);
    expect(reconciled[1].status).toBe('scheduled');
  });
});

describe('sprint points table', () => {
  it('awards 8..1 for P1..P8 and 0 beyond, preferring official values', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((p) => sprintPointsForPosition(p))).toEqual([
      8, 7, 6, 5, 4, 3, 2, 1,
    ]);
    expect(sprintPointsForPosition(9)).toBe(0);
    expect(sprintPointsForPosition(22)).toBe(0);
    expect(sprintPointsForPosition(1, 8)).toBe(8);
  });
});
