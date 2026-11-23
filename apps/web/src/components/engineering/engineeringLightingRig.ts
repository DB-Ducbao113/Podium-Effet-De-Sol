import type { EngineeringStoryChapterId } from "./engineeringStoryTimeline";

export interface EngineeringLightRigState {
  readonly ambientIntensity: number;
  readonly keyIntensity: number;
  readonly keyPosition: readonly [number, number, number];
  readonly fillIntensity: number;
  readonly fillPosition: readonly [number, number, number];
  readonly rimIntensity: number;
  readonly rimPosition: readonly [number, number, number];
  readonly accentPointIntensity: number;
  readonly accentPointPosition: readonly [number, number, number];
  readonly accentPointColor: string;
}

export interface MutableEngineeringLightRigState {
  ambientIntensity: number;
  keyIntensity: number;
  keyPosition: [number, number, number];
  fillIntensity: number;
  fillPosition: [number, number, number];
  rimIntensity: number;
  rimPosition: [number, number, number];
  accentPointIntensity: number;
  accentPointPosition: [number, number, number];
  accentPointColor: string;
}

/**
 * Restrained, chapter-specific studio lighting presets calibrated for
 * realistic F1 carbon weave, painted clearcoat, matte tire rubber,
 * machined metals, and glare-free cockpit OLED legibility.
 */
export const ENGINEERING_CHAPTER_LIGHT_PRESETS: Readonly<
  Record<EngineeringStoryChapterId, EngineeringLightRigState>
> = {
  origin: {
    ambientIntensity: 0.42,
    keyIntensity: 2.45,
    keyPosition: [-6.4, 9.2, -5.8],
    fillIntensity: 1.32,
    fillPosition: [7.6, 4.8, 5.4],
    rimIntensity: 1.24,
    rimPosition: [0.4, 3.4, 8.4],
    accentPointIntensity: 0.45,
    accentPointPosition: [-1.4, 1.3, -1.6],
    accentPointColor: "#eef6ff",
  },
  aero: {
    ambientIntensity: 0.4,
    keyIntensity: 2.7,
    keyPosition: [-5.6, 8.6, -6.8],
    fillIntensity: 1.25,
    fillPosition: [7.2, 4.6, 4.8],
    rimIntensity: 1.36,
    rimPosition: [0.8, 3.6, 8.2],
    accentPointIntensity: 0.55,
    accentPointPosition: [-1.6, 0.9, -2.6],
    accentPointColor: "#fff4eb",
  },
  cockpit: {
    ambientIntensity: 0.46,
    keyIntensity: 1.95,
    keyPosition: [-5.8, 8.8, 4.4],
    fillIntensity: 1.18,
    fillPosition: [6.2, 4.4, 4.2],
    rimIntensity: 0.95,
    rimPosition: [0.0, 4.2, -6.5],
    // Off-axis soft cockpit task light: illuminates carbon/buttons without washing out central OLED glare
    accentPointIntensity: 0.65,
    accentPointPosition: [-0.85, 1.45, 0.65],
    accentPointColor: "#e6f2ff",
  },
  corners: {
    ambientIntensity: 0.44,
    keyIntensity: 2.35,
    keyPosition: [-6.8, 7.6, -4.6],
    fillIntensity: 1.52,
    fillPosition: [7.4, 3.6, 4.6],
    rimIntensity: 1.18,
    rimPosition: [0.0, 2.8, 8.0],
    accentPointIntensity: 0.62,
    accentPointPosition: [-1.8, 0.65, -0.8],
    accentPointColor: "#eef5ff",
  },
  bodywork: {
    ambientIntensity: 0.45,
    keyIntensity: 2.35,
    keyPosition: [-6.2, 9.6, -3.2],
    fillIntensity: 1.55,
    fillPosition: [7.6, 6.2, -2.4],
    rimIntensity: 1.12,
    rimPosition: [0.0, 3.6, 8.4],
    accentPointIntensity: 0.7,
    accentPointPosition: [0.0, 1.65, 0.4],
    accentPointColor: "#f0f7ff",
  },
  core: {
    ambientIntensity: 0.46,
    keyIntensity: 2.25,
    keyPosition: [-6.0, 8.4, -4.8],
    fillIntensity: 1.48,
    fillPosition: [6.8, 4.2, 5.2],
    rimIntensity: 1.28,
    rimPosition: [0.2, 2.6, 8.2],
    // Cool upward underfloor bounce revealing Venturi tunnels, titanium plank & V6 core
    accentPointIntensity: 1.15,
    accentPointPosition: [0.0, -0.95, 0.25],
    accentPointColor: "#c8e4ff",
  },
  matrix: {
    ambientIntensity: 0.46,
    keyIntensity: 2.4,
    keyPosition: [-6.5, 9.5, -5.5],
    fillIntensity: 1.42,
    fillPosition: [7.5, 5.2, 5.8],
    rimIntensity: 1.18,
    rimPosition: [0.0, 3.2, 8.2],
    accentPointIntensity: 0.6,
    accentPointPosition: [0.0, 1.15, -0.2],
    accentPointColor: "#eef6ff",
  },
  reassembly: {
    ambientIntensity: 0.43,
    keyIntensity: 2.45,
    keyPosition: [-6.4, 9.2, -5.8],
    fillIntensity: 1.34,
    fillPosition: [7.6, 4.8, 5.4],
    rimIntensity: 1.22,
    rimPosition: [0.4, 3.4, 8.4],
    accentPointIntensity: 0.48,
    accentPointPosition: [-1.2, 1.25, -1.4],
    accentPointColor: "#eef6ff",
  },
};

