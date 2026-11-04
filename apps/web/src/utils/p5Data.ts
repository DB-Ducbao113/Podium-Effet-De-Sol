import { getRaceResults } from '../data/championship/results';
import type { DetailedRaceResult } from '../types';

const stripDiacritics = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const canonicalName = (value: string) =>
  stripDiacritics(value)
    .toLowerCase()
    .replace(/\b(jr|junior|ii|iii)\b\.?/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

/** First initial + surname survives "Alex/Alexander Albon" and "Carlos Sainz Jr." variants. */
export const nameKey = (value: string): string => {
  const tokens = canonicalName(value).split(' ').filter(Boolean);
  if (!tokens.length) return '';
  return `${tokens[0][0]}${tokens[tokens.length - 1]}`;
};

type PodiumSource = 'detailed' | 'summary';

export type PodiumFormEntry = {
  round: number;
  position: 1 | 2 | 3 | null;
  source: PodiumSource;
};

type RoundSource = {
  round: number;
  summary?: ReturnType<typeof getRaceResults>[number];
  detail?: DetailedRaceResult;
};

const completedDetailRaces = (races?: DetailedRaceResult[]): DetailedRaceResult[] =>
  (races ?? []).filter(
    (race) =>
      race &&
      race.status === 'completed' &&
      Array.isArray(race.entries) &&
      race.entries.length > 0,
  );

const roundSources = (season: number, detailedRaces?: DetailedRaceResult[]): RoundSource[] => {
  const summaries = new Map(getRaceResults(season).map((race) => [race.round, race]));
  const details = new Map(completedDetailRaces(detailedRaces).map((race) => [race.round, race]));
  return [...new Set([...summaries.keys(), ...details.keys()])]
    .sort((a, b) => a - b)
    .map((round) => ({ round, summary: summaries.get(round), detail: details.get(round) }));
};

const summaryPodium = (
  summary: RoundSource['summary'],
  keys: Set<string>,
): Array<[1 | 2 | 3, { driver: string; points: number; gap: string }]> => {
  if (!summary) return [];
  const candidates: Array<[1 | 2 | 3, { driver: string; points: number; gap: string }]> = [
    [1, { ...summary.podium.p1, gap: summary.podium.p1.time }],
    [2, { ...summary.podium.p2, gap: summary.podium.p2.gap }],
    [3, { ...summary.podium.p3, gap: summary.podium.p3.gap }],
  ];
  return candidates.filter(([, entry]) => keys.has(nameKey(entry.driver)));
};

export const podiumForm = (
  season: number,
  driverNames: string[],
  last = 5,
  detailedRaces?: DetailedRaceResult[],
): PodiumFormEntry[] => {
  const keys = new Set(driverNames.map(nameKey));
  return roundSources(season, detailedRaces)
    .slice(-last)
    .map(({ round, summary, detail }) => {
      if (detail) {
        const hit = detail.entries?.find((entry) => keys.has(nameKey(entry.driverName)));
        const position =
          hit && hit.position >= 1 && hit.position <= 3
            ? (hit.position as 1 | 2 | 3)
            : null;
        return { round, position, source: 'detailed' as const };
      }
      const hit = summaryPodium(summary, keys)[0];
      return { round, position: hit ? hit[0] : null, source: 'summary' as const };
    });
};

export type PodiumResultEntry = {
  round: number;
  grandPrix: string;
  circuit: string;
  position: 1 | 2 | 3 | null;
  points: number | null;
  gap: string | null;
  source: PodiumSource;
};

/**
 * Detailed classifications win when available; published top-three summaries
 * fill the rounds that only exist in the static results dataset. A null
 * position means no podium, never a guessed lower finish.
 */
export const driverPodiumResults = (
  season: number,
  driverNames: string[],
  last = 5,
  detailedRaces?: DetailedRaceResult[],
): PodiumResultEntry[] => {
  const keys = new Set(driverNames.map(nameKey));
  return roundSources(season, detailedRaces)
    .slice(-last)
    .map(({ round, summary, detail }) => {
      if (detail) {
        const hit = detail.entries?.find((entry) => keys.has(nameKey(entry.driverName)));
        const podium = hit && hit.position >= 1 && hit.position <= 3 ? hit : null;
        return {
          round,
          grandPrix: detail.grandPrix,
          circuit: detail.circuit,
          position: podium ? (podium.position as 1 | 2 | 3) : null,
          points: podium?.points ?? null,
          gap: podium
            ? podium.position === 1
              ? detail.winner?.time ?? podium.timeOrGap ?? null
              : podium.timeOrGap ?? null
            : null,
          source: 'detailed' as const,
        };
      }
      const summaryRace = summary;
      const hit = summaryPodium(summary, keys)[0];
      return {
        round,
        grandPrix: summaryRace?.grandPrix ?? '',
        circuit: summaryRace?.circuit ?? '',
        position: hit ? hit[0] : null,
        points: hit ? hit[1].points : null,
        gap: hit ? hit[1].gap : null,
        source: 'summary' as const,
      };
    });
};

export const roundsWithResults = (season: number, detailedRaces?: DetailedRaceResult[]) => {
  const rounds = new Set(getRaceResults(season).map((race) => race.round));
  for (const race of completedDetailRaces(detailedRaces)) rounds.add(race.round);
  return rounds.size;
};

export const gapLabel = (leader: number, points: number, lang: 'vi' | 'en') => {
  const gap = Math.max(0, leader - points);
  return gap === 0
    ? lang === 'vi'
      ? 'Dẫn đầu'
      : 'Leader'
    : lang === 'vi'
      ? `−${gap} điểm`
      : `−${gap} pts`;
};
