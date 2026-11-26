import { clamp } from "animejs";
import {
  ENGINEERING_PARTS,
  stepEngineeringProgress,
  type EngineeringPartSnapshot,
  type EngineeringPartSpec,
  type EngineeringTrackId,
  type LocalizedText,
} from "./engineeringDisassemblyData";

export type EngineeringStoryChapterId =
  | "origin"
  | "aero"
  | "cockpit"
  | "corners"
  | "bodywork"
  | "core"
  | "matrix"
  | "reassembly";

export type EngineeringStoryBeatPhase =
  "opening" | "separating" | "tableau" | "returning";

export type EngineeringVector3 = readonly [number, number, number];

export interface EngineeringStoryChapterSpec {
  readonly id: EngineeringStoryChapterId;
  readonly index: string;
  readonly range: readonly [number, number];
  readonly focusProgress: number;
  readonly shortLabel: LocalizedText;
  readonly overline: LocalizedText;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
}

export interface EngineeringShotCameraSpec {
  /** Direction from the component toward the camera, in model coordinates. */
  readonly direction: EngineeringVector3;
  /** A value near 1 tightly frames the measured node bounds. */
  readonly framing: number;
  readonly fov: number;
  /** Offsets the measured bounds center by a fraction of its size. */
  readonly lookTargetBias: EngineeringVector3;
}

export interface EngineeringStoryShot {
  readonly id: string;
  readonly index: number;
  readonly chapterId: EngineeringStoryChapterId;
  readonly partId: string;
  readonly title: LocalizedText;
  readonly location: LocalizedText;
  readonly caption: LocalizedText;
  readonly durationVh: number;
  readonly startUnits: number;
  readonly approachEndUnits: number;
  readonly detachEndUnits: number;
  readonly holdEndUnits: number;
  readonly endUnits: number;
  readonly startProgress: number;
  readonly approachProgress: number;
  readonly detachEndProgress: number;
  readonly holdProgress: number;
  readonly holdEndProgress: number;
  readonly endProgress: number;
  readonly camera: EngineeringShotCameraSpec;
}

export interface EngineeringStoryBeat {
  readonly id: string;
  readonly progress: number;
  readonly partId: string | null;
  readonly componentIndex: number | null;
  readonly title: LocalizedText;
  readonly location: LocalizedText;
  readonly caption: LocalizedText;
  readonly phase: EngineeringStoryBeatPhase;
}

export interface EngineeringCameraAnchor {
  readonly id: string;
  readonly atUnits: number;
  readonly holdUntilUnits: number;
  /** The point of interest; null means the complete assembled/exploded car. */
  readonly subjectPartId: string | null;
  /** Bounds to fit; null frames all current visible engineering nodes. */
  readonly framingPartId: string | null;
  readonly direction: EngineeringVector3;
  readonly framing: number;
  readonly fov: number;
  readonly lookTargetBias: EngineeringVector3;
}

export interface EngineeringCameraRoute {
  readonly from: EngineeringCameraAnchor;
  readonly to: EngineeringCameraAnchor;
  readonly progress: number;
}

export interface EngineeringStoryEvaluation {
  readonly progress: number;
  readonly explodeRatio: number;
  readonly chapterIndex: number;
  readonly chapter: EngineeringStoryChapterSpec;
  readonly storyBeat: EngineeringStoryBeat;
  readonly showChapterTitle: boolean;
  readonly cameraRoute: EngineeringCameraRoute;
  readonly parts: Readonly<Record<string, EngineeringPartSnapshot>>;
}

interface ShotDefinition {
  readonly partId: string;
  readonly chapterId: EngineeringStoryChapterId;
}

interface RawShot extends ShotDefinition {
  readonly index: number;
  readonly chapterOffset: number;
  readonly durationVh: number;
  readonly startUnits: number;
  readonly approachEndUnits: number;
  readonly detachEndUnits: number;
  readonly holdEndUnits: number;
  readonly endUnits: number;
}

interface EngineeringReturnShot {
  readonly shot: EngineeringStoryShot;
  readonly startUnits: number;
  readonly endUnits: number;
  readonly startProgress: number;
  readonly endProgress: number;
}

const OPENING_DURATION_VH = 80;
const REASSEMBLY_DURATION_VH = 120;
const RETURN_TITLE_DURATION_VH = 12;
const DEFAULT_SHOT_DURATION_VH = 25;
const SIGNATURE_SHOT_DURATION_VH = 45;
const MATRIX_SHOT_DURATION_VH = 110;

