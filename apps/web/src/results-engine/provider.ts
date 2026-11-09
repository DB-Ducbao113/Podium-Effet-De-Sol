import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  CalendarEvent,
  DriverResult,
  ProviderSessionReference,
  SessionDefinition,
  SessionResult,
} from './types.ts';
import { verifySessionResult } from './verification.ts';

export interface ResultsProvider {
  readonly id: SessionResult['source']['provider'];
  readonly enabledForPublication: boolean;
  fetchSessionData(
    event: CalendarEvent,
    session: SessionDefinition,
    nowUtc: string,
  ): Promise<SessionResult>;
}

export class ProviderResponseError extends Error {}

/** Offline test provider. Fixture names match the canonical sessionId exactly. */
export class FixtureProvider implements ResultsProvider {
  readonly id = 'fixture' as const;
  readonly enabledForPublication = false;
  private readonly fixtureDirectory: string;

  constructor(fixtureDirectory = join(process.cwd(), 'src', 'results-engine', 'fixtures')) {
    this.fixtureDirectory = fixtureDirectory;
  }

  async fetchSessionData(
    event: CalendarEvent,
    session: SessionDefinition,
    _nowUtc: string,
  ): Promise<SessionResult> {
    const path = join(this.fixtureDirectory, `${session.sessionId}.json`);
    const raw: unknown = JSON.parse(readFileSync(path, 'utf8'));
    const result = parseCanonicalFixture(raw);
    if (
      result.eventId !== event.eventId ||
      result.sessionId !== session.sessionId ||
      result.type !== session.type
    ) {
      throw new ProviderResponseError(`Fixture identity does not match ${session.sessionId}`);
    }
    return result;
  }
}

type FetchJson = (url: string) => Promise<unknown>;

/**
 * Read-only adapter for OpenF1's documented `/v1/sessions`, `/v1/session_result`,
 * and `/v1/drivers` endpoints. It is intentionally not selected by the engine
 * unless a caller explicitly injects it, because its publication rights are restricted.
 */
export class OpenF1Provider implements ResultsProvider {
  readonly id = 'openf1' as const;
  readonly enabledForPublication = false;
  private readonly fetchJson: FetchJson;

  constructor(fetchJson: FetchJson = fetchJsonFromNetwork) {
    this.fetchJson = fetchJson;
  }

  async fetchSessionData(
    event: CalendarEvent,
    session: SessionDefinition,
    nowUtc: string,
  ): Promise<SessionResult> {
    const reference = requireOpenF1Reference(session.providers?.openf1);
    const encodedKey = encodeURIComponent(String(reference.sessionKey));
    const [sessions, classifications, drivers] = await Promise.all([
      this.fetchJson(`https://api.openf1.org/v1/sessions?session_key=${encodedKey}`),
      this.fetchJson(`https://api.openf1.org/v1/session_result?session_key=${encodedKey}`),
      this.fetchJson(`https://api.openf1.org/v1/drivers?session_key=${encodedKey}`),
    ]);
    return adaptOpenF1Response({
      event,
      session,
      nowUtc,
      sessions,
      classifications,
      drivers,
      reference,
    });
  }
}

/**
 * Read-only adapter for Jolpica's documented Ergast-compatible URL:
 * `https://api.jolpi.ca/ergast/f1/{year}/{round}/results.json`.
 * It is restricted from commercial publication until rights approval is recorded.
 */
export class JolpicaProvider implements ResultsProvider {
  readonly id = 'jolpica' as const;
  readonly enabledForPublication = false;
  private readonly fetchJson: FetchJson;

  constructor(fetchJson: FetchJson = fetchJsonFromNetwork) {
    this.fetchJson = fetchJson;
  }

  async fetchSessionData(
    event: CalendarEvent,
    session: SessionDefinition,
    nowUtc: string,
  ): Promise<SessionResult> {
    const reference = requireJolpicaReference(session.providers?.jolpica);
    const url = `https://api.jolpi.ca/ergast/f1/${reference.year}/${reference.round}/results.json`;
    const response = await this.fetchJson(url);
    return adaptJolpicaResponse({ event, session, nowUtc, response, reference });
  }
}

