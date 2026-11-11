import { useState, type ReactNode } from 'react';

/** Optional owner-local image: missing path never leaves the browser's broken-image icon. */
export function LocalImage({ src, className, alt = '', fallback, width, height }: {
  src?: string;
  className?: string;
  alt?: string;
  fallback: ReactNode;
  width?: number;
  height?: number;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return <>{fallback}</>;
  return (
    <img
      src={src} key={src} className={className} alt={alt}
      width={width} height={height}
      loading="lazy" decoding="async" data-p5-image-source="owner-concept"
      onError={() => setFailedSrc(src)}
    />
  );
}
