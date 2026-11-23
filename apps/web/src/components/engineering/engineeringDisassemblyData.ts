import { clamp, createTimeline, damp } from "animejs";

export type EngineeringLang = "en" | "vi";
export type EngineeringTrackId = "aero" | "body" | "corners" | "core";

export interface LocalizedText {
  readonly en: string;
  readonly vi: string;
}

export interface EngineeringPartSpec {
  readonly id: string;
  readonly node: string;
  readonly track: EngineeringTrackId;
  readonly label: LocalizedText;
  readonly summary: LocalizedText;
  readonly explodeOffset: readonly [number, number, number];
  readonly explodeEuler: readonly [number, number, number];
  readonly window: readonly [number, number, number, number];
  readonly outerShell?: boolean;
  readonly internalSystem?: boolean;
}

export interface EngineeringCameraKeyframe {
  readonly at: number;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly fov: number;
}

export interface EngineeringChapterSpec {
  readonly id: string;
  readonly index: string;
  readonly range: readonly [number, number];
  readonly focusProgress: number;
  readonly shortLabel: LocalizedText;
  readonly overline: LocalizedText;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
}

export interface EngineeringStoryBeat {
  readonly id: string;
  readonly progress: number;
  readonly partId: string;
  readonly caption: LocalizedText;
}

export interface EngineeringPartSnapshot {
  readonly tx: number;
  readonly ty: number;
  readonly tz: number;
  readonly rx: number;
  readonly ry: number;
  readonly rz: number;
  readonly phase: number;
}

export interface EngineeringEvaluation {
  readonly progress: number;
  readonly explodeRatio: number;
  readonly chapterIndex: number;
  readonly chapter: EngineeringChapterSpec;
  readonly storyBeat: EngineeringStoryBeat;
  readonly camera: {
    readonly position: readonly [number, number, number];
    readonly target: readonly [number, number, number];
    readonly fov: number;
  };
  readonly parts: Readonly<Record<string, EngineeringPartSnapshot>>;
}

export const ENGINEERING_FP04RB_GLB_URL = "/models/fp04rb-engineering-v1.glb";
export const F1_COCKPIT_MACRO_PROGRESS = 0.27;
const TIMELINE_VIRTUAL_MS = 10000;

type EngineeringMotionGroup =
  "aero" | "cockpit" | "corners" | "bodywork" | "core";

interface EngineeringMotionRange {
  readonly sourceDetachStart: readonly [number, number];
  readonly targetDetachStart: readonly [number, number];
  readonly sourceDetachEnd: readonly [number, number];
  readonly targetDetachEnd: readonly [number, number];
  readonly sourceReturnStart: readonly [number, number];
  readonly targetReturnStart: readonly [number, number];
  readonly sourceReturnEnd: readonly [number, number];
  readonly targetReturnEnd: readonly [number, number];
}

const STORY_MOTION_RANGES: Readonly<
  Record<EngineeringMotionGroup, EngineeringMotionRange>
> = {
  aero: {
    sourceDetachStart: [0.05, 0.125],
    targetDetachStart: [0.06, 0.12],
    sourceDetachEnd: [0.16, 0.235],
    targetDetachEnd: [0.105, 0.19],
    sourceReturnStart: [0.92, 0.932],
    targetReturnStart: [0.982, 0.992],
    sourceReturnEnd: [0.96, 0.98],
    targetReturnEnd: [0.993, 1],
  },
  cockpit: {
    sourceDetachStart: [0.155, 0.365],
    targetDetachStart: [0.19, 0.35],
    sourceDetachEnd: [0.225, 0.47],
    targetDetachEnd: [0.23, 0.35],
    sourceReturnStart: [0.9, 0.918],
    targetReturnStart: [0.955, 0.97],
    sourceReturnEnd: [0.936, 0.954],
    targetReturnEnd: [0.978, 0.99],
  },
  corners: {
    sourceDetachStart: [0.35, 0.452],
    targetDetachStart: [0.35, 0.455],
    sourceDetachEnd: [0.45, 0.552],
    targetDetachEnd: [0.395, 0.49],
    sourceReturnStart: [0.93, 0.962],
    targetReturnStart: [0.92, 0.94],
    sourceReturnEnd: [0.96, 0.992],
    targetReturnEnd: [0.955, 0.975],
  },
  bodywork: {
    sourceDetachStart: [0.48, 0.52],
    targetDetachStart: [0.49, 0.535],
    sourceDetachEnd: [0.58, 0.62],
    targetDetachEnd: [0.55, 0.6],
    sourceReturnStart: [0.886, 0.898],
    targetReturnStart: [0.9, 0.912],
    sourceReturnEnd: [0.923, 0.934],
    targetReturnEnd: [0.93, 0.94],
  },
  core: {
    sourceDetachStart: [0.58, 0.625],
    targetDetachStart: [0.6, 0.65],
    sourceDetachEnd: [0.71, 0.738],
    targetDetachEnd: [0.67, 0.73],
    sourceReturnStart: [0.865, 0.882],
    targetReturnStart: [0.86, 0.89],
    sourceReturnEnd: [0.902, 0.92],
    targetReturnEnd: [0.9, 0.92],
  },
};

function remapMotionPoint(
  value: number,
  source: readonly [number, number],
  target: readonly [number, number],
): number {
  const sourceSpan = source[1] - source[0];
  if (sourceSpan <= 0) return target[0];
  const ratio = clamp((value - source[0]) / sourceSpan, 0, 1);
  return target[0] + (target[1] - target[0]) * ratio;
}

function resolveMotionGroup(spec: EngineeringPartSpec): EngineeringMotionGroup {
  if (spec.id.startsWith("COCKPIT_") || spec.id.startsWith("STEERING_")) {
    return "cockpit";
  }
  if (spec.track === "aero") return "aero";
  if (spec.track === "corners") return "corners";
  if (spec.track === "core") return "core";
  return "bodywork";
}

function resolveStoryWindow(
  spec: EngineeringPartSpec,
): readonly [number, number, number, number] {
  const [detachStart, detachEnd, returnStart, returnEnd] = spec.window;
  const range = STORY_MOTION_RANGES[resolveMotionGroup(spec)];
  return [
    remapMotionPoint(
      detachStart,
      range.sourceDetachStart,
      range.targetDetachStart,
    ),
    remapMotionPoint(detachEnd, range.sourceDetachEnd, range.targetDetachEnd),
    remapMotionPoint(
      returnStart,
      range.sourceReturnStart,
      range.targetReturnStart,
    ),
    remapMotionPoint(returnEnd, range.sourceReturnEnd, range.targetReturnEnd),
  ];
}

