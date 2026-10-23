import {
  DetailedRaceResult,
  DetailedRaceResultEntry,
  SeasonYear,
  TeamId,
  F1SyncMetadata,
  UNKNOWN_TEAM_ID,
} from '../types';
import { DETAILED_RACE_RESULTS_2024 } from '../data/championship/detailedResults2024';
import { DETAILED_RACE_RESULTS_2026 } from '../data/championship/detailedResults2026';
import { DRIVER_STANDINGS_2026 } from '../data/championship/standings';
import { attachOpenF1SprintResults } from '../data/championship/openF1SprintBridge';

const STORAGE_DETAILED_RESULTS_KEY = 'f1_detailed_results_v3';
const STORAGE_SYNC_META_KEY = 'f1_sync_meta_v2';
const STORAGE_SYNC_REVIEW_KEY = 'f1_sync_review_v1';
const STORAGE_DISMISSED_REVIEW_KEY = 'f1_sync_review_dismissed_v1';
const JOLPICA_API_BASE = '/api/jolpica/ergast/f1';

function buildJolpicaUrl(
  season: SeasonYear,
  type: 'results' | 'sprint',
  limit: number,
  offset: number,
): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    return `${JOLPICA_API_BASE}/${season}/${type}.json?limit=${limit}&offset=${offset}`;
  }

  const params = new URLSearchParams({
    path: `ergast/f1/${season}/${type}.json`,
    limit: String(limit),
    offset: String(offset),
  });
  return `/api/jolpica?${params.toString()}`;
}

// Initial baseline data mapped by season
export const INITIAL_DETAILED_RESULTS: Record<SeasonYear, DetailedRaceResult[]> = {
  2024: DETAILED_RACE_RESULTS_2024,
  2025: [], // 2025 transition season
  2026: DETAILED_RACE_RESULTS_2026,
};

// Map Ergast/Jolpica constructor IDs to our internal TeamId
const CONSTRUCTOR_MAP: Record<string, TeamId> = {
  red_bull: 'redbull',
  cadillac: 'cadillac',
  ferrari: 'ferrari',
  mclaren: 'mclaren',
  mercedes: 'mercedes',
  aston_martin: 'astonmartin',
  alpine: 'alpine',
  rb: 'racingbulls',
  sauber: 'audi',
  audi: 'audi',
  haas: 'haas',
  williams: 'williams',
};

export function mapConstructorId(constructorId: string | undefined): TeamId {
  if (constructorId && CONSTRUCTOR_MAP[constructorId]) return CONSTRUCTOR_MAP[constructorId];
  // Never credit an unmapped constructor to another team: park under 'unknown'.
  if (typeof console !== 'undefined') {
    console.warn(`Unmapped constructorId "${constructorId ?? ''}", falling back to 'unknown'.`);
  }
  return UNKNOWN_TEAM_ID;
}
// Jolpica returns e.g. "max_verstappen"/"arvid_lindblad" while the app's standings
// baseline keys drivers as "verstappen"/"lindblad"; without this mapping a freshly
// synced round creates ghost duplicate drivers instead of crediting the real one.
const DRIVER_MAP: Record<string, string> = {
  max_verstappen: 'verstappen',
  arvid_lindblad: 'lindblad',
};

const CANONICAL_DRIVER_IDS = new Set(DRIVER_STANDINGS_2026.map((driver) => driver.driverId));

export function normalizeDriverId(driverId: string | undefined): string {
  if (!driverId) return 'unknown';
  if (DRIVER_MAP[driverId]) return DRIVER_MAP[driverId];

  const surname = driverId.split('_').pop();
  return surname && CANONICAL_DRIVER_IDS.has(surname) ? surname : driverId;
}

function normalizeRaceResults(races: DetailedRaceResult[]): DetailedRaceResult[] {
  return (Array.isArray(races) ? races : []).map((race) => {
    if (!race) return race;
    const entries = Array.isArray(race.entries) ? race.entries : [];
    const normalizedEntries = entries.map((entry) => {
      if (!entry) return entry;
      const { sprintPoints: _legacySprintPoints, ...raceEntry } = entry;
      return { ...raceEntry, driverId: normalizeDriverId(entry.driverId) };
    });
    const legacySprintEntries = entries
      .filter((entry) => entry?.sprintPoints)
      .map((entry) => ({
        ...entry,
        driverId: normalizeDriverId(entry.driverId),
        points: entry.sprintPoints || 0,
        sprintPoints: undefined,
      }));
    const sprintEntries =
      race.sprintEntries && race.sprintEntries.length > 0
        ? race.sprintEntries.map((entry) => ({
            ...entry,
            driverId: normalizeDriverId(entry.driverId),
          }))
        : legacySprintEntries;
    return {
      ...race,
      entries: normalizedEntries,
      sprintEntries,
    };
  });
}

