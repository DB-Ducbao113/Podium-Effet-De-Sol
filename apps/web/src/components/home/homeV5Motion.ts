/** Pure scroll choreography; return values are bounded and reversible. */
export type V5HeroMotion = {
  progress: number;
  scene: 1 | 2 | 3;
  first: number;
  second: number;
  third: number;
  shift: number;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smoothstep = (a: number, b: number, value: number) => {
  const x = clamp01((value - a) / (b - a));
  return x * x * (3 - 2 * x);
};

export function getV5HeroMotion(
  top: number,
  height: number,
  viewportHeight: number,
  staticMode = false,
): V5HeroMotion {
  const scrollable = Math.max(1, height - viewportHeight + 64);
  const progress = staticMode ? 0 : clamp01((64 - top) / scrollable);
  return {
    progress,
    scene: progress < 0.34 ? 1 : progress < 0.72 ? 2 : 3,
    first: 1 - smoothstep(0.12, 0.42, progress),
    second: smoothstep(0.2, 0.43, progress) * (1 - smoothstep(0.59, 0.82, progress)),
    third: smoothstep(0.62, 0.9, progress),
    // Never exceed 18px; the car stays within a constant contain-framed stage.
    shift: progress * 18,
  };
}
