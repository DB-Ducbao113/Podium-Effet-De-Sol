import type { LocalizedText } from "./engineeringDisassemblyData";

export type EngineeringCfdZoneId =
  "front-wing" | "sidepod-inwash" | "venturi-underfloor";

export interface EngineeringCfdZoneSpec {
  readonly id: EngineeringCfdZoneId;
  readonly colorHex: string;
  readonly label: LocalizedText;
}

export interface EngineeringAeroStreamlineSpec {
  readonly id: string;
  readonly zone: EngineeringCfdZoneId;
  readonly side: "left" | "right";
  readonly colorHex: string;
  readonly radius: number;
  readonly speed: number;
  readonly phaseOffset: number;
  readonly points: readonly (readonly [number, number, number])[];
}

export const ENGINEERING_CFD_ZONES: readonly EngineeringCfdZoneSpec[] = [
  {
    id: "front-wing",
    colorHex: "#4ad8e8",
    label: {
      en: "Front Wing Conditioning & Outwash",
      vi: "Điều hướng cánh trước & tách xoáy lốp",
    },
  },
  {
    id: "sidepod-inwash",
    colorHex: "#ff8a5c",
    label: {
      en: "Sidepod Undercut & Downwash Channel",
      vi: "Luồng ôm lườn sidepod & ép xuống sàn",
    },
  },
  {
    id: "venturi-underfloor",
    colorHex: "#d8ff48",
    label: {
      en: "Underfloor Venturi Throat & Diffuser",
      vi: "Đường hầm Venturi gầm xe & khuếch tán sau",
    },
  },
];

interface BaseHalfStreamline {
  readonly idPrefix: string;
  readonly zone: EngineeringCfdZoneId;
  readonly colorHex: string;
  readonly radius: number;
  readonly speed: number;
  readonly phaseOffset: number;
  /** Left-side control points (X < 0); right-side mirror negates X. */
  readonly leftPoints: readonly (readonly [number, number, number])[];
}

const BASE_HALF_STREAMLINES: readonly BaseHalfStreamline[] = [
  // ── 1. Front Wing Conditioning & Tire Wake Outwash (4 lines: 2L, 2R) ──────
  {
    idPrefix: "cfd-fw-inner",
    zone: "front-wing",
    colorHex: "#4ad8e8",
    radius: 0.022,
    speed: 1.05,
    phaseOffset: 0.0,
    leftPoints: [
      [-0.32, 0.16, -3.02],
      [-0.34, 0.19, -2.35],
      [-0.36, 0.28, -1.72],
      [-0.39, 0.42, -0.95],
      [-0.41, 0.48, -0.15],
      [-0.38, 0.52, 0.65],
    ],
  },
  {
    idPrefix: "cfd-fw-outwash",
    zone: "front-wing",
    colorHex: "#4ad8e8",
    radius: 0.024,
    speed: 1.15,
    phaseOffset: 0.28,
    leftPoints: [
      [-0.64, 0.18, -2.98],
      [-0.74, 0.24, -2.28],
      [-0.96, 0.36, -1.62],
      [-1.04, 0.44, -0.82],
      [-0.92, 0.46, 0.08],
      [-0.82, 0.48, 0.92],
    ],
  },

  // ── 2. Sidepod Undercut & Shoulder Downwash (4 lines: 2L, 2R) ─────────────
  {
    idPrefix: "cfd-sp-undercut",
    zone: "sidepod-inwash",
    colorHex: "#ff8a5c",
    radius: 0.024,
    speed: 1.22,
    phaseOffset: 0.14,
    leftPoints: [
      [-0.46, 0.34, -0.85],
      [-0.58, 0.36, -0.25],
      [-0.56, 0.31, 0.45],
      [-0.44, 0.26, 1.18],
      [-0.38, 0.32, 1.88],
      [-0.42, 0.54, 2.68],
    ],
  },
  {
    idPrefix: "cfd-sp-shoulder",
    zone: "sidepod-inwash",
    colorHex: "#ff8a5c",
    radius: 0.022,
    speed: 1.12,
    phaseOffset: 0.46,
    leftPoints: [
      [-0.38, 0.58, -0.68],
      [-0.48, 0.64, -0.05],
      [-0.46, 0.59, 0.62],
      [-0.35, 0.48, 1.32],
      [-0.32, 0.56, 2.04],
      [-0.36, 0.78, 2.82],
    ],
  },

  // ── 3. Underfloor Venturi Throat & Rear Diffuser Extraction (4 lines: 2L, 2R)
  {
    idPrefix: "cfd-vf-throat",
    zone: "venturi-underfloor",
    colorHex: "#d8ff48",
    radius: 0.026,
    speed: 1.48,
    phaseOffset: 0.08,
    leftPoints: [
      [-0.24, 0.11, -1.18],
      [-0.22, 0.08, -0.38],
      [-0.2, 0.07, 0.48],
      [-0.24, 0.09, 1.34],
      [-0.3, 0.24, 2.18],
      [-0.36, 0.48, 2.96],
    ],
  },
  {
    idPrefix: "cfd-vf-edge",
    zone: "venturi-underfloor",
    colorHex: "#d8ff48",
    radius: 0.024,
    speed: 1.36,
    phaseOffset: 0.52,
    leftPoints: [
      [-0.48, 0.12, -1.04],
      [-0.52, 0.09, -0.22],
      [-0.54, 0.08, 0.64],
      [-0.5, 0.11, 1.48],
      [-0.52, 0.28, 2.24],
      [-0.58, 0.52, 3.02],
    ],
  },
];

