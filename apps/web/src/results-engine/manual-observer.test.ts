import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadCalendar } from './engine.ts';
import { discoverObservationSession, runManualObservation } from './manual-observer.ts';
import { loadShadowState } from './shadow.ts';

const fixtureDirectory = join(process.cwd(), 'src', 'results-engine', 'fixtures');
const calendarPath = join(fixtureDirectory, 'm4-observation-calendar.json');
const replayPath = join(fixtureDirectory, 'm4-complete-replay.json');
const fiaPath = join(fixtureDirectory, 'm4-fia-document-reviews.json');
const temporaryDirectories: string[] = [];

function temporaryState(): string {
  const directory = mkdtempSync(join(tmpdir(), 'results-engine-m4-'));
  temporaryDirectories.push(directory);
  return join(directory, 'shadow-state.json');
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe('M4 manual observation workflow', () => {
  it('discovers a configured race without treating its schedule as completion evidence', () => {
    const calendar = loadCalendar(calendarPath);
    const discovered = discoverObservationSession(calendar, new Date('2026-10-18T14:30:00Z'));
    expect(discovered).toMatchObject({
      event: { eventId: '2026-synthetic-observation-gp' },
      session: { sessionId: '2026-synthetic-observation-gp-race', type: 'Race' },
      scheduledEndUtc: '2026-10-18T14:00:00.000Z',
    });
    expect(() => discoverObservationSession(calendar, new Date('2026-10-18T11:00:00Z'))).toThrow(
      'No race session is discoverable yet',
    );
  });

  it('persists replay evidence idempotently and refuses to claim the live latency target', async () => {
    const statePath = temporaryState();
    const options = {
      calendar: loadCalendar(calendarPath),
      now: new Date('2026-10-18T14:30:00Z'),
      statePath,
      replayPath,
      fiaDocumentsPath: fiaPath,
    };
    const first = await runManualObservation(options);
    const second = await runManualObservation(options);
    expect(first).toMatchObject({
      mode: 'REPLAY',
      observationsAdded: 6,
      duplicatesIgnored: 0,
      targetClaim: 'NOT_MEASURED',
      validation: { valid: true, expectedDriverCount: 3, receivedDriverCount: 3 },
      metrics: {
        actualSessionEndUtc: null,
        observedSessionEndUtc: '2026-10-18T14:07:30Z',
        measurementBasis: 'REPLAY',
        timeToFirstAvailableMinutes: 10.5,
        timeToFirstValidatedMinutes: 12.5,
        timeToOfficialProvisionalMinutes: 19.5,
        provisionalTarget: 'REPLAY_ONLY',
      },
    });
    expect(second).toMatchObject({ observationsAdded: 0, duplicatesIgnored: 6 });
    const persisted = loadShadowState(statePath);
    expect(persisted.sessions['2026-synthetic-observation-gp-race']?.evidence).toHaveLength(6);
    expect(Object.keys(persisted.validationReports)).toHaveLength(1);
    expect(
      persisted.sessions['2026-synthetic-observation-gp-race']?.evidence.find(
        (item) => item.kind === 'FIA_CORRECTED',
      )?.review,
    ).toMatchObject({ reviewedBy: 'm4-replay-operator', rightsStatus: 'REVIEW_REQUIRED' });
  });

  it('persists malformed or partial validation evidence without creating validated evidence', async () => {
    const statePath = temporaryState();
    const partialPath = join(
      temporaryDirectories[temporaryDirectories.length - 1]!,
      'partial.json',
    );
    const partial = JSON.parse(readFileSync(replayPath, 'utf8'));
    partial.captureId = 'm4-phase1-partial-v1';
    partial.results = partial.results.slice(0, 2);
    writeFileSync(partialPath, JSON.stringify(partial));
    const report = await runManualObservation({
      calendar: loadCalendar(calendarPath),
      now: new Date('2026-10-18T14:30:00Z'),
      statePath,
      replayPath: partialPath,
    });
    expect(report.validation).toMatchObject({
      valid: false,
      expectedDriverCount: 3,
      receivedDriverCount: 2,
    });
    expect(report.metrics?.firstValidatedResultAtUtc).toBeNull();
    expect(report.metrics?.provisionalTarget).toBe('REPLAY_ONLY');
    const persisted = loadShadowState(statePath);
    expect(Object.values(persisted.validationReports)[0]?.errors.join(' ')).toContain(
      'Incomplete classification',
    );
    expect(
      persisted.sessions['2026-synthetic-observation-gp-race']?.evidence.some(
        (item) => item.kind === 'VALIDATED_RESULT',
      ),
    ).toBe(false);
  });

  it('fails closed for malformed replay data and unauthorized network observation', async () => {
    const statePath = temporaryState();
    const malformedPath = join(
      temporaryDirectories[temporaryDirectories.length - 1]!,
      'malformed.json',
    );
    writeFileSync(malformedPath, JSON.stringify({ schemaVersion: 1, results: [] }));
    await expect(
      runManualObservation({
        calendar: loadCalendar(calendarPath),
        now: new Date('2026-10-18T14:30:00Z'),
        statePath,
        replayPath: malformedPath,
      }),
    ).rejects.toThrow('Replay snapshot schema is invalid');
    await expect(
      runManualObservation({
        calendar: loadCalendar(calendarPath),
        now: new Date('2026-10-18T14:30:00Z'),
        statePath,
        live: { sessionKey: 999, manuallyAuthorized: false },
      }),
    ).rejects.toThrow('--authorize-network-observation');
  });

  it('provides a working manually invoked CLI and preserves evidence across executions', () => {
    const statePath = temporaryState();
    const argumentsList = [
      '--experimental-strip-types',
      'src/results-engine/observe-cli.ts',
      '--calendar',
      calendarPath,
      '--replay',
      replayPath,
      '--fia-documents',
      fiaPath,
      '--state',
      statePath,
      '--now',
      '2026-10-18T14:30:00Z',
    ];
    const first = spawnSync(process.execPath, argumentsList, {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    const second = spawnSync(process.execPath, argumentsList, {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(first.status, first.stderr).toBe(0);
    expect(first.stdout).toContain('"provisionalTarget": "REPLAY_ONLY"');
    expect(second.status, second.stderr).toBe(0);
    expect(second.stdout).toContain('"observationsAdded": 0');
    expect(
      loadShadowState(statePath).sessions['2026-synthetic-observation-gp-race']?.evidence,
    ).toHaveLength(6);
  });
});