export const ENGINEERING_PARTS: readonly EngineeringPartSpec[] = [
  // ── 01 · AERODYNAMICS & DRS (8) ───────────────────────────────────────────
  {
    id: "FRONT_WING_ASSEMBLY",
    node: "FRONT_WING_ASSEMBLY",
    track: "aero",
    label: {
      en: "Multi-Element Front Wing",
      vi: "Cánh Gió Trước Đa Tầng",
    },
    summary: {
      en: "Four-plane ground-effect wing shapes front tire outwash and feeds clean air into the Venturi inlets.",
      vi: "Cánh bốn tầng điều hướng xoáy khí quanh bánh trước và cấp luồng khí sạch vào cửa hút sàn Venturi.",
    },
    explodeOffset: [0, 0.14, -1.36],
    explodeEuler: [-0.06, 0, 0],
    window: [0.05, 0.16, 0.94, 0.98],
    outerShell: true,
  },
  {
    id: "NOSECONE_SHELL",
    node: "NOSECONE_SHELL",
    track: "aero",
    label: {
      en: "Carbon Crash Nosecone",
      vi: "Mũi Xe Chịu Va Chạm Carbon",
    },
    summary: {
      en: "Composite impact structure detaches forward from the front survival-cell bulkhead.",
      vi: "Cấu trúc mũi sợi carbon hấp thụ xung lực tách dọc trục khỏi mặt bích khoang an toàn.",
    },
    explodeOffset: [0, 0.1, -0.82],
    explodeEuler: [-0.03, 0, 0],
    window: [0.065, 0.175, 0.935, 0.975],
    outerShell: true,
  },
  {
    id: "NOSE_CANARDS_PITOT",
    node: "NOSE_CANARDS_PITOT",
    track: "aero",
    label: {
      en: "Pitot Array & Nose Canards",
      vi: "Cảm Biến Pitot & Vây Mũi",
    },
    summary: {
      en: "Machined pitot pressure tubes, telemetry antennas and forward nose winglets.",
      vi: "Cụm ống đo áp suất động Pitot CNC, ăng-ten viễn thông và vây hướng dòng mũi xe.",
    },
    explodeOffset: [0, 0.36, -0.52],
    explodeEuler: [0, 0, 0],
    window: [0.075, 0.185, 0.93, 0.97],
  },
  {
    id: "NOSE_CRASH_BULKHEAD",
    node: "NOSE_CRASH_BULKHEAD",
    track: "aero",
    label: {
      en: "Nose Quick-Release Bulkhead (Illustration)",
      vi: "Ngàm Khóa Nhanh Mũi Xe (Minh Họa)",
    },
    summary: {
      en: "Illustrative twin-pin alignment flange coupling the nosecone to the monocoque.",
      vi: "Minh họa mặt bích chốt định vị kết nối mũi xe vào khoang monocoque.",
    },
    explodeOffset: [0, 0.06, -0.42],
    explodeEuler: [0, 0, 0],
    window: [0.085, 0.195, 0.925, 0.965],
    internalSystem: true,
  },
  {
    id: "FRONT_WHEEL_DEFLECTORS",
    node: "FRONT_WHEEL_DEFLECTORS",
    track: "aero",
    label: {
      en: "Over-Wheel Wake Deflectors",
      vi: "Vây Chắn Xoáy Đỉnh Bánh Trước",
    },
    summary: {
      en: "Inner curved winglets tame tire plume turbulence ahead of the sidepod inlets.",
      vi: "Cặp vây cong kiểm soát luồng khí nhiễu từ lốp trước để giữ khí sạch cho hốc gió hông.",
    },
    explodeOffset: [0, 0.46, -0.22],
    explodeEuler: [0, 0, 0],
    window: [0.095, 0.205, 0.922, 0.962],
  },
  {
    id: "AERO_MIRRORS_PAIR",
    node: "AERO_MIRRORS_PAIR",
    track: "aero",
    label: {
      en: "Aero-Shrouded Side Mirrors",
      vi: "Gương Chiếu Hậu Khí Động",
    },
    summary: {
      en: "Twin-stalk mirror housings double as flow conditioners over the sidepod shoulders.",
      vi: "Vỏ gương sợi carbon kiêm cánh hướng dòng dẫn khí ôm sát vai sidepod.",
    },
    explodeOffset: [0, 0.44, -0.1],
    explodeEuler: [0, 0, 0],
    window: [0.105, 0.215, 0.92, 0.96],
  },
  {
    id: "REAR_DRS_FLAP_ACTUATOR",
    node: "REAR_DRS_FLAP_ACTUATOR",
    track: "aero",
    label: {
      en: "DRS Flap & CNC Actuator",
      vi: "Cánh Mở DRS & Cơ Cấu CNC",
    },
    summary: {
      en: "Upper movable rear flap and machined linkage rotate open to shed straight-line drag.",
      vi: "Cánh trên DRS cùng cơ cấu thanh truyền CNC xoay mở để giảm lực cản trên đoạn thẳng.",
    },
    explodeOffset: [0, 0.88, 1.26],
    explodeEuler: [0.34, 0, 0],
    window: [0.115, 0.225, 0.932, 0.972],
    outerShell: true,
  },
  {
    id: "REAR_WING_MAINPLANE",
    node: "REAR_WING_MAINPLANE",
    track: "aero",
    label: {
      en: "Rear Wing Mainplane & Beam Wing",
      vi: "Cánh Sau Chính & Beam Wing",
    },
    summary: {
      en: "Sculpted mainplane and lower beam wing couple with the diffuser exit to extract rear downforce.",
      vi: "Cánh chính sau và beam wing phối hợp cùng miệng khuếch tán gầm tạo lực ép đuôi xe.",
    },
    explodeOffset: [0, 0.54, 0.94],
    explodeEuler: [0.06, 0, 0],
    window: [0.125, 0.235, 0.928, 0.968],
    outerShell: true,
  },

  // ── 02 · F1 COCKPIT, BODYWORK & THERMAL (14) ──────────────────────────────
  {
    id: "COCKPIT_HALO",
    node: "COCKPIT_HALO",
    track: "body",
    label: {
      en: "Titanium Halo Protection Hoop",
      vi: "Khung Bảo Vệ Halo Titan",
    },
    summary: {
      en: "Grade-5 titanium safety structure lifts early to open a clear sightline into the F1 cockpit.",
      vi: "Khung bảo vệ titan nhấc cao sớm để mở trọn góc nhìn trực diện vào buồng lái F1.",
    },
    explodeOffset: [0, 0.86, -0.06],
    explodeEuler: [-0.04, 0, 0],
    window: [0.155, 0.225, 0.918, 0.954],
    outerShell: true,
  },
  {
    id: "STEERING_ENCODERS_LEDS",
    node: "STEERING_ENCODERS_LEDS",
    track: "body",
    label: {
      en: "Rotary Encoders, Buttons & Shift LEDs",
      vi: "Núm Xoay, Nút Bấm & Đèn LED Tua Máy",
    },
    summary: {
      en: "Thumb wheels, ERS/differential rotary dials, tactile push buttons and 15-LED shift array.",
      vi: "Con lăn ngón cái, núm xoay bản đồ ERS/vi sai, nút bấm ký hiệu và dải 15 đèn LED sang số.",
    },
    explodeOffset: [0, 0.56, -0.06],
    explodeEuler: [-0.08, 0, 0],
    window: [0.31, 0.41, 0.912, 0.948],
  },
  {
    id: "STEERING_WHEEL_LCD",
    node: "STEERING_WHEEL_LCD",
    track: "body",
    label: {
      en: "Carbon F1 Wheel & OLED Telemetry",
      vi: "Vô-Lăng Carbon & Màn Hình OLED",
    },
    summary: {
      en: "Carbon butterfly chassis with Alcantara grips and high-contrast central OLED telemetry display.",
      vi: "Khung vô-lăng sợi carbon bọc Alcantara tích hợp màn hình OLED hiển thị số, tốc độ và nhiệt độ.",
    },
    explodeOffset: [0, 0.44, -0.14],
    explodeEuler: [-0.08, 0, 0],
    window: [0.32, 0.42, 0.91, 0.946],
  },
  {
    id: "STEERING_SHIFT_PADDLES",
    node: "STEERING_SHIFT_PADDLES",
    track: "body",
    label: {
      en: "Rear Carbon Shift & Clutch Paddles",
      vi: "Lẫy Sang Số & Côn Kép Carbon",
    },
    summary: {
      en: "Triple-tier rear carbon paddles for seamless 8-speed shifts and launch bite-point control.",
      vi: "Hệ lẫy carbon ba tầng phía sau phục vụ sang số tức thời và kiểm soát điểm bắt côn xuất phát.",
    },
    explodeOffset: [0, 0.34, -0.24],
    explodeEuler: [-0.06, 0, 0],
    window: [0.33, 0.43, 0.908, 0.944],
  },
  {
    id: "STEERING_COLUMN_QR",
    node: "STEERING_COLUMN_QR",
    track: "body",
    label: {
      en: "Quick-Release Spline & Column",
      vi: "Khớp Tháo Nhanh & Trục Lái",
    },
    summary: {
      en: "Precision splined collar enabling rapid steering wheel release for driver egress.",
      vi: "Khớp hoa khế tháo lắp nhanh giúp tay đua rời buồng lái tức thời theo chuẩn an toàn.",
    },
    explodeOffset: [0, 0.22, -0.32],
    explodeEuler: [0, 0, 0],
    window: [0.34, 0.44, 0.906, 0.942],
  },
  {
    id: "COCKPIT_HARNESS_BELTS",
    node: "COCKPIT_HARNESS_BELTS",
    track: "body",
    label: {
      en: "6-Point Racing Harness",
      vi: "Dây Đai An Toàn 6 Điểm",
    },
    summary: {
      en: "High-tenacity crimson webbing straps anchored to a central rotary quick-release buckle.",
      vi: "Hệ dây đai chịu lực sáu điểm kết hợp khóa xoay trung tâm hợp kim nhôm CNC.",
    },
    explodeOffset: [0, 0.62, 0.06],
    explodeEuler: [0, 0, 0],
    window: [0.345, 0.45, 0.904, 0.94],
  },
  {
    id: "COCKPIT_SEAT_CARBON",
    node: "COCKPIT_SEAT_CARBON",
    track: "body",
    label: {
      en: "Molded Carbon Seat & Alcantara Pads",
      vi: "Ghế Đúc Carbon & Đệm Alcantara",
    },
    summary: {
      en: "Form-fitted carbon shell with Alcantara damping pads, extractable vertically for medical rescue.",
      vi: "Ghế vỏ sợi carbon đúc theo phom tay đua bọc đệm Alcantara, hỗ trợ nhấc thẳng khi cứu hộ.",
    },
    explodeOffset: [0, 0.42, 0.1],
    explodeEuler: [0, 0, 0],
    window: [0.355, 0.46, 0.902, 0.938],
  },
  {
    id: "COCKPIT_SURVIVAL_LINER",
    node: "COCKPIT_SURVIVAL_LINER",
    track: "body",
    label: {
      en: "Cockpit Headrest & Energy Foam",
      vi: "Đệm Đầu & Vách Lót Hấp Thụ Lực",
    },
    summary: {
      en: "Removable energy-absorbing headrest collar protecting the helmet under lateral G-loads.",
      vi: "Vòng đệm hấp thụ xung lực bảo vệ vùng đầu cổ tay đua dưới gia tốc ngang lớn.",
    },
    explodeOffset: [0, 0.24, 0.04],
    explodeEuler: [0, 0, 0],
    window: [0.365, 0.47, 0.9, 0.936],
  },
  {
    id: "ROLL_HOOP_TCAM",
    node: "ROLL_HOOP_TCAM",
    track: "body",
    label: {
      en: "Roll-Hoop T-Cam & Airbox Intake",
      vi: "Cụm T-Cam & Họng Hút Khí Nạp",
    },
    summary: {
      en: "Upper T-cam mount, aero winglets and central ram-air intake feeding the turbocharger.",
      vi: "Cụm camera chữ T trên đỉnh cùng họng hút dẫn khí nạp thẳng xuống cụm tăng áp.",
    },
    explodeOffset: [0, 1.04, 0.12],
    explodeEuler: [0, 0, 0],
    window: [0.48, 0.58, 0.898, 0.934],
  },
  {
    id: "ENGINE_COVER_SPINE",
    node: "ENGINE_COVER_SPINE",
    track: "body",
    label: {
      en: "Carbon Engine Cover & Spine",
      vi: "Nắp Khoang Máy & Sống Khí Động",
    },
    summary: {
      en: "Lightweight dorsal bodywork lifts clear to expose the 1.6L V6 hybrid layout beneath.",
      vi: "Lớp vỏ carbon phía sau nhấc cao để lộ cấu trúc động cơ V6 1.6L Hybrid bên dưới.",
    },
    explodeOffset: [0, 0.86, 0.34],
    explodeEuler: [0.05, 0, 0],
    window: [0.49, 0.59, 0.895, 0.932],
    outerShell: true,
  },
  {
    id: "SIDEPOD_SHELL_LEFT",
    node: "SIDEPOD_SHELL_LEFT",
    track: "body",
    label: {
      en: "Left Undercut Sidepod",
      vi: "Vỏ Hốc Gió Hông Trái",
    },
    summary: {
      en: "Left downwash sidepod shell peels outward to reveal its inclined radiator core.",
      vi: "Vỏ hốc gió trái tách ngang để lộ cụm két tản nhiệt đặt nghiêng bên trong.",
    },
    explodeOffset: [-0.96, 0.24, 0.04],
    explodeEuler: [0, 0, 0.07],
    window: [0.5, 0.6, 0.892, 0.93],
    outerShell: true,
  },
  {
    id: "SIDEPOD_SHELL_RIGHT",
    node: "SIDEPOD_SHELL_RIGHT",
    track: "body",
    label: {
      en: "Right Undercut Sidepod",
      vi: "Vỏ Hốc Gió Hông Phải",
    },
    summary: {
      en: "Right composite sidepod channeling high-energy flow into the rear Coke-bottle region.",
      vi: "Vỏ hốc gió phải dẫn luồng khí ôm sát vùng thắt cổ chai đuôi xe.",
    },
    explodeOffset: [0.96, 0.24, 0.04],
    explodeEuler: [0, 0, -0.07],
    window: [0.505, 0.605, 0.89, 0.928],
    outerShell: true,
  },
  {
    id: "COOLING_RADIATOR_LEFT",
    node: "COOLING_RADIATOR_LEFT",
    track: "body",
    label: {
      en: "Left Inclined Radiator (Illustration)",
      vi: "Két Giải Nhiệt Trái (Minh Họa)",
    },
    summary: {
      en: "Illustrative louvered aluminum water/oil heat-exchanger core inside the left sidepod.",
      vi: "Minh họa lõi két giải nhiệt nước và dầu bằng nhôm đặt nghiêng trong hốc gió trái.",
    },
    explodeOffset: [-0.48, 0.12, 0.04],
    explodeEuler: [0, 0, 0],
    window: [0.515, 0.615, 0.888, 0.925],
    internalSystem: true,
  },
  {
    id: "COOLING_RADIATOR_RIGHT",
    node: "COOLING_RADIATOR_RIGHT",
    track: "body",
    label: {
      en: "Right ERS & Charge Cooler (Illustration)",
      vi: "Két Giải Nhiệt ERS Phải (Minh Họa)",
    },
    summary: {
      en: "Illustrative right-bank charge-air intercooler and ERS thermal rejection core.",
      vi: "Minh họa két làm mát khí nạp turbo và hệ thống điện ERS bên phải.",
    },
    explodeOffset: [0.48, 0.12, 0.04],
    explodeEuler: [0, 0, 0],
    window: [0.52, 0.62, 0.886, 0.923],
    internalSystem: true,
  },

  // ── 03 · 4-CORNER RIMS, TIRES & CARBON BRAKES (20) ────────────────────────
  {
    id: "FL_CENTERLOCK_NUT",
    node: "FL_CENTERLOCK_NUT",
    track: "corners",
    label: { en: "FL Centerlock Nut", vi: "Ốc Khóa Tâm Trước Trái" },
    summary: {
      en: "CNC centerlock nut spins 720° as it unthreads off the front-left axle.",
      vi: "Đai ốc khóa tâm CNC xoay 720° khi tháo rời khỏi đầu trục trước trái.",
    },
    explodeOffset: [-1.58, 0.04, 0],
    explodeEuler: [Math.PI * 4, 0, 0],
    window: [0.35, 0.45, 0.962, 0.992],
  },
  {
    id: "FR_CENTERLOCK_NUT",
    node: "FR_CENTERLOCK_NUT",
    track: "corners",
    label: { en: "FR Centerlock Nut", vi: "Ốc Khóa Tâm Trước Phải" },
    summary: {
      en: "Quick-pit single nut clamping the front-right forged wheel to the hub.",
      vi: "Đai ốc khóa tâm ép chặt mâm rèn trước phải vào moay-ơ.",
    },
    explodeOffset: [1.58, 0.04, 0],
    explodeEuler: [-Math.PI * 4, 0, 0],
    window: [0.354, 0.454, 0.96, 0.99],
  },
  {
    id: "FL_AERO_COVER",
    node: "FL_AERO_COVER",
    track: "corners",
    label: { en: 'FL 18" Aero Cover', vi: 'Ốp Mâm Khí Động 18" Trước Trái' },
    summary: {
      en: "Outer wheel shroud sealing turbulent spoke wake along the front-left corner.",
      vi: "Ốp chắn khí động mâm 18 inch giúp giảm nhiễu xoáy từ nan mâm trước trái.",
    },
    explodeOffset: [-1.3, 0.02, 0],
    explodeEuler: [0, 0, 0],
    window: [0.362, 0.462, 0.956, 0.986],
    outerShell: true,
  },
  {
    id: "FR_AERO_COVER",
    node: "FR_AERO_COVER",
    track: "corners",
    label: { en: 'FR 18" Aero Cover', vi: 'Ốp Mâm Khí Động 18" Trước Phải' },
    summary: {
      en: "Front-right aerodynamic wheel disc controlling lateral wake dispersion.",
      vi: "Ốp mâm khí động bánh trước phải kiểm soát luồng khí nhiễu dọc thân xe.",
    },
    explodeOffset: [1.3, 0.02, 0],
    explodeEuler: [0, 0, 0],
    window: [0.366, 0.466, 0.954, 0.984],
    outerShell: true,
  },
  {
    id: "FL_SLICK_TIRE",
    node: "FL_SLICK_TIRE",
    track: "corners",
    label: { en: 'FL 18" Slick Tire', vi: 'Lốp Đua Trơn 18" Trước Trái' },
    summary: {
      en: "Low-profile 18-inch racing slick separating cleanly off the forged magnesium rim.",
      vi: "Lốp trơn 18 inch thành mỏng tách rời khỏi lòng mâm hợp kim rèn.",
    },
    explodeOffset: [-0.96, 0, 0],
    explodeEuler: [0, 0, 0],
    window: [0.374, 0.474, 0.95, 0.98],
    outerShell: true,
  },
  {
    id: "FR_SLICK_TIRE",
    node: "FR_SLICK_TIRE",
    track: "corners",
    label: { en: 'FR 18" Slick Tire', vi: 'Lốp Đua Trơn 18" Trước Phải' },
    summary: {
      en: "Front-right 18-inch slick tire translating aero load into cornering grip.",
      vi: "Lốp trơn 18 inch trước phải truyền tải lực ép khí động xuống mặt đường.",
    },
    explodeOffset: [0.96, 0, 0],
    explodeEuler: [0, 0, 0],
    window: [0.378, 0.478, 0.948, 0.978],
    outerShell: true,
  },
  {
    id: "FL_FORGED_RIM",
    node: "FL_FORGED_RIM",
    track: "corners",
    label: {
      en: "FL Forged Rim & Brass Valve",
      vi: "Mâm Rèn & Van Đồng Trước Trái",
    },
    summary: {
      en: "Forged 18-inch wheel barrel complete with machined hub and brass inflation valve.",
      vi: "Mâm rèn 18 inch kèm moay-ơ trung tâm CNC và van bơm áp suất bằng đồng.",
    },
    explodeOffset: [-0.62, 0.02, 0],
    explodeEuler: [0, 0, 0],
    window: [0.386, 0.486, 0.944, 0.974],
  },
  {
    id: "FR_FORGED_RIM",
    node: "FR_FORGED_RIM",
    track: "corners",
    label: {
      en: "FR Forged Rim & Brass Valve",
      vi: "Mâm Rèn & Van Đồng Trước Phải",
    },
    summary: {
      en: "Front-right forged magnesium wheel barrel, hub carrier and brass valve.",
      vi: "Lòng mâm rèn hợp kim, moay-ơ và van đồng bánh trước phải.",
    },
    explodeOffset: [0.62, 0.02, 0],
    explodeEuler: [0, 0, 0],
    window: [0.39, 0.49, 0.942, 0.972],
  },
  {
    id: "FL_BRAKE_SUSPENSION",
    node: "FL_BRAKE_SUSPENSION",
    track: "corners",
    label: {
      en: "FL Carbon Brake & Wishbones",
      vi: "Phanh Carbon & Tay Đòn Trước Trái",
    },
    summary: {
      en: "Carbon brake rotor, cooling ducts, 6-piston caliper and carbon wishbones.",
      vi: "Đĩa phanh carbon, hốc dẫn gió làm mát, cùm phanh 6 piston và tay đòn chữ A.",
    },
    explodeOffset: [-0.26, 0.05, 0],
    explodeEuler: [0, 0, 0],
    window: [0.398, 0.498, 0.936, 0.966],
  },
  {
    id: "FR_BRAKE_SUSPENSION",
    node: "FR_BRAKE_SUSPENSION",
    track: "corners",
    label: {
      en: "FR Carbon Brake & Wishbones",
      vi: "Phanh Carbon & Tay Đòn Trước Phải",
    },
    summary: {
      en: "Front-right carbon brake drum, cooling scoop and aero-profiled wishbones.",
      vi: "Cụm phanh đĩa carbon, ống dẫn khí làm mát và tay đòn treo trước phải.",
    },
    explodeOffset: [0.26, 0.05, 0],
    explodeEuler: [0, 0, 0],
    window: [0.402, 0.502, 0.934, 0.964],
  },
  {
    id: "RL_CENTERLOCK_NUT",
    node: "RL_CENTERLOCK_NUT",
    track: "corners",
    label: { en: "RL Centerlock Nut", vi: "Ốc Khóa Tâm Sau Trái" },
    summary: {
      en: "High-torque rear lock nut unthreading off the rear-left drive axle.",
      vi: "Đai ốc khóa trục sau chịu mô-men xoắn lớn tháo khỏi trục dẫn động trái.",
    },
    explodeOffset: [-1.58, 0.04, 0.12],
    explodeEuler: [Math.PI * 4, 0, 0],
    window: [0.408, 0.508, 0.958, 0.988],
  },
  {
    id: "RR_CENTERLOCK_NUT",
    node: "RR_CENTERLOCK_NUT",
    track: "corners",
    label: { en: "RR Centerlock Nut", vi: "Ốc Khóa Tâm Sau Phải" },
    summary: {
      en: "Rear-right centerlock nut coupling hybrid drive torque into the hub.",
      vi: "Đai ốc khóa tâm trục sau phải truyền lực kéo hybrid vào bánh xe.",
    },
    explodeOffset: [1.58, 0.04, 0.12],
    explodeEuler: [-Math.PI * 4, 0, 0],
    window: [0.412, 0.512, 0.956, 0.986],
  },
  {
    id: "RL_AERO_COVER",
    node: "RL_AERO_COVER",
    track: "corners",
    label: { en: 'RL 18" Aero Cover', vi: 'Ốp Mâm Khí Động 18" Sau Trái' },
    summary: {
      en: "Rear aero shroud sealing wheel turbulence beside the diffuser exit.",
      vi: "Ốp mâm khí động bánh sau trái giữ sạch luồng khí cạnh miệng khuếch tán.",
    },
    explodeOffset: [-1.3, 0.02, 0.1],
    explodeEuler: [0, 0, 0],
    window: [0.418, 0.518, 0.952, 0.982],
    outerShell: true,
  },
  {
    id: "RR_AERO_COVER",
    node: "RR_AERO_COVER",
    track: "corners",
    label: { en: 'RR 18" Aero Cover', vi: 'Ốp Mâm Khí Động 18" Sau Phải' },
    summary: {
      en: "Rear-right aerodynamic disc cover reducing lateral wake drag.",
      vi: "Ốp mâm khí động bánh sau phải giảm thiểu nhiễu động ngang đuôi xe.",
    },
    explodeOffset: [1.3, 0.02, 0.1],
    explodeEuler: [0, 0, 0],
    window: [0.422, 0.522, 0.95, 0.98],
    outerShell: true,
  },
  {
    id: "RL_SLICK_TIRE",
    node: "RL_SLICK_TIRE",
    track: "corners",
    label: { en: 'RL 18" Traction Slick', vi: 'Lốp Bản Rộng 18" Sau Trái' },
    summary: {
      en: "Wide rear slick deploying combined V6 and MGU-K hybrid power.",
      vi: "Lốp sau bản rộng truyền tải công suất tổ hợp V6 và điện MGU-K.",
    },
    explodeOffset: [-0.96, 0, 0.08],
    explodeEuler: [0, 0, 0],
    window: [0.428, 0.528, 0.946, 0.976],
    outerShell: true,
  },
  {
    id: "RR_SLICK_TIRE",
    node: "RR_SLICK_TIRE",
    track: "corners",
    label: { en: 'RR 18" Traction Slick', vi: 'Lốp Bản Rộng 18" Sau Phải' },
    summary: {
      en: "Rear-right 18-inch traction slick built for corner-exit stability.",
      vi: "Lốp dẫn động 18 inch bánh sau phải tối ưu độ bám khi thoát cua.",
    },
    explodeOffset: [0.96, 0, 0.08],
    explodeEuler: [0, 0, 0],
    window: [0.432, 0.532, 0.944, 0.974],
    outerShell: true,
  },
  {
    id: "RL_FORGED_RIM",
    node: "RL_FORGED_RIM",
    track: "corners",
    label: { en: "RL Deep-Dish Forged Rim", vi: "Mâm Rèn Lòng Sâu Sau Trái" },
    summary: {
      en: "Deep-offset forged rear rim barrel with CNC drive spline and brass valve.",
      vi: "Mâm rèn lòng sâu bánh sau trái kèm moay-ơ truyền lực CNC và van đồng.",
    },
    explodeOffset: [-0.62, 0.02, 0.06],
    explodeEuler: [0, 0, 0],
    window: [0.438, 0.538, 0.94, 0.97],
  },
  {
    id: "RR_FORGED_RIM",
    node: "RR_FORGED_RIM",
    track: "corners",
    label: { en: "RR Deep-Dish Forged Rim", vi: "Mâm Rèn Lòng Sâu Sau Phải" },
    summary: {
      en: "Rear-right forged wheel barrel, hub carrier and brass valve.",
      vi: "Lòng mâm rèn hợp kim, moay-ơ và van đồng bánh sau phải.",
    },
    explodeOffset: [0.62, 0.02, 0.06],
    explodeEuler: [0, 0, 0],
    window: [0.442, 0.542, 0.938, 0.968],
  },
  {
    id: "RL_BRAKE_SUSPENSION",
    node: "RL_BRAKE_SUSPENSION",
    track: "corners",
    label: {
      en: "RL Brake Ducts & Suspension",
      vi: "Hốc Phanh & Treo Sau Trái",
    },
    summary: {
      en: "Brake-by-wire rotor, multi-blade duct winglets and carbon suspension arms.",
      vi: "Đĩa phanh brake-by-wire, cánh nhỏ gắn hốc phanh và tay đòn treo sau trái.",
    },
    explodeOffset: [-0.26, 0.05, 0.06],
    explodeEuler: [0, 0, 0],
    window: [0.448, 0.548, 0.932, 0.962],
  },
  {
    id: "RR_BRAKE_SUSPENSION",
    node: "RR_BRAKE_SUSPENSION",
    track: "corners",
    label: {
      en: "RR Brake Ducts & Suspension",
      vi: "Hốc Phanh & Treo Sau Phải",
    },
    summary: {
      en: "Rear-right carbon brake drum, local downforce blades and suspension.",
      vi: "Cụm hốc phanh carbon kèm cánh tạo lực ép cục bộ và tay đòn sau phải.",
    },
    explodeOffset: [0.26, 0.05, 0.06],
    explodeEuler: [0, 0, 0],
    window: [0.452, 0.552, 0.93, 0.96],
  },

  // ── 04 · VENTURI FLOOR, V6 HYBRID, GEARBOX & MONOCOQUE (5) ────────────────
  {
    id: "VENTURI_FLOOR_TITANIUM",
    node: "VENTURI_FLOOR_TITANIUM",
    track: "core",
    label: {
      en: "Venturi Floor & Titanium Plank",
      vi: "Sàn Đáy Venturi & Tấm Trượt Titan",
    },
    summary: {
      en: "Full-length ground-effect tunnels, edge strakes and central skid plate drop cleanly below.",
      vi: "Sàn đáy hiệu ứng mặt đất, vách hướng dòng và tấm trượt titan hạ xuống dưới gầm xe.",
    },
    explodeOffset: [0, -0.72, 0.06],
    explodeEuler: [0, 0, 0],
    window: [0.58, 0.71, 0.865, 0.902],
  },
  {
    id: "POWERTRAIN_V6_HYBRID",
    node: "POWERTRAIN_V6_HYBRID",
    track: "core",
    label: {
      en: "1.6L V6 Turbo-Hybrid & ERS (Illustration)",
      vi: "Động Cơ V6 1.6L Hybrid & Pin ERS (Minh Họa)",
    },
    summary: {
      en: "Illustrative stressed V6 combustion unit, split turbocharger and ERS battery store.",
      vi: "Minh họa khối động cơ V6 chịu lực khung, cụm tăng áp tách rời và khối pin năng lượng ERS.",
    },
    explodeOffset: [0, 0.36, 0.34],
    explodeEuler: [0, 0, 0],
    window: [0.6, 0.72, 0.872, 0.91],
    internalSystem: true,
  },
  {
    id: "GEARBOX_DRIVETRAIN",
    node: "GEARBOX_DRIVETRAIN",
    track: "core",
    label: {
      en: "8-Speed Carbon Gearbox & Driveshafts",
      vi: "Hộp Số Carbon 8 Cấp & Bán Trục",
    },
    summary: {
      en: "Rear carbon gearbox cassette, suspension pickup points and illustrative titanium half-shafts.",
      vi: "Vỏ hộp số sợi carbon, gối đỡ hệ treo sau và cặp bán trục truyền lực titan minh họa.",
    },
    explodeOffset: [0, 0.18, 0.74],
    explodeEuler: [0, 0, 0],
    window: [0.615, 0.73, 0.878, 0.915],
  },
  {
    id: "REAR_EXHAUST_RAIN_LED",
    node: "REAR_EXHAUST_RAIN_LED",
    track: "core",
    label: {
      en: "Tailpipe, Wastegates & Rain LED",
      vi: "Ống Xả, Wastegate & Đèn Mưa FIA",
    },
    summary: {
      en: "Central exhaust exit, twin wastegate pipes and rear FIA warning/ERS light cluster.",
      vi: "Ống xả trung tâm, cặp ống wastegate và cụm đèn hậu cảnh báo mưa/thu hồi ERS.",
    },
    explodeOffset: [0, 0.14, 1.18],
    explodeEuler: [0, 0, 0],
    window: [0.625, 0.738, 0.882, 0.92],
  },
  {
    id: "MONOCOQUE_CHASSIS",
    node: "MONOCOQUE_CHASSIS",
    track: "core",
    label: {
      en: "Carbon Monocoque Survival Cell",
      vi: "Khoang An Toàn Monocoque Carbon",
    },
    summary: {
      en: "Central carbon survival cell anchored at world origin while all 46 assemblies stage around it.",
      vi: "Khoang sợi carbon trung tâm giữ cố định tại gốc tọa độ để 46 cụm chi tiết tách mở xung quanh.",
    },
    explodeOffset: [0, 0, 0],
    explodeEuler: [0, 0, 0],
    window: [0, 0.001, 0.999, 1],
  },
];

