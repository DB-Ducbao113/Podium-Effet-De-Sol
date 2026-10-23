import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FixtureProvider } from './provider.ts';
import type { ResultsProvider } from './provider.ts';
import { appendRevision, initSession, loadState, saveState, transitionSession } from './state.ts';
import type {
  CalendarEvent,
  EngineState,
  ProviderSessionReference,
  SessionDefinition,
  SessionResult,
} from './types.ts';
import { verifySessionResult } from './verification.ts';

export interface EngineOptions {
  now?: Date;
  calendar?: readonly CalendarEvent[];
  provider?: ResultsProvider;
  statePath?: string;
  allowHistoricalCorrections?: boolean;
}

export interface EngineRunReport {
  processed: string[];
  skipped: string[];
  warnings: string[];
  state: EngineState;
}

export type PollingDecision = 'WAITING' | 'IN_PROGRESS' | 'DUE_FOR_CHECK' | 'HISTORICAL';

export function loadCalendar(
  path = join(process.cwd(), 'src', 'results-engine', 'calendar.json'),
): CalendarEvent[] {
  const raw: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(raw)) throw new Error('Results Engine calendar must be an array');
  return raw.map(validateCalendarEvent);
}

/** Calendar times are parsed only as UTC instants, never in runner-local time. */
export function pollingDecision(session: SessionDefinition, now: Date): PollingDecision {
  const start = Date.parse(session.scheduledStartUtc);
  if (!Number.isFinite(start) || !session.scheduledStartUtc.endsWith('Z')) {
    throw new Error(`Session ${session.sessionId} must use a UTC scheduledStartUtc`);
  }
  const end = start + session.durationMinutes * 60_000;
  if (now.getTime() < start) return 'WAITING';
  if (now.getTime() < end) return 'IN_PROGRESS';
  if (now.getTime() <= end + 7 * 24 * 60 * 60_000) return 'DUE_FOR_CHECK';
  return 'HISTORICAL';
}

