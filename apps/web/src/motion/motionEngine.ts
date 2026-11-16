export type MotionEngine = 'classic' | 'gsap';

/**
 * `?motion=gsap` is a development comparison switch only: a production bundle
 * resolves to the classic engine whatever the query string says.
 */
export function resolveMotionEngine(search: string, isDev: boolean): MotionEngine {
  if (!isDev) return 'classic';
  return new URLSearchParams(search).get('motion') === 'gsap' ? 'gsap' : 'classic';
}

export function readMotionEngine(): MotionEngine {
  if (typeof window === 'undefined') return 'classic';
  return resolveMotionEngine(window.location.search, import.meta.env.DEV);
}
