import type { CameraPose } from '../storyboard';

/**
 * P1.0 LOOKDEV ONLY. Shot presets use the authored R4.5 front-left wheel pivot.
 * The published REV4.2 choreography is not changed by this configuration.
 * All positions are in GLB Y-up. +Y Blender (left) maps to -Z Three.js.
 *
 * A, B, C, D, E, F mirror cinematic *principles* from the owner-supplied
 * Anime.js footage, not its actual software/animations/brand.
 */
export const FRONT_LEFT_R45_PIVOT_Z_UP = [1.2527518272399902, 0.8302745819091797, 0.3711177110671997] as const;

export function sourceZUpToThreeYUp([x, y, z]: readonly [number, number, number]): [number, number, number] {
  return [x, z, -y];
}

export const FRONT_LEFT_R45_PIVOT_Y_UP = sourceZUpToThreeYUp(FRONT_LEFT_R45_PIVOT_Z_UP);

export type WheelShotId = 'hero' | 'axis' | 'exploded' | 'blueprint' | 'macro' | 'rebuild';
export type WheelShotMood = 'cinematic' | 'technical';

export interface WheelShot {
  id: WheelShotId;
  timeRange: readonly [number, number];
  camera: CameraPose;
  mood: WheelShotMood;
  /** Relative non-physical intensity multiplier for the existing lighting rig. */
  light: number;
  focusPart: string | null;
  title: { vi: string; en: string };
  visualGate: string;
}

const pivot = FRONT_LEFT_R45_PIVOT_Y_UP;

/**
 * Positions are initial storyboard framing candidates. Their actual visual
 * acceptance requires WebGL screenshots; exact positioning is NOT certified.
 */
export const FRONT_LEFT_WHEEL_SHOTS: readonly WheelShot[] = [
  {
    id: 'hero',
    timeRange: [0, 0.12],
    camera: { target: [0, 0.42, 0], direction: [5, 1.83, -5.9], distance: 7.95, fit: true, screenShift: 0 },
    mood: 'cinematic',
    light: 1.15,
    focusPart: null,
    title: { vi: 'Toàn cảnh chiếc xe', en: 'The machine revealed' },
    visualGate: 'Read entire car silhouette and material hierarchy immediately.',
  },
  {
    id: 'axis',
    timeRange: [0.12, 0.25],
    camera: { target: pivot, direction: [2.45, 1.12, -2.8], distance: 3.2, fit: false, screenShift: 0, focusAssembly: true },
    mood: 'cinematic',
    light: 1.35,
    focusPart: 'FRONT_LEFT_WHEEL.CENTER_LOCK_NUT',
    title: { vi: 'Khóa tâm', en: 'Center lock' },
    visualGate: 'Nut and tire rim remain distinct without unexplained focal jumps.',
  },
  {
    id: 'exploded',
    timeRange: [0.25, 0.54],
    camera: { target: [pivot[0], pivot[1] + 0.05, pivot[2] - 0.34], direction: [2.2, 1.12, -2.8], distance: 4.4, fit: false, screenShift: 0, focusAssembly: true },
    mood: 'cinematic',
    light: 1.45,
    focusPart: 'FRONT_LEFT_WHEEL.BRAKE_DISC',
    title: { vi: 'Bóc tách cơ khí', en: 'Precision exploded view' },
    visualGate: 'Seven separations readable; authored wheel axis retained.',
  },
  {
    id: 'blueprint',
    timeRange: [0.54, 0.69],
    camera: { target: [pivot[0], pivot[1], pivot[2] - 0.28], direction: [2.2, 1.45, -2.7], distance: 4.05, fit: false, screenShift: 0, focusAssembly: true },
    mood: 'technical',
    light: 1.05,
    focusPart: 'FRONT_LEFT_WHEEL.WHEEL_HUB',
    title: { vi: 'Bản vẽ kỹ thuật', en: 'Technical blueprint' },
    visualGate: 'The *same* geometry yields clean edges/labels against a pale field.',
  },
  {
    id: 'macro',
    timeRange: [0.69, 0.86],
    camera: { target: pivot, direction: [1.9, 0.78, -2.2], distance: 2.55, fit: false, screenShift: 0, focusAssembly: true },
    mood: 'technical',
    light: 1.25,
    focusPart: 'FRONT_LEFT_WHEEL.BRAKE_CALIPER',
    title: { vi: 'Khảo sát phanh', en: 'Brake / hub macro' },
    visualGate: 'No unsupported vents or false axial engagement.',
  },
  {
    id: 'rebuild',
    timeRange: [0.86, 1],
    camera: { target: [0, 0.42, 0], direction: [5, 1.83, -5.9], distance: 7.95, fit: true, screenShift: 0 },
    mood: 'cinematic',
    light: 1.15,
    focusPart: null,
    title: { vi: 'Lắp ráp hoàn chỉnh', en: 'Reassembly' },
    visualGate: 'Final pose exactly matches original transforms; no residual offset.',
  },
] as const;

export function wheelShotAt(progress: number): WheelShot {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  return FRONT_LEFT_WHEEL_SHOTS.find((shot) => p >= shot.timeRange[0] && p < shot.timeRange[1])
    ?? FRONT_LEFT_WHEEL_SHOTS[FRONT_LEFT_WHEEL_SHOTS.length - 1];
}

/** Visual/motion timing is a proposal, not accepted camera-clip evidence. */
export const FRONT_LEFT_WHEEL_LOOKDEV_COLORS = {
  heroBackground: '#080D15',
  blueprintBackground: '#EEF3F5',
  ignition: '#FF5635',
  truthfulTelemetry: '#56D4E9',
  carbonEdge: '#687F90',
} as const;
