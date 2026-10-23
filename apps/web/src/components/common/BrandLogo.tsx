import React from 'react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { t } from '../../i18n/translations';

export interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'mark' | 'full';
  theme?: 'light' | 'dark' | 'auto';
  showSub?: boolean;
}

/**
 * Legacy bespoke aerodynamic mark retained for backwards compatibility.
 * Features a multi-element downforce aerofoil and Venturi underfloor tunnel vortex.
 * 100% custom, original racing engineering icon with ZERO trademark infringement.
 */
export const BrandLogoMark: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isDark?: boolean;
}> = ({ size = 'md', className = '', isDark = false }) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative ${dim} shrink-0 select-none flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="geBrandRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff3333" />
            <stop offset="100%" stopColor="#e10600" />
          </linearGradient>
          <linearGradient id="geBrandCarbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e222b" />
            <stop offset="100%" stopColor="#090a0d" />
          </linearGradient>
          <linearGradient id="geBrandSilver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>

        {/* 1. Aerodynamic Badge Chassis */}
        <rect
          x="1.5"
          y="1.5"
          width="33"
          height="33"
          rx="8.5"
          fill={isDark ? 'url(#geBrandCarbon)' : '#090a0d'}
          stroke="#e10600"
          strokeWidth="1.5"
        />

        {/* 2. Top Downforce DRS Aerofoil (Crimson Red) */}
        <path
          d="M6 10.5C11 7.6 22 7.6 30 11L28.2 14.2C21.5 12 13 12 8 13.8L6 10.5Z"
          fill="url(#geBrandRed)"
        />

        {/* 3. Mid Venturi Undercut Airflow Channel (Titanium Silver) */}
        <path
          d="M8.5 16.2C13.2 14 21.2 14 27.2 16.5L25.6 19.4C20.5 17.5 13.8 17.5 9.8 19.1L8.5 16.2Z"
          fill="url(#geBrandSilver)"
        />

        {/* 4. Lower Ground-Effect Diffuser Kick-Plate (Crimson Red) */}
        <path
          d="M11 22C14.8 20.4 19.8 20.4 24.2 22L23 24.6C19.2 23.4 15.2 23.4 12 24.5L11 22Z"
          fill="url(#geBrandRed)"
        />

        {/* 5. Aerodynamic Apex Keel Center Vane & Speed Focal Core */}
        <polygon points="18,10.5 20.2,17.8 18,26.5 15.8,17.8" fill="#ffffff" opacity="0.95" />
        <circle cx="18" cy="17.8" r="2.2" fill="#e10600" />
      </svg>
    </div>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'auto',
  showSub = true,
}) => {
  const lang = useNavigationStore((state) => state.lang);
  const strings = t[lang].nav;

  const isDark = theme === 'dark';

  if (variant === 'mark') {
    return <BrandLogoMark size={size} className={className} isDark={isDark} />;
  }

  return (
    <div className={`flex items-center gap-2 sm:gap-3 group shrink-0 text-left ${className}`}>
      <BrandLogoMark size={size} isDark={isDark} />

      <div className="flex flex-col select-none">
        <div className="flex items-center gap-1.5 leading-tight">
          <span
            className={`text-[11px] sm:text-[13px] font-display uppercase tracking-widest font-black transition-colors duration-200 ${
              isDark
                ? 'text-white group-hover:text-f1red'
                : 'text-studio-950 group-hover:text-f1red'
            }`}
          >
            Ground Effect
          </span>
          <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-f1red text-white shadow-2xs">
            Hub
          </span>
        </div>

        {showSub && (
          <span
            className={`text-[8px] sm:text-[9px] uppercase tracking-widest font-semibold hidden xs:block transition-colors ${
              isDark ? 'text-studio-400' : 'text-studio-500'
            }`}
          >
            {strings.brandSub}
          </span>
        )}
      </div>
    </div>
  );
};
