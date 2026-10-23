import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadCalendar } from './engine.ts';
import { runManualObservation } from './manual-observer.ts';
import { runObservationSequence } from './observation-sequence.ts';
import { observationSourceRegistry } from './source-registry.ts';

function readArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

if (process.argv.includes('--list-sources')) {
  console.log(JSON.stringify(observationSourceRegistry, null, 2));
} else {
  const calendarPath = requiredArgument('--calendar');
  const replayPath = readArgument('--replay');
  const replaySequencePath = readArgument('--replay-sequence');
  const liveRequested = process.argv.includes('--live-openf1');
  if (
    [Boolean(replayPath), Boolean(replaySequencePath), liveRequested].filter(Boolean).length !== 1
  )
    throw new Error(
      'Choose exactly one of --replay <snapshot>, --replay-sequence <sequence>, or --live-openf1',
    );
  const nowArgument = readArgument('--now');
  const now = nowArgument ? new Date(nowArgument) : new Date();
  if (!Number.isFinite(now.getTime())) throw new Error('--now must be a valid ISO timestamp');
  const sessionKeyValue = readArgument('--openf1-session-key');
  const calendar = loadCalendar(calendarPath);
  const common = {
    calendar,
    now,
    sessionId: readArgument('--session'),
    statePath: readArgument('--state'),
  };
  const report = replaySequencePath
    ? await runObservationSequence({
        ...common,
        sequencePath: replaySequencePath,
        durableStorePath: readArgument('--durable-store'),
      })
    : await runManualObservation({
        ...common,
        replayPath,
        fiaDocumentsPath: readArgument('--fia-documents'),
        ...(liveRequested
          ? {
              live: {
                ...(sessionKeyValue ? { sessionKey: Number(sessionKeyValue) } : {}),
                permissionPath: readArgument('--source-permission'),
                manuallyAuthorized: process.argv.includes('--authorize-network-observation'),
                requestPolicy: {
                  timeoutMs: positiveIntegerArgument('--timeout-ms', 10_000),
                  maxAttempts: positiveIntegerArgument('--max-attempts', 3),
                },
              },
            }
          : {}),
      });
  const reportPath = readArgument('--report');
  if (reportPath) writeReport(reportPath, report);
  console.log(JSON.stringify(report, null, 2));
  if ('validation' in report && report.validation && !report.validation.valid) process.exitCode = 1;
}

function writeReport(path: string, report: unknown): void {
  const target = resolve(path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  renameSync(temporary, target);
}

function requiredArgument(name: string): string {
  const value = readArgument(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function positiveIntegerArgument(name: string, fallback: number): number {
  const value = readArgument(name);
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0)
    throw new Error(`${name} must be a positive integer`);
  return parsed;
}
