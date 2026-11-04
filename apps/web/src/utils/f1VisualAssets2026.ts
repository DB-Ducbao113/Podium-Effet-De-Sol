import type { SeasonYear, TeamId } from '../types';

const base = '/images/p5/concepts-2026';

// Stable application IDs map to the owner's 2026 concept package. The source
// manifest and file hashes are recorded in docs/asset-manifests/f1-2026-concepts.json.
export const teamPrefixes = {
  ferrari: 'fer', mercedes: 'mer', redbull: 'rbr', mclaren: 'mcl',
  astonmartin: 'amr', williams: 'wil', audi: 'aud', alpine: 'alp',
  haas: 'haa', racingbulls: 'rbs', cadillac: 'cad',
} as const satisfies Record<TeamId, string>;

export const driverAssets = {
  leclerc: 'fer-charles', hamilton: 'fer-lewis',
  russell: 'mer-george', antonelli: 'mer-kimi',
  verstappen: 'rbr-max', hadjar: 'rbr-isack',
  norris: 'mcl-lando', piastri: 'mcl-oscar',
  alonso: 'amr-fernando', stroll: 'amr-lance',
  sainz: 'wil-carlos', albon: 'wil-alex',
  hulkenberg: 'aud-nico', bortoleto: 'aud-gabriel',
  gasly: 'alp-pierre', colapinto: 'alp-franco',
  ocon: 'haa-esteban', bearman: 'haa-oliver',
  lawson: 'rbs-liam', lindblad: 'rbs-arvid',
  perez: 'cad-sergio', bottas: 'cad-valtteri',
} as const;

export const F1_VISUAL_TEAM_IDS_2026 = Object.keys(teamPrefixes) as TeamId[];
export const F1_VISUAL_DRIVER_IDS_2026 = Object.keys(driverAssets);

export function driverConcept2026(driverId: string, season: SeasonYear): string | undefined {
  if (season !== 2026) return undefined;
  const asset = driverAssets[driverId as keyof typeof driverAssets];
  return asset ? `${base}/headshots/${asset}-portrait.webp` : undefined;
}

export function teamConcept2026(teamId: string, season: SeasonYear): string | undefined {
  if (season !== 2026) return undefined;
  const prefix = teamPrefixes[teamId as TeamId];
  return prefix ? `${base}/cars/${prefix}-car.webp` : undefined;
}

export function teamConceptWidth2026(teamId: string): number {
  return teamId === 'racingbulls' || teamId === 'cadillac' ? 651 : teamId === 'redbull' || teamId === 'williams' || teamId === 'haas' ? 527 : teamId === 'mercedes' || teamId === 'astonmartin' || teamId === 'alpine' ? 524 : 526;
}
