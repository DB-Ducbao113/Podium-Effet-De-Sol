import { useState } from 'react';
import type { SeasonYear } from '../../types';
import { circuitPreviewUrl, resolveCircuitVisual } from '../../utils/p5SeasonalVisuals';

type Props = {
  season: SeasonYear;
  round: number;
  fallback: string;
  className?: string;
  wrapperClassName?: string;
  eager?: boolean;
  sizes?: string;
};

export function SeasonalCircuitPhoto({ season, round, fallback, className, wrapperClassName, eager = false, sizes = '100vw' }: Props) {
  const [failed, setFailed] = useState(false);
  const visual = resolveCircuitVisual(season, round);
  const desktop = circuitPreviewUrl(visual, 'desktop');
  const mobile = circuitPreviewUrl(visual, 'mobile');
  if (!desktop || failed) {
    return wrapperClassName ? (
      <picture className={wrapperClassName}>
        <img className={className} src={fallback} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />
      </picture>
    ) : <img className={className} src={fallback} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />;
  }
  return (
    <picture className={wrapperClassName} data-p5-review-image="ai-illustration">
      {mobile && <source media="(max-width: 46em)" srcSet={mobile} type="image/webp" sizes={sizes} />}
      <img
        className={className}
        src={desktop}
        alt=""
        width={visual!.desktop.width}
        height={visual!.desktop.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={{ objectPosition: `${Math.round(visual!.focalPointX * 100)}% center` }}
        onError={() => setFailed(true)}
      />
    </picture>
  );
}