const SHOT_GROUPS: readonly {
  readonly chapterId: EngineeringStoryChapterId;
  readonly partIds: readonly string[];
}[] = [
    {
      chapterId: "aero",
      partIds: [
        "FRONT_WING_ASSEMBLY",
        "NOSECONE_SHELL",
        "NOSE_CANARDS_PITOT",
        "NOSE_CRASH_BULKHEAD",
        "FRONT_WHEEL_DEFLECTORS",
        "AERO_MIRRORS_PAIR",
        "REAR_WING_MAINPLANE",
        "REAR_DRS_FLAP_ACTUATOR",
      ],
    },
    {
      chapterId: "cockpit",
      partIds: [
        "COCKPIT_HALO",
        "STEERING_COLUMN_QR",
        "STEERING_SHIFT_PADDLES",
        "STEERING_WHEEL_LCD",
        "STEERING_ENCODERS_LEDS",
        "COCKPIT_HARNESS_BELTS",
        "COCKPIT_SEAT_CARBON",
        "COCKPIT_SURVIVAL_LINER",
        "ROLL_HOOP_TCAM",
      ],
    },
    {
      chapterId: "corners",
      partIds: [
        "FL_CENTERLOCK_NUT",
        "FL_AERO_COVER",
        "FL_SLICK_TIRE",
        "FL_FORGED_RIM",
        "FL_BRAKE_SUSPENSION",
        "FR_CENTERLOCK_NUT",
        "FR_AERO_COVER",
        "FR_SLICK_TIRE",
        "FR_FORGED_RIM",
        "FR_BRAKE_SUSPENSION",
        "RR_CENTERLOCK_NUT",
        "RR_AERO_COVER",
        "RR_SLICK_TIRE",
        "RR_FORGED_RIM",
        "RR_BRAKE_SUSPENSION",
        "RL_CENTERLOCK_NUT",
        "RL_AERO_COVER",
        "RL_SLICK_TIRE",
        "RL_FORGED_RIM",
        "RL_BRAKE_SUSPENSION",
      ],
    },
    {
      chapterId: "bodywork",
      partIds: [
        "ENGINE_COVER_SPINE",
        "SIDEPOD_SHELL_LEFT",
        "COOLING_RADIATOR_LEFT",
        "SIDEPOD_SHELL_RIGHT",
        "COOLING_RADIATOR_RIGHT",
      ],
    },
    {
      chapterId: "core",
      partIds: [
        "VENTURI_FLOOR_TITANIUM",
        "POWERTRAIN_V6_HYBRID",
        "GEARBOX_DRIVETRAIN",
        "REAR_EXHAUST_RAIN_LED",
      ],
    },
    { chapterId: "matrix", partIds: ["MONOCOQUE_CHASSIS"] },
  ];

const partById = new Map(ENGINEERING_PARTS.map((part) => [part.id, part]));
const signatureShotIds = new Set([
  "FRONT_WING_ASSEMBLY",
  "REAR_DRS_FLAP_ACTUATOR",
  "COCKPIT_HALO",
  "STEERING_WHEEL_LCD",
  "FL_BRAKE_SUSPENSION",
  "VENTURI_FLOOR_TITANIUM",
  "POWERTRAIN_V6_HYBRID",
]);

function requiredPart(partId: string): EngineeringPartSpec {
  const part = partById.get(partId);
  if (!part)
    throw new Error(`Engineering story references unknown node: ${partId}`);
  return part;
}

function resolvePartLocation(part: EngineeringPartSpec): LocalizedText {
  const corner = part.id.slice(0, 2);
  const cornerLocations: Readonly<Record<string, LocalizedText>> = {
    FL: { en: "Front left wheel corner", vi: "Góc bánh trước trái" },
    FR: { en: "Front right wheel corner", vi: "Góc bánh trước phải" },
    RR: { en: "Rear right wheel corner", vi: "Góc bánh sau phải" },
    RL: { en: "Rear left wheel corner", vi: "Góc bánh sau trái" },
  };
  if (part.track === "corners") return cornerLocations[corner];
  if (part.id.startsWith("COCKPIT_") || part.id.startsWith("STEERING_")) {
    return { en: "Driver cockpit", vi: "Buồng lái" };
  }
  if (part.id === "ROLL_HOOP_TCAM") {
    return { en: "Cockpit rear", vi: "Phía sau buồng lái" };
  }
  if (part.id === "FRONT_WING_ASSEMBLY") {
    return { en: "Front of the car", vi: "Đầu xe" };
  }
  if (part.id.startsWith("NOSE_")) {
    return { en: "Nose assembly", vi: "Cụm mũi xe" };
  }
  if (part.id === "FRONT_WHEEL_DEFLECTORS") {
    return { en: "Ahead of the front wheels", vi: "Phía trước bánh xe" };
  }
  if (part.id === "AERO_MIRRORS_PAIR") {
    return { en: "Cockpit sides", vi: "Hai bên buồng lái" };
  }
  if (part.id.includes("LEFT")) {
    return { en: "Left side of the car", vi: "Bên trái thân xe" };
  }
  if (part.id.includes("RIGHT")) {
    return { en: "Right side of the car", vi: "Bên phải thân xe" };
  }
  if (part.id === "ENGINE_COVER_SPINE") {
    return { en: "Upper rear bodywork", vi: "Thân vỏ phía trên đuôi xe" };
  }
  if (part.id === "VENTURI_FLOOR_TITANIUM") {
    return { en: "Underfloor", vi: "Dưới sàn xe" };
  }
  if (part.id === "POWERTRAIN_V6_HYBRID") {
    return { en: "Hybrid core", vi: "Lõi hybrid" };
  }
  if (part.id === "GEARBOX_DRIVETRAIN") {
    return { en: "Rear drivetrain", vi: "Hệ truyền động phía sau" };
  }
  if (part.id === "REAR_EXHAUST_RAIN_LED") {
    return { en: "Rear centerline", vi: "Trục giữa phía đuôi xe" };
  }
  if (part.id.startsWith("REAR_")) {
    return { en: "Rear wing", vi: "Cánh sau" };
  }
  if (part.id === "MONOCOQUE_CHASSIS") {
    return { en: "Central chassis datum", vi: "Mốc khung gầm trung tâm" };
  }
  return { en: "Central bodywork", vi: "Thân xe trung tâm" };
}

