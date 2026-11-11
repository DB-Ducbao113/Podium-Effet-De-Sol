import { useState } from 'react';
import { driverConcept2026 } from '../../utils/f1VisualAssets2026';
import { getStandings } from '../../data/championship/standings';
import type { SeasonYear } from '../../types';

type DriverPortraitProps = {
  driverId: string;
  alt: string;
  number?: number;
  sizes?: string;
  eager?: boolean;
  className?: string;
  season?: SeasonYear;
};

/** Season portrait -> owner concept -> number fallback. */
export function DriverPortrait({
  driverId, alt, number,
  eager = false, className = '', season,
}: DriverPortraitProps) {
  const concept = season ? driverConcept2026(driverId, season) : undefined;
  const generated = (season === 2024 || season === 2025) && getStandings(season).drivers.some((driver) => driver.driverId === driverId)
    ? `/images/driver-portraits-ai/${season}-${driverId}.webp`
    : undefined;
  const key = `${driverId}:${season ?? 'none'}`;
  const [failure, setFailure] = useState<{ key: string; level: number } | null>(null);
  const level = failure?.key === key ? failure.level : 0;

  if (generated && level === 0) {
    return (
      <picture className={`p5-portrait p5-portrait--generated p5-portrait--historical-${season} ${className}`.trim()} data-p5-image-source="ai-generated-portrait">
        <img key={generated} src={generated} alt={alt} width={768} height={1024}
          loading={eager ? 'eager' : 'lazy'} decoding="async"
          onError={() => setFailure({ key, level: 1 })} />
      </picture>
    );
  }

  if (concept && level === 0) {
    return (
      <picture className={`p5-portrait p5-portrait--concept ${className}`.trim()} data-p5-image-source="owner-concept">
        <img
          key={concept} src={concept} alt={alt} width={341} height={436}
          loading={eager ? 'eager' : 'lazy'} decoding="async"
          onError={() => setFailure({ key, level: 1 })}
        />
      </picture>
    );
  }

  return (
    <span
      className={`p5-portrait-fallback ${className}`.trim()}
      role="img" aria-label={alt}
      data-portrait-missing="true"
      data-p5-image-source="number-fallback"
    >
      <span aria-hidden="true">{number != null ? `#${number}` : '—'}</span>
    </span>
  );
}
