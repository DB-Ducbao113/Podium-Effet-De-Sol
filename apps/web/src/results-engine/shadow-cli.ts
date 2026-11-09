import { readFileSync } from 'node:fs';
import {
  appendShadowEvidence,
  metricsFor,
  observeOpenF1Session,
  recordValidatedResult,
  updateShadowState,
} from './shadow.ts';
import { requireObservationPermission } from './source-registry.ts';

function readArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const eventId = requiredArgument('--event');
const sessionId = requiredArgument('--session');
const scheduledEndUtc = requiredArgument('--scheduled-end');
const evidencePath = readArgument('--evidence');
const sessionKey = readArgument('--openf1-session-key');
if (!evidencePath && sessionKey === undefined)
  throw new Error('Provide --evidence or --openf1-session-key');
const evidence = readEvidenceFile(evidencePath);
let validationReport: Awaited<ReturnType<typeof observeOpenF1Session>>['validationReport'] = null;
if (sessionKey !== undefined) {
  requireObservationPermission({
    sourceId: 'openf1-community-api',
    permissionPath: readArgument('--source-permission'),
    manuallyAuthorized: process.argv.includes('--authorize-network-observation'),
  });
  const observation = await observeOpenF1Session({
    eventId,
    sessionId,
    sessionKey: Number(sessionKey),
    observedAtUtc: new Date().toISOString(),
  });
  evidence.push(...observation.evidence);
  validationReport = observation.validationReport;
}
const statePath = readArgument('--state');
const state = await updateShadowState((current) => {
  let next = current;
  for (const item of evidence)
    next = appendShadowEvidence(next, { eventId, sessionId, scheduledEndUtc }, item).state;
  if (validationReport)
    next = recordValidatedResult(
      next,
      { eventId, sessionId, scheduledEndUtc },
      validationReport,
      new Date().toISOString(),
    ).state;
  return next;
}, statePath);
console.log(
  JSON.stringify(
    {
      observationsRecorded: evidence.length,
      metrics: metricsFor(state, sessionId),
    },
    null,
    2,
  ),
);

function requiredArgument(name: string): string {
  const value = readArgument(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function readEvidenceFile(path: string | undefined): unknown[] {
  if (!path) return [];
  const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(value)) throw new Error('--evidence must contain a JSON array');
  return value;
}