const CORNER_CAMERA_DIRECTIONS: Readonly<Record<string, EngineeringVector3>> = {
  FL: [-0.94, 0.24, -0.26],
  FR: [0.94, 0.24, -0.26],
  RR: [0.94, 0.24, 0.26],
  RL: [-0.94, 0.24, 0.26],
};

/**
 * Oblique 3/4 corner camera directions for inner rim & brake/suspension shots
 * so detached outer tires and aero covers frame the edge instead of occluding
 * the carbon brake rotor, 6-piston caliper, and wishbones.
 */
const CORNER_INNER_CAMERA_DIRECTIONS: Readonly<
  Record<string, EngineeringVector3>
> = {
  FL: [-0.62, 0.34, -0.7],
  FR: [0.62, 0.34, -0.7],
  RR: [0.62, 0.34, 0.7],
  RL: [-0.62, 0.34, 0.7],
};

const COCKPIT_CAMERA_DIRECTIONS: Readonly<Record<string, EngineeringVector3>> =
{
  COCKPIT_HALO: [-0.62, 0.52, 0.58],
  STEERING_COLUMN_QR: [-0.46, 0.36, 0.81],
  STEERING_SHIFT_PADDLES: [0.58, 0.34, -0.74],
  STEERING_WHEEL_LCD: [0.14, 0.32, 0.94],
  STEERING_ENCODERS_LEDS: [-0.14, 0.28, 0.95],
  COCKPIT_HARNESS_BELTS: [-0.42, 0.62, 0.66],
  COCKPIT_SEAT_CARBON: [0.34, 0.66, 0.67],
  COCKPIT_SURVIVAL_LINER: [-0.28, 0.74, 0.61],
  ROLL_HOOP_TCAM: [0.24, 0.44, 0.86],
};

function resolveCameraSpec(
  part: EngineeringPartSpec,
  chapterId: EngineeringStoryChapterId,
  chapterOffset: number,
  chapterLength: number,
): EngineeringShotCameraSpec {
  const positionInChapter =
    chapterLength <= 1 ? 0 : chapterOffset / (chapterLength - 1);
  let direction: EngineeringVector3;

  if (chapterId === "corners") {
    const corner = part.id.slice(0, 2);
    const isInnerCorner =
      part.id.endsWith("_FORGED_RIM") || part.id.endsWith("_BRAKE_SUSPENSION");
    direction = isInnerCorner
      ? CORNER_INNER_CAMERA_DIRECTIONS[corner]
      : CORNER_CAMERA_DIRECTIONS[corner];
  } else if (chapterId === "cockpit") {
    direction = COCKPIT_CAMERA_DIRECTIONS[part.id];
  } else if (chapterId === "aero") {
    direction =
      part.id === "FRONT_WING_ASSEMBLY"
        ? [-0.74, 0.24, -0.78]
        : [
          -0.76,
          0.34 + Math.sin(positionInChapter * Math.PI) * 0.06,
          -0.78 + positionInChapter * 1.56,
        ];
  } else if (chapterId === "bodywork") {
    if (part.id === "COOLING_RADIATOR_LEFT") {
      // Elevated front-3/4 view looking cleanly past the laterally peeled sidepod onto the radiator core
      direction = [-0.56, 0.74, -0.38];
    } else if (part.id === "COOLING_RADIATOR_RIGHT") {
      direction = [0.56, 0.74, -0.38];
    } else {
      direction = part.id.includes("LEFT")
        ? [-0.9, 0.36, -0.24]
        : part.id.includes("RIGHT")
          ? [0.9, 0.36, -0.24]
          : [-0.14, 0.42, 0.9];
    }
  } else if (part.id === "VENTURI_FLOOR_TITANIUM") {
    // Low raking 3/4 exhibition angle revealing full-length Venturi tunnels & titanium plank
    // while keeping the suspended chassis framed cleanly inside the upper viewport
    direction = [-0.66, 0.04, -0.75];
  } else if (part.id === "POWERTRAIN_V6_HYBRID") {
    direction = [-0.62, 0.52, 0.59];
  } else if (part.id === "GEARBOX_DRIVETRAIN") {
    direction = [0.58, 0.44, 0.68];
  } else if (part.id === "REAR_EXHAUST_RAIN_LED") {
    direction = [0.16, 0.34, 0.93];
  } else {
    direction = [-0.68, 0.32, -0.66];
  }

  const isWheelFrontShot =
    part.id === "STEERING_WHEEL_LCD" || part.id === "STEERING_ENCODERS_LEDS";
  const isRadiatorShot = part.id.startsWith("COOLING_RADIATOR_");
  const isBrakeSuspensionShot = part.id.endsWith("_BRAKE_SUSPENSION");

  return {
    direction,
    framing: isWheelFrontShot
      ? 0.9
      : part.id === "FRONT_WING_ASSEMBLY"
        ? 0.92
        : part.id === "VENTURI_FLOOR_TITANIUM"
          ? 1.08
          : part.id === "POWERTRAIN_V6_HYBRID"
            ? 1.08
            : isBrakeSuspensionShot
              ? 1.0
              : isRadiatorShot
                ? 1.04
                : signatureShotIds.has(part.id)
                  ? 0.96
                  : part.id === "NOSECONE_SHELL"
                    ? 0.98
                    : 1.06,
    fov: isWheelFrontShot ? 28 : signatureShotIds.has(part.id) ? 31 : 34,
    lookTargetBias:
      part.id === "STEERING_WHEEL_LCD"
        ? [0, 0.04, 0.04]
        : part.id === "VENTURI_FLOOR_TITANIUM"
          ? [0, 1.15, 0.06]
          : part.id === "POWERTRAIN_V6_HYBRID"
            ? [0, 0.02, -0.04]
            : [0, 0, 0],
  };
}