/** Executes one offline-safe run. The default provider is synthetic fixtures. */
export async function runEngine(options: EngineOptions = {}): Promise<EngineRunReport> {
  const now = options.now ?? new Date();
  const nowUtc = now.toISOString();
  const calendar = options.calendar ?? loadCalendar();
  const provider = options.provider ?? new FixtureProvider();
  let state = loadState(options.statePath);
  const report: EngineRunReport = { processed: [], skipped: [], warnings: [], state };

  for (const event of calendar) {
    for (const session of event.sessions) {
      const decision = pollingDecision(session, now);
      let context = state.sessions[session.sessionId] ?? initSession(event, session, nowUtc);
      state = putContext(state, context);
      if (decision === 'WAITING' || decision === 'IN_PROGRESS') {
        report.skipped.push(`${session.sessionId}:${decision}`);
        continue;
      }
      if (decision === 'HISTORICAL' && !options.allowHistoricalCorrections) {
        report.skipped.push(`${session.sessionId}:HISTORICAL`);
        continue;
      }
      if (context.state === 'FINAL' && !options.allowHistoricalCorrections) {
        report.skipped.push(`${session.sessionId}:FINAL`);
        continue;
      }
      if (context.state === 'SCHEDULED') {
        context = transitionSession(context, 'RUNNING', nowUtc);
        state = putContext(state, context);
      }
      try {
        const fetched = await provider.fetchSessionData(event, session, nowUtc);
        const verification = verifySessionResult(fetched);
        if (!verification.valid) throw new Error(verification.errors.join('; '));
        if (
          now.getTime() < Date.parse(fetched.endUtc) ||
          fetched.classificationStatus === 'PENDING'
        ) {
          if (context.state === 'RUNNING') {
            context = transitionSession(context, 'RESULT_PENDING', nowUtc);
            state = putContext(state, context);
          }
          report.skipped.push(`${session.sessionId}:ACTUAL_COMPLETION_PENDING`);
          continue;
        }
        if (context.state === 'FINAL' && fetched.classificationStatus !== 'CORRECTED') {
          report.skipped.push(`${session.sessionId}:FINAL`);
          continue;
        }
        if (context.state !== 'FINAL' && fetched.classificationStatus === 'CORRECTED') {
          throw new Error('A corrected classification requires a recorded final classification');
        }
        const desiredStatus = fetched.classificationStatus;
        const result: SessionResult = fetched;
        const appended = appendRevision(state, context, result, nowUtc);
        state = appended.state;
        context = appended.context;
        if (!appended.duplicate) {
          const targetState = desiredStatus === 'CORRECTED' ? 'CORRECTED' : desiredStatus;
          context = transitionSession(context, targetState, nowUtc);
          state = putContext(state, context);
          report.processed.push(`${session.sessionId}:${targetState}`);
        } else {
          report.skipped.push(`${session.sessionId}:DUPLICATE`);
        }
      } catch (error) {
        if (context.state === 'RUNNING') {
          context = transitionSession(context, 'RESULT_PENDING', nowUtc);
          state = putContext(state, context);
        }
        report.warnings.push(
          `${session.sessionId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
  saveState(state, options.statePath);
  return { ...report, state };
}

function putContext(state: EngineState, context: EngineState['sessions'][string]): EngineState {
  return { ...state, sessions: { ...state.sessions, [context.sessionId]: context } };
}

function validateCalendarEvent(value: unknown): CalendarEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Calendar event must be an object');
  const event = value as Record<string, unknown>;
  if (
    typeof event.eventId !== 'string' ||
    typeof event.name !== 'string' ||
    !Array.isArray(event.sessions)
  ) {
    throw new Error('Calendar event is missing required fields');
  }
  return {
    eventId: event.eventId,
    name: event.name,
    sessions: event.sessions.map(validateSession),
  };
}

function validateSession(value: unknown): SessionDefinition {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Calendar session must be an object');
  const session = value as Record<string, unknown>;
  if (
    typeof session.sessionId !== 'string' ||
    typeof session.scheduledStartUtc !== 'string' ||
    typeof session.durationMinutes !== 'number' ||
    !['Practice', 'Qualifying', 'Sprint', 'SprintQualifying', 'Race'].includes(
      session.type as string,
    )
  )
    throw new Error('Calendar session is missing required fields');
  return {
    type: session.type as SessionDefinition['type'],
    sessionId: session.sessionId,
    scheduledStartUtc: session.scheduledStartUtc,
    durationMinutes: session.durationMinutes,
    ...(session.providers ? { providers: validateProviders(session.providers) } : {}),
  };
}

function validateProviders(value: unknown): SessionDefinition['providers'] {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Calendar providers must be an object');
  const providers = value as Record<string, unknown>;
  const result: NonNullable<SessionDefinition['providers']> = {};
  if (providers.openf1 !== undefined)
    result.openf1 = validateProviderReference(providers.openf1, 'openf1');
  if (providers.jolpica !== undefined)
    result.jolpica = validateProviderReference(providers.jolpica, 'jolpica');
  return result;
}

function validateProviderReference(value: unknown, provider: string): ProviderSessionReference {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`Calendar ${provider} mapping must be an object`);
  const reference = value as Record<string, unknown>;
  const mapping = reference.mappingVerification;
  if (
    (reference.sessionKey !== undefined &&
      (!Number.isInteger(reference.sessionKey) || Number(reference.sessionKey) <= 0)) ||
    (reference.year !== undefined &&
      (!Number.isInteger(reference.year) || Number(reference.year) <= 0)) ||
    (reference.round !== undefined &&
      (!Number.isInteger(reference.round) || Number(reference.round) <= 0)) ||
    (mapping !== undefined && !validMappingVerification(mapping))
  ) {
    throw new Error(`Calendar ${provider} mapping is invalid`);
  }
  return reference as unknown as ProviderSessionReference;
}

function validMappingVerification(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const mapping = value as Record<string, unknown>;
  return (
    (mapping.status === 'SYNTHETIC' || mapping.status === 'REVIEWED') &&
    typeof mapping.verifiedBy === 'string' &&
    mapping.verifiedBy.length > 0 &&
    typeof mapping.verifiedAtUtc === 'string' &&
    mapping.verifiedAtUtc.endsWith('Z') &&
    Number.isFinite(Date.parse(mapping.verifiedAtUtc)) &&
    typeof mapping.evidenceReference === 'string' &&
    mapping.evidenceReference.length > 0
  );
}
