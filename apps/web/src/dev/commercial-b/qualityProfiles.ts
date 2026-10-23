import type { QualityProfile } from './adaptiveController';

export const QUALITY_PROFILES = {
  HIGH: { renderScale: 1, antialias: true, shadows: false, postProcessing: false },
  BALANCED: { renderScale: 0.75, antialias: true, shadows: false, postProcessing: false },
  PERFORMANCE: { renderScale: 0.67, antialias: true, shadows: false, postProcessing: false },
} as const satisfies Record<QualityProfile, object>;
