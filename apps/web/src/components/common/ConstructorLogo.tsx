import React from 'react';
import { TeamId } from '../../types';

interface ConstructorLogoProps {
  teamId: TeamId;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  badgeMode?: boolean;
  lang?: 'vi' | 'en';
}

const TEAM_LABELS: Record<TeamId, { code: string; label: string }> = {
  ferrari: { code: 'FER', label: 'Ferrari' },
  mclaren: { code: 'MCL', label: 'McLaren' },
  redbull: { code: 'RBR', label: 'Red Bull Racing' },
  mercedes: { code: 'MER', label: 'Mercedes' },
  astonmartin: { code: 'AMR', label: 'Aston Martin' },
  alpine: { code: 'ALP', label: 'Alpine' },
  racingbulls: { code: 'RB', label: 'Racing Bulls' },
  haas: { code: 'HAS', label: 'Haas' },
  williams: { code: 'WIL', label: 'Williams' },
  audi: { code: 'AUD', label: 'Audi' },
  cadillac: { code: 'CAD', label: 'Cadillac' },
};

const SIZE_CLASSES = {
  sm: 'h-6 w-6',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

/**
 * Original Podium EDS editorial identifier. The geometric mark deliberately
 * avoids constructor logos while keeping factual team labels available in UI.
 */
export const ConstructorLogo: React.FC<ConstructorLogoProps> = ({
  teamId,
  className = '',
  size = 'md',
  showText = false,
  badgeMode = false,
  lang = 'vi',
}) => {
  const identity = TEAM_LABELS[teamId];
  const gradientId = `eds-constructor-${teamId}`;

  const mark = (
    <svg
      viewBox="0 0 64 64"
      className={`${SIZE_CLASSES[size]} shrink-0 drop-shadow-md`}
      role="img"
      aria-label={`${identity.label} independent editorial identifier`}
    >
      <defs>
        <linearGradient id={gradientId} x1="10" y1="8" x2="54" y2="56">
          <stop stopColor="#f8fafc" />
          <stop offset="0.48" stopColor="#a7b0bd" />
          <stop offset="0.5" stopColor="#ef233c" />
          <stop offset="1" stopColor="#8d1022" />
        </linearGradient>
      </defs>
      <path
        d="M32 3 55 16v32L32 61 9 48V16Z"
        fill="#0b0e13"
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
      />
      <path d="M18 22h28M16 42h32" stroke="#ffffff" strokeOpacity="0.18" />
      <path d="M18 32h28" stroke="#ef233c" strokeWidth="3" />
      <text
        x="32"
        y="28"
        fill="#f8fafc"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="11"
        fontWeight="800"
        letterSpacing="1"
      >
        {identity.code}
      </text>
      <text
        x="32"
        y="50"
        fill="#a7b0bd"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="6"
        fontWeight="700"
        letterSpacing="1.4"
      >
        EDS
      </text>
    </svg>
  );

  if (badgeMode) {
    return (
      <div
        className={`inline-flex items-center gap-2.5 rounded-xl border border-white/20 bg-black/80 px-3 py-1.5 shadow-xl backdrop-blur-md transition-all ${className}`}
      >
        {mark}
        <div className="flex flex-col text-left">
          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {lang === 'vi' ? 'HỒ SƠ ĐỘC LẬP' : 'INDEPENDENT PROFILE'}
          </span>
          <span className="font-display text-xs font-black uppercase leading-tight tracking-wider text-white">
            {identity.label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {mark}
      {showText && (
        <span className="font-display text-xs font-black uppercase tracking-wide text-white sm:text-sm">
          {identity.label}
        </span>
      )}
    </div>
  );
};
