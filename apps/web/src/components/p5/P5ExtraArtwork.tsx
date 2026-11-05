import { useState, type ReactNode } from 'react';
import type { Extra2026Artwork } from '../../utils/p5Extended2026Visuals';

export function P5ExtraArtwork({ artwork, className, alt = '', eager = false, sizes = '100vw', fallback }: {
  artwork?: Extra2026Artwork;
  className?: string;
  alt?: string;
  eager?: boolean;
  sizes?: string;
  fallback?: ReactNode;
}) {
  // A failure belongs to the specific URL; changing season must retry the next image.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!artwork || failedSrc === artwork.src) return <>{fallback ?? null}</>;
  return (
    <picture className={className} data-p5-review-image="ai-illustration" data-p5-image-source="owner-review">
      {artwork.mobileSrc && <source media="(max-width: 46em)" srcSet={artwork.mobileSrc} type="image/webp" sizes={sizes} />}
      <img src={artwork.src} key={artwork.src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedSrc(artwork.src)} />
    </picture>
  );
}
