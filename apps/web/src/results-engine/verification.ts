import { sessionTypes } from './types.ts';
import type { SessionResult, VerificationReport } from './types.ts';

function isIsoUtc(value: string): boolean {
  return Number.isFinite(Date.parse(value)) && /(?:Z|[+-]\d\d:\d\d)$/.test(value);
}

/** Reject malformed canonical records before they enter durable state. */
export function verifySessionResult(result: SessionResult): VerificationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!result.eventId) errors.push('Missing eventId');
  if (!result.sessionId) errors.push('Missing sessionId');
  if (!sessionTypes.includes(result.type)) errors.push('Unsupported session type');
  if (!isIsoUtc(result.startUtc)) errors.push('startUtc must be an ISO UTC timestamp');
  if (!isIsoUtc(result.endUtc)) errors.push('endUtc must be an ISO UTC timestamp');
  if (Date.parse(result.endUtc) < Date.parse(result.startUtc))
    errors.push('endUtc precedes startUtc');
  if (!['PENDING', 'PROVISIONAL', 'FINAL', 'CORRECTED'].includes(result.classificationStatus)) {
    errors.push('Unsupported classification status');
  }
  if (!result.source?.provider || !result.source?.sourceReference)
    errors.push('Missing result source');
  if (!['SYNTHETIC', 'RESTRICTED', 'APPROVED', 'UNKNOWN'].includes(result.source?.license)) {
    errors.push('Unsupported source license');
  }
  if (!isIsoUtc(result.source?.retrievedAtUtc ?? ''))
    errors.push('Invalid source retrieval timestamp');
  if (!Array.isArray(result.driverResults) || result.driverResults.length === 0) {
    errors.push('driverResults must be a non-empty array');
  }

  const driverIds = new Set<string>();
  const positions = new Set<number>();
  for (const driverResult of result.driverResults) {
    const driverId = driverResult.driver?.driverId;
    if (!driverId || !driverResult.driver.fullName)
      errors.push('Driver result is missing identity fields');
    else if (driverIds.has(driverId)) errors.push(`Duplicate driverId ${driverId}`);
    else driverIds.add(driverId);
    if (driverResult.position !== null) {
      if (!Number.isInteger(driverResult.position) || driverResult.position < 1) {
        errors.push(`Invalid position for ${driverId ?? 'unknown driver'}`);
      } else if (positions.has(driverResult.position)) {
        errors.push(`Duplicate position ${driverResult.position}`);
      } else positions.add(driverResult.position);
    }
    if (
      driverResult.points !== null &&
      (!Number.isFinite(driverResult.points) || driverResult.points < 0)
    ) {
      errors.push(`Invalid points for ${driverId ?? 'unknown driver'}`);
    }
    if (
      driverResult.laps !== null &&
      (!Number.isInteger(driverResult.laps) || driverResult.laps < 0)
    ) {
      errors.push(`Invalid laps for ${driverId ?? 'unknown driver'}`);
    }
  }
  if (positions.size > 0 && !positions.has(1))
    warnings.push('Classification has no winner position');
  return { valid: errors.length === 0, errors, warnings };
}
