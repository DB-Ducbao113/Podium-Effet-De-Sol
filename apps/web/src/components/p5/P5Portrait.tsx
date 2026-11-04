import {
  driverPortraitAvailable,
  driverPortraitSrc,
  driverPortraitSrcSet,
} from '../../utils/driverPortraits';
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

export function P5Portrait({
  driverId,
  alt,
  number,
  sizes = '(max-width: 600px) 45vw, (max-width: 1024px) 30vw, 320px',
  eager = false,
  className = '',
  season,
}: P5PortraitProps) {
  const concept = season ? driverConcept2026(driverId, season) : undefined;
  if (concept) {
    return (
      <picture className={`p5-portrait p5-portrait--concept ${className}`.trim()}>
        <img src={concept} alt={alt} width={341} height={436} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      </picture>
    );
  }
  if (!driverPortraitAvailable(driverId)) {
    return (
      <span
        className={`p5-portrait-fallback ${className}`.trim()}
        role="img"
        aria-label={alt}
        data-portrait-missing="true"
      >
        <span aria-hidden="true">{number ? `#${number}` : '—'}</span>
      </span>
    );
  }
  return (
    <picture className={`p5-portrait ${className}`.trim()}>
      <source
        type="image/avif"
        srcSet={driverPortraitSrcSet(driverId, 'avif')}
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet={driverPortraitSrcSet(driverId, 'webp')}
        sizes={sizes}
      />
      <img
        src={driverPortraitSrc(driverId)}
        alt={alt}
        width={720}
        height={960}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}
