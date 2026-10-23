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

/** Official raster artwork; PNG preserves the original metallic and glow treatment. */
export const OfficialBrandLogo: React.FC<OfficialBrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
}) => (
  <img
    src={sourceByVariant[variant]}
    alt={variant === 'mark' ? '' : variant === 'compact' ? 'EDS' : 'PODIUM — Effet de Sol'}
    aria-hidden={variant === 'mark' ? true : undefined}
    className={`${heightByVariant[variant][size]} ${variant === 'mark' ? 'aspect-square' : ''} w-auto max-w-full shrink-0 select-none object-contain transition-all duration-300 group-hover:brightness-110 ${className}`}
  />
);