export const COCKPIT_INTERIOR_LIGHT_PRESET: EngineeringLightRigState = {
  ambientIntensity: 0.54,
  keyIntensity: 2.35,
  keyPosition: [-4.2, 10.4, 2.2],
  fillIntensity: 1.72,
  fillPosition: [5.4, 7.2, 2.8],
  rimIntensity: 1.15,
  rimPosition: [0.0, 4.6, -5.8],
  // Subtle overhead monocoque tub fill separating dark carbon seat bolsters & survival liner
  accentPointIntensity: 1.55,
  accentPointPosition: [0.0, 1.55, 0.22],
  accentPointColor: "#e8f2ff",
};

const COCKPIT_INTERIOR_PART_IDS = new Set([
  "COCKPIT_SEAT_CARBON",
  "COCKPIT_SURVIVAL_LINER",
]);

export function resolveTargetLightPreset(
  chapterId: EngineeringStoryChapterId,
  partId: string | null = null,
): EngineeringLightRigState {
  if (
    chapterId === "cockpit" &&
    partId !== null &&
    COCKPIT_INTERIOR_PART_IDS.has(partId)
  ) {
    return COCKPIT_INTERIOR_LIGHT_PRESET;
  }
  return (
    ENGINEERING_CHAPTER_LIGHT_PRESETS[chapterId] ??
    ENGINEERING_CHAPTER_LIGHT_PRESETS.origin
  );
}

export function createMutableLightRigState(): MutableEngineeringLightRigState {
  const base = ENGINEERING_CHAPTER_LIGHT_PRESETS.origin;
  return {
    ambientIntensity: base.ambientIntensity,
    keyIntensity: base.keyIntensity,
    keyPosition: [...base.keyPosition],
    fillIntensity: base.fillIntensity,
    fillPosition: [...base.fillPosition],
    rimIntensity: base.rimIntensity,
    rimPosition: [...base.rimPosition],
    accentPointIntensity: base.accentPointIntensity,
    accentPointPosition: [...base.accentPointPosition],
    accentPointColor: base.accentPointColor,
  };
}