/**
 * Reconcile baseline static results with dynamic client cache.
 * Cached (synced or user-applied) results win whenever they carry a real
 * classification — otherwise every reload would silently roll accepted data
 * back to the static snapshot and re-trigger the sync review banner.
 * The baseline snapshot only fills rounds the cache has no entries for.
 */
export function reconcileSeasonRaces(
  baseline: DetailedRaceResult[],
  cached: DetailedRaceResult[],
): DetailedRaceResult[] {
  const raceMap = new Map<number, DetailedRaceResult>();
  const hasEntries = (race: DetailedRaceResult | undefined): boolean =>
    Boolean(race && Array.isArray(race.entries) && race.entries.length > 0);

  for (const race of cached) {
    if (
      race &&
      typeof race.round === 'number' &&
      !race.id?.includes('simulated') &&
      hasEntries(race)
    ) {
      raceMap.set(race.round, race);
    }
  }
  for (const race of baseline) {
    if (race && typeof race.round === 'number' && !hasEntries(raceMap.get(race.round))) {
      raceMap.set(race.round, race);
    }
  }
  // Keep cached shells (scheduled rounds, sprint-only bridges) not covered above.
  for (const race of cached) {
    if (race && typeof race.round === 'number' && !race.id?.includes('simulated')) {
      if (!raceMap.has(race.round)) raceMap.set(race.round, race);
    }
  }
  return Array.from(raceMap.values()).sort((a, b) => a.round - b.round);
}

/**
 * Load persisted results from localStorage, merging cleanly with initial baseline
 */
export function loadSavedDetailedResults(): Record<SeasonYear, DetailedRaceResult[]> {
  try {
    const raw = localStorage.getItem(STORAGE_DETAILED_RESULTS_KEY);
    if (raw) {
      const parsed: Record<SeasonYear, DetailedRaceResult[]> = JSON.parse(raw);
      return attachOpenF1SprintResults({
        2024:
          parsed[2024] && parsed[2024].length > 0
            ? normalizeRaceResults(parsed[2024])
            : INITIAL_DETAILED_RESULTS[2024],
        2025: normalizeRaceResults(parsed[2025] || INITIAL_DETAILED_RESULTS[2025]),
        2026: reconcileSeasonRaces(
          INITIAL_DETAILED_RESULTS[2026] || [],
          normalizeRaceResults(parsed[2026] || []),
        ),
      });
    }
  } catch {
    // ignore
  }
  return attachOpenF1SprintResults(INITIAL_DETAILED_RESULTS);
}

/**
 * Remove any leftover interactive-sync review snapshot persisted by older
 * builds. The sync pipeline now applies reconciled results automatically, so a
 * stale review must never re-appear or block future syncs.
 */
export function clearStaleSyncReview(): void {
  try {
    localStorage.removeItem(STORAGE_SYNC_REVIEW_KEY);
    localStorage.removeItem(STORAGE_DISMISSED_REVIEW_KEY);
  } catch {
    // Continue with in-memory reconciliation if browser storage is unavailable.
  }
}

/**
 * Save updated results to localStorage (ready for Supabase database sync)
 */