export function adaptOpenF1Response(input: {
  event: CalendarEvent;
  session: SessionDefinition;
  nowUtc: string;
  sessions: unknown;
  classifications: unknown;
  drivers: unknown;
  reference: ProviderSessionReference;
}): SessionResult {
  const remoteSession = expectSingleObjectArray(input.sessions, 'OpenF1 sessions');
  const startUtc = expectString(remoteSession.date_start, 'OpenF1 session date_start');
  const endUtc = expectString(remoteSession.date_end, 'OpenF1 session date_end');
  const rows = expectObjectArray(input.classifications, 'OpenF1 session_result');
  const driverRows = expectObjectArray(input.drivers, 'OpenF1 drivers');
  const drivers = new Map(
    driverRows.map((row) => [expectNumber(row.driver_number, 'OpenF1 driver number'), row]),
  );
  const driverResults: DriverResult[] = rows.map((row) => {
    const number = expectNumber(row.driver_number, 'OpenF1 result driver_number');
    const driver = drivers.get(number);
    if (!driver) throw new ProviderResponseError(`OpenF1 driver ${number} was not returned`);
    return {
      driver: {
        driverId: String(number),
        fullName: expectString(driver.full_name, 'OpenF1 driver full_name'),
        country: typeof driver.country_code === 'string' ? driver.country_code : null,
      },
      position: optionalPositiveInteger(row.position, 'OpenF1 result position'),
      laps: optionalNonNegativeInteger(row.number_of_laps, 'OpenF1 result number_of_laps'),
      time: printableDuration(row.duration),
      points: null,
      status: classifyOpenF1Status(row),
      penalties: [],
    };
  });
  return checkedCanonical({
    eventId: input.event.eventId,
    sessionId: input.session.sessionId,
    type: input.session.type,
    startUtc,
    endUtc,
    classificationStatus: 'PROVISIONAL',
    driverResults,
    source: {
      provider: 'openf1',
      license: 'RESTRICTED',
      retrievedAtUtc: input.nowUtc,
      sourceReference: `session_key=${input.reference.sessionKey}`,
    },
  });
}

export function adaptJolpicaResponse(input: {
  event: CalendarEvent;
  session: SessionDefinition;
  nowUtc: string;
  response: unknown;
  reference: ProviderSessionReference;
}): SessionResult {
  const root = expectObject(input.response, 'Jolpica response');
  const metadata = expectObject(root.MRData, 'Jolpica MRData');
  const raceTable = expectObject(metadata.RaceTable, 'Jolpica RaceTable');
  const race = expectSingleObjectArray(raceTable.Races, 'Jolpica RaceTable.Races');
  const rows = expectObjectArray(race.Results, 'Jolpica Results');
  const driverResults: DriverResult[] = rows.map((row) => {
    const driver = expectObject(row.Driver, 'Jolpica Driver');
    const time =
      row.Time === undefined
        ? null
        : expectString(expectObject(row.Time, 'Jolpica Time').time, 'Jolpica Time.time');
    return {
      driver: {
        driverId: expectString(driver.driverId, 'Jolpica Driver.driverId'),
        fullName: `${expectString(driver.givenName, 'Jolpica Driver.givenName')} ${expectString(driver.familyName, 'Jolpica Driver.familyName')}`,
        country: typeof driver.nationality === 'string' ? driver.nationality : null,
      },
      position: optionalPositiveInteger(row.position, 'Jolpica position'),
      laps: optionalNonNegativeInteger(row.laps, 'Jolpica laps'),
      time,
      points: optionalNumber(row.points, 'Jolpica points'),
      status: expectString(row.status, 'Jolpica status'),
      penalties: [],
    };
  });
  const startUtc = `${expectString(race.date, 'Jolpica race date')}T${typeof race.time === 'string' ? race.time : '00:00:00Z'}`;
  const endUtc = new Date(
    Date.parse(startUtc) + input.session.durationMinutes * 60_000,
  ).toISOString();
  return checkedCanonical({
    eventId: input.event.eventId,
    sessionId: input.session.sessionId,
    type: input.session.type,
    startUtc,
    endUtc,
    classificationStatus: 'PROVISIONAL',
    driverResults,
    source: {
      provider: 'jolpica',
      license: 'RESTRICTED',
      retrievedAtUtc: input.nowUtc,
      sourceReference: `year=${input.reference.year};round=${input.reference.round}`,
    },
  });
}

