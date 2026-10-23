import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type {
  CalendarEvent,
  EngineSessionState,
  EngineState,
  ResultRevision,
  SessionContext,
  SessionDefinition,
  SessionResult,
} from './types.ts';

export const emptyEngineState = (): EngineState => ({
  schemaVersion: 1,
  sessions: {},
  revisions: {},
});

export function getStatePath(override?: string): string {
  return resolve(override ?? process.env.RESULTS_ENGINE_STATE_PATH ?? '.results-engine/state.json');
}

export function loadState(path?: string): EngineState {
  try {
    const parsed: unknown = JSON.parse(readFileSync(getStatePath(path), 'utf8'));
    if (!isEngineState(parsed)) throw new Error('state schema is invalid');
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyEngineState();
    throw error;
  }
}

/** Atomic replacement avoids a partially written state file on runner interruption. */
export function saveState(state: EngineState, path?: string): void {
  const target = getStatePath(path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  renameSync(temporary, target);
}

export function initSession(
  event: CalendarEvent,
  definition: SessionDefinition,
  nowUtc: string,
): SessionContext {
  return {
    eventId: event.eventId,
    sessionId: definition.sessionId,
    type: definition.type,
    state: 'SCHEDULED',
    lastUpdateUtc: nowUtc,
    latestRevisionId: null,
    revisionIds: [],
  };
}

const permittedTransitions: Record<EngineSessionState, readonly EngineSessionState[]> = {
  SCHEDULED: ['RUNNING'],
  RUNNING: ['RESULT_PENDING', 'PROVISIONAL', 'FINAL'],
  RESULT_PENDING: ['PROVISIONAL', 'FINAL'],
  PROVISIONAL: ['PROVISIONAL', 'FINAL'],
  FINAL: ['CORRECTED'],
  CORRECTED: ['CORRECTED'],
};

export function transitionSession(
  context: SessionContext,
  target: EngineSessionState,
  nowUtc: string,
): SessionContext {
  if (context.state !== target && !permittedTransitions[context.state].includes(target)) {
    throw new Error(`Invalid state transition: ${context.state} -> ${target}`);
  }
  return { ...context, state: target, lastUpdateUtc: nowUtc };
}

export function revisionIdFor(result: SessionResult): string {
  return createHash('sha256').update(JSON.stringify(result)).digest('hex').slice(0, 16);
}

/** Adds a revision only once. Existing revision objects are never mutated. */
export function appendRevision(
  state: EngineState,
  context: SessionContext,
  result: SessionResult,
  nowUtc: string,
): { state: EngineState; context: SessionContext; revision: ResultRevision; duplicate: boolean } {
  const revisionId = revisionIdFor(result);
  const existing = state.revisions[revisionId];
  if (existing) return { state, context, revision: existing, duplicate: true };
  const revision: ResultRevision = {
    revisionId,
    sessionId: result.sessionId,
    parentRevisionId: context.latestRevisionId,
    createdAtUtc: nowUtc,
    classificationStatus: result.classificationStatus,
    result,
  };
  const nextContext = {
    ...context,
    latestRevisionId: revisionId,
    revisionIds: [...context.revisionIds, revisionId],
  };
  return {
    state: { ...state, revisions: { ...state.revisions, [revisionId]: revision } },
    context: nextContext,
    revision,
    duplicate: false,
  };
}

function isEngineState(value: unknown): value is EngineState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<EngineState>;
  return candidate.schemaVersion === 1 && !!candidate.sessions && !!candidate.revisions;
}