export const ENGINEERING_AERO_STREAMLINES: readonly EngineeringAeroStreamlineSpec[] =
  BASE_HALF_STREAMLINES.flatMap((base): EngineeringAeroStreamlineSpec[] => {
    const left: EngineeringAeroStreamlineSpec = {
      id: `${base.idPrefix}-left`,
      zone: base.zone,
      side: "left",
      colorHex: base.colorHex,
      radius: base.radius,
      speed: base.speed,
      phaseOffset: base.phaseOffset,
      points: base.leftPoints,
    };
    const right: EngineeringAeroStreamlineSpec = {
      id: `${base.idPrefix}-right`,
      zone: base.zone,
      side: "right",
      colorHex: base.colorHex,
      radius: base.radius,
      speed: base.speed,
      phaseOffset: (base.phaseOffset + 0.18) % 1,
      points: base.leftPoints.map(
        ([x, y, z]): readonly [number, number, number] => [-x, y, z],
      ),
    };
    return [left, right];
  });

export function resolveStreamlinePointsForExplode(
  streamline: EngineeringAeroStreamlineSpec,
  explodeRatio: number,
): readonly (readonly [number, number, number])[] {
  const clamped = Number.isFinite(explodeRatio)
    ? Math.max(0, Math.min(1, explodeRatio))
    : 0;
  if (clamped === 0) return streamline.points;

  const lateralScale = 1 + clamped * 0.22;
  const verticalLift =
    streamline.zone === "venturi-underfloor" ? -clamped * 0.06 : clamped * 0.08;

  return streamline.points.map(
    ([x, y, z]): readonly [number, number, number] => [
      x * lateralScale,
      Math.max(0.04, y + verticalLift),
      z,
    ],
  );
}

export type EngineeringCfdZoneOpacities = Readonly<
  Record<EngineeringCfdZoneId, number>
>;

function smoothstepRange(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Per-zone CFD validity gating (G2.2 §3 Option B):
 * Each aerodynamic streamline zone fades smoothly to 0 as soon as its
 * reference bodywork/aero assembly detaches, preventing floating streamlines
 * over obsolete geometry while keeping remaining assembled zones visible.
 */
export function resolveCfdZoneOpacities(
  parts: Readonly<Record<string, { readonly phase: number }>>,
): EngineeringCfdZoneOpacities {
  const fwPhase = Math.max(
    parts.FRONT_WING_ASSEMBLY?.phase ?? 0,
    parts.NOSECONE_SHELL?.phase ?? 0,
  );
  const sidepodPhase = Math.max(
    parts.SIDEPOD_SHELL_LEFT?.phase ?? 0,
    parts.SIDEPOD_SHELL_RIGHT?.phase ?? 0,
  );
  const floorPhase = parts.VENTURI_FLOOR_TITANIUM?.phase ?? 0;

  return {
    "front-wing": 1 - smoothstepRange(0.02, 0.12, fwPhase),
    "sidepod-inwash": 1 - smoothstepRange(0.02, 0.12, sidepodPhase),
    "venturi-underfloor": 1 - smoothstepRange(0.02, 0.12, floorPhase),
  };
}

export function isAnyCfdZoneValid(
  opacities: EngineeringCfdZoneOpacities,
): boolean {
  return (
    Math.max(
      opacities["front-wing"],
      opacities["sidepod-inwash"],
      opacities["venturi-underfloor"],
    ) >= 0.05
  );
}