export function persistDetailedResults(data: Record<SeasonYear, DetailedRaceResult[]>): void {
  try {
    localStorage.setItem(STORAGE_DETAILED_RESULTS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Load or initialize sync metadata
 */
export function loadSyncMetadata(): F1SyncMetadata {
  try {
    const raw = localStorage.getItem(STORAGE_SYNC_META_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    lastSyncTimestamp: 'Chưa đồng bộ',
    syncStatus: 'idle',
    source: 'Local snapshot',
    completedRoundsCount: INITIAL_DETAILED_RESULTS[2026].length,
    message: 'Đang chờ kiểm tra dữ liệu mới từ Jolpica.',
  };
}

export function persistSyncMetadata(meta: F1SyncMetadata): void {
  try {
    localStorage.setItem(STORAGE_SYNC_META_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

class PartialSyncError extends Error {
  partial = true;
  loadedPages: number;
  constructor(message: string, loadedPages: number) {
    super(message);
    this.loadedPages = loadedPages;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(attempt: number, retryAfter: string | null): number {
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 30_000);
  }
  return Math.min(1000 * 2 ** attempt, 8000);
}

/**
 * Single Jolpica page fetch with bounded retry (max attempts + total budget).
 * Retries 429/5xx with backoff and honors numeric Retry-After; other errors
 * throw immediately. The total budget covers sleeps AND fetch time: each
 * request timeout shrinks to the remaining budget.
 */
async function fetchJolpicaPage(url: string): Promise<Response> {
  const MAX_ATTEMPTS = 3;
  const TOTAL_BUDGET_MS = 30_000;
  const REQUEST_TIMEOUT_MS = 12_000;
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let lastStatus = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new Error(`Jolpica endpoint timed out (retry budget of 30s exhausted)`);
    }
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(Math.min(REQUEST_TIMEOUT_MS, remaining)),
    });
    if (res.ok) return res;
    lastStatus = res.status;
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS - 1) {
      throw new Error(`Jolpica endpoint returned ${res.status}`);
    }
    const delay = retryDelayMs(attempt, res.headers.get('Retry-After'));
    if (Date.now() + delay >= deadline) {
      throw new Error(`Jolpica endpoint returned ${res.status} (retry budget exhausted)`);
    }
    await sleep(delay);
  }
  throw new Error(`Jolpica endpoint returned ${lastStatus}`);
}

/**
 * Paginated fetch helper for Jolpica API (capped at 100 entries per request,
 * at most 5 pages). Throws PartialSyncError when a later page fails after
 * earlier pages succeeded, so callers never report partial data as success.
 */
async function fetchAllRacesFromJolpica(
  season: SeasonYear,
  type: 'results' | 'sprint' = 'results',
): Promise<any[]> {
  const LIMIT = 100;
  const MAX_PAGES = 5;
  let offset = 0;
  let pages = 0;
  const raceMap = new Map<number, any>();

  while (true) {
    const url = buildJolpicaUrl(season, type, LIMIT, offset);
    let res: Response;
    try {
      res = await fetchJolpicaPage(url);
    } catch (err) {
      if (raceMap.size === 0) throw err;
      throw new PartialSyncError(
        `Jolpica ${type} page ${pages + 1} failed after ${pages} page(s) loaded`,
        pages,
      );
    }
    const data = await res.json();
    const races = data?.MRData?.RaceTable?.Races || [];
    const rawTotal = parseInt(data?.MRData?.total || '0', 10);
    const safeRawTotal = Number.isFinite(rawTotal) && rawTotal >= 0 ? rawTotal : 0;
    // The cap truncates the season: surface it as partial, never as success.
    if (pages === 0 && safeRawTotal > LIMIT * MAX_PAGES) {
      throw new PartialSyncError(
        `Jolpica ${type} total ${safeRawTotal} exceeds the ${LIMIT * MAX_PAGES}-entry page cap`,
        0,
      );
    }
    const total = Math.min(safeRawTotal, LIMIT * MAX_PAGES);

    for (const r of races) {
      const rnd = parseInt(r.round, 10);
      if (!Number.isFinite(rnd)) continue;
      if (!raceMap.has(rnd)) {
        raceMap.set(rnd, {
          ...r,
          Results: r.Results ? [...r.Results] : [],
          SprintResults: r.SprintResults ? [...r.SprintResults] : [],
        });
      } else {
        const existing = raceMap.get(rnd)!;
        const seenDrivers = new Set((existing.Results || []).map((e: any) => e?.Driver?.driverId));
        if (r.Results) {
          for (const e of r.Results) {
            if (e?.Driver?.driverId && seenDrivers.has(e.Driver.driverId)) continue;
            seenDrivers.add(e?.Driver?.driverId);
            existing.Results.push(e);
          }
        }
        const seenSprint = new Set(
          (existing.SprintResults || []).map((e: any) => e?.Driver?.driverId),
        );
        if (r.SprintResults) {
          for (const e of r.SprintResults) {
            if (e?.Driver?.driverId && seenSprint.has(e.Driver.driverId)) continue;
            seenSprint.add(e?.Driver?.driverId);
            existing.SprintResults.push(e);
          }
        }
      }
    }

    pages += 1;
    offset += LIMIT;
    if (offset >= total || races.length === 0 || pages >= MAX_PAGES) break;
  }

  return [...raceMap.values()].sort((a, b) => parseInt(a.round, 10) - parseInt(b.round, 10));
}

/**
 * Sync F1 Season Data:
 * Fetches race and sprint classifications from Jolpica, retaining the last saved snapshot if unavailable
 */
export async function syncF1SeasonData(
  season: SeasonYear,
  existingResults: DetailedRaceResult[],
): Promise<{
  success: boolean;
  partial?: boolean;
  results: DetailedRaceResult[];
  message: string;
  source: string;
}> {
  try {
    // Try live Ergast/Jolpica API with full pagination
    const racesApi = await fetchAllRacesFromJolpica(season, 'results');
    let sprintRaces: any[] = [];
    let sprintSyncWarning = '';
    try {
      sprintRaces = await fetchAllRacesFromJolpica(season, 'sprint');
    } catch (error) {
      sprintSyncWarning = ' Không thể làm mới kết quả Sprint; vẫn giữ điểm Sprint đã lưu gần nhất.';
      console.warn('Sprint classification refresh failed:', error);
    }

    if (racesApi.length > 0 || sprintRaces.length > 0) {
      const syncedAt = new Date().toISOString();
      const racesByRound = new Map<number, any>();
      racesApi.forEach((race: any) => racesByRound.set(parseInt(race.round, 10), race));
      sprintRaces.forEach((race: any) => {
        const round = parseInt(race.round, 10);
        const existing = racesByRound.get(round);
        racesByRound.set(round, {
          ...race,
          ...existing,
          SprintResults: race.SprintResults || existing?.SprintResults || [],
        });
      });

      const savedByRound = new Map(existingResults.map((race) => [race.round, race]));
      const transformed = [...racesByRound.values()].map((race: any): DetailedRaceResult | null => {
        const entries: DetailedRaceResultEntry[] = (race.Results || []).map((res: any) => {
          const teamId = mapConstructorId(res.Constructor?.constructorId);
          const pos = parseInt(res.position, 10) || 20;
          return {
            position: pos,
            driverId: normalizeDriverId(res.Driver?.driverId),
            driverName: `${res.Driver?.givenName || ''} ${res.Driver?.familyName || ''}`.trim(),
            driverCode: res.Driver?.code || 'F1',
            driverNumber: parseInt(res.Driver?.permanentNumber, 10) || undefined,
            teamId,
            teamName: res.Constructor?.name || 'Constructor',
            laps: parseInt(res.laps, 10) || 0,
            status: res.status || 'Finished',
            timeOrGap: res.Time?.time || res.status || '+1 Lap',
            points: parseFloat(res.points) || 0,
            fastestLap: res.FastestLap?.rank === '1',
            fastestLapTime: res.FastestLap?.Time?.time,
            gridPosition: parseInt(res.grid, 10) || undefined,
          };
        });
        const fetchedSprintEntries: DetailedRaceResultEntry[] = (race.SprintResults || []).map(
          (res: any, index: number) => ({
            position: parseInt(res.position, 10) || index + 1,
            driverId: normalizeDriverId(res.Driver?.driverId),
            driverName: `${res.Driver?.givenName || ''} ${res.Driver?.familyName || ''}`.trim(),
            driverCode: res.Driver?.code || 'F1',
            driverNumber: parseInt(res.Driver?.permanentNumber, 10) || undefined,
            teamId: mapConstructorId(res.Constructor?.constructorId),
            teamName: res.Constructor?.name || 'Constructor',
            laps: parseInt(res.laps, 10) || 0,
            status: res.status || 'Finished',
            timeOrGap: res.Time?.time || res.status || '',
            points: parseFloat(res.points) || 0,
            gridPosition: parseInt(res.grid, 10) || undefined,
          }),
        );
        const savedRace = savedByRound.get(parseInt(race.round, 10));
        const sprintEntries =
          fetchedSprintEntries.length > 0
            ? fetchedSprintEntries
            : savedRace?.sprintEntries ||
              savedRace?.entries
                .filter((entry) => entry.sprintPoints)
                .map((entry) => ({
                  ...entry,
                  points: entry.sprintPoints || 0,
                  sprintPoints: undefined,
                })) ||
              [];
        // Provenance for the attach step: freshly fetched entries are
        // official; reused saved entries keep their marker (provisional saved
        // data stays replaceable, official saved data stays protected).
        const sprintProvenance =
          fetchedSprintEntries.length > 0
            ? ('official' as const)
            : sprintEntries.length > 0
              ? (savedRace?.sprintProvenance ?? ('provisional' as const))
              : undefined;
        const round = parseInt(race.round, 10);
        if (!Number.isFinite(round)) return null;

        const safeRaceName =
          typeof race.raceName === 'string' && race.raceName.length > 0
            ? race.raceName
            : `Round ${Number.isFinite(round) ? round : 'unknown'}`;

        return {
          id: `race-${season}-r${race.round}-${safeRaceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          season,
          round,
          grandPrix: safeRaceName,
          officialName: safeRaceName,
          circuit: race.Circuit?.circuitName || 'Circuit',
          location: race.Circuit?.Location?.locality,
          country: race.Circuit?.Location?.country,
          date: race.date,
          dataSource: 'Jolpica F1 API',
          dataUpdatedAt: syncedAt,
          status: entries.length > 0 ? 'completed' : 'scheduled',
          lapsTotal: entries[0]?.laps || 57,
          winner: entries[0]
            ? {
                driver: entries[0].driverName,
                team: entries[0].teamName,
                time: entries[0].timeOrGap,
              }
            : undefined,
          fastestLap: entries.find((e) => e.fastestLap)
            ? {
                driver: entries.find((e) => e.fastestLap)!.driverName,
                team: entries.find((e) => e.fastestLap)!.teamName,
                time: entries.find((e) => e.fastestLap)!.fastestLapTime || '',
              }
            : undefined,
          entries,
          sprintEntries,
          sprintProvenance,
        };
      });

      const raceByRound = new Map(
        transformed
          .filter((race): race is DetailedRaceResult => race !== null)
          .map((race) => [race.round, race] as const),
      );
      // Baseline only fills rounds missing from sync — never overwrites
      // successfully synced rounds (see BASELINE_CUTOFF_BY_SEASON).
      for (const race of INITIAL_DETAILED_RESULTS[season] || []) {
        if (race && typeof race.round === 'number' && !raceByRound.has(race.round)) {
          raceByRound.set(race.round, race);
        }
      }
      const syncedResults = attachOpenF1SprintResults({
        ...INITIAL_DETAILED_RESULTS,
        [season]: [...raceByRound.values()].sort((a, b) => a.round - b.round),
      })[season];

      return {
        success: true,
        results: syncedResults,
        message: `Đã đồng bộ ${syncedResults.length} chặng, gồm cả điểm Sprint nếu có, từ Jolpica.${sprintSyncWarning}`,
        source: 'Jolpica F1 API',
      };
    }
  } catch (err) {
    // Network, timeout, or partial-page failure: keep the last saved snapshot
    // visible, but report honestly — never as success.
    const partial = err instanceof PartialSyncError;
    const fallback =
      existingResults.length > 0 ? existingResults : INITIAL_DETAILED_RESULTS[season];
    return {
      success: false,
      partial: partial || undefined,
      results: fallback,
      message: partial
        ? 'Đồng bộ dở dang (một số trang lỗi); đang giữ nguyên dữ liệu đã lưu, không báo thành công.'
        : 'Không thể kết nối Jolpica lúc này; đang giữ dữ liệu đã lưu gần nhất.',
      source: 'Local saved snapshot',
    };
  }

  // Empty upstream payload: keep snapshot, report honestly (never success).
  const emptyFallback =
    existingResults.length > 0 ? existingResults : INITIAL_DETAILED_RESULTS[season];
  return {
    success: false,
    results: emptyFallback,
    message: 'Jolpica chua co du lieu moi; dang giu du lieu da luu gan nhat.',
    source: 'Local saved snapshot',
  };
}