export const ENGINEERING_CAMERA_KEYFRAMES: readonly EngineeringCameraKeyframe[] =
  [
    {
      at: 0.0,
      position: [-4.45, 1.56, -4.1],
      target: [0.0, 0.42, -0.05],
      fov: 35,
    },
    {
      at: 0.12,
      position: [-3.25, 1.24, -4.15],
      target: [0.0, 0.36, -1.55],
      fov: 34,
    },
    {
      at: 0.21,
      position: [-0.54, 1.04, 0.08],
      target: [0.0, 0.53, -0.24],
      fov: 35,
    },
    {
      at: F1_COCKPIT_MACRO_PROGRESS,
      position: [-0.055, 0.725, 0.14],
      target: [-0.055, 0.575, -0.384],
      fov: 36,
    },
    {
      at: 0.36,
      position: [-1.38, 1.34, 0.46],
      target: [0.0, 0.66, -0.22],
      fov: 35,
    },
    {
      at: 0.46,
      position: [-4.15, 1.48, -2.55],
      target: [-0.35, 0.42, -0.85],
      fov: 35,
    },
    {
      at: 0.56,
      position: [-4.85, 2.35, -0.65],
      target: [0.0, 0.52, 0.15],
      fov: 36,
    },
    {
      at: 0.68,
      position: [-4.55, 2.55, 3.95],
      target: [0.0, 0.32, 0.55],
      fov: 37,
    },
    {
      at: 0.8,
      position: [-6.55, 3.18, -5.55],
      target: [0.0, 0.38, 0.05],
      fov: 38,
    },
    {
      at: 0.86,
      position: [-6.0, 2.75, -5.1],
      target: [0.0, 0.4, 0.0],
      fov: 37,
    },
    {
      at: 0.92,
      position: [-5.35, 2.3, -4.55],
      target: [0.0, 0.4, 0.0],
      fov: 36,
    },
    {
      at: 0.985,
      position: [-4.8, 1.8, -4.2],
      target: [0.0, 0.42, -0.04],
      fov: 35.5,
    },
    {
      at: 1.0,
      position: [-4.45, 1.56, -4.1],
      target: [0.0, 0.42, -0.05],
      fov: 35,
    },
  ];

