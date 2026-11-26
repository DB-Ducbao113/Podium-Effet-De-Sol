import React from 'react';

type LogoVariant = 'mark' | 'compact' | 'full';
type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface OfficialBrandLogoProps {
  className?: string;
  size?: LogoSize;
  variant?: LogoVariant;
}

const heightByVariant: Record<LogoVariant, Record<LogoSize, string>> = {
  full: { sm: 'h-8', md: 'h-11', lg: 'h-14', xl: 'h-20' },
  compact: { sm: 'h-7', md: 'h-9', lg: 'h-11', xl: 'h-14' },
  mark: { sm: 'h-7', md: 'h-9', lg: 'h-12', xl: 'h-16' },
};

const sourceByVariant: Record<LogoVariant, string> = {
  full: '/logo/logo.png',
  compact: '/logo/logo-compact.png',
  mark: '/logo/icon-192.png',
};

const dimensionsByVariant: Record<
  LogoVariant,
  { readonly width: number; readonly height: number }
> = {
  full: { width: 600, height: 224 },
  compact: { width: 240, height: 90 },
  mark: { width: 192, height: 192 },
};

/** Keep the approved PNG as the fallback; modern browsers use responsive AVIF/WebP derivatives. */
export const OfficialBrandLogo: React.FC<OfficialBrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
}) => {
  const dims = dimensionsByVariant[variant];
  const logo = (
    <img
      src={sourceByVariant[variant]}
      width={dims.width}
      height={dims.height}
      decoding="async"
      alt={variant === 'mark' ? '' : variant === 'compact' ? 'EDS' : 'PODIUM — Effet de Sol'}
      aria-hidden={variant === 'mark' ? true : undefined}
      className={`${heightByVariant[variant][size]} ${variant === 'mark' ? 'aspect-square' : ''} w-auto max-w-full shrink-0 select-none object-contain transition-all duration-300 group-hover:brightness-110 ${className}`}
    />
  );
  return variant === 'full' ? (
    <picture className="contents">
      <source
        srcSet="/logo/logo-240.avif 240w, /logo/logo-600.avif 600w"
        sizes="(max-width: 860px) 120px, 160px"
        type="image/avif"
      />
      <source
        srcSet="/logo/logo-240.webp 240w, /logo/logo-optimized.webp 600w"
        sizes="(max-width: 860px) 120px, 160px"
        type="image/webp"
      />
      {logo}
    </picture>
  ) : (
    logo
  );
};