const rawShots: RawShot[] = [];
const rawChapterRanges = new Map<
  EngineeringStoryChapterId,
  readonly [number, number]
>();
let cursorUnits = OPENING_DURATION_VH;

for (const group of SHOT_GROUPS) {
  const chapterStartUnits = cursorUnits;
  group.partIds.forEach((partId, chapterOffset) => {
    const durationVh =
      group.chapterId === "matrix"
        ? MATRIX_SHOT_DURATION_VH
        : signatureShotIds.has(partId)
          ? SIGNATURE_SHOT_DURATION_VH
          : DEFAULT_SHOT_DURATION_VH;
    const startUnits = cursorUnits;
    const endUnits = startUnits + durationVh;
    rawShots.push({
      partId,
      chapterId: group.chapterId,
      index: rawShots.length + 1,
      chapterOffset,
      durationVh,
      startUnits,
      approachEndUnits: startUnits + durationVh * 0.2,
      detachEndUnits: startUnits + durationVh * 0.4,
      holdEndUnits: startUnits + durationVh * 0.85,
      endUnits,
    });
    cursorUnits = endUnits;
  });
  rawChapterRanges.set(group.chapterId, [chapterStartUnits, cursorUnits]);
}

export const ENGINEERING_STORY_SCROLL_VH = cursorUnits + REASSEMBLY_DURATION_VH;
const REASSEMBLY_START_UNITS = cursorUnits;

export const ENGINEERING_STORY_SHOTS: readonly EngineeringStoryShot[] =
  rawShots.map((raw) => {
    const part = requiredPart(raw.partId);
    const camera =
      raw.chapterId === "matrix"
        ? {
          direction: [-0.64, 0.34, -0.69] as const,
          framing: 0.72,
          fov: 34,
          lookTargetBias: [0, 0.04, 0] as const,
        }
        : resolveCameraSpec(
          part,
          raw.chapterId,
          raw.chapterOffset,
          rawShots.filter(
            (candidate) => candidate.chapterId === raw.chapterId,
          ).length,
        );
    return {
      ...raw,
      id: raw.partId.toLowerCase().replaceAll("_", "-"),
      title: part.label,
      location: resolvePartLocation(part),
      caption: part.summary,
      startProgress: raw.startUnits / ENGINEERING_STORY_SCROLL_VH,
      approachProgress: raw.approachEndUnits / ENGINEERING_STORY_SCROLL_VH,
      detachEndProgress: raw.detachEndUnits / ENGINEERING_STORY_SCROLL_VH,
      holdProgress:
        (raw.startUnits + raw.durationVh * 0.625) / ENGINEERING_STORY_SCROLL_VH,
      holdEndProgress: raw.holdEndUnits / ENGINEERING_STORY_SCROLL_VH,
      endProgress: raw.endUnits / ENGINEERING_STORY_SCROLL_VH,
      camera,
    };
  });

const shotsByPartId = new Map(
  ENGINEERING_STORY_SHOTS.map((shot) => [shot.partId, shot]),
);
const openingChapterRange: readonly [number, number] = [
  0,
  OPENING_DURATION_VH / ENGINEERING_STORY_SCROLL_VH,
];

function chapterRange(
  chapterId: EngineeringStoryChapterId,
): readonly [number, number] {
  if (chapterId === "origin") return openingChapterRange;
  if (chapterId === "reassembly") {
    return [REASSEMBLY_START_UNITS / ENGINEERING_STORY_SCROLL_VH, 1];
  }
  const range = rawChapterRanges.get(chapterId);
  if (!range)
    throw new Error(`Engineering story chapter is missing: ${chapterId}`);
  return [
    range[0] / ENGINEERING_STORY_SCROLL_VH,
    range[1] / ENGINEERING_STORY_SCROLL_VH,
  ];
}

const chapterText: Readonly<
  Record<
    EngineeringStoryChapterId,
    Omit<EngineeringStoryChapterSpec, "range" | "focusProgress">
  >