export const ENGINEERING_CHAPTERS: readonly EngineeringChapterSpec[] = [
  {
    id: "origin",
    index: "01",
    range: [0.0, 0.06],
    focusProgress: 0.0,
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
  {
    id: "aero",
    index: "02",
    range: [0.06, 0.19],
    focusProgress: 0.13,
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
  {
    id: "cockpit",
    index: "03",
    range: [0.19, 0.35],
    focusProgress: F1_COCKPIT_MACRO_PROGRESS,
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
  {
    id: "corners",
    index: "04",
    range: [0.35, 0.49],
    focusProgress: 0.45,
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
  {
    id: "bodywork",
    index: "05",
    range: [0.49, 0.6],
    focusProgress: 0.55,
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
  {
    id: "core",
    index: "06",
    range: [0.6, 0.73],
    focusProgress: 0.67,
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
  {
    id: "matrix",
    index: "07",
    range: [0.73, 0.86],
    focusProgress: 0.8,
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
  {
    id: "reassembly",
    index: "08",
    range: [0.86, 1.0],
    focusProgress: 0.96,
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
      vi: "Lõi máy, buồng lái, thân vỏ, cánh gió và đai ốc trượt khít về gốc tọa độ trước khi nối xuống bốn chuyên đề bên dưới.",
    },
  },
];

export const ENGINEERING_STORY_BEATS: readonly EngineeringStoryBeat[] = [
  {
    id: "origin-cell",
    progress: 0,
    partId: "MONOCOQUE_CHASSIS",
    caption: {
      en: "Every assembly is organized around the central survival cell.",
      vi: "Mọi cụm chi tiết quy tụ quanh khoang sống trung tâm.",
    },
  },
  {
    id: "aero-front-wing",
    progress: 0.06,
    partId: "FRONT_WING_ASSEMBLY",
    caption: {
      en: "The front wing shapes airflow along the car.",
      vi: "Cánh trước định hình luồng khí dọc thân xe.",
    },
  },
  {
    id: "aero-rear-drs",
    progress: 0.145,
    partId: "REAR_DRS_FLAP_ACTUATOR",
    caption: {
      en: "The rear wing and DRS complete the aero assembly.",
      vi: "Cánh sau và DRS hoàn thiện cụm khí động học.",
    },
  },
  {
    id: "cockpit-halo",
    progress: 0.19,
    partId: "COCKPIT_HALO",
    caption: {
      en: "The Halo lifts to reveal the cockpit.",
      vi: "Khung Halo nâng lên, mở tầm nhìn vào buồng lái.",
    },
  },
  {
    id: "cockpit-controls",
    progress: F1_COCKPIT_MACRO_PROGRESS,
    partId: "STEERING_WHEEL_LCD",
    caption: {
      en: "The display, encoders and paddles sit within the driver's reach.",
      vi: "Màn hình, núm xoay và lẫy số nằm trong tầm tay người lái.",
    },
  },
  {
    id: "cockpit-seat",
    progress: 0.32,
    partId: "COCKPIT_SEAT_CARBON",
    caption: {
      en: "The seat and harness define the driver's place in the cockpit.",
      vi: "Ghế và dây đai định hình vị trí người lái trong khoang.",
    },
  },
  {
    id: "corners-locks",
    progress: 0.35,
    partId: "FL_CENTERLOCK_NUT",
    caption: {
      en: "Centerlocks begin to release the wheel assemblies.",
      vi: "Đai ốc khóa tâm mở đầu nhịp bóc tách cụm bánh xe.",
    },
  },
  {
    id: "corners-rims",
    progress: 0.415,
    partId: "FL_FORGED_RIM",
    caption: {
      en: "Tires and forged rims separate from the brake assemblies.",
      vi: "Lốp và mâm rèn tách khỏi cụm phanh ở bốn góc xe.",
    },
  },
  {
    id: "corners-brakes",
    progress: 0.465,
    partId: "FL_BRAKE_SUSPENSION",
    caption: {
      en: "The brake assemblies emerge inside each corner.",
      vi: "Cụm phanh lộ ra bên trong từng góc xe.",
    },
  },
  {
    id: "body-shells",
    progress: 0.49,
    partId: "SIDEPOD_SHELL_LEFT",
    caption: {
      en: "The sidepods open to reveal the cooling system.",
      vi: "Hai sidepod mở ra, để lộ hệ thống tản nhiệt.",
    },
  },
  {
    id: "body-radiators",
    progress: 0.56,
    partId: "COOLING_RADIATOR_LEFT",
    caption: {
      en: "The inclined radiators emerge beneath the bodywork.",
      vi: "Các két giải nhiệt đặt nghiêng hiện ra dưới thân vỏ.",
    },
  },
  {
    id: "core-floor",
    progress: 0.6,
    partId: "VENTURI_FLOOR_TITANIUM",
    caption: {
      en: "The Venturi floor drops clear of the chassis.",
      vi: "Sàn Venturi hạ xuống, tách khỏi khung gầm.",
    },
  },
  {
    id: "core-powertrain",
    progress: 0.675,
    partId: "POWERTRAIN_V6_HYBRID",
    caption: {
      en: "The hybrid unit, gearbox and exhaust form the drivetrain core.",
      vi: "Cụm hybrid, hộp số và ống xả tạo thành lõi truyền động.",
    },
  },
  {
    id: "matrix-overview",
    progress: 0.73,
    partId: "MONOCOQUE_CHASSIS",
    caption: {
      en: "All 46 movable assemblies hold position around the monocoque.",
      vi: "46 cụm chuyển động giữ vị trí quanh monocoque.",
    },
  },
  {
    id: "reassembly-core",
    progress: 0.86,
    partId: "POWERTRAIN_V6_HYBRID",
    caption: {
      en: "The drivetrain returns to its assembly datum.",
      vi: "Lõi truyền động trở về chuẩn lắp.",
    },
  },
  {
    id: "reassembly-body",
    progress: 0.905,
    partId: "SIDEPOD_SHELL_LEFT",
    caption: {
      en: "Bodywork closes around the cooling system.",
      vi: "Thân vỏ khép lại quanh hệ thống tản nhiệt.",
    },
  },
  {
    id: "reassembly-wheels",
    progress: 0.935,
    partId: "FL_BRAKE_SUSPENSION",
    caption: {
      en: "Wheel assemblies return from brakes to centerlocks.",
      vi: "Cụm bánh xe tái hợp từ phanh tới khóa tâm.",
    },
  },
  {
    id: "reassembly-cockpit",
    progress: 0.965,
    partId: "COCKPIT_SEAT_CARBON",
    caption: {
      en: "The cockpit closes around the seat and steering wheel.",
      vi: "Buồng lái khép lại quanh ghế và vô-lăng.",
    },
  },
  {
    id: "reassembly-aero",
    progress: 0.985,
    partId: "FRONT_WING_ASSEMBLY",
    caption: {
      en: "The wings return to their original datum.",
      vi: "Các cánh gió trở về đúng vị trí ban đầu.",
    },
  },
];

const DEEP_LINK_PROGRESS_MAP: Readonly<Record<string, number>> = {
  origin: 0.0,
  aero: 0.13,
  "front-wing": 0.12,
  "rear-wing": 0.16,
  cockpit: F1_COCKPIT_MACRO_PROGRESS,
  halo: F1_COCKPIT_MACRO_PROGRESS,
  corners: 0.45,
  suspension: 0.45,
  bodywork: 0.55,
  sidepods: 0.55,
  core: 0.67,
  floor: 0.65,
  diffuser: 0.68,
  matrix: 0.8,
  reassembly: 0.96,
};

export function resolveDeepLinkProgress(param: string | null): number | null {
  if (!param) return null;
  const key = param.trim().toLowerCase();
  return key in DEEP_LINK_PROGRESS_MAP ? DEEP_LINK_PROGRESS_MAP[key] : null;
}

interface CompiledTimelineEngine {
  readonly timeline: ReturnType<typeof createTimeline>;
  readonly partTargets: ReadonlyMap<string, { phase: number }>;
  readonly cameraTarget: {
    px: number;
    py: number;
    pz: number;
    tx: number;
    ty: number;
    tz: number;
    fov: number;
  };
}

let cachedEngine: CompiledTimelineEngine | null = null;

function getCompiledTimelineEngine(): CompiledTimelineEngine {
  if (cachedEngine) return cachedEngine;

  const tl = createTimeline({
    autoplay: false,
    defaults: { ease: "inOutCubic" },
  });

  const partTargets = new Map<string, { phase: number }>();
  const byTrack: Record<EngineeringTrackId, EngineeringPartSpec[]> = {
    aero: [],
    corners: [],
    body: [],
    core: [],
  };
  for (const spec of ENGINEERING_PARTS) {
    byTrack[spec.track].push(spec);
  }

  for (const trackId of ["aero", "corners", "body", "core"] as const) {
    const group = byTrack[trackId];

    group.forEach((spec) => {
      const target = { phase: 0 };
      partTargets.set(spec.id, target);
      if (
        spec.explodeOffset[0] === 0 &&
        spec.explodeOffset[1] === 0 &&
        spec.explodeOffset[2] === 0
      ) {
        return;
      }

      const [dStart, dEnd, rStart, rEnd] = resolveStoryWindow(spec);
      const detachStartMs = Math.min(
        TIMELINE_VIRTUAL_MS - 100,
        Math.round(dStart * TIMELINE_VIRTUAL_MS),
      );
      const detachDurMs = Math.max(
        120,
        Math.round((dEnd - dStart) * TIMELINE_VIRTUAL_MS),
      );
      const returnStartMs = Math.max(
        detachStartMs + detachDurMs + 40,
        Math.round(rStart * TIMELINE_VIRTUAL_MS),
      );
      const returnDurMs = Math.max(
        120,
        Math.min(
          TIMELINE_VIRTUAL_MS - returnStartMs,
          Math.round((rEnd - rStart) * TIMELINE_VIRTUAL_MS),
        ),
      );
      const holdDurMs = Math.max(
        1,
        returnStartMs - (detachStartMs + detachDurMs),
      );
      const tailDurMs = Math.max(
        1,
        TIMELINE_VIRTUAL_MS - (returnStartMs + returnDurMs),
      );

      tl.add(
        target,
        {
          keyframes: [
            { phase: 0, duration: Math.max(1, detachStartMs), ease: "linear" },
            { phase: 1, duration: detachDurMs, ease: "outQuart" },
            { phase: 1, duration: holdDurMs, ease: "linear" },
            { phase: 0, duration: returnDurMs, ease: "inOutCubic" },
            { phase: 0, duration: tailDurMs, ease: "linear" },
          ],
        },
        0,
      );
    });
  }

  const firstCam = ENGINEERING_CAMERA_KEYFRAMES[0];
  const cameraTarget = {
    px: firstCam.position[0],
    py: firstCam.position[1],
    pz: firstCam.position[2],
    tx: firstCam.target[0],
    ty: firstCam.target[1],
    tz: firstCam.target[2],
    fov: firstCam.fov,
  };

  for (let i = 0; i < ENGINEERING_CAMERA_KEYFRAMES.length - 1; i += 1) {
    const from = ENGINEERING_CAMERA_KEYFRAMES[i];
    const to = ENGINEERING_CAMERA_KEYFRAMES[i + 1];
    const startMs = Math.round(from.at * TIMELINE_VIRTUAL_MS);
    const durMs = Math.max(
      50,
      Math.round((to.at - from.at) * TIMELINE_VIRTUAL_MS),
    );
    tl.add(
      cameraTarget,
      {
        px: [from.position[0], to.position[0]],
        py: [from.position[1], to.position[1]],
        pz: [from.position[2], to.position[2]],
        tx: [from.target[0], to.target[0]],
        ty: [from.target[1], to.target[1]],
        tz: [from.target[2], to.target[2]],
        fov: [from.fov, to.fov],
        duration: durMs,
        ease: "inOutSine",
      },
      startMs,
    );
  }

  cachedEngine = { timeline: tl, partTargets, cameraTarget };
  return cachedEngine;
}

export function evaluateEngineeringTimeline(
  rawProgress: number,
): EngineeringEvaluation {
  const progress = clamp(rawProgress, 0, 1);
  const { timeline, partTargets, cameraTarget } = getCompiledTimelineEngine();

  const isBoundary = progress <= 0.0001 || progress >= 0.9999;
  timeline.seek(Math.round(progress * TIMELINE_VIRTUAL_MS));

  const parts: Record<string, EngineeringPartSnapshot> = {};
  let phaseTotal = 0;
  let movableCount = 0;

  for (const spec of ENGINEERING_PARTS) {
    const rawPhase = isBoundary
      ? 0
      : clamp(partTargets.get(spec.id)?.phase ?? 0, 0, 1);
    const isMovable =
      spec.explodeOffset[0] !== 0 ||
      spec.explodeOffset[1] !== 0 ||
      spec.explodeOffset[2] !== 0;

    if (isMovable) {
      movableCount += 1;
      phaseTotal += rawPhase;
    }

    parts[spec.id] =
      rawPhase === 0
        ? { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, phase: 0 }
        : {
            tx: spec.explodeOffset[0] * rawPhase,
            ty: spec.explodeOffset[1] * rawPhase,
            tz: spec.explodeOffset[2] * rawPhase,
            rx: spec.explodeEuler[0] * rawPhase,
            ry: spec.explodeEuler[1] * rawPhase,
            rz: spec.explodeEuler[2] * rawPhase,
            phase: rawPhase,
          };
  }

  let chapterIndex = ENGINEERING_CHAPTERS.findIndex(
    (ch, index) =>
      progress >= ch.range[0] &&
      (progress < ch.range[1] || index === ENGINEERING_CHAPTERS.length - 1),
  );
  if (chapterIndex < 0) chapterIndex = ENGINEERING_CHAPTERS.length - 1;

  const storyBeat = ENGINEERING_STORY_BEATS.reduce(
    (active, beat) => (progress >= beat.progress ? beat : active),
    ENGINEERING_STORY_BEATS[0],
  );

  const firstCam = ENGINEERING_CAMERA_KEYFRAMES[0];
  const camera = isBoundary
    ? {
        position: firstCam.position,
        target: firstCam.target,
        fov: firstCam.fov,
      }
    : {
        position: [cameraTarget.px, cameraTarget.py, cameraTarget.pz] as const,
        target: [cameraTarget.tx, cameraTarget.ty, cameraTarget.tz] as const,
        fov: cameraTarget.fov,
      };

  return {
    progress,
    explodeRatio: movableCount > 0 ? phaseTotal / movableCount : 0,
    chapterIndex,
    chapter: ENGINEERING_CHAPTERS[chapterIndex],
    storyBeat,
    camera,
    parts,
  };
}

export function stepEngineeringProgress(
  current: number,
  target: number,
  deltaMs: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return clamp(target, 0, 1);
  const next = damp(current, clamp(target, 0, 1), Math.min(64, deltaMs), 0.12);
  return Math.abs(next - target) < 0.00015 ? clamp(target, 0, 1) : next;
}
