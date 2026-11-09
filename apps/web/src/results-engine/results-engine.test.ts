import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { runEngine } from './engine.ts';
import { publishRevision } from './publish.ts';
import {
  adaptJolpicaResponse,
  adaptOpenF1Response,
  FixtureProvider,
  ProviderResponseError,
} from './provider.ts';
import { loadState, transitionSession } from './state.ts';
import type { CalendarEvent, SessionDefinition, SessionResult } from './types.ts';

const session = {
  type: 'Race' as const,
  sessionId: '2026-gp-bahrain-race',
  scheduledStartUtc: '2026-03-14T12:00:00Z',
  durationMinutes: 120,
};
const calendar: CalendarEvent[] = [
  { eventId: '2026-gp-bahrain', name: 'Synthetic Bahrain', sessions: [session] },
];
const temporaryDirectories: string[] = [];

function statePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'results-engine-'));
  temporaryDirectories.push(directory);
  return join(directory, 'state.json');
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe('Results Engine', () => {
  it('persists a provisional revision and makes duplicate execution idempotent', async () => {
    const path = statePath();
    const first = await runEngine({
      calendar,
      statePath: path,
      now: new Date('2026-03-14T14:30:00Z'),
    });
    expect(first.processed).toEqual(['2026-gp-bahrain-race:PROVISIONAL']);
    expect(first.state.sessions[session.sessionId]?.state).toBe('PROVISIONAL');
    expect(first.state.sessions[session.sessionId]?.revisionIds).toHaveLength(1);
    const second = await runEngine({
      calendar,
      statePath: path,
      now: new Date('2026-03-14T14:35:00Z'),
    });
    expect(second.skipped).toContain('2026-gp-bahrain-race:DUPLICATE');
    expect(loadState(path).sessions[session.sessionId]?.revisionIds).toHaveLength(1);
    expect(JSON.parse(readFileSync(path, 'utf8')).schemaVersion).toBe(1);
  });

  it('preserves state and revision history across separate CLI processes', () => {
    const path = statePath();
    const first = runCli(path, '2026-03-14T14:30:00Z');
    expect(first.status).toBe(0);
    const afterFirst = JSON.parse(readFileSync(path, 'utf8'));
    const firstRevision = afterFirst.sessions[session.sessionId].latestRevisionId;
    const second = runCli(path, '2026-03-14T14:35:00Z');
    expect(second.status).toBe(0);
    expect(second.stdout).toContain('DUPLICATE');
    const afterSecond = JSON.parse(readFileSync(path, 'utf8'));
    expect(afterSecond.sessions[session.sessionId].latestRevisionId).toBe(firstRevision);
    expect(afterSecond.sessions[session.sessionId].revisionIds).toHaveLength(1);
  });

  it('accepts an explicit UTC calendar file through the CLI', () => {
    const path = statePath();
    const calendarPath = join(dirname(path), 'calendar.json');
    writeFileSync(calendarPath, JSON.stringify(calendar));
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        'src/results-engine/cli.ts',
        '--now',
        '2026-03-14T14:30:00Z',
        '--state',
        path,
        '--calendar',
        calendarPath,
      ],
      { cwd: process.cwd(), encoding: 'utf8' },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('2026-gp-bahrain-race:PROVISIONAL');
  });

  it('moves provisional results to final and records a historical correction as a new immutable revision', async () => {
    const path = statePath();
    await runEngine({ calendar, statePath: path, now: new Date('2026-03-14T14:30:00Z') });
    const finalRun = await runEngine({
      calendar,
      statePath: path,
      now: new Date('2026-03-14T17:00:00Z'),
      provider: new FinalFixtureProvider(),
    });
    expect(finalRun.processed).toEqual(['2026-gp-bahrain-race:FINAL']);
    const corrected = await runEngine({
      calendar,
      statePath: path,
      now: new Date('2026-03-15T17:00:00Z'),
      allowHistoricalCorrections: true,
      provider: new CorrectedFixtureProvider(),
    });
    expect(corrected.processed).toEqual(['2026-gp-bahrain-race:CORRECTED']);
    const persisted = loadState(path);
    expect(persisted.sessions[session.sessionId]?.state).toBe('CORRECTED');
    expect(persisted.sessions[session.sessionId]?.revisionIds).toHaveLength(3);
    const firstRevisionId = persisted.sessions[session.sessionId]?.revisionIds[0] as string;
    expect(persisted.revisions[firstRevisionId]?.classificationStatus).toBe('PROVISIONAL');
    expect(persisted.revisions[firstRevisionId]?.result.driverResults[1]?.penalties).toEqual([]);
  });

  it('does not treat a scheduled end as actual completion', async () => {
    const path = statePath();
    const delayed = await runEngine({
      calendar,
      statePath: path,
      now: new Date('2026-03-14T14:30:00Z'),
      provider: new DelayedFixtureProvider(),
    });
    expect(delayed.processed).toEqual([]);
    expect(delayed.skipped).toContain('2026-gp-bahrain-race:ACTUAL_COMPLETION_PENDING');
    expect(delayed.state.sessions[session.sessionId]?.state).toBe('RESULT_PENDING');
    expect(delayed.state.sessions[session.sessionId]?.revisionIds).toEqual([]);
  });

  it('keeps migration CI read-only and leaves data automation disabled', () => {
    const workflow = readFileSync('../../.github/workflows/ci.yml', 'utf8');
    expect(workflow).not.toMatch(/^\s*schedule:/m);
    expect(workflow).toContain('contents: read');
    expect(workflow).not.toContain('contents: write');
    expect(workflow).not.toContain('git push');
  });

  it('rejects malformed OpenF1 and Jolpica responses instead of casting them into canonical results', () => {
    expect(() =>
      adaptOpenF1Response({
        event: calendar[0],
        session,
        nowUtc: '2026-03-14T14:00:00Z',
        reference: { sessionKey: 1 },
        sessions: [{}],
        classifications: [],
        drivers: [],
      }),
    ).toThrow(ProviderResponseError);
    expect(() =>
      adaptJolpicaResponse({
        event: calendar[0],
        session,
        nowUtc: '2026-03-14T14:00:00Z',
        reference: { year: 2026, round: 1 },
        response: { MRData: { RaceTable: { Races: [{ Results: [{}] }] } } },
      }),
    ).toThrow(ProviderResponseError);
  });

  it('adapts documented synthetic OpenF1 and Jolpica-shaped payloads into restricted canonical records', () => {
    const openF1 = adaptOpenF1Response({
      event: calendar[0],
      session,
      nowUtc: '2026-03-14T14:00:00Z',
      reference: { sessionKey: 9001 },
      sessions: [{ date_start: '2026-03-14T12:00:00Z', date_end: '2026-03-14T14:00:00Z' }],
      classifications: [{ driver_number: 99, position: 1, number_of_laps: 58, duration: 7200 }],
      drivers: [{ driver_number: 99, full_name: 'Synthetic Driver', country_code: 'XX' }],
    });
    const jolpica = adaptJolpicaResponse({
      event: calendar[0],
      session,
      nowUtc: '2026-03-14T14:00:00Z',
      reference: { year: 2026, round: 1 },
      response: {
        MRData: {
          RaceTable: {
            Races: [
              {
                date: '2026-03-14',
                time: '12:00:00Z',
                Results: [
                  {
                    position: '1',
                    laps: '58',
                    points: '25',
                    status: 'Finished',
                    Time: { time: '1:30:00.000' },
                    Driver: {
                      driverId: 'synthetic_driver',
                      givenName: 'Synthetic',
                      familyName: 'Driver',
                      nationality: 'Test',
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    });
    expect(openF1.source).toMatchObject({ provider: 'openf1', license: 'RESTRICTED' });
    expect(jolpica.source).toMatchObject({ provider: 'jolpica', license: 'RESTRICTED' });
    expect(jolpica.driverResults[0]?.driver.driverId).toBe('synthetic_driver');
  });

  it('enforces state transitions', () => {
    expect(() =>
      transitionSession(
        {
          eventId: 'event',
          sessionId: 'session',
          type: 'Race',
          state: 'SCHEDULED',
          lastUpdateUtc: '2026-01-01T00:00:00Z',
          latestRevisionId: null,
          revisionIds: [],
        },
        'FINAL',
        '2026-01-01T00:00:01Z',
      ),
    ).toThrow('Invalid state transition');
  });

  it('refuses to publish synthetic fixture classifications', async () => {
    const result = await new FixtureProvider().fetchSessionData(
      calendar[0],
      session,
      '2026-03-14T14:30:00Z',
    );
    expect(() =>
      publishRevision({
        revisionId: 'synthetic-revision',
        sessionId: result.sessionId,
        parentRevisionId: null,
        createdAtUtc: '2026-03-14T14:30:00Z',
        classificationStatus: 'PROVISIONAL',
        result,
      }),
    ).toThrow('SYNTHETIC source results cannot be published');
    expect(() =>
      publishRevision({
        revisionId: 'unknown-revision',
        sessionId: result.sessionId,
        parentRevisionId: null,
        createdAtUtc: '2026-03-14T14:30:00Z',
        classificationStatus: 'PROVISIONAL',
        result: { ...result, source: { ...result.source, license: 'UNKNOWN' } },
      }),
    ).toThrow('UNKNOWN source results cannot be published');
    expect(() =>
      publishRevision({
        revisionId: 'restricted-revision',
        sessionId: result.sessionId,
        parentRevisionId: null,
        createdAtUtc: '2026-03-14T14:30:00Z',
        classificationStatus: 'PROVISIONAL',
        result: { ...result, source: { ...result.source, license: 'RESTRICTED' } },
      }),
    ).toThrow('RESTRICTED source results cannot be published');
  });
});

class CorrectedFixtureProvider extends FixtureProvider {
  override async fetchSessionData(
    event: CalendarEvent,
    definition: SessionDefinition,
    nowUtc: string,
  ): Promise<SessionResult> {
    const fixture = await super.fetchSessionData(event, definition, nowUtc);
    return {
      ...fixture,
      classificationStatus: 'CORRECTED',
      driverResults: fixture.driverResults.map((driverResult) =>
        driverResult.driver.driverId === 'charles_leclerc'
          ? { ...driverResult, penalties: ['Synthetic five-second penalty'] }
          : driverResult,
      ),
    };
  }
}

class FinalFixtureProvider extends FixtureProvider {
  override async fetchSessionData(
    event: CalendarEvent,
    definition: SessionDefinition,
    nowUtc: string,
  ): Promise<SessionResult> {
    return {
      ...(await super.fetchSessionData(event, definition, nowUtc)),
      classificationStatus: 'FINAL',
    };
  }
}

class DelayedFixtureProvider extends FixtureProvider {
  override async fetchSessionData(
    event: CalendarEvent,
    definition: SessionDefinition,
    nowUtc: string,
  ): Promise<SessionResult> {
    return {
      ...(await super.fetchSessionData(event, definition, nowUtc)),
      endUtc: '2026-03-14T16:00:00Z',
    };
  }
}

function runCli(path: string, nowUtc: string) {
  return spawnSync(
    process.execPath,
    ['--experimental-strip-types', 'src/results-engine/cli.ts', '--now', nowUtc, '--state', path],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
}
