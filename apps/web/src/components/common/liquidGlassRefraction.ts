export interface LiquidBezelMapOptions {
  /** Horizontal curved bezel band width as a percentage of element width (1..40). */
  readonly bezelXPercent: number;
  /** Vertical curved bezel band width as a percentage of element height (1..40). */
  readonly bezelYPercent: number;
}

export interface LiquidGlassPreset {
  readonly id: string;
  readonly bezelXPercent: number;
  readonly bezelYPercent: number;
  readonly scaleR: number;
  readonly scaleG: number;
  readonly scaleB: number;
}

export const LIQUID_GLASS_PRESETS: readonly LiquidGlassPreset[] = [
  {
    id: "peds-liquid-refract-pill",
    bezelXPercent: 14,
    bezelYPercent: 28,
    scaleR: 26,
    scaleG: 22,
    scaleB: 18,
  },
  {
    id: "peds-liquid-refract-panel",
    bezelXPercent: 8,
    bezelYPercent: 11,
    scaleR: 20,
    scaleG: 17,
    scaleB: 14,
  },
  {
    id: "peds-liquid-refract-drawer",
    bezelXPercent: 7,
    bezelYPercent: 8,
    scaleR: 15,
    scaleG: 13,
    scaleB: 11,
  },
] as const;

function clampBezel(pct: number): number {
  return Math.max(2, Math.min(40, Math.round(pct)));
}

/**
 * Generates an inline SVG displacement map encoding a convex liquid-glass bezel:
 * - Red channel encodes horizontal refraction (255 left bezel -> 128 flat optical core -> 0 right bezel).
 * - Green channel encodes vertical refraction (255 top bezel -> 128 flat optical core -> 0 bottom bezel).
 * - Screen-blending pure (R,0,0) and (0,G,0) layers yields exact (R,G,0) with a distortion-free (128,128) center.
 */
export function buildLiquidBezelMapDataUri(
  options: LiquidBezelMapOptions,
): string {
  const bx = clampBezel(options.bezelXPercent);
  const by = clampBezel(options.bezelYPercent);
  const bxMid = Math.max(1, Math.round(bx * 0.42));
  const byMid = Math.max(1, Math.round(by * 0.42));

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" preserveAspectRatio="none">',
    "<defs>",
    '<linearGradient id="rx" x1="0%" y1="0%" x2="100%" y2="0%">',
    '<stop offset="0%" stop-color="rgb(255,0,0)"/>',
    `<stop offset="${bxMid}%" stop-color="rgb(194,0,0)"/>`,
    `<stop offset="${bx}%" stop-color="rgb(128,0,0)"/>`,
    `<stop offset="${100 - bx}%" stop-color="rgb(128,0,0)"/>`,
    `<stop offset="${100 - bxMid}%" stop-color="rgb(62,0,0)"/>`,
    '<stop offset="100%" stop-color="rgb(0,0,0)"/>',
    "</linearGradient>",
    '<linearGradient id="gy" x1="0%" y1="0%" x2="0%" y2="100%">',
    '<stop offset="0%" stop-color="rgb(0,255,0)"/>',
    `<stop offset="${byMid}%" stop-color="rgb(0,194,0)"/>`,
    `<stop offset="${by}%" stop-color="rgb(0,128,0)"/>`,
    `<stop offset="${100 - by}%" stop-color="rgb(0,128,0)"/>`,
    `<stop offset="${100 - byMid}%" stop-color="rgb(0,62,0)"/>`,
    '<stop offset="100%" stop-color="rgb(0,0,0)"/>',
    "</linearGradient>",
    "</defs>",
    '<rect width="256" height="256" fill="url(#rx)"/>',
    '<rect width="256" height="256" fill="url(#gy)" style="mix-blend-mode:screen"/>',
    "</svg>",
  ].join("");

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
