import { useState } from 'react';
import type { CircuitVisualAsset2026 } from '../../utils/circuitVisualAssets2026';

type Props = {
  visual?: CircuitVisualAsset2026;
  className?: string;
  sizes?: string;
  eager?: boolean;
  fallback: string;
};

/** The on-error path keeps a usable local plate when an optimized file fails. */
export function CircuitPhoto({ visual, className, sizes = '100vw', eager = false, fallback }: Props) {
  const [failed, setFailed] = useState(false);
  if (!visual || failed) {
    return <img className={className} src={fallback} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />;
  }
  return (
    <picture>
      <source media="(max-width: 46em)" type="image/avif" srcSet={visual.mobileSrcSet('avif')} sizes={sizes} />
      <source media="(max-width: 46em)" type="image/webp" srcSet={visual.mobileSrcSet('webp')} sizes={sizes} />
      <source type="image/avif" srcSet={visual.desktopSrcSet('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={visual.desktopSrcSet('webp')} sizes={sizes} />
      <img
        className={className}
        src={visual.desktop}
        alt=""
        width={visual.desktopSize.width}
        height={visual.desktopSize.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
      />
    </picture>
  );
}