> = {
  origin: {
    id: "origin",
    index: "01",
    shortLabel: { en: "Origin", vi: "Nguyên khối" },
    overline: {
      en: "01 / 08 · ASSEMBLED DATUM",
      vi: "01 / 08 · TỔNG THỂ NGUYÊN KHỐI",
    },
    title: {
      en: "Ground-effect architecture, inside out",
      vi: "Giải phẫu xe đua hiệu ứng mặt đất",
    },
    summary: {
      en: "Scroll to separate all 47 aerodynamic, cockpit, wheel-corner and hybrid assemblies, or jump straight into the F1 cockpit.",
      vi: "Cuộn trang để bóc tách 47 cụm khí động, buồng lái, mâm phanh và lõi hybrid, hoặc bấm Buồng Lái F1 để soi cận cảnh vô-lăng.",
    },
  },
  aero: {
    id: "aero",
    index: "02",
    shortLabel: { en: "Aero", vi: "Khí động" },
    overline: {
      en: "02 / 08 · AERODYNAMICS & DRS",
      vi: "02 / 08 · KHÍ ĐỘNG HỌC & DRS",
    },
    title: {
      en: "Wings, nosecone & DRS linkage",
      vi: "Cánh đa tầng, mũi xe & cơ cấu DRS",
    },
    summary: {
      en: "Four-plane front wing, impact nosecone, pitot array and machined rear DRS flap stage cleanly along the airflow axis.",
      vi: "Cánh trước bốn tầng, mũi chịu va chạm, cụm ống đo áp Pitot và cánh mở DRS tách rời dọc theo trục dòng khí.",
    },
  },
  cockpit: {
    id: "cockpit",
    index: "03",
    shortLabel: { en: "Cockpit", vi: "Buồng lái" },
    overline: {
      en: "03 / 08 · F1 COCKPIT & TELEMETRY",
      vi: "03 / 08 · BUỒNG LÁI & VÔ-LĂNG F1",
    },
    title: {
      en: "OLED steering wheel, encoders & survival seat",
      vi: "Vô-lăng OLED, núm xoay & ghế đúc buồng lái",
    },
    summary: {
      en: "Titanium Halo lifts clear to reveal the live OLED display, 15 shift LEDs, rotary switches, carbon paddles and 6-point harness.",
      vi: "Khung Halo titan nhấc cao để lộ trực diện màn hình OLED, dải 15 đèn LED sang số, núm xoay vi sai, lẫy số carbon và dây đai 6 điểm.",
    },
  },
  corners: {
    id: "corners",
    index: "04",
    shortLabel: { en: "Wheels", vi: "Mâm & phanh" },
    overline: {
      en: "04 / 08 · RIMS, TIRES & BRAKES",
      vi: "04 / 08 · MÂM RÈN & PHANH CARBON",
    },
    title: {
      en: "Centerlocks, 18-inch forged rims & carbon brakes",
      vi: 'Ốc khóa tâm, mâm rèn 18" & phanh đĩa carbon',
    },
    summary: {
      en: "Centerlock nuts spin 720° across all four axles, separating aero covers, slicks, forged rims and carbon brake drums.",
      vi: "Đai ốc khóa tâm xoay 720° ở bốn góc trục, tách mở ốp khí động, lốp trơn, mâm rèn van đồng và cụm phanh carbon.",
    },
  },
  bodywork: {
    id: "bodywork",
    index: "05",
    shortLabel: { en: "Sidepods", vi: "Thân vỏ" },
    overline: {
      en: "05 / 08 · SIDEPODS & COOLING",
      vi: "05 / 08 · THÂN VỎ & TẢN NHIỆT",
    },
    title: {
      en: "Undercut sidepods & inclined radiators",
      vi: "Vỏ hốc gió sidepod & két giải nhiệt",
    },
    summary: {
      en: "Dorsal engine cowling and composite sidepods peel outward to expose the inclined heat-exchanger cores beneath.",
      vi: "Nắp khoang máy và hai vỏ hốc gió tách mở đối xứng, để lộ cặp két giải nhiệt đặt nghiêng bên trong.",
    },
  },
  core: {
    id: "core",
    index: "06",
    shortLabel: { en: "Hybrid", vi: "Lõi Hybrid" },
    overline: {
      en: "06 / 08 · VENTURI & HYBRID CORE",
      vi: "06 / 08 · SÀN VENTURI & LÕI HYBRID",
    },
    title: {
      en: "Venturi tunnels, V6 hybrid & 8-speed gearbox",
      vi: "Sàn đáy Venturi, động cơ V6 & hộp số 8 cấp",
    },
    summary: {
      en: "Carbon underfloor and titanium plank drop below the stressed 1.6L V6 hybrid unit, carbon gearbox and exhaust.",
      vi: "Sàn đáy carbon và tấm trượt titan hạ xuống dưới khối động cơ V6 1.6L Hybrid, vỏ hộp số và cụm ống xả.",
    },
  },
  matrix: {
    id: "matrix",
    index: "07",
    shortLabel: { en: "Exploded", vi: "Toàn cảnh" },
    overline: {
      en: "07 / 08 · FULL 47-PART MATRIX",
      vi: "07 / 08 · TOÀN CẢNH 47 CỤM CHI TIẾT",
    },
    title: {
      en: "Complete 47-assembly spatial equilibrium",
      vi: "Toàn cảnh giải phẫu 47 cụm cơ khí",
    },
    summary: {
      en: "Every movable subsystem floats around the central carbon survival cell — drag to orbit 360° or select any part.",
      vi: "Toàn bộ 46 cụm chi tiết lơ lửng quanh khoang monocoque trung tâm — kéo để xoay 360° hoặc bấm chọn từng linh kiện.",
    },
  },
  reassembly: {
    id: "reassembly",
    index: "08",
    shortLabel: { en: "Lock", vi: "Tái hợp" },
    overline: {
      en: "08 / 08 · PRECISION REASSEMBLY",
      vi: "08 / 08 · TÁI HỢP CHUẨN XÁC",
    },
    title: {
      en: "Reverse stagger re-lock to datum",
      vi: "Khép khít từng cụm về chuẩn ban đầu",
    },
    summary: {
      en: "Core, cockpit, bodywork, wings and centerlock nuts return smoothly along their vectors before the deep-dive features below.",
      vi: "Lõi máy, buồng lái, thân vỏ, cánh gió và đai ốc trượt khít về gốc tọa độ trước khi nối xuống bốn chuyên đề kỹ thuật.",
    },
  },
};

