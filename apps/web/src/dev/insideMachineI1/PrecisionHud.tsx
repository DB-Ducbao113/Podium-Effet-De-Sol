import type { QualityProfile } from './types';

interface PrecisionHudProps {
  profile: QualityProfile;
  progress: number;
  beatIndex: number;
  beatCount: number;
  paused: boolean;
  lang: 'vi' | 'en';
}

/** Decorative data is deliberately limited to live application state, not fabricated F1 telemetry. */
export function PrecisionHud({
  profile,
  progress,
  beatIndex,
  beatCount,
  paused,
  lang,
}: PrecisionHudProps) {
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <div className="precision-hud" aria-hidden="true" data-testid="itm-v2-hud">
      <span className="precision-hud__heading">
        {lang === 'vi' ? 'BẢN PHÂN TÍCH CƠ KHÍ' : 'MECHANICAL INTELLIGENCE'}
      </span>
      <span className="precision-hud__line">
        <span className="precision-hud__dot" />
        R4.2 / {profile} / {paused ? 'INSPECTION' : 'STORY'}
      </span>
      <span className="precision-hud__line precision-hud__line--secondary">
        {lang === 'vi' ? 'TIẾN TRÌNH' : 'SEQUENCE'}{' '}
        <span className="precision-hud__active precision-hud__fraction">{percent}%</span>
        {'  /  '}
        {String(beatIndex + 1).padStart(2, '0')}:{String(beatCount).padStart(2, '0')}
      </span>
    </div>
  );
}
