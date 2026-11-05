import { useState } from 'react';
import { driverPortraitAvailable, driverPortraitSrc, driverPortraitSrcSet } from '../../utils/driverPortraits';
import { driverConcept2026 } from '../../utils/f1VisualAssets2026';
import type { SeasonYear } from '../../types';

type P5PortraitProps = {
  driverId: string;
  alt: string;
  number?: number;
  sizes?: string;
  eager?: boolean;
  className?: string;
  season?: SeasonYear;
};

/** Owner concept -> licensed portrait -> number fallback, one attempt per source. */
export function P5Portrait({
  driverId, alt, number,
  sizes = '(max-width: 600px) 45vw, (max-width: 1024px) 30vw, 320px',
  eager = false, className = '', season,
}: P5PortraitProps) {
  const concept = season ? driverConcept2026(driverId, season) : undefined;
  const key = `${driverId}:${season ?? 'none'}`;
  const [failure, setFailure] = useState<{ key: string; level: number } | null>(null);
  const level = failure?.key === key ? failure.level : 0;

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

  if (driverPortraitAvailable(driverId) && level < 2) {
    return (
      <picture className={`p5-portrait ${className}`.trim()} data-p5-image-source="licensed-portrait">
        <source type="image/avif" srcSet={driverPortraitSrcSet(driverId, 'avif')} sizes={sizes} />
        <source type="image/webp" srcSet={driverPortraitSrcSet(driverId, 'webp')} sizes={sizes} />
        <img
          key={`${key}:licensed`} src={driverPortraitSrc(driverId)} alt={alt}
          width={720} height={960} loading={eager ? 'eager' : 'lazy'} decoding="async"
          onError={() => setFailure({ key, level: 2 })}
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