function chapterFocusProgress(chapterId: EngineeringStoryChapterId): number {
  const range = chapterRange(chapterId);
  if (chapterId === "origin") return range[0];
  if (chapterId === "reassembly") {
    return Math.min(1, range[0] + (range[1] - range[0]) * 0.055);
  }
  const firstShot = ENGINEERING_STORY_SHOTS.find(
    (shot) => shot.chapterId === chapterId,
  );
  return firstShot?.holdProgress ?? range[0];
}

export const ENGINEERING_STORY_CHAPTERS: readonly EngineeringStoryChapterSpec[] =
  (
    [
      "origin",
      "aero",
      "cockpit",
      "corners",
      "bodywork",
      "core",
      "matrix",
      "reassembly",
    ] as const
  ).map((id) => ({
    ...chapterText[id],
    range: chapterRange(id),
    focusProgress: chapterFocusProgress(id),
  }));

export const ENGINEERING_STORY_COCKPIT_PROGRESS =
  ENGINEERING_STORY_SHOTS.find((shot) => shot.partId === "STEERING_WHEEL_LCD")
    ?.holdProgress ?? 0;

export function getEngineeringStoryShot(
  partId: string,
): EngineeringStoryShot | null {
  return shotsByPartId.get(partId) ?? null;
}

export function resolveEngineeringStoryShotProgress(
  componentIndex: number,
): number | null {
  if (!Number.isInteger(componentIndex) || componentIndex < 1) return null;
  return ENGINEERING_STORY_SHOTS[componentIndex - 1]?.holdProgress ?? null;
}

const openingBeat: EngineeringStoryBeat = {
  id: "assembled-datum",
  progress: 0,
  partId: null,
  componentIndex: null,
  title: {
    en: "Monocoque · the spatial datum",
    vi: "Monocoque · mốc không gian",
  },
  location: {
    en: "Complete car · assembled",
    vi: "Toàn xe · tư thế nguyên khối",
  },
  caption: {
    en: "The intact chassis anchors every component in the story.",
    vi: "Khoang monocoque làm mốc không gian cho từng linh kiện trong câu chuyện.",
  },
  phase: "opening",
};

export const ENGINEERING_STORY_BEATS: readonly EngineeringStoryBeat[] = [
  openingBeat,
  ...ENGINEERING_STORY_SHOTS.map((shot): EngineeringStoryBeat => ({
    id: shot.id,
    progress: shot.approachProgress,
    partId: shot.partId,
    componentIndex: shot.index,
    title: shot.title,
    location: shot.location,
    caption: shot.caption,
    phase: shot.chapterId === "matrix" ? "tableau" : "separating",
  })),
];

const movingShots = ENGINEERING_STORY_SHOTS.filter(
  (shot) => shot.partId !== "MONOCOQUE_CHASSIS",
);
const returnActiveStartUnits =
  REASSEMBLY_START_UNITS + RETURN_TITLE_DURATION_VH;
const returnSlotUnits =
  (REASSEMBLY_DURATION_VH - RETURN_TITLE_DURATION_VH) / movingShots.length;

export const ENGINEERING_REASSEMBLY_SHOTS: readonly EngineeringReturnShot[] = [
  ...movingShots,
]
  .reverse()
  .map((shot, index) => {
    const startUnits =
      returnActiveStartUnits + returnSlotUnits * (index + 0.08);
    const endUnits = startUnits + returnSlotUnits * 0.72;
    return {
      shot,
      startUnits,
      endUnits,
      startProgress: startUnits / ENGINEERING_STORY_SCROLL_VH,
      endProgress: endUnits / ENGINEERING_STORY_SCROLL_VH,
    };
  });

const reassemblyByPartId = new Map<string, EngineeringReturnShot>(
  ENGINEERING_REASSEMBLY_SHOTS.map((entry) => [entry.shot.partId, entry]),
);

const reassemblyBeats: readonly EngineeringStoryBeat[] =
  ENGINEERING_REASSEMBLY_SHOTS.map(
    ({ shot, startProgress }): EngineeringStoryBeat => ({
      id: `return-${shot.id}`,
      progress: startProgress,
      partId: shot.partId,
      componentIndex: shot.index,
      title: shot.title,
      location: shot.location,
      caption: {
        en: `${shot.title.en} returns to the assembled datum. ${shot.caption.en}`,
        vi: `${shot.title.vi} trở về mốc nguyên khối. ${shot.caption.vi}`,
      },
      phase: "returning",
    }),
  );

