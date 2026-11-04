import manifest from '../data/visualAssets/p5SeasonalClientManifest.json';
import type { SeasonYear } from '../types';
import { getCircuitById } from '../data/championship/circuitsData';
import type { CircuitData, CircuitId } from '../types/circuit';

export type VisualStatus = 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED' | 'MISSING';
export type CircuitVisualRecord = (typeof manifest.circuits)[number];
export type DriverVisualRecord = (typeof manifest.drivers)[number];

// Show local review art in DEV when the owner keeps the source images locally.
// Vite replaces DEV with false in production builds; set the flag to 0 to hide it locally.
const localReviewEnabled = import.meta.env.DEV && import.meta.env.MODE !== 'test' && import.meta.env.VITE_P5_LOCAL_REVIEW !== '0';

const circuitByEvent = new Map(
  manifest.circuits.map((entry) => [`${entry.season}:${entry.round}`, entry]),
);
const driverBySeason = new Map(
  manifest.drivers.map((entry) => [`${entry.season}:${entry.driverId}`, entry]),
);

export function resolveCircuitVisual(season: SeasonYear, round: number): CircuitVisualRecord | undefined {
  return circuitByEvent.get(`${season}:${round}`);
}

/** Unlike getCircuitByRound, this lookup retains the selected season. */
export function getSeasonCircuit(season: SeasonYear, round: number): CircuitData | undefined {
  const circuitId = resolveCircuitVisual(season, round)?.circuitId;
  return circuitId ? getCircuitById(circuitId as CircuitId) : undefined;
}

export function resolveDriverVisual(season: SeasonYear, driverId: string): DriverVisualRecord | undefined {
  return driverBySeason.get(`${season}:${driverId}`);
}

/** Package entries with no current standings row remain review-only, never ranked. */
export function packageOnlyDriverVisuals(season: SeasonYear, standingsDriverIds: readonly string[]): DriverVisualRecord[] {
  const ranked = new Set(standingsDriverIds);
  return manifest.drivers.filter((entry) => entry.season === season && !ranked.has(entry.driverId));
}

export function circuitPreviewUrl(
  entry: CircuitVisualRecord | undefined,
  variant: 'desktop' | 'mobile' | 'thumbnail',
): string | undefined {
  if (!localReviewEnabled || !entry || entry.assetStatus !== 'NEEDS_REVIEW') return undefined;
  return `/__p5-seasonal/${entry.season}/circuits/${variant}/r${String(entry.round).padStart(2, '0')}.webp`;
}

export function driverPreviewUrl(
  entry: DriverVisualRecord | undefined,
  variant: 'full' | 'small',
): string | undefined {
  if (!localReviewEnabled || !entry || entry.assetStatus !== 'NEEDS_REVIEW') return undefined;
  return `/__p5-seasonal/${entry.season}/drivers/${variant}/${entry.driverId}.webp`;
}

export const P5_SEASONAL_REVIEW_ENABLED = localReviewEnabled;
