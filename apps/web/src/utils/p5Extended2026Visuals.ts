import type { SeasonYear, TeamId } from '../types';
import { driverAssets, teamPrefixes } from './f1VisualAssets2026';
import { P5_SEASONAL_REVIEW_ENABLED } from './p5SeasonalVisuals';

const base = '/__p5-extra-2026';
export const celebrationSlugs = {
  alonso: 'amr-alonso', hamilton: 'fer-hamilton', leclerc: 'fer-leclerc',
  norris: 'mcl-norris', piastri: 'mcl-piastri', antonelli: 'mer-antonelli',
  russell: 'mer-russell', hadjar: 'rbr-hadjar', verstappen: 'rbr-verstappen',
} as const;

export type Extra2026Artwork = { src: string; mobileSrc?: string };

export function extra2026Hero(kind: 'drivers' | 'constructors' | 'championship', season: SeasonYear): Extra2026Artwork | undefined {
  if (!P5_SEASONAL_REVIEW_ENABLED || season !== 2026) return undefined;
  const stem = `hero-${kind}-2026`;
  return { src: `${base}/heroes/${stem}.webp`, mobileSrc: `${base}/heroes/${stem}-960.webp` };
}

export function extra2026DriverPoster(driverId: string, season: SeasonYear): Extra2026Artwork | undefined {
  if (!P5_SEASONAL_REVIEW_ENABLED || season !== 2026) return undefined;
  const slug = driverAssets[driverId as keyof typeof driverAssets];
  return slug ? { src: `${base}/drivers/${slug}.webp` } : undefined;
}

export function extra2026TeamPoster(teamId: TeamId, season: SeasonYear): Extra2026Artwork | undefined {
  if (!P5_SEASONAL_REVIEW_ENABLED || season !== 2026) return undefined;
  const prefix = teamPrefixes[teamId];
  return prefix ? { src: `${base}/teams/${prefix}-team.webp` } : undefined;
}

/** Editorial concept only: never infer a win or event result from this image. */
export function extra2026Celebration(driverId: string, season: SeasonYear): Extra2026Artwork | undefined {
  if (!P5_SEASONAL_REVIEW_ENABLED || season !== 2026) return undefined;
  const slug = celebrationSlugs[driverId as keyof typeof celebrationSlugs];
  if (!slug) return undefined;
  const stem = `celebration-${slug}-2026`;
  return { src: `${base}/celebrations/${stem}.webp`, mobileSrc: `${base}/celebrations/${stem}-960.webp` };
}
