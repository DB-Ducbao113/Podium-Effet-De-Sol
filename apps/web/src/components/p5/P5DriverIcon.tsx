import { useState, type CSSProperties } from 'react';
import type { SeasonYear } from '../../types';
import { getTeamTextColor } from '../../utils/teamColors';
import { driverPreviewUrl, resolveDriverVisual } from '../../utils/p5SeasonalVisuals';
import './p5DriverIcon.css';

type Props = {
  season: SeasonYear;
  driverId: string;
  code?: string;
  teamId?: string;
  size?: number;
  className?: string;
};

/** Compact, decorative image; the adjacent driver name remains the accessible label. */
export function P5DriverIcon({ season, driverId, code, teamId, size = 40, className = '' }: Props) {
  const [failed, setFailed] = useState(false);
  const visual = resolveDriverVisual(season, driverId);
  const full = driverPreviewUrl(visual, 'full');
  const small = driverPreviewUrl(visual, 'small');
  const color = getTeamTextColor(teamId ?? visual?.teamId, true);
  return (
    <span
      className={`p5-driver-icon ${className}`.trim()}
      style={{ '--p5-icon-size': `${size}px`, '--p5-icon-team': color } as CSSProperties}
      data-p5-review-image={full && !failed ? 'ai-illustration' : undefined}
      aria-hidden="true"
    >
      {full && !failed ? (
        <img
          src={size <= 36 ? small : full}
          srcSet={`${small} 72w, ${full} 192w`}
          sizes={`${size}px`}
          alt=""
          width={192}
          height={192}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : <span className="p5-driver-icon__fallback">{(code || driverId).slice(0, 3).toUpperCase()}</span>}
    </span>
  );
}
