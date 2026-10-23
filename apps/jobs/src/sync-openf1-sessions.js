/**
 * Persist completed Formula 1 session classifications in the repository.
 * Formula 1's public live-timing archive publishes classifications before
 * slower feeds. Write only when a complete 22-driver classification changes.
 *
 * Two sources are tried in order:
 *   1. livetiming.formula1.com (F1 official live-timing archive) — preferred.
 *   2. api.jolpi.ca (Ergast-compatible API) — fallback when the F1 archive
 *      answers 403 (bot protection) or is otherwise unreachable. Jolpica
 *      carries official qualifying (Q1/Q2/Q3) and sprint classifications,
 *      but no practice sessions and no sprint qualifying.
 *
 * Usage:
 *   node scripts/sync-openf1-sessions.js
 *   node scripts/sync-openf1-sessions.js --dry-run   (preview without writing)
 *   node scripts/sync-openf1-sessions.js --source jolpica|f1   (pin a source)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(
  path.resolve(__dirname, '../../../apps/web/src'),
  'data',
  'championship',
  'openF1SessionResults2026.json',
);
const LIVE_TIMING_BASE = 'https://livetiming.formula1.com/static';
const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const EXPECTED_GRID_SIZE = 22;
const MAX_ATTEMPTS = 6;
const RETRY_BASE_MS = 1500;
const RETRY_CAP_MS = 12000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const IS_DRY_RUN = process.argv.includes('--dry-run');
const PINNED_SOURCE = (() => {
  const argIndex = process.argv.findIndex(
    (arg) => arg === '--source' || arg.startsWith('--source='),
  );
  if (argIndex < 0) return null;
  const inline = process.argv[argIndex]?.split('=')[1];
  return inline || process.argv[argIndex + 1] || null;
})();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const jitterSleep = () => sleep(150 + Math.random() * 150);

const DRIVER_FALLBACK = {
  1: ['norris', 'Lando Norris', 'NOR', 'mclaren', 'McLaren F1 Team'],
  3: ['verstappen', 'Max Verstappen', 'VER', 'redbull', 'Oracle Red Bull Racing'],
  5: ['bortoleto', 'Gabriel Bortoleto', 'BOR', 'audi', 'Audi F1 Team'],
  6: ['hadjar', 'Isack Hadjar', 'HAD', 'redbull', 'Oracle Red Bull Racing'],
  10: ['gasly', 'Pierre Gasly', 'GAS', 'alpine', 'BWT Alpine F1 Team'],
  11: ['perez', 'Sergio Pérez', 'PER', 'cadillac', 'Cadillac F1 Team'],
  12: ['antonelli', 'Andrea Kimi Antonelli', 'ANT', 'mercedes', 'Mercedes-AMG PETRONAS F1 Team'],
  14: ['alonso', 'Fernando Alonso', 'ALO', 'astonmartin', 'Aston Martin Aramco F1 Team'],
  16: ['leclerc', 'Charles Leclerc', 'LEC', 'ferrari', 'Scuderia Ferrari HP'],
  18: ['stroll', 'Lance Stroll', 'STR', 'astonmartin', 'Aston Martin Aramco F1 Team'],
  23: ['albon', 'Alexander Albon', 'ALB', 'williams', 'Williams Racing'],
  27: ['hulkenberg', 'Nico Hülkenberg', 'HUL', 'audi', 'Audi F1 Team'],
  30: ['lawson', 'Liam Lawson', 'LAW', 'racingbulls', 'Visa Cash App Racing Bulls'],
  31: ['ocon', 'Esteban Ocon', 'OCO', 'haas', 'MoneyGram Haas F1 Team'],
  41: ['lindblad', 'Arvid Lindblad', 'LIN', 'racingbulls', 'Visa Cash App Racing Bulls'],
  43: ['colapinto', 'Franco Colapinto', 'COL', 'alpine', 'BWT Alpine F1 Team'],
  44: ['hamilton', 'Lewis Hamilton', 'HAM', 'ferrari', 'Scuderia Ferrari HP'],
  55: ['sainz', 'Carlos Sainz', 'SAI', 'williams', 'Williams Racing'],
  63: ['russell', 'George Russell', 'RUS', 'mercedes', 'Mercedes-AMG PETRONAS F1 Team'],
  77: ['bottas', 'Valtteri Bottas', 'BOT', 'cadillac', 'Cadillac F1 Team'],
  81: ['piastri', 'Oscar Piastri', 'PIA', 'mclaren', 'McLaren Mastercard F1 Team'],
  87: ['bearman', 'Oliver Bearman', 'BEA', 'haas', 'MoneyGram Haas F1 Team'],
};

// Team name/IDs → our TeamId. Tokens cover both live-timing driver names
// ("Oracle Red Bull Racing") and Jolpica names/constructorIds ("Red Bull",
// "red_bull"). Any unmapped constructor stays unknown.
const TEAM_IDS = [
  ['red bull', 'redbull'],
  ['red_bull', 'redbull'],
  ['racing bulls', 'racingbulls'],
  ['rb f1 team', 'racingbulls'],
  ['rb', 'racingbulls'],
  ['mercedes', 'mercedes'],
  ['ferrari', 'ferrari'],
  ['mclaren', 'mclaren'],
  ['aston martin', 'astonmartin'],
  ['aston_martin', 'astonmartin'],
  ['williams', 'williams'],
  ['alpine', 'alpine'],
  ['haas', 'haas'],
  ['sauber', 'audi'],
  ['audi', 'audi'],
  ['cadillac', 'cadillac'],
];

function teamTokenId(value) {
  const normalized = String(value || '').toLowerCase();
  return TEAM_IDS.find(([token]) => normalized.includes(token))?.[1] || 'unknown';
}

const SESSION_MAP = {
  'Practice 1': ['practice', 'fp1'],
  'Practice 2': ['practice', 'fp2'],
  'Practice 3': ['practice', 'fp3'],
  'Sprint Qualifying': ['qualifying', 'sprintQualifying'],
  Qualifying: ['qualifying', 'qualifying'],
  Sprint: ['qualifying', 'sprint'],
};

async function fetchText(url, attempt = 0) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(60_000),
  });
  // Both F1's bot protection and Jolpica's rate limiter answer with
  // retryable statuses; bounded backoff with jitter gets through most of them.
  const retryable =
    response.status === 403 ||
    response.status === 408 ||
    response.status === 429 ||
    response.status >= 500;
  if (retryable && attempt < MAX_ATTEMPTS) {
    const backoff = Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_CAP_MS);
    await sleep(backoff + Math.random() * 500);
    return fetchText(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return (await response.text()).replace(/^\uFEFF/, '');
}

async function fetchJson(url) {
  await jitterSleep();
  return JSON.parse(await fetchText(url));
}

function mergePatch(target, patch) {
  if (patch === null || typeof patch !== 'object') return patch;
  const result = target && typeof target === 'object' ? target : Array.isArray(patch) ? [] : {};
  for (const [key, value] of Object.entries(patch)) {
    result[key] = mergePatch(result[key], value);
  }
  return result;
}

function parseJsonStream(text) {
  let state = {};
  for (const line of text.split(/\r?\n/)) {
    const payloadStart = line.indexOf('{');
    if (payloadStart < 0) continue;
    state = mergePatch(state, JSON.parse(line.slice(payloadStart)));
  }
  return state;
}

async function fetchStream(sessionPath, fileName) {
  const text = await fetchText(`${LIVE_TIMING_BASE}/${sessionPath}${fileName}`);
  return parseJsonStream(text);
}

function profile(number, driver, constructor) {
  const fallback = DRIVER_FALLBACK[number] || [
    `driver-${number}`,
    driver
      ? `${driver.givenName ?? ''} ${driver.familyName ?? ''}`.trim() || `Driver ${number}`
      : `Driver ${number}`,
    driver?.code || driver?.Tla || `#${number}`,
    'unknown',
    constructor?.name || 'Formula 1 Team',
  ];
  const driverName =
    fallback[1] ||
    (driver?.FirstName && driver?.LastName
      ? `${driver.FirstName} ${driver.LastName}`.trim()
      : undefined) ||
    (driver?.givenName && driver?.familyName
      ? `${driver.givenName} ${driver.familyName}`.trim()
      : undefined) ||
    driver?.FullName;
  const driverCode = driver?.Tla || driver?.code || fallback[2];
  const teamName = driver?.TeamName || constructor?.name || fallback[4];
  const mappedTeam = teamTokenId(teamName);
  return {
    driverId: fallback[0],
    driverName,
    driverCode,
    driverNumber: number,
    // Never credit an unmapped constructor to another team: unknown stays
    // unknown and keeps the local fallback profile.
    teamId: mappedTeam === 'unknown' ? fallback[3] : mappedTeam,
    teamName,
  };
}

function lapTimeToSeconds(value) {
  if (!value || typeof value !== 'string') return undefined;
  const parts = value.split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return undefined;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return undefined;
}

function formatGap(seconds) {
  return Number.isFinite(seconds) ? `+${seconds.toFixed(3)}s` : '';
}

function cleanGap(value) {
  if (!value) return '';
  const text = String(value).trim();
  if (/^\+?\d+(?:\.\d+)?$/.test(text)) return `+${text.replace(/^\+/, '')}s`;
  if (/L$/i.test(text)) return text;
  return text;
}

// Qualifying TimingData carries per-segment best laps in Lines[n].BestLapTimes,
// an array where index 0/1/2 are Q1/Q2/Q3 (or SQ1/SQ2/SQ3 in sprint qualifying).
// Drivers eliminated in an earlier segment have empty {} objects for later
// segments, so their q2Time/q3Time stay undefined and the UI renders "-".
function segmentBestLaps(line) {
  const bests = line?.BestLapTimes;
  if (!Array.isArray(bests)) return undefined;
  const read = (index) => {
    const value = bests[index]?.Value;
    return typeof value === 'string' && value ? value : undefined;
  };
  const segments = { q1: read(0), q2: read(1), q3: read(2) };
  return segments.q1 || segments.q2 || segments.q3 ? segments : undefined;
}

function sessionDate(session) {
  const offset = String(session.GmtOffset || '00:00:00');
  const sign = offset.startsWith('-') ? '-' : '+';
  const normalized = offset.replace(/^[+-]/, '').slice(0, 5);
  return new Date(`${session.StartDate}${sign}${normalized}`).toISOString();
}

function baseEntries(timingData, timingStats, drivers) {
  return Object.entries(timingData.Lines || {})
    .map(([numberText, line]) => {
      const number = Number(numberText);
      const position = Number(line.Position);
      const bestLapTime =
        timingStats.Lines?.[numberText]?.PersonalBestLapTime?.Value ||
        line.BestLapTime?.Value ||
        '';
      return {
        position,
        ...profile(number, drivers[numberText]),
        lapsCompleted: Number(line.NumberOfLaps) || 0,
        bestLapTime,
        rawGap: cleanGap(line.GapToLeader),
        segmentTimes: segmentBestLaps(line),
      };
    })
    .filter((entry) => Number.isInteger(entry.position) && entry.position > 0)
    .sort((a, b) => a.position - b.position);
}

function buildPracticeSession(session, entries) {
  const leaderSeconds = lapTimeToSeconds(entries[0]?.bestLapTime);
  const normalized = entries.map((entry) => {
    const seconds = lapTimeToSeconds(entry.bestLapTime);
    const { segmentTimes: _segments, ...cleaned } = entry;
    return {
      ...cleaned,
      bestLapTime: entry.bestLapTime || 'No time',
      gapToP1:
        entry.position === 1
          ? 'LEADER'
          : formatGap(
              Number.isFinite(seconds) && Number.isFinite(leaderSeconds)
                ? seconds - leaderSeconds
                : undefined,
            ),
      rawGap: undefined,
    };
  });
  return {
    sessionKey: SESSION_MAP[session.Name][1],
    sessionName: session.Name,
    dateStr: sessionDate(session),
    status: 'finished',
    fastestDriver: normalized[0]
      ? {
          driver: normalized[0].driverName,
          team: normalized[0].teamName,
          time: normalized[0].bestLapTime,
        }
      : undefined,
    entries: normalized,
  };
}

function buildClassificationSession(session, sessionKey, entries) {
  const sprint = sessionKey === 'sprint';
  const hasSegments = sessionKey === 'qualifying' || sessionKey === 'sprintQualifying';
  const leaderSeconds = lapTimeToSeconds(entries[0]?.bestLapTime);
  const sprintPoints = [8, 7, 6, 5, 4, 3, 2, 1];
  const normalized = entries.map((entry) => {
    const seconds = lapTimeToSeconds(entry.bestLapTime);
    const calculatedGap = formatGap(
      Number.isFinite(seconds) && Number.isFinite(leaderSeconds)
        ? seconds - leaderSeconds
        : undefined,
    );
    const displayGap = sprint ? entry.rawGap : calculatedGap;
    const { segmentTimes, ...cleaned } = entry;
    return {
      ...cleaned,
      ...(hasSegments && segmentTimes
        ? {
            q1Time: segmentTimes.q1,
            q2Time: segmentTimes.q2,
            q3Time: segmentTimes.q3,
          }
        : {}),
      bestLapTime: sprint
        ? entry.position === 1
          ? 'LEADER'
          : displayGap || entry.bestLapTime || ''
        : entry.bestLapTime || 'No time',
      gapToPole: entry.position === 1 ? (sprint ? 'LEADER' : 'POLE') : displayGap,
      sprintPoints: sprint ? sprintPoints[entry.position - 1] : undefined,
      rawGap: undefined,
    };
  });
  return {
    sessionKey,
    sessionName: session.Name,
    dateStr: sessionDate(session),
    status: 'finished',
    poleDriver: normalized[0]
      ? {
          driver: normalized[0].driverName,
          team: normalized[0].teamName,
          time: normalized[0].bestLapTime,
        }
      : undefined,
    entries: normalized,
  };
}

async function readSession(session) {
  const [drivers, timingData, timingStats] = await Promise.all([
    fetchStream(session.Path, 'DriverList.jsonStream'),
    fetchStream(session.Path, 'TimingData.jsonStream'),
    fetchStream(session.Path, 'TimingStats.jsonStream'),
  ]);
  const entries = baseEntries(timingData, timingStats, drivers);
  const positions = new Set(entries.map((entry) => entry.position));
  if (entries.length !== EXPECTED_GRID_SIZE || positions.size !== EXPECTED_GRID_SIZE) {
    console.log(
      `[F1 timing] ${session.Name} is not complete (${entries.length}/${EXPECTED_GRID_SIZE}).`,
    );
    return null;
  }
  const [bucket, sessionKey] = SESSION_MAP[session.Name];
  return {
    bucket,
    sessionKey,
    data:
      bucket === 'practice'
        ? buildPracticeSession(session, entries)
        : buildClassificationSession(session, sessionKey, entries),
  };
}

// ─── Jolpica (Ergast) fallback ───────────────────────────────────────────────

async function fetchJolpicaRaces(endpoint) {
  const races = [];
  let offset = 0;
  // Endpoint-specific entry keys: qualifying returns QualifyingResults,
  // sprint returns SprintResults, results returns Results.
  const entryKey = endpoint.startsWith('qualifying')
    ? 'QualifyingResults'
    : endpoint.startsWith('sprint')
      ? 'SprintResults'
      : 'Results';
  for (let page = 0; page < 20; page += 1) {
    // Jolpica paginates by result entries, not by race weekends.
    const response = await fetchJson(`${JOLPICA_BASE}/2026/${endpoint}?limit=100&offset=${offset}`);
    const pageRaces = response?.MRData?.RaceTable?.Races || [];
    races.push(...pageRaces);
    const total = Number(response?.MRData?.total || 0);
    offset += pageRaces.reduce((sum, race) => sum + (race[entryKey] || []).length, 0);
    if (pageRaces.length === 0 || offset >= total) break;
  }
  return races;
}

function fastestSegmentTime(entry) {
  const times = [entry.Q3, entry.Q2, entry.Q1]
    .map((value) => (typeof value === 'string' && value ? value : undefined))
    .filter(Boolean);
  return times.sort((a, b) => (lapTimeToSeconds(a) ?? 0) - (lapTimeToSeconds(b) ?? 0))[0];
}

function buildJolpicaQualifyingRace(race) {
  const entries = (race.QualifyingResults || [])
    .map((entry) => {
      const position = Number(entry.position);
      const profileEntry = {
        position,
        ...profile(Number(entry.number), entry.Driver, entry.Constructor),
      };
      return {
        ...profileEntry,
        q1Time: typeof entry.Q1 === 'string' && entry.Q1 ? entry.Q1 : undefined,
        q2Time: typeof entry.Q2 === 'string' && entry.Q2 ? entry.Q2 : undefined,
        q3Time: typeof entry.Q3 === 'string' && entry.Q3 ? entry.Q3 : undefined,
        bestLapTime: fastestSegmentTime(entry) || '',
      };
    })
    .filter((entry) => Number.isInteger(entry.position) && entry.position > 0)
    .sort((a, b) => a.position - b.position);

  const leaderSeconds = lapTimeToSeconds(entries[0]?.bestLapTime);
  const entriesWithGaps = entries.map((entry) => {
    const seconds = lapTimeToSeconds(entry.bestLapTime);
    const gap =
      entry.position === 1
        ? 'POLE'
        : formatGap(
            Number.isFinite(seconds) && Number.isFinite(leaderSeconds)
              ? seconds - leaderSeconds
              : undefined,
          );
    return { ...entry, gapToPole: gap || '' };
  });

  return {
    round: Number(race.round),
    grandPrix: race.raceName,
    season: 2026,
    circuit: race.Circuit?.circuitName || 'Circuit',
    sessions: {
      qualifying: {
        sessionKey: 'qualifying',
        sessionName: 'Qualifying',
        dateStr: race.date,
        status: 'finished',
        poleDriver: entriesWithGaps[0]
          ? {
              driver: entriesWithGaps[0].driverName,
              team: entriesWithGaps[0].teamName,
              time: entriesWithGaps[0].bestLapTime,
            }
          : undefined,
        entries: entriesWithGaps,
      },
    },
  };
}

function buildJolpicaSprintRace(race) {
  const entries = (race.SprintResults || [])
    .map((entry) => {
      const position = Number(entry.position);
      const gapTime = entry.Time?.time ? cleanGap(entry.Time.time) : '';
      return {
        position,
        ...profile(Number(entry.number), entry.Driver, entry.Constructor),
        lapsCompleted: Number(entry.laps) || 0,
        bestLapTime: position === 1 ? 'LEADER' : gapTime || '',
        gapToPole: position === 1 ? 'LEADER' : gapTime || '',
        sprintPoints: entry.points != null ? Number(entry.points) : undefined,
      };
    })
    .filter((entry) => Number.isInteger(entry.position) && entry.position > 0)
    .sort((a, b) => a.position - b.position);

  return {
    round: Number(race.round),
    grandPrix: race.raceName,
    season: 2026,
    circuit: race.Circuit?.circuitName || 'Circuit',
    sessions: {
      sprint: {
        sessionKey: 'sprint',
        sessionName: 'Sprint',
        dateStr: race.date,
        status: 'finished',
        poleDriver: entries[0]
          ? {
              driver: entries[0].driverName,
              team: entries[0].teamName,
              time: 'LEADER',
            }
          : undefined,
        entries,
      },
    },
  };
}

async function syncFromJolpica(existing) {
  const [qualifyingRaces, sprintRaces] = await Promise.all([
    fetchJolpicaRaces('qualifying.json'),
    fetchJolpicaRaces('sprint.json').catch(() => []),
  ]);

  // Only sync the most recent weekend that has a complete qualifying
  // classification — same "latest meeting only" policy as the F1 path.
  const completed = qualifyingRaces.filter(
    (race) => (race.QualifyingResults || []).length >= EXPECTED_GRID_SIZE,
  );
  if (completed.length === 0) {
    console.log('[F1 timing] Jolpica has no completed qualifying classification.');
    return false;
  }
  const latest = completed.reduce((a, b) => (Number(a.round) >= Number(b.round) ? a : b));
  const round = Number(latest.round);

  const existingRecord = existing.qualifying?.[round];
  const nextRecord = buildJolpicaQualifyingRace(latest);
  const sprintRace = sprintRaces.find((race) => Number(race.round) === round);
  if (sprintRace && (sprintRace.SprintResults || []).length >= EXPECTED_GRID_SIZE) {
    nextRecord.sessions.sprint = buildJolpicaSprintRace(sprintRace).sessions.sprint;
  }

  if (existingRecord) {
    // Jolpica has no practice sessions and no sprint qualifying: keep whatever
    // the live-timing archive already captured for those sessions.
    nextRecord.sessions = {
      ...existingRecord.sessions,
      ...nextRecord.sessions,
    };
  }

  const changed =
    JSON.stringify(existing.qualifying?.[round] || null) !== JSON.stringify(nextRecord);
  if (changed) {
    console.log(
      `[F1 timing] Jolpica: round ${round} (${latest.raceName}) ${
        existingRecord ? 'updated' : 'added'
      }.`,
    );
    existing.qualifying = existing.qualifying || {};
    existing.qualifying[round] = nextRecord;
  } else {
    console.log(`[F1 timing] Jolpica: round ${round} unchanged.`);
  }
  return changed;
}

// ─── Primary source: F1 live timing ──────────────────────────────────────────

async function syncFromLiveTiming(existing) {
  const index = await fetchJson(`${LIVE_TIMING_BASE}/2026/Index.json`);
  const meetings = (index.Meetings || []).filter((meeting) =>
    meeting.Sessions?.some((session) => SESSION_MAP[session.Name] && session.Path),
  );
  const meeting = meetings.at(-1);
  if (!meeting) throw new Error('No completed 2026 race-weekend session was found');

  const round = Number(meeting.Number);
  if (!Number.isInteger(round)) throw new Error(`Invalid round number for ${meeting.Name}`);
  let changed = false;

  for (const session of meeting.Sessions || []) {
    if (!SESSION_MAP[session.Name] || !session.Path) continue;
    const result = await readSession(session);
    if (!result) continue;
    const raceRecord = existing[result.bucket][round] || {
      round,
      grandPrix: meeting.Name,
      season: 2026,
      circuit: meeting.Location,
      sessions: {},
    };
    if (JSON.stringify(raceRecord.sessions[result.sessionKey]) !== JSON.stringify(result.data)) {
      raceRecord.sessions[result.sessionKey] = result.data;
      existing[result.bucket][round] = raceRecord;
      changed = true;
    }
  }
  if (!changed) {
    console.log('[F1 timing] No new complete session results.');
  } else {
    console.log(`[F1 timing] Updated complete session snapshot for round ${round}.`);
  }
  return changed;
}

async function run() {
  const existing = fs.existsSync(OUTPUT_FILE)
    ? JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
    : { practice: {}, qualifying: {} };
  existing.practice = existing.practice || {};
  existing.qualifying = existing.qualifying || {};

  let changed = false;
  const preferJolpica = PINNED_SOURCE === 'jolpica';
  let useJolpica = preferJolpica;

  if (!preferJolpica) {
    try {
      changed = await syncFromLiveTiming(existing);
    } catch (error) {
      if (PINNED_SOURCE === 'f1') throw error;
      console.log(
        `[F1 timing] Live timing archive unavailable: ${error.message}. Trying Jolpica fallback...`,
      );
      useJolpica = true;
    }
  }

  if (useJolpica) {
    changed = await syncFromJolpica(existing);
  }

  if (!changed) {
    console.log('[F1 timing] Nothing to write.');
    return;
  }
  if (IS_DRY_RUN) {
    console.log('[F1 timing] Dry run: data changed but nothing was written.');
    return;
  }
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');
  console.log('[F1 timing] Session snapshot written.');
}

run().catch((error) => {
  const hint = /returned 403/.test(error.message)
    ? ' (F1 bot protection kept rejecting the request after retries; re-run later or from a different network)'
    : /returned 429/.test(error.message)
      ? ' (Jolpica rate limit hit; re-run in a minute)'
      : '';
  console.error(`[F1 timing] Sync failed: ${error.message}${hint}`);
  process.exit(1);
});