function parseCanonicalFixture(raw: unknown): SessionResult {
  const record = expectObject(raw, 'fixture');
  const result: SessionResult = {
    eventId: expectString(record.eventId, 'fixture eventId'),
    sessionId: expectString(record.sessionId, 'fixture sessionId'),
    type: expectString(record.type, 'fixture type') as SessionResult['type'],
    startUtc: expectString(record.startUtc, 'fixture startUtc'),
    endUtc: expectString(record.endUtc, 'fixture endUtc'),
    classificationStatus: expectString(
      record.classificationStatus,
      'fixture classificationStatus',
    ) as SessionResult['classificationStatus'],
    driverResults: expectObjectArray(record.driverResults, 'fixture driverResults').map((row) => ({
      driver: {
        driverId: expectString(
          expectObject(row.driver, 'fixture driver').driverId,
          'fixture driverId',
        ),
        fullName: expectString(
          expectObject(row.driver, 'fixture driver').fullName,
          'fixture fullName',
        ),
        country:
          typeof expectObject(row.driver, 'fixture driver').country === 'string'
            ? (expectObject(row.driver, 'fixture driver').country as string)
            : null,
      },
      position: optionalPositiveInteger(row.position, 'fixture position'),
      laps: optionalNonNegativeInteger(row.laps, 'fixture laps'),
      time: typeof row.time === 'string' ? row.time : null,
      points: optionalNumber(row.points, 'fixture points'),
      status: expectString(row.status, 'fixture status'),
      penalties:
        Array.isArray(row.penalties) && row.penalties.every((value) => typeof value === 'string')
          ? row.penalties
          : [],
    })),
    source: parseFixtureSource(expectObject(record.source, 'fixture source')),
  };
  return checkedCanonical(result);
}

function checkedCanonical(result: SessionResult): SessionResult {
  const report = verifySessionResult(result);
  if (!report.valid)
    throw new ProviderResponseError(`Invalid provider response: ${report.errors.join('; ')}`);
  return result;
}

async function fetchJsonFromNetwork(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new ProviderResponseError(`Provider HTTP ${response.status} for ${url}`);
  return response.json();
}

function requireOpenF1Reference(
  reference: ProviderSessionReference | undefined,
): Required<Pick<ProviderSessionReference, 'sessionKey'>> {
  if (!reference || !Number.isInteger(reference.sessionKey))
    throw new ProviderResponseError('OpenF1 sessionKey is required');
  return { sessionKey: reference.sessionKey as number };
}

function requireJolpicaReference(
  reference: ProviderSessionReference | undefined,
): Required<Pick<ProviderSessionReference, 'year' | 'round'>> {
  if (!reference || !Number.isInteger(reference.year) || !Number.isInteger(reference.round)) {
    throw new ProviderResponseError('Jolpica year and round are required');
  }
  return { year: reference.year as number, round: reference.round as number };
}

type UnknownRecord = Record<string, unknown>;
function expectObject(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ProviderResponseError(`${label} must be an object`);
  return value as UnknownRecord;
}
function expectObjectArray(value: unknown, label: string): UnknownRecord[] {
  if (!Array.isArray(value)) throw new ProviderResponseError(`${label} must be an array`);
  return value.map((row) => expectObject(row, label));
}
function expectSingleObjectArray(value: unknown, label: string): UnknownRecord {
  const rows = expectObjectArray(value, label);
  if (rows.length !== 1)
    throw new ProviderResponseError(`${label} must contain exactly one record`);
  return rows[0];
}
function expectString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new ProviderResponseError(`${label} must be a non-empty string`);
  return value;
}
function expectNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new ProviderResponseError(`${label} must be a finite number`);
  return value;
}
function optionalPositiveInteger(value: unknown, label: string): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed =
    typeof value === 'string' || typeof value === 'number' ? Number(value) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < 1)
    throw new ProviderResponseError(`${label} must be a positive integer`);
  return parsed;
}
function optionalNonNegativeInteger(value: unknown, label: string): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed =
    typeof value === 'string' || typeof value === 'number' ? Number(value) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < 0)
    throw new ProviderResponseError(`${label} must be a non-negative integer`);
  return parsed;
}
function optionalNumber(value: unknown, label: string): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed < 0)
    throw new ProviderResponseError(`${label} must be a non-negative number`);
  return parsed;
}
function printableDuration(value: unknown): string | null {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(3) : null;
}
function classifyOpenF1Status(row: UnknownRecord): string {
  if (row.dsq === true) return 'Disqualified';
  if (row.dns === true) return 'Did not start';
  if (row.dnf === true) return 'Did not finish';
  return 'Finished';
}

function parseFixtureSource(source: UnknownRecord): SessionResult['source'] {
  const provider = expectString(source.provider, 'fixture provider');
  const license = expectString(source.license, 'fixture source license');
  if (provider !== 'fixture') throw new ProviderResponseError('Fixture provider must be fixture');
  if (
    license !== 'SYNTHETIC' &&
    license !== 'RESTRICTED' &&
    license !== 'APPROVED' &&
    license !== 'UNKNOWN'
  ) {
    throw new ProviderResponseError('Fixture source license is invalid');
  }
  return {
    provider,
    license,
    retrievedAtUtc: expectString(source.retrievedAtUtc, 'fixture source retrievedAtUtc'),
    sourceReference: expectString(source.sourceReference, 'fixture source sourceReference'),
  };
}
