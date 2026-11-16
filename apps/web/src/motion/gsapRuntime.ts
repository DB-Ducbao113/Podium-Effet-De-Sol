export type GsapRuntime = {
  gsap: typeof import('gsap').gsap;
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
};

export type ScrollTriggerInstance = import('gsap/ScrollTrigger').ScrollTrigger;

let runtime: Promise<GsapRuntime | null> | null = null;

/**
 * Home is server-prerendered and its tests render through renderToStaticMarkup in
 * a node environment, so the engine loads lazily on the client and answers null
 * anywhere it cannot run. A null runtime leaves every CSS default in place, which
 * is the static fallback rather than a broken page.
 */
export function loadGsapRuntime(): Promise<GsapRuntime | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  runtime ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
    .then(([core, trigger]) => {
      const ScrollTrigger = trigger.ScrollTrigger;
      core.gsap.registerPlugin(ScrollTrigger);
      return { gsap: core.gsap, ScrollTrigger };
    })
    .catch(() => null);
  return runtime;
}