export const ENGINEERING_STORY_CAMERA_ANCHORS: readonly EngineeringCameraAnchor[] =
  (() => {
    const openingAnchors: EngineeringCameraAnchor[] = [
      {
        id: "opening-three-quarter",
        atUnits: 0,
        holdUntilUnits: OPENING_DURATION_VH * 0.2,
        subjectPartId: null,
        framingPartId: null,
        direction: [-0.66, 0.24, -0.71],
        framing: 0.66,
        fov: 33,
        lookTargetBias: [0, 0.04, -0.06],
      },
      {
        id: "opening-dolly-front",
        atUnits: OPENING_DURATION_VH * 0.28,
        holdUntilUnits: OPENING_DURATION_VH * 0.48,
        subjectPartId: null,
        framingPartId: null,
        direction: [-0.88, 0.16, -0.34],
        framing: 0.68,
        fov: 32,
        lookTargetBias: [0, 0.03, -0.14],
      },
      {
        id: "opening-dolly-side",
        atUnits: OPENING_DURATION_VH * 0.58,
        holdUntilUnits: OPENING_DURATION_VH * 0.76,
        subjectPartId: null,
        framingPartId: null,
        direction: [-0.54, 0.2, 0.81],
        framing: 0.68,
        fov: 33,
        lookTargetBias: [0, 0.02, 0.14],
      },
    ];
    const componentAnchors = ENGINEERING_STORY_SHOTS.map(
      (shot): EngineeringCameraAnchor => ({
        id: `focus-${shot.id}`,
        atUnits: shot.approachEndUnits,
        holdUntilUnits: shot.holdEndUnits,
        subjectPartId: shot.partId,
        framingPartId: shot.chapterId === "matrix" ? null : shot.partId,
        direction: shot.camera.direction,
        framing: shot.camera.framing,
        fov: shot.camera.fov,
        lookTargetBias: shot.camera.lookTargetBias,
      }),
    );
    const initial = openingAnchors[0];
    return [
      ...openingAnchors,
      ...componentAnchors,
      {
        ...initial,
        id: "assembled-return",
        atUnits: ENGINEERING_STORY_SCROLL_VH,
        holdUntilUnits: ENGINEERING_STORY_SCROLL_VH,
      },
    ].sort((a, b) => a.atUnits - b.atUnits);
  })();

const firstReturnProgress =
  ENGINEERING_REASSEMBLY_SHOTS[0]?.startProgress ??
  REASSEMBLY_START_UNITS / ENGINEERING_STORY_SCROLL_VH;
const chapterTitleEndProgress: Readonly<
  Record<EngineeringStoryChapterId, number>
> = {
  origin:
    openingChapterRange[0] +
    (openingChapterRange[1] - openingChapterRange[0]) * 0.32,
  aero:
    ENGINEERING_STORY_SHOTS.find((shot) => shot.chapterId === "aero")
      ?.approachProgress ?? 0,
  cockpit:
    ENGINEERING_STORY_SHOTS.find((shot) => shot.chapterId === "cockpit")
      ?.approachProgress ?? 0,
  corners:
    ENGINEERING_STORY_SHOTS.find((shot) => shot.chapterId === "corners")
      ?.approachProgress ?? 0,
  bodywork:
    ENGINEERING_STORY_SHOTS.find((shot) => shot.chapterId === "bodywork")
      ?.approachProgress ?? 0,
  core:
    ENGINEERING_STORY_SHOTS.find((shot) => shot.chapterId === "core")
      ?.approachProgress ?? 0,
  matrix:
    ENGINEERING_STORY_SHOTS.find((shot) => shot.chapterId === "matrix")
      ?.approachProgress ?? 0,
  reassembly: firstReturnProgress,
};

export function resolveEngineeringStoryDeepLinkProgress(
  param: string | null,
): number | null {
  if (!param) return null;
  const key = param.trim().toLowerCase();
  const byPart = (id: string) =>
    getEngineeringStoryShot(id)?.holdProgress ?? null;
  const links: Readonly<Record<string, number | null>> = {
    origin: ENGINEERING_STORY_CHAPTERS[0].focusProgress,
    aero: byPart("FRONT_WING_ASSEMBLY"),
    "front-wing": byPart("FRONT_WING_ASSEMBLY"),
    "rear-wing": byPart("REAR_WING_MAINPLANE"),
    cockpit: ENGINEERING_STORY_COCKPIT_PROGRESS,
    halo: ENGINEERING_STORY_COCKPIT_PROGRESS,
    "cockpit-halo": byPart("COCKPIT_HALO"),
    corners: byPart("FL_CENTERLOCK_NUT"),
    suspension: byPart("FL_BRAKE_SUSPENSION"),
    bodywork: byPart("ENGINE_COVER_SPINE"),
    sidepods: byPart("SIDEPOD_SHELL_LEFT"),
    core: byPart("POWERTRAIN_V6_HYBRID"),
    floor: byPart("VENTURI_FLOOR_TITANIUM"),
    diffuser: byPart("VENTURI_FLOOR_TITANIUM"),
    matrix: byPart("MONOCOQUE_CHASSIS"),
    reassembly: firstReturnProgress,
  };
  return key in links ? (links[key] ?? null) : null;
}

