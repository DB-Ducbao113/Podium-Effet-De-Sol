import type { ResultSessionKey } from '../../results-engine/availability';

export type ClassificationPresentation =
  | 'final'
  | 'provisional'
  | 'summary'
  | 'scheduled'
  | 'unavailable';

export function resolveResultRound(
  availableRounds: readonly number[],
  latestRound: number | null,
  requestedRound: number,
): number | null {
  return availableRounds.includes(requestedRound)
    ? requestedRound
    : (latestRound ?? availableRounds[0] ?? null);
}

export function resolveResultSession(
  sessions: readonly ResultSessionKey[],
  availableSessions: readonly ResultSessionKey[],
  requestedSession: string | null,
): ResultSessionKey | undefined {
  const requested = requestedSession as ResultSessionKey | null;
  if (requested && sessions.includes(requested)) return requested;
  return availableSessions[0] ?? sessions[0];
}

export function getClassificationPresentation(
  classification: { status?: string; partial?: boolean } | null,
  isScheduled: boolean,
): ClassificationPresentation {
  if (!classification) return isScheduled ? 'scheduled' : 'unavailable';
  if (classification.partial) return 'summary';
  return classification.status === 'final' ? 'final' : 'provisional';
}
