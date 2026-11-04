import { CALENDAR_2026 } from '../data/championship/calendar';
import { getCircuitByRound } from '../data/championship/circuitsData';
import { venueHeroFor, venueHeroSrcSet } from './venueHeroes';

/** Existing P4 crops whose source record depicts the named circuit itself.
 * Other rounds deliberately use the neutral editorial plate until a track
 * photograph, its reuse terms, and its crop have been reviewed.
 */
const trackPhotoIds = new Set([
  'catalunya', 'gilles-villeneuve', 'hungaroring', 'interlagos',
  'red-bull-ring', 'sepang', 'silverstone', 'spa', 'suzuka', 'zandvoort',
]);

export type CircuitVisualAsset2026 = {
  season: 2026;
  round: number;
  circuitId: string;
  desktop: string;
  mobile: string;
  thumbnail: string;
  desktopSrcSet: (format: 'avif' | 'webp') => string;
  mobileSrcSet: (format: 'avif' | 'webp') => string;
  desktopSize: { width: 1600; height: 900 };
  mobileSize: { width: 900; height: 1200 };
  sourcePage: string;
  credit: string;
  license: string;
  licenseUrl: string;
};

export const CIRCUIT_VISUALS_2026: Readonly<Record<string, CircuitVisualAsset2026>> =
  Object.fromEntries(CALENDAR_2026.flatMap((race) => {
    const circuitId = getCircuitByRound(race.round)?.id;
    if (!circuitId || !trackPhotoIds.has(circuitId)) return [];
    const source = venueHeroFor(circuitId);
    if (!source) return [];
    return [[circuitId, {
      season: 2026 as const,
      round: race.round,
      circuitId,
      desktop: `/images/p4/venues/${circuitId}-land-1600.webp`,
      mobile: `/images/p4/venues/${circuitId}-port-900.webp`,
      thumbnail: `/images/p4/venues/${circuitId}-land-960.webp`,
      desktopSrcSet: (format: 'avif' | 'webp') => venueHeroSrcSet(circuitId, 'land', format),
      mobileSrcSet: (format: 'avif' | 'webp') => venueHeroSrcSet(circuitId, 'port', format),
      desktopSize: { width: 1600 as const, height: 900 as const },
      mobileSize: { width: 900 as const, height: 1200 as const },
      sourcePage: source.sourcePage,
      credit: source.credit,
      license: source.license,
      licenseUrl: source.licenseUrl ?? source.sourcePage,
    }]];
  }));

export function circuitVisual2026For(season: number, circuitId?: string): CircuitVisualAsset2026 | undefined {
  return season === 2026 && circuitId ? CIRCUIT_VISUALS_2026[circuitId] : undefined;
}
