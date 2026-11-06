/**
 * P1.5 — candidate macro lenses for the actual seven R4.5 source nodes.
 *
 * Direction is a world-space point-of-view vector in GLB Y-up.
 * Distance is determined from each mesh's current world-space bounding
 * sphere, not from the manifest's unverified part origins.
 *
 * These are lookdev shots, not accepted source evidence.
 */
export interface ComponentMacroLens {
  direction: readonly [number, number, number];
  minDistance: number;
  maxDistance: number;
  margin: number;
}

export const P1_COMPONENT_MACRO_LENSES: Record<string, ComponentMacroLens> = {
  'FRONT_LEFT_WHEEL.CENTER_LOCK_NUT': {
    direction: [1.20, 0.68, -3.30], minDistance: 0.72, maxDistance: 1.6, margin: 1.85,
  },
  'FRONT_LEFT_WHEEL.WHEEL_OUTER': {
    direction: [1.65, 0.90, -3.00], minDistance: 1.55, maxDistance: 3.3, margin: 1.70,
  },
  'FRONT_LEFT_WHEEL.WHEEL_HUB': {
    direction: [1.85, 0.72, -2.80], minDistance: 0.95, maxDistance: 2.25, margin: 1.85,
  },
  'FRONT_LEFT_WHEEL.BRAKE_DISC': {
    direction: [1.35, 1.12, -2.88], minDistance: 1.08, maxDistance: 2.6, margin: 1.70,
  },
  'FRONT_LEFT_WHEEL.BRAKE_CALIPER': {
    direction: [2.50, 1.30, -2.15], minDistance: 0.90, maxDistance: 2.10, margin: 1.85,
  },
  'FRONT_LEFT_WHEEL.SUSPENSION_LINKS': {
    direction: [3.20, 1.45, -1.50], minDistance: 1.4, maxDistance: 3.4, margin: 1.65,
  },
  'FRONT_LEFT_WHEEL.HUB_MOUNT_INTERFACE': {
    direction: [1.80, 1.18, -2.55], minDistance: 0.80, maxDistance: 2.20, margin: 2.0,
  },
};

export const P1_DEFAULT_MACRO_LENS: ComponentMacroLens = {
  direction: [1.85, 1.02, -2.8],
  minDistance: 0.74,
  maxDistance: 4.5,
  margin: 1.65,
};

export function macroLensFor(id: string | null): ComponentMacroLens {
  return id ? (P1_COMPONENT_MACRO_LENSES[id] ?? P1_DEFAULT_MACRO_LENS) : P1_DEFAULT_MACRO_LENS;
}