export function stepLightRigTowardChapter(
  current: MutableEngineeringLightRigState,
  chapterId: EngineeringStoryChapterId,
  alpha: number,
  partId: string | null = null,
): void {
  const target = resolveTargetLightPreset(chapterId, partId);
  const t = Math.max(0, Math.min(1, alpha));
  current.ambientIntensity +=
    (target.ambientIntensity - current.ambientIntensity) * t;
  current.keyIntensity += (target.keyIntensity - current.keyIntensity) * t;
  current.fillIntensity += (target.fillIntensity - current.fillIntensity) * t;
  current.rimIntensity += (target.rimIntensity - current.rimIntensity) * t;
  current.accentPointIntensity +=
    (target.accentPointIntensity - current.accentPointIntensity) * t;
  for (let i = 0; i < 3; i += 1) {
    current.keyPosition[i] +=
      (target.keyPosition[i] - current.keyPosition[i]) * t;
    current.fillPosition[i] +=
      (target.fillPosition[i] - current.fillPosition[i]) * t;
    current.rimPosition[i] +=
      (target.rimPosition[i] - current.rimPosition[i]) * t;
    current.accentPointPosition[i] +=
      (target.accentPointPosition[i] - current.accentPointPosition[i]) * t;
  }
  current.accentPointColor = target.accentPointColor;
}

export type EngineeringMaterialClass =
  | "display-sticker"
  | "glass-alpha"
  | "rubber-fabric"
  | "metal-machined"
  | "carbon-fiber"
  | "painted-bodywork"
  | "standard";

/**
 * Classifies authored FP-04 RB GLB material names to calibrate envMapIntensity
 * without overwriting authored textures, roughness, metalness, clearcoat, or alphaMode.
 */
export function classifyEngineeringMaterial(
  name: string,
  isTransparentBlend: boolean,
  hasEmissiveMap: boolean,
): EngineeringMaterialClass {
  const n = name.toLowerCase();
  if (
    hasEmissiveMap ||
    n.includes("dashboard_screen") ||
    n.includes("display_screen") ||
    n.includes("steering_wheel_stickers") ||
    n.includes("led_emmitor")
  ) {
    return "display-sticker";
  }
  if (isTransparentBlend || n.includes("glass_clear")) {
    return "glass-alpha";
  }
  if (
    n.includes("tyre") ||
    n.includes("tire") ||
    n.includes("rubber") ||
    n.includes("felt") ||
    n.includes("fabric") ||
    n.includes("foam")
  ) {
    return "rubber-fabric";
  }
  if (
    n.includes("chrome") ||
    n.includes("titanium") ||
    n.includes("aluminum") ||
    n.includes("anodized") ||
    n.includes("inconel") ||
    n.includes("brass")
  ) {
    return "metal-machined";
  }
  if (n.includes("carbon") || n.includes("floor_texture")) {
    return "carbon-fiber";
  }
  if (
    n.includes("body_texture") ||
    n.includes("wing_texture") ||
    n.includes("winglets_texture") ||
    n.includes("mirrors_texture") ||
    n.includes("wheel_covers") ||
    n.includes("paint") ||
    n.includes("audi_")
  ) {
    return "painted-bodywork";
  }
  return "standard";
}

const ENV_INTENSITY_BY_CLASS: Readonly<
  Record<EngineeringMaterialClass, number>
> = {
  "display-sticker": 0.42,
  "glass-alpha": 1.32,
  "rubber-fabric": 0.52,
  "metal-machined": 1.68,
  "carbon-fiber": 1.12,
  "painted-bodywork": 1.48,
  standard: 1.15,
};

export function resolveMaterialClassEnvIntensity(
  name: string,
  isTransparentBlend: boolean,
  hasEmissiveMap: boolean,
): number {
  return ENV_INTENSITY_BY_CLASS[
    classifyEngineeringMaterial(name, isTransparentBlend, hasEmissiveMap)
  ];
}
