import { getMotionTier, readMotionEnvironment } from '../utils/motionContract';
import type { MotionEnvironment } from '../utils/motionContract';
import { readViewportMetrics } from './viewportMetrics';
import type { ViewportMetrics } from './viewportMetrics';
import type { MotionTier } from '../utils/motionContract';

export type HomeMotionPolicy = {
  tier: MotionTier;
  /** Short travel and no long staggers: the narrow band, a low-power device or 400% text. */
  lite: boolean;
  viewport: ViewportMetrics;
};

export function readHomeMotionPolicy(
  env: MotionEnvironment = readMotionEnvironment(),
  viewport: ViewportMetrics = readViewportMetrics(),
): HomeMotionPolicy {
  const tier = getMotionTier(env);
  return { tier, lite: tier === 'lite' || viewport.compact, viewport };
}