export function resolveEngineeringStoryShotProgressByPartId(
  partId: string,
): number | null {
  return getEngineeringStoryShot(partId)?.holdProgress ?? null;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function easeOutQuart(value: number): number {
  const t = clamp01(value);
  return 1 - (1 - t) ** 4;
}

function easeInOutCubic(value: number): number {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function resolvePartPhase(shot: EngineeringStoryShot, units: number): number {
  if (shot.partId === "MONOCOQUE_CHASSIS") return 0;
  // Progress is normalized and multiplied back into scene units. Treat that
  // round-trip noise as the exact half-open shot boundary it represents.
  if (units <= shot.approachEndUnits + 1e-7) return 0;
  if (units < shot.detachEndUnits) {
    return easeOutQuart(
      (units - shot.approachEndUnits) /
      (shot.detachEndUnits - shot.approachEndUnits),
    );
  }
  const reassembly = reassemblyByPartId.get(shot.partId);
  if (reassembly && units >= reassembly.endUnits) return 0;
  if (reassembly && units > reassembly.startUnits) {
    return (
      1 -
      easeInOutCubic(
        (units - reassembly.startUnits) /
        (reassembly.endUnits - reassembly.startUnits),
      )
    );
  }
  return 1;
}

function resolveCameraRoute(units: number): EngineeringCameraRoute {
  const anchors = ENGINEERING_STORY_CAMERA_ANCHORS;
  let from = anchors[0];
  if (units >= ENGINEERING_STORY_SCROLL_VH - 1e-8) {
    return { from, to: from, progress: 0 };
  }
  if (units <= from.atUnits) return { from, to: from, progress: 0 };

  for (let index = 1; index < anchors.length; index += 1) {
    const to = anchors[index];
    if (units < to.atUnits - 1e-7) {
      const span = to.atUnits - from.holdUntilUnits;
      return {
        from,
        to,
        progress: span <= 0 ? 1 : clamp01((units - from.holdUntilUnits) / span),
      };
    }
    from = to;
    if (units <= from.holdUntilUnits + 1e-7) {
      return { from, to: from, progress: 0 };
    }
  }
  return { from, to: from, progress: 0 };
}

function resolveStoryBeat(progress: number): EngineeringStoryBeat {
  if (progress < ENGINEERING_STORY_BEATS[1].progress) return openingBeat;
  const beats =
    progress >= REASSEMBLY_START_UNITS / ENGINEERING_STORY_SCROLL_VH
      ? reassemblyBeats
      : ENGINEERING_STORY_BEATS.slice(1);
  let active =
    progress >= REASSEMBLY_START_UNITS / ENGINEERING_STORY_SCROLL_VH
      ? ENGINEERING_STORY_BEATS[ENGINEERING_STORY_BEATS.length - 1]
      : ENGINEERING_STORY_BEATS[1];
  for (const beat of beats) {
    if (progress < beat.progress) break;
    active = beat;
  }
  return active;
}

export function evaluateEngineeringStoryTimeline(
  rawProgress: number,
): EngineeringStoryEvaluation {
  const progress = clamp01(rawProgress);
  const units = progress * ENGINEERING_STORY_SCROLL_VH;
  const parts: Record<string, EngineeringPartSnapshot> = {};
  let movableCount = 0;
  let phaseTotal = 0;

  for (const part of ENGINEERING_PARTS) {
    const shot = shotsByPartId.get(part.id);
    const hasMotion =
      part.explodeOffset.some((value) => value !== 0) ||
      part.explodeEuler.some((value) => value !== 0);
    const phase = shot ? resolvePartPhase(shot, units) : 0;
    if (hasMotion) {
      movableCount += 1;
      phaseTotal += phase;
    }
    parts[part.id] = {
      tx: part.explodeOffset[0] * phase,
      ty: part.explodeOffset[1] * phase,
      tz: part.explodeOffset[2] * phase,
      rx: part.explodeEuler[0] * phase,
      ry: part.explodeEuler[1] * phase,
      rz: part.explodeEuler[2] * phase,
      phase,
    };
  }

  const chapterIndex = Math.max(
    0,
    ENGINEERING_STORY_CHAPTERS.findIndex(
      (chapter, index) =>
        progress >= chapter.range[0] &&
        (progress < chapter.range[1] ||
          index === ENGINEERING_STORY_CHAPTERS.length - 1),
    ),
  );
  const chapter = ENGINEERING_STORY_CHAPTERS[chapterIndex];
  const storyBeat = resolveStoryBeat(progress);

  return {
    progress,
    explodeRatio: movableCount > 0 ? phaseTotal / movableCount : 0,
    chapterIndex,
    chapter,
    storyBeat,
    showChapterTitle: progress < chapterTitleEndProgress[chapter.id],
    cameraRoute: resolveCameraRoute(units),
    parts,
  };
}

export function stepEngineeringStoryProgress(
  current: number,
  target: number,
  deltaMs: number,
  immediate = false,
): number {
  return stepEngineeringProgress(current, target, deltaMs, immediate);
}

export function validateEngineeringStoryRegister(): readonly string[] {
  const errors: string[] = [];
  const shotIds = ENGINEERING_STORY_SHOTS.map((shot) => shot.partId);
  if (shotIds.length !== 47)
    errors.push(`expected 47 shots, received ${shotIds.length}`);
  if (new Set(shotIds).size !== shotIds.length)
    errors.push("shot register contains duplicate node IDs");
  if (ENGINEERING_PARTS.some((part) => !shotIds.includes(part.id)))
    errors.push("shot register omits a GLB node");
  if (
    ENGINEERING_STORY_CHAPTERS.some((chapter, index) => {
      const previous = ENGINEERING_STORY_CHAPTERS[index - 1];
      return previous && Math.abs(previous.range[1] - chapter.range[0]) > 1e-9;
    })
  )
    errors.push("chapter ranges overlap or have gaps");
  if (Math.abs(ENGINEERING_STORY_SCROLL_VH - 1600) > 1e-9) {
    errors.push(
      `expected 1600svh story, received ${ENGINEERING_STORY_SCROLL_VH}svh`,
    );
  }
  return errors;
}

export const ENGINEERING_STORY_PART_COUNT: number =
  ENGINEERING_STORY_SHOTS.length;
export const ENGINEERING_STORY_CHAPTER_ID_BY_TRACK: Readonly<
  Record<EngineeringTrackId, EngineeringStoryChapterId>
> = { aero: "aero", body: "bodywork", corners: "corners", core: "core" };
