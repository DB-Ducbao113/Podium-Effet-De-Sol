import { clamp } from "animejs";
import {
  ENGINEERING_PARTS,
  type EngineeringPartSnapshot,
  type LocalizedText,
} from "./engineeringDisassemblyData";
import { resolveEngineeringInspectionPose } from "./engineeringInspectionState";
import {
  resolveCoupledPartOffset,
  type EngineeringControlMode,
} from "./engineeringInteractionState";
import {
  COCKPIT_INTERIOR_LIGHT_PRESET,
  ENGINEERING_CHAPTER_LIGHT_PRESETS,
  interpolateLightRigStates,
  resolveTargetLightPreset,
  type EngineeringLightRigState,
} from "./engineeringLightingRig";
import {
  ENGINEERING_STORY_CAMERA_ANCHORS,
  ENGINEERING_STORY_CHAPTERS,
  ENGINEERING_STORY_SCROLL_VH,
  ENGINEERING_STORY_SHOTS,
  evaluateEngineeringStoryTimeline,
  getEngineeringStoryShot,
  type EngineeringCameraAnchor,
  type EngineeringCameraRoute,
  type EngineeringStoryChapterId,
  type EngineeringStoryEvaluation,
  type EngineeringStoryShot,
} from "./engineeringStoryTimeline";

export type EngineeringMotionPhaseId =
  "establish" | "approach" | "detach" | "inspect" | "explain" | "transition";

export interface EngineeringMotionPhaseSpec {
  readonly id: EngineeringMotionPhaseId;
  readonly index: 1 | 2 | 3 | 4 | 5 | 6;
  readonly startUnits: number;
  readonly endUnits: number;
  readonly startProgress: number;
  readonly endProgress: number;
  readonly label: LocalizedText;
  readonly caption: LocalizedText;
}

export interface EngineeringMotionPhaseCue {
  readonly partId: string;
  readonly phaseId: EngineeringMotionPhaseId;
  readonly phaseIndex: 1 | 2 | 3 | 4 | 5 | 6;
  readonly phaseCount: 6;
  readonly phaseProgress: number;
  readonly shotProgress: number;
  readonly label: LocalizedText;
  readonly caption: LocalizedText;
}

export interface EngineeringCameraCue {
  readonly route: EngineeringCameraRoute;
  /** Multiplier applied to scene bounding-sphere radius for quadratic dolly lift. */
  readonly arcLiftMultiplier: number;
  readonly source: "director" | "timeline";
}

export interface EngineeringAnnotationCue {
  readonly visible: boolean;
  readonly partId: string | null;
  readonly opacity: number;
  readonly leaderScale: number;
  readonly motionPhaseId: EngineeringMotionPhaseId | null;
  readonly phaseLabel: LocalizedText | null;
  readonly phase: number;
}

export interface EngineeringEditorialCue {
  readonly showChapterTitle: boolean;
  readonly partId: string | null;
  readonly componentIndex: number | null;
  readonly title: LocalizedText;
  readonly location: LocalizedText;
  readonly caption: LocalizedText;
  readonly phaseId: EngineeringMotionPhaseId | null;
  readonly phaseIndex: 1 | 2 | 3 | 4 | 5 | 6 | null;
  readonly phaseCount: number | null;
  readonly phaseLabel: LocalizedText | null;
}

export interface EngineeringMotionDirectorInput {
  readonly effectiveProgress: number;
  readonly controlMode?: EngineeringControlMode;
  readonly selectedPartId?: string | null;
  readonly isolatedPartId?: string | null;
  readonly isolationBlend?: number;
  readonly reducedMotion?: boolean;
  readonly xray?: boolean;
  /** Optional precomputed story evaluation at exact effectiveProgress to avoid duplicate work. */
  readonly precomputedStory?: EngineeringStoryEvaluation;
}

export interface EngineeringMotionCueSheet {
  readonly progress: number;
  readonly units: number;
  readonly story: EngineeringStoryEvaluation;
  readonly activePhaseCue: EngineeringMotionPhaseCue | null;
  readonly cameraCue: EngineeringCameraCue;
  readonly lightingCue: EngineeringLightRigState;
  readonly annotationCue: EngineeringAnnotationCue;
  readonly editorialCue: EngineeringEditorialCue;
  readonly parts: Readonly<Record<string, EngineeringPartSnapshot>>;
}

export interface EngineeringResolvedPartTransform {
  readonly visible: boolean;
  readonly tx: number;
  readonly ty: number;
  readonly tz: number;
  readonly rx: number;
  readonly ry: number;
  readonly rz: number;
  readonly phase: number;
}

export type EngineeringMechanicalChoreographyKind =
  | "front-wing-axial"
  | "drs-hinge-lift"
  | "halo-vertical-hoist"
  | "steering-spline-macro"
  | "centerlock-helical-spin"
  | "wheel-corner-axial"
  | "sidepod-lateral-peel"
  | "venturi-floor-drop"
  | "powertrain-vertical-extract"
  | "cockpit-vertical-stack"
  | "secondary-axial";

const DEFAULT_CAMERA_ARC_LIFT = 0.64;
const BOUNDARY_EPS = 1e-7;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return clamp(value, 0, 1);
}

function cleanZero(value: number): number {
  return value === 0 ? 0 : value;
}

function smoothstep(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function easeOutCubic(value: number): number {
  const t = clamp01(value);
  return 1 - (1 - t) ** 3;
}

function easeOutQuart(value: number): number {
  const t = clamp01(value);
  return 1 - (1 - t) ** 4;
}

function easeOutQuint(value: number): number {
  const t = clamp01(value);
  return 1 - (1 - t) ** 5;
}

function easeInOutSine(value: number): number {
  const t = clamp01(value);
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function easeInOutCubic(value: number): number {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

const PHASE_LABELS: Readonly<Record<EngineeringMotionPhaseId, LocalizedText>> =
  {
    establish: { en: "Establish", vi: "Thiết lập" },
    approach: { en: "Approach", vi: "Tiếp cận" },
    detach: { en: "Detach", vi: "Bóc tách" },
    inspect: { en: "Inspect", vi: "Quan sát" },
    explain: { en: "Explain", vi: "Giải thích" },
    transition: { en: "Transition", vi: "Chuyển cảnh" },
  };

const partSpecById = new Map(ENGINEERING_PARTS.map((part) => [part.id, part]));
const anchorById = new Map(
  ENGINEERING_STORY_CAMERA_ANCHORS.map((anchor) => [anchor.id, anchor]),
);

const OPENING_DOLLY_SIDE_ANCHOR = anchorById.get("opening-dolly-side")!;

// ── Signature 6-Phase Shot Registry (All 8 Hero Sequences across 1600svh) ────

interface SignatureShotOrchestration {
  readonly partId: string;
  readonly shot: EngineeringStoryShot;
  readonly focusAnchor: EngineeringCameraAnchor;
  readonly phases: readonly EngineeringMotionPhaseSpec[];
  readonly establishStartAnchor?: EngineeringCameraAnchor;
  readonly establishEndAnchor?: EngineeringCameraAnchor;
  readonly detachEndAnchor: EngineeringCameraAnchor;
  readonly inspectPeakAnchor: EngineeringCameraAnchor;
  readonly explainSettleAnchor: EngineeringCameraAnchor;
  readonly showChapterTitleInEstablish: boolean;
  readonly arcLiftApproach: number;
  readonly arcLiftDetach: number;
  readonly arcLiftInspect: number;
  readonly arcLiftExplain: number;
  readonly arcLiftTransition: number;
  readonly lights: {
    readonly entry: EngineeringLightRigState;
    readonly establish: EngineeringLightRigState;
    readonly approach: EngineeringLightRigState;
    readonly detach: EngineeringLightRigState;
    readonly inspect: EngineeringLightRigState;
    readonly explain: EngineeringLightRigState;
    readonly exit: EngineeringLightRigState;
  };
}

function buildSixPhases(
  shot: EngineeringStoryShot,
  establishSpanUnits: number,
  inspectSplitRatio: number,
  captions: Readonly<Record<EngineeringMotionPhaseId, LocalizedText>>,
): readonly EngineeringMotionPhaseSpec[] {
  const establishEnd = shot.startUnits + establishSpanUnits;
  const approachEnd = shot.approachEndUnits;
  const detachEnd = shot.detachEndUnits;
  const inspectEnd =
    detachEnd + (shot.holdEndUnits - detachEnd) * inspectSplitRatio;
  const explainEnd = shot.holdEndUnits;
  const end = shot.endUnits;

  const defs: readonly [
    EngineeringMotionPhaseId,
    1 | 2 | 3 | 4 | 5 | 6,
    number,
    number,
  ][] = [
    ["establish", 1, shot.startUnits, establishEnd],
    ["approach", 2, establishEnd, approachEnd],
    ["detach", 3, approachEnd, detachEnd],
    ["inspect", 4, detachEnd, inspectEnd],
    ["explain", 5, inspectEnd, explainEnd],
    ["transition", 6, explainEnd, end],
  ];

  return defs.map(([id, index, startUnits, endUnits]) => ({
    id,
    index,
    startUnits,
    endUnits,
    startProgress: startUnits / ENGINEERING_STORY_SCROLL_VH,
    endProgress: endUnits / ENGINEERING_STORY_SCROLL_VH,
    label: PHASE_LABELS[id],
    caption: captions[id],
  }));
}

function requireShotAndAnchor(partId: string): {
  shot: EngineeringStoryShot;
  focusAnchor: EngineeringCameraAnchor;
} {
  const shot = getEngineeringStoryShot(partId);
  if (!shot) {
    throw new Error(`Motion Director missing shot spec for ${partId}`);
  }
  const focusAnchor = anchorById.get(`focus-${shot.id}`);
  if (!focusAnchor) {
    throw new Error(`Motion Director missing camera anchor for ${partId}`);
  }
  return { shot, focusAnchor };
}

function buildSignatureRegistry(): readonly SignatureShotOrchestration[] {
  const entries: SignatureShotOrchestration[] = [];

  // 1. Ch 02 Aero — FRONT_WING_ASSEMBLY (80..125vh, 45vh)
  {
    const { shot, focusAnchor } = requireShotAndAnchor("FRONT_WING_ASSEMBLY");
    const phases = buildSixPhases(shot, 5, 10.5 / 20.25, {
      establish: {
        en: "Establishing the four-plane front wing anchored ahead of the survival cell on the intact car.",
        vi: "Định vị cụm cánh trước bốn tầng gắn liền phía trước mũi xe trên tổng thể nguyên khối.",
      },
      approach: {
        en: "Gliding down to the nosecone pylons and sculpted leading edge before axial release.",
        vi: "Tiến sát góc thấp vào ngàm treo mũi xe và mép đón gió trước khi tách cụm cánh.",
      },
      detach: {
        en: "Releasing axially along the airflow datum with clearance lift and subtle aerodynamic pitch settle.",
        vi: "Tách tịnh tiến dọc trục dòng khí, nâng nhẹ khoảng sáng và nghiêng góc khí động có kiểm soát.",
      },
      inspect: {
        en: "Sweeping across the four staggered carbon wing planes, slot gaps and sculpted outwash endplates.",
        vi: "Lia máy chậm qua bốn tầng cánh carbon xếp lớp, khe gia tốc dòng khí và tấm đầu cánh.",
      },
      explain: shot.caption,
      transition: {
        en: "Holding the separated front wing datum while handing focus smoothly to the carbon crash nosecone.",
        vi: "Giữ cố định mốc cánh trước đã tách để chuyển nhịp mượt sang cụm mũi chịu va chạm carbon.",
      },
    });
    const inspectEnd = phases[3].endUnits;
    const explainEnd = phases[4].endUnits;
    const fwEstablishLight: EngineeringLightRigState = {
      ...ENGINEERING_CHAPTER_LIGHT_PRESETS.origin,
      keyIntensity: 2.54,
      keyPosition: [-6.0, 8.9, -6.2],
      rimIntensity: 1.3,
      accentPointIntensity: 0.52,
      accentPointPosition: [-1.5, 1.1, -2.1],
      accentPointColor: "#f7f3ee",
    };
    const fwApproachLight: EngineeringLightRigState = {
      ...ENGINEERING_CHAPTER_LIGHT_PRESETS.aero,
      keyIntensity: 2.68,
      keyPosition: [-5.5, 8.5, -6.9],
      rimIntensity: 1.4,
      accentPointIntensity: 0.66,
      accentPointPosition: [-1.45, 0.88, -2.75],
      accentPointColor: "#fff3e6",
    };
    const fwDetachLight: EngineeringLightRigState = {
      ...ENGINEERING_CHAPTER_LIGHT_PRESETS.aero,
      ambientIntensity: 0.42,
      keyIntensity: 2.76,
      keyPosition: [-5.1, 8.2, -7.2],
      fillIntensity: 1.34,
      rimIntensity: 1.5,
      accentPointIntensity: 0.86,
      accentPointPosition: [-1.2, 0.74, -3.15],
      accentPointColor: "#ffefe0",
    };
    const fwInspectLight: EngineeringLightRigState = {
      ...ENGINEERING_CHAPTER_LIGHT_PRESETS.aero,
      ambientIntensity: 0.43,
      keyIntensity: 2.8,
      keyPosition: [-4.6, 8.6, -7.1],
      fillIntensity: 1.4,
      rimIntensity: 1.56,
      accentPointIntensity: 0.94,
      accentPointPosition: [-0.95, 0.82, -3.3],
      accentPointColor: "#fff6ec",
    };
    const fwExplainLight: EngineeringLightRigState = {
      ...ENGINEERING_CHAPTER_LIGHT_PRESETS.aero,
      ambientIntensity: 0.42,
      keyIntensity: 2.66,
      keyPosition: [-5.4, 8.6, -6.8],
      fillIntensity: 1.36,
      rimIntensity: 1.38,
      accentPointIntensity: 0.68,
      accentPointPosition: [-1.4, 0.86, -2.9],
      accentPointColor: "#fff4eb",
    };

    entries.push({
      partId: shot.partId,
      shot,
      focusAnchor,
      phases,
      establishStartAnchor: {
        id: "director-fw-establish-start",
        atUnits: shot.startUnits,
        holdUntilUnits: shot.startUnits,
        subjectPartId: null,
        framingPartId: null,
        direction: [-0.82, 0.25, -0.54],
        framing: 0.68,
        fov: 33,
        lookTargetBias: [0, 0.03, -0.16],
      },
      establishEndAnchor: {
        id: "director-fw-establish-end",
        atUnits: phases[0].endUnits,
        holdUntilUnits: phases[0].endUnits,
        subjectPartId: null,
        framingPartId: null,
        direction: [-0.76, 0.23, -0.64],
        framing: 0.66,
        fov: 32.5,
        lookTargetBias: [0, 0.02, -0.22],
      },
      detachEndAnchor: {
        id: "director-fw-detach-end",
        atUnits: shot.detachEndUnits,
        holdUntilUnits: shot.detachEndUnits,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [-0.7, 0.2, -0.82],
        framing: 0.85,
        fov: 30.5,
        lookTargetBias: [0, 0.01, 0],
      },
      inspectPeakAnchor: {
        id: "director-fw-inspect-peak",
        atUnits: inspectEnd,
        holdUntilUnits: inspectEnd,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [-0.48, 0.28, -0.86],
        framing: 0.82,
        fov: 29.5,
        lookTargetBias: [0, 0.02, 0],
      },
      explainSettleAnchor: {
        ...focusAnchor,
        id: "director-fw-explain-settle",
        atUnits: inspectEnd + (explainEnd - inspectEnd) * 0.45,
        holdUntilUnits: explainEnd,
      },
      showChapterTitleInEstablish: true,
      arcLiftApproach: 0.24,
      arcLiftDetach: 0.08,
      arcLiftInspect: 0.12,
      arcLiftExplain: 0.08,
      arcLiftTransition: 0.46,
      lights: {
        entry: ENGINEERING_CHAPTER_LIGHT_PRESETS.origin,
        establish: fwEstablishLight,
        approach: fwApproachLight,
        detach: fwDetachLight,
        inspect: fwInspectLight,
        explain: fwExplainLight,
        exit: ENGINEERING_CHAPTER_LIGHT_PRESETS.aero,
      },
    });
  }

  // 2. Ch 02 Aero — REAR_DRS_FLAP_ACTUATOR (275..320vh, 45vh)
  {
    const { shot, focusAnchor } = requireShotAndAnchor(
      "REAR_DRS_FLAP_ACTUATOR",
    );
    const phases = buildSixPhases(shot, 4.5, 0.52, {
      establish: {
        en: "Framing the upper rear wing plane and central DRS actuator pod above the beam wing.",
        vi: "Định vị tầng cánh gió sau trên và cụm thanh truyền mở DRS trung tâm phía trên beam wing.",
      },
      approach: {
        en: "Closing in on the carbon flap hinge and machined DRS linkage mechanism.",
        vi: "Tiến cận cảnh bản lề cánh trên sợi carbon và cụm cơ cấu thanh truyền DRS CNC.",
      },
      detach: {
        en: "Pivoting the DRS flap open along its hinge before lifting cleanly along the rear wake axis.",
        vi: "Xoay mở cánh gió DRS quanh trục bản lề trước khi tách nâng dọc theo luồng thoát khí đuôi.",
      },
      inspect: {
        en: "Sweeping behind the opened slot gap to inspect flap curvature and actuator leverage.",
        vi: "Lia máy phía sau khe mở gió để quan sát biên dạng cánh lật và tay đòn truyền động.",
      },
      explain: shot.caption,
      transition: {
        en: "Completing the aerodynamic chapter and sweeping forward to the titanium Halo cockpit.",
        vi: "Khép lại chương khí động học và chuyển góc máy mượt về khung bảo vệ Halo buồng lái.",
      },
    });
    const inspectEnd = phases[3].endUnits;
    const explainEnd = phases[4].endUnits;
    const aeroBase = ENGINEERING_CHAPTER_LIGHT_PRESETS.aero;
    const drsPeak: EngineeringLightRigState = {
      ...aeroBase,
      keyIntensity: 2.78,
      keyPosition: [-4.8, 8.9, 6.2],
      rimIntensity: 1.56,
      rimPosition: [1.4, 3.8, 8.6],
      accentPointIntensity: 0.88,
      accentPointPosition: [-1.1, 1.35, 2.95],
      accentPointColor: "#ffefe2",
    };

    entries.push({
      partId: shot.partId,
      shot,
      focusAnchor,
      phases,
      detachEndAnchor: {
        id: "director-drs-detach-end",
        atUnits: shot.detachEndUnits,
        holdUntilUnits: shot.detachEndUnits,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [-0.66, 0.36, 0.66],
        framing: 0.9,
        fov: 30.5,
        lookTargetBias: [0, 0.02, 0],
      },
      inspectPeakAnchor: {
        id: "director-drs-inspect-peak",
        atUnits: inspectEnd,
        holdUntilUnits: inspectEnd,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [-0.34, 0.44, 0.84],
        framing: 0.86,
        fov: 29.5,
        lookTargetBias: [0, 0.02, 0],
      },
      explainSettleAnchor: {
        ...focusAnchor,
        id: "director-drs-explain-settle",
        atUnits: inspectEnd + (explainEnd - inspectEnd) * 0.45,
        holdUntilUnits: explainEnd,
      },
      showChapterTitleInEstablish: false,
      arcLiftApproach: 0.46,
      arcLiftDetach: 0.1,
      arcLiftInspect: 0.14,
      arcLiftExplain: 0.1,
      arcLiftTransition: 0.56,
      lights: {
        entry: aeroBase,
        establish: aeroBase,
        approach: interpolateLightRigStates(aeroBase, drsPeak, 0.45),
        detach: interpolateLightRigStates(aeroBase, drsPeak, 0.8),
        inspect: drsPeak,
        explain: interpolateLightRigStates(aeroBase, drsPeak, 0.4),
        exit: interpolateLightRigStates(
          aeroBase,
          ENGINEERING_CHAPTER_LIGHT_PRESETS.cockpit,
          0.5,
        ),
      },
    });
  }

  // 3. Ch 03 Cockpit — COCKPIT_HALO (320..365vh, 45vh)
  {
    const { shot, focusAnchor } = requireShotAndAnchor("COCKPIT_HALO");
    const phases = buildSixPhases(shot, 5, 0.5, {
      establish: {
        en: "Introducing the cockpit survival cell crowned by the Grade-5 titanium Halo hoop.",
        vi: "Mở màn chương buồng lái với khung bảo vệ Halo hợp kim titan bao quanh khoang tay đua.",
      },
      approach: {
        en: "Framing the forward central titanium pylon and twin side chassis mounting points.",
        vi: "Tiến cận cảnh trụ titan trung tâm và hai điểm neo khung sườn hai bên buồng lái.",
      },
      detach: {
        en: "Hoisting the titanium Halo vertically clear of the survival cell before gentle forward pitch.",
        vi: "Nhấc thẳng đứng khung Halo titan thoát khỏi miệng buồng lái rồi nghiêng nhẹ mở góc nhìn.",
      },
      inspect: {
        en: "Orbiting high across the structural wishbone hoop to reveal the steering cockpit below.",
        vi: "Lia máy từ trên cao qua vòng khung chịu lực, mở trọn tầm nhìn xuống cụm vô-lăng F1 bên dưới.",
      },
      explain: shot.caption,
      transition: {
        en: "Holding the Halo suspended overhead as focus descends into the steering column quick-release.",
        vi: "Giữ khung Halo lơ lửng phía trên để hạ góc máy xuống trục lái và khớp tháo nhanh.",
      },
    });
    const inspectEnd = phases[3].endUnits;
    const explainEnd = phases[4].endUnits;
    const cockpitBase = ENGINEERING_CHAPTER_LIGHT_PRESETS.cockpit;
    const haloSculpt: EngineeringLightRigState = {
      ...cockpitBase,
      keyIntensity: 2.38,
      keyPosition: [-5.2, 9.6, 3.6],
      rimIntensity: 1.24,
      accentPointIntensity: 0.82,
      accentPointPosition: [-0.9, 1.85, 0.25],
      accentPointColor: "#e8f3ff",
    };

    entries.push({
      partId: shot.partId,
      shot,
      focusAnchor,
      phases,
      detachEndAnchor: {
        id: "director-halo-detach-end",
        atUnits: shot.detachEndUnits,
        holdUntilUnits: shot.detachEndUnits,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [-0.56, 0.58, 0.58],
        framing: 0.9,
        fov: 30.5,
        lookTargetBias: [0, -0.02, 0],
      },
      inspectPeakAnchor: {
        id: "director-halo-inspect-peak",
        atUnits: inspectEnd,
        holdUntilUnits: inspectEnd,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [-0.34, 0.68, 0.64],
        framing: 0.88,
        fov: 29.8,
        lookTargetBias: [0, -0.03, 0],
      },
      explainSettleAnchor: {
        ...focusAnchor,
        id: "director-halo-explain-settle",
        atUnits: inspectEnd + (explainEnd - inspectEnd) * 0.45,
        holdUntilUnits: explainEnd,
      },
      showChapterTitleInEstablish: true,
      arcLiftApproach: 0.52,
      arcLiftDetach: 0.1,
      arcLiftInspect: 0.12,
      arcLiftExplain: 0.08,
      arcLiftTransition: 0.42,
      lights: {
        entry: interpolateLightRigStates(
          ENGINEERING_CHAPTER_LIGHT_PRESETS.aero,
          cockpitBase,
          0.5,
        ),
        establish: interpolateLightRigStates(
          ENGINEERING_CHAPTER_LIGHT_PRESETS.aero,
          cockpitBase,
          0.8,
        ),
        approach: cockpitBase,
        detach: interpolateLightRigStates(cockpitBase, haloSculpt, 0.7),
        inspect: haloSculpt,
        explain: cockpitBase,
        exit: cockpitBase,
      },
    });
  }

  // 4. Ch 03 Cockpit — STEERING_WHEEL_LCD (415..460vh, 45vh)
  {
    const { shot, focusAnchor } = requireShotAndAnchor("STEERING_WHEEL_LCD");
    const phases = buildSixPhases(shot, 4.5, 0.5, {
      establish: {
        en: "Aligning to driver-eye POV facing the carbon F1 butterfly wheel inside the open tub.",
        vi: "Căn chỉnh góc nhìn trực diện mắt tay đua hướng vào vô-lăng carbon giữa buồng lái.",
      },
      approach: {
        en: "Pushing smoothly into the 2.5K OLED telemetry screen, shift LEDs and rotary dials.",
        vi: "Đẩy góc máy tiến sát màn hình OLED 2.5K, dải đèn sang số và cụm núm xoay điều chỉnh.",
      },
      detach: {
        en: "Drawing the steering wheel off the splined column with encoders coupled cleanly in unison.",
        vi: "Tách vô-lăng dọc trục khớp hoa khế đồng bộ cùng cụm núm xoay và đèn LED tua máy.",
      },
      inspect: {
        en: "Gentle driver-eye parallax across the matte Alcantara grips and crisp glare-free OLED face.",
        vi: "Quét góc thị sai dịu nhẹ qua tay nắm Alcantara và mặt đồng hồ OLED không lóa sáng.",
      },
      explain: shot.caption,
      transition: {
        en: "Maintaining driver-eye orientation before separating the tactile rotary encoders and shift LED layer.",
        vi: "Giữ vững hướng nhìn trực diện để tách riêng lớp núm xoay vi sai và dải 15 đèn LED sang số.",
      },
    });
    const inspectEnd = phases[3].endUnits;
    const explainEnd = phases[4].endUnits;
    const cockpitBase = ENGINEERING_CHAPTER_LIGHT_PRESETS.cockpit;
    // Strictly preserve off-axis glare-free OLED illumination (abs(accentX) > 0.7)
    const wheelMacroLight: EngineeringLightRigState = {
      ...cockpitBase,
      keyIntensity: 2.05,
      fillIntensity: 1.28,
      rimIntensity: 1.08,
      accentPointIntensity: 0.72,
      accentPointPosition: [-0.92, 1.48, 0.72],
      accentPointColor: "#e6f2ff",
    };

    entries.push({
      partId: shot.partId,
      shot,
      focusAnchor,
      phases,
      detachEndAnchor: {
        id: "director-wheel-detach-end",
        atUnits: shot.detachEndUnits,
        holdUntilUnits: shot.detachEndUnits,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [0.1, 0.34, 0.94],
        framing: 0.87,
        fov: 27.6,
        lookTargetBias: [0, 0.04, 0.04],
      },
      inspectPeakAnchor: {
        id: "director-wheel-inspect-peak",
        atUnits: inspectEnd,
        holdUntilUnits: inspectEnd,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [-0.1, 0.35, 0.93],
        framing: 0.85,
        fov: 27.2,
        lookTargetBias: [0, 0.04, 0.04],
      },
      explainSettleAnchor: {
        ...focusAnchor,
        id: "director-wheel-explain-settle",
        atUnits: inspectEnd + (explainEnd - inspectEnd) * 0.45,
        holdUntilUnits: explainEnd,
      },
      showChapterTitleInEstablish: false,
      arcLiftApproach: 0.34,
      arcLiftDetach: 0.05,
      arcLiftInspect: 0.06,
      arcLiftExplain: 0.05,
      arcLiftTransition: 0.28,
      lights: {
        entry: cockpitBase,
        establish: cockpitBase,
        approach: interpolateLightRigStates(cockpitBase, wheelMacroLight, 0.5),
        detach: wheelMacroLight,
        inspect: wheelMacroLight,
        explain: cockpitBase,
        exit: cockpitBase,
      },
    });
  }

  // 5. Ch 04 Wheels — FL_BRAKE_SUSPENSION (685..730vh, 45vh)
  {
    const { shot, focusAnchor } = requireShotAndAnchor("FL_BRAKE_SUSPENSION");
    const phases = buildSixPhases(shot, 4.5, 0.52, {
      establish: {
        en: "Revealing the front-left upright cavity behind the separated centerlock, slick tire and forged rim.",
        vi: "Mở lộ khoang moay-ơ trước trái phía sau cụm ốc khóa tâm, lốp trơn và mâm rèn đã tách rời.",
      },
      approach: {
        en: "Angling obliquely past the floating wheel stack onto the carbon brake drum and wishbone mounts.",
        vi: "Luồn góc máy xiên 3/4 qua cụm mâm lốp để soi thẳng vào cụm phanh carbon và tay đòn treo.",
      },
      detach: {
        en: "Drawing the carbon rotor, cooling ducts and 6-piston caliper cleanly outward along the axle line.",
        vi: "Tách tịnh tiến đĩa phanh carbon, ống gió làm mát và cùm phanh 6 piston dọc theo trục bánh.",
      },
      inspect: {
        en: "Low macro sweep across the ventilated carbon brake rotor, caliper bridge and aero wishbones.",
        vi: "Quét cận cảnh góc thấp qua đĩa phanh carbon tản nhiệt, cùm phanh và thanh treo khí động.",
      },
      explain: shot.caption,
      transition: {
        en: "Completing the front-left corner cascade and swinging cleanly across the nose to the front-right hub.",
        vi: "Hoàn tất góc bánh trước trái và xoay góc máy mượt sang cụm trục bánh trước phải.",
      },
    });
    const inspectEnd = phases[3].endUnits;
    const explainEnd = phases[4].endUnits;
    const cornersBase = ENGINEERING_CHAPTER_LIGHT_PRESETS.corners;
    const brakeInspectLight: EngineeringLightRigState = {
      ...cornersBase,
      keyIntensity: 2.58,
      fillIntensity: 1.62,
      rimIntensity: 1.38,
      accentPointIntensity: 0.92,
      accentPointPosition: [-1.55, 0.58, -1.35],
      accentPointColor: "#f0f6ff",
    };

    entries.push({
      partId: shot.partId,
      shot,
      focusAnchor,
      phases,
      detachEndAnchor: {
        id: "director-flbrake-detach-end",
        atUnits: shot.detachEndUnits,
        holdUntilUnits: shot.detachEndUnits,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [-0.56, 0.3, -0.77],
        framing: 0.9,
        fov: 30.5,
        lookTargetBias: [0, 0, 0],
      },
      inspectPeakAnchor: {
        id: "director-flbrake-inspect-peak",
        atUnits: inspectEnd,
        holdUntilUnits: inspectEnd,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [-0.42, 0.24, -0.87],
        framing: 0.86,
        fov: 29.5,
        lookTargetBias: [0, 0.01, 0],
      },
      explainSettleAnchor: {
        ...focusAnchor,
        id: "director-flbrake-explain-settle",
        atUnits: inspectEnd + (explainEnd - inspectEnd) * 0.45,
        holdUntilUnits: explainEnd,
      },
      showChapterTitleInEstablish: false,
      arcLiftApproach: 0.36,
      arcLiftDetach: 0.08,
      arcLiftInspect: 0.1,
      arcLiftExplain: 0.08,
      arcLiftTransition: 0.6,
      lights: {
        entry: cornersBase,
        establish: cornersBase,
        approach: interpolateLightRigStates(
          cornersBase,
          brakeInspectLight,
          0.45,
        ),
        detach: interpolateLightRigStates(cornersBase, brakeInspectLight, 0.8),
        inspect: brakeInspectLight,
        explain: interpolateLightRigStates(
          cornersBase,
          brakeInspectLight,
          0.45,
        ),
        exit: cornersBase,
      },
    });
  }

  // 6. Ch 06 Core — VENTURI_FLOOR_TITANIUM (1230..1275vh, 45vh)
  {
    const { shot, focusAnchor } = requireShotAndAnchor(
      "VENTURI_FLOOR_TITANIUM",
    );
    const phases = buildSixPhases(shot, 5, 0.52, {
      establish: {
        en: "Opening the ground-effect core chapter with the full-length carbon underfloor still locked to chassis.",
        vi: "Mở màn chương lõi hiệu ứng mặt đất với toàn bộ sàn đáy carbon đang áp khít dưới khung gầm.",
      },
      approach: {
        en: "Dropping to a low sweeping underfloor angle as the studio datum plinth retracts clear beneath.",
        vi: "Hạ thấp góc máy sát gầm xe trong khi bệ đo studio thu gọn để tạo khoảng trống phía dưới.",
      },
      detach: {
        en: "Lowering the Venturi floor and central titanium skid plank smoothly below the survival cell.",
        vi: "Hạ sàn hầm Venturi và tấm trượt titan trung tâm xuống dưới khung gầm theo phương thẳng đứng.",
      },
      inspect: {
        en: "Gliding beneath the sculpted Venturi inlet strakes, floor edge wings and expanding rear diffuser.",
        vi: "Lia máy dọc gầm xe soi rõ vách hướng dòng Venturi, mép sàn cắt xoáy và miệng khuếch tán sau.",
      },
      explain: shot.caption,
      transition: {
        en: "Holding the lowered floor plane clear before rising to inspect the stressed 1.6L V6 hybrid powertrain.",
        vi: "Giữ sàn đáy hạ thấp để vươn góc máy lên khối động cơ V6 1.6L Hybrid chịu lực khung.",
      },
    });
    const inspectEnd = phases[3].endUnits;
    const explainEnd = phases[4].endUnits;
    const coreBase = ENGINEERING_CHAPTER_LIGHT_PRESETS.core;
    const venturiBounce: EngineeringLightRigState = {
      ...coreBase,
      keyIntensity: 2.38,
      fillIntensity: 1.56,
      rimIntensity: 1.38,
      accentPointIntensity: 1.24,
      accentPointPosition: [-0.25, -1.05, 0.12],
      accentPointColor: "#c2e2ff",
    };

    entries.push({
      partId: shot.partId,
      shot,
      focusAnchor,
      phases,
      detachEndAnchor: {
        id: "director-venturi-detach-end",
        atUnits: shot.detachEndUnits,
        holdUntilUnits: shot.detachEndUnits,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [-0.54, -0.16, -0.82],
        framing: 0.85,
        fov: 30.5,
        lookTargetBias: [0, -0.02, 0.08],
      },
      inspectPeakAnchor: {
        id: "director-venturi-inspect-peak",
        atUnits: inspectEnd,
        holdUntilUnits: inspectEnd,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [-0.36, -0.18, -0.91],
        framing: 0.82,
        fov: 29.5,
        lookTargetBias: [0, -0.02, 0.1],
      },
      explainSettleAnchor: {
        ...focusAnchor,
        id: "director-venturi-explain-settle",
        atUnits: inspectEnd + (explainEnd - inspectEnd) * 0.45,
        holdUntilUnits: explainEnd,
      },
      showChapterTitleInEstablish: true,
      arcLiftApproach: 0.44,
      arcLiftDetach: 0.08,
      arcLiftInspect: 0.1,
      arcLiftExplain: 0.08,
      arcLiftTransition: 0.52,
      lights: {
        entry: ENGINEERING_CHAPTER_LIGHT_PRESETS.bodywork,
        establish: interpolateLightRigStates(
          ENGINEERING_CHAPTER_LIGHT_PRESETS.bodywork,
          coreBase,
          0.6,
        ),
        approach: coreBase,
        detach: interpolateLightRigStates(coreBase, venturiBounce, 0.7),
        inspect: venturiBounce,
        explain: coreBase,
        exit: coreBase,
      },
    });
  }

  // 7. Ch 06 Core — POWERTRAIN_V6_HYBRID (1275..1320vh, 45vh)
  {
    const { shot, focusAnchor } = requireShotAndAnchor("POWERTRAIN_V6_HYBRID");
    const phases = buildSixPhases(shot, 4.5, 0.52, {
      establish: {
        en: "Framing the stressed 1.6L V6 turbo-hybrid power unit bolted directly behind the survival cell.",
        vi: "Định vị khối động cơ V6 1.6L Turbo-Hybrid chịu lực khung gắn trực tiếp sau khoang an toàn.",
      },
      approach: {
        en: "Rising above the exposed monocoque spine to bring the cylinder banks and ERS store into focus.",
        vi: "Nâng góc máy qua sống lưng khung sườn để đưa hai hàng xi-lanh và khối pin ERS vào khung hình.",
      },
      detach: {
        en: "Extracting the hybrid power unit vertically clear of the chassis bulkhead before gliding aft.",
        vi: "Nhấc khối động cơ hybrid thẳng đứng thoát khỏi vách sau khung gầm trước khi trượt về phía đuôi.",
      },
      inspect: {
        en: "Orbiting across the split turbocharger architecture, exhaust manifolds and energy recovery core.",
        vi: "Lia máy qua kiến trúc tăng áp tách rời, cụm cổ góp xả và lõi thu hồi năng lượng điện ERS.",
      },
      explain: shot.caption,
      transition: {
        en: "Keeping the V6 core suspended while shifting focus rearward to the 8-speed carbon gearbox.",
        vi: "Giữ khối V6 nổi phía trên để chuyển nhịp góc máy về phía vỏ hộp số sợi carbon 8 cấp.",
      },
    });
    const inspectEnd = phases[3].endUnits;
    const explainEnd = phases[4].endUnits;
    const coreBase = ENGINEERING_CHAPTER_LIGHT_PRESETS.core;
    const puSculpt: EngineeringLightRigState = {
      ...coreBase,
      keyIntensity: 2.52,
      keyPosition: [-5.2, 9.2, 4.2],
      fillIntensity: 1.56,
      rimIntensity: 1.44,
      accentPointIntensity: 0.96,
      accentPointPosition: [-0.65, 1.35, 0.95],
      accentPointColor: "#ffe9d4",
    };

    entries.push({
      partId: shot.partId,
      shot,
      focusAnchor,
      phases,
      detachEndAnchor: {
        id: "director-pu-detach-end",
        atUnits: shot.detachEndUnits,
        holdUntilUnits: shot.detachEndUnits,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [-0.54, 0.6, 0.59],
        framing: 0.9,
        fov: 30.5,
        lookTargetBias: [0, 0.02, 0],
      },
      inspectPeakAnchor: {
        id: "director-pu-inspect-peak",
        atUnits: inspectEnd,
        holdUntilUnits: inspectEnd,
        subjectPartId: shot.partId,
        framingPartId: shot.partId,
        direction: [-0.32, 0.66, 0.68],
        framing: 0.87,
        fov: 29.8,
        lookTargetBias: [0, 0.02, 0],
      },
      explainSettleAnchor: {
        ...focusAnchor,
        id: "director-pu-explain-settle",
        atUnits: inspectEnd + (explainEnd - inspectEnd) * 0.45,
        holdUntilUnits: explainEnd,
      },
      showChapterTitleInEstablish: false,
      arcLiftApproach: 0.48,
      arcLiftDetach: 0.1,
      arcLiftInspect: 0.12,
      arcLiftExplain: 0.08,
      arcLiftTransition: 0.46,
      lights: {
        entry: coreBase,
        establish: coreBase,
        approach: interpolateLightRigStates(coreBase, puSculpt, 0.5),
        detach: interpolateLightRigStates(coreBase, puSculpt, 0.8),
        inspect: puSculpt,
        explain: interpolateLightRigStates(coreBase, puSculpt, 0.45),
        exit: coreBase,
      },
    });
  }

  // 8. Ch 07 Matrix — MONOCOQUE_CHASSIS (1370..1480vh, 110vh tableau)
  {
    const { shot, focusAnchor } = requireShotAndAnchor("MONOCOQUE_CHASSIS");
    const phases = buildSixPhases(shot, 12, 0.56, {
      establish: {
        en: "Pulling back from the rear drivetrain to unveil the complete 47-assembly spatial matrix.",
        vi: "Kéo lùi góc máy khỏi cụm truyền động sau để mở trọn toàn cảnh giải phẫu 47 cụm chi tiết.",
      },
      approach: {
        en: "Centering the carbon monocoque survival cell as the fixed spatial datum at world origin.",
        vi: "Định tâm khoang an toàn monocoque sợi carbon làm mốc bất động tại gốc tọa độ.",
      },
      detach: {
        en: "All 46 movable assemblies float in calibrated equilibrium along their mechanical axes.",
        vi: "Toàn bộ 46 cụm chuyển động lơ lửng cân bằng theo đúng trục tháo lắp cơ khí xung quanh khung.",
      },
      inspect: {
        en: "Sweeping a wide heroic orbit across wings, cockpit, corners, sidepods and hybrid core — drag to orbit 360°.",
        vi: "Lia máy toàn cảnh qua cánh gió, buồng lái, bốn bánh, thân vỏ và lõi hybrid — kéo để xoay 360°.",
      },
      explain: shot.caption,
      transition: {
        en: "Settling the exploded tableau before initiating reverse staggered precision reassembly.",
        vi: "Ổn định toàn cảnh bóc tách trước khi bắt đầu chu trình tái hợp đảo ngược chuẩn xác.",
      },
    });
    const inspectEnd = phases[3].endUnits;
    const explainEnd = phases[4].endUnits;
    const matrixBase = ENGINEERING_CHAPTER_LIGHT_PRESETS.matrix;
    const matrixOrbitLight: EngineeringLightRigState = {
      ...matrixBase,
      keyIntensity: 2.56,
      keyPosition: [-5.8, 10.2, -5.0],
      fillIntensity: 1.5,
      rimIntensity: 1.32,
      accentPointIntensity: 0.72,
      accentPointPosition: [0.2, 1.35, -0.35],
      accentPointColor: "#f2f8ff",
    };

    entries.push({
      partId: shot.partId,
      shot,
      focusAnchor,
      phases,
      detachEndAnchor: {
        id: "director-matrix-orbit-mid",
        atUnits: shot.detachEndUnits,
        holdUntilUnits: shot.detachEndUnits,
        subjectPartId: shot.partId,
        framingPartId: null,
        direction: [-0.22, 0.4, -0.89],
        framing: 0.7,
        fov: 33.5,
        lookTargetBias: [0, 0.04, 0],
      },
      inspectPeakAnchor: {
        id: "director-matrix-orbit-peak",
        atUnits: inspectEnd,
        holdUntilUnits: inspectEnd,
        subjectPartId: shot.partId,
        framingPartId: null,
        direction: [0.36, 0.42, -0.83],
        framing: 0.69,
        fov: 33,
        lookTargetBias: [0, 0.04, 0],
      },
      explainSettleAnchor: {
        ...focusAnchor,
        id: "director-matrix-explain-settle",
        atUnits: inspectEnd + (explainEnd - inspectEnd) * 0.5,
        holdUntilUnits: explainEnd,
      },
      showChapterTitleInEstablish: true,
      arcLiftApproach: 0.56,
      arcLiftDetach: 0.16,
      arcLiftInspect: 0.18,
      arcLiftExplain: 0.16,
      arcLiftTransition: 0.48,
      lights: {
        entry: ENGINEERING_CHAPTER_LIGHT_PRESETS.core,
        establish: interpolateLightRigStates(
          ENGINEERING_CHAPTER_LIGHT_PRESETS.core,
          matrixBase,
          0.6,
        ),
        approach: matrixBase,
        detach: interpolateLightRigStates(matrixBase, matrixOrbitLight, 0.6),
        inspect: matrixOrbitLight,
        explain: matrixBase,
        exit: matrixBase,
      },
    });
  }

  return entries;
}

export const SIGNATURE_SHOT_ORCHESTRATIONS: readonly SignatureShotOrchestration[] =
  buildSignatureRegistry();

const signatureByPartId = new Map(
  SIGNATURE_SHOT_ORCHESTRATIONS.map((entry) => [entry.partId, entry]),
);

export const FRONT_WING_MOTION_PHASES: readonly EngineeringMotionPhaseSpec[] =
  signatureByPartId.get("FRONT_WING_ASSEMBLY")!.phases;

export const ORCHESTRATED_SIGNATURE_PART_IDS: readonly string[] =
  SIGNATURE_SHOT_ORCHESTRATIONS.map((entry) => entry.partId);

export function getSignatureShotPhases(
  partId: string,
): readonly EngineeringMotionPhaseSpec[] | null {
  return signatureByPartId.get(partId)?.phases ?? null;
}

// ── Per-System Mechanical Part Choreography (All 47 Assemblies) ──────────────

export function classifyMechanicalChoreography(
  partId: string,
): EngineeringMechanicalChoreographyKind {
  if (partId === "FRONT_WING_ASSEMBLY") return "front-wing-axial";
  if (partId === "REAR_DRS_FLAP_ACTUATOR") return "drs-hinge-lift";
  if (partId === "COCKPIT_HALO") return "halo-vertical-hoist";
  if (partId === "STEERING_WHEEL_LCD") return "steering-spline-macro";
  if (partId.endsWith("_CENTERLOCK_NUT")) return "centerlock-helical-spin";
  if (
    partId.endsWith("_AERO_COVER") ||
    partId.endsWith("_SLICK_TIRE") ||
    partId.endsWith("_FORGED_RIM") ||
    partId.endsWith("_BRAKE_SUSPENSION")
  ) {
    return "wheel-corner-axial";
  }
  if (
    partId === "SIDEPOD_SHELL_LEFT" ||
    partId === "SIDEPOD_SHELL_RIGHT" ||
    partId === "ENGINE_COVER_SPINE"
  ) {
    return "sidepod-lateral-peel";
  }
  if (partId === "VENTURI_FLOOR_TITANIUM") return "venturi-floor-drop";
  if (partId === "POWERTRAIN_V6_HYBRID") return "powertrain-vertical-extract";
  if (
    partId.startsWith("COCKPIT_") ||
    partId.startsWith("STEERING_") ||
    partId === "ROLL_HOOP_TCAM"
  ) {
    return "cockpit-vertical-stack";
  }
  return "secondary-axial";
}

function resolveChoreographedDetachSnapshot(
  shot: EngineeringStoryShot,
  units: number,
  baselineSnap: EngineeringPartSnapshot,
): EngineeringPartSnapshot {
  if (
    shot.partId === "MONOCOQUE_CHASSIS" ||
    units <= shot.approachEndUnits + BOUNDARY_EPS ||
    units >= shot.detachEndUnits - BOUNDARY_EPS
  ) {
    return baselineSnap;
  }

  const spec = partSpecById.get(shot.partId);
  if (!spec) return baselineSnap;

  const u = clamp01(
    (units - shot.approachEndUnits) /
      (shot.detachEndUnits - shot.approachEndUnits),
  );
  const [ox, oy, oz] = spec.explodeOffset;
  const [ex, ey, ez] = spec.explodeEuler;
  const kind = classifyMechanicalChoreography(shot.partId);

  switch (kind) {
    case "front-wing-axial": {
      const axial = easeOutQuint(u);
      const lift = easeInOutSine(u) * 0.86 + Math.sin(u * Math.PI) * 0.14;
      const pitch = easeOutCubic(clamp01((u - 0.18) / 0.82));
      return {
        tx: cleanZero(ox * axial),
        ty: cleanZero(oy * lift),
        tz: cleanZero(oz * axial),
        rx: cleanZero(ex * pitch),
        ry: cleanZero(ey * pitch),
        rz: cleanZero(ez * pitch),
        phase: axial,
      };
    }

    case "drs-hinge-lift": {
      // Hinge flap open first (u in 0..0.55), then lift & extend aft
      const hinge = easeOutCubic(clamp01(u / 0.55));
      const lift = easeOutQuart(clamp01((u - 0.14) / 0.86));
      return {
        tx: cleanZero(ox * lift),
        ty: cleanZero(oy * lift),
        tz: cleanZero(oz * lift),
        rx: cleanZero(ex * hinge),
        ry: cleanZero(ey * hinge),
        rz: cleanZero(ez * hinge),
        phase: lift,
      };
    }

    case "halo-vertical-hoist": {
      // Vertical titanium hoist clears cockpit rim before subtle pitch
      const vertical = easeOutQuart(u);
      const aft = easeInOutCubic(clamp01((u - 0.18) / 0.82));
      const pitch = easeOutCubic(clamp01((u - 0.24) / 0.76));
      return {
        tx: cleanZero(ox * aft),
        ty: cleanZero(oy * vertical),
        tz: cleanZero(oz * aft),
        rx: cleanZero(ex * pitch),
        ry: cleanZero(ey * pitch),
        rz: cleanZero(ez * pitch),
        phase: vertical,
      };
    }

    case "steering-spline-macro": {
      // Pull off splined collar first, then rise to ergonomic showcase angle
      const spline = easeOutQuint(clamp01(u / 0.78));
      const rise = easeInOutCubic(clamp01((u - 0.12) / 0.88));
      return {
        tx: cleanZero(ox * rise),
        ty: cleanZero(oy * rise),
        tz: cleanZero(oz * spline),
        rx: cleanZero(ex * rise),
        ry: cleanZero(ey * rise),
        rz: cleanZero(ez * rise),
        phase: rise,
      };
    }

    case "centerlock-helical-spin": {
      // Authentic helical unthreading: 720° spin leads as nut clears axle threads
      const spin = easeOutCubic(clamp01(u / 0.88));
      const slide = easeInOutCubic(clamp01((u - 0.1) / 0.9));
      return {
        tx: cleanZero(ox * slide),
        ty: cleanZero(oy * slide),
        tz: cleanZero(oz * slide),
        rx: cleanZero(ex * spin),
        ry: cleanZero(ey * spin),
        rz: cleanZero(ez * spin),
        phase: slide,
      };
    }

    case "wheel-corner-axial": {
      // Crisp outward axle pull with slight late settle lift
      const lateral = easeOutQuart(u);
      const settle = easeInOutSine(u);
      return {
        tx: cleanZero(ox * lateral),
        ty: cleanZero(oy * settle),
        tz: cleanZero(oz * lateral),
        rx: cleanZero(ex * settle),
        ry: cleanZero(ey * settle),
        rz: cleanZero(ez * settle),
        phase: lateral,
      };
    }

    case "sidepod-lateral-peel": {
      // Shell rolls gently open slightly ahead of full lateral/vertical peel
      const peel = easeOutQuart(u);
      const roll = easeOutCubic(clamp01(u / 0.82));
      return {
        tx: cleanZero(ox * peel),
        ty: cleanZero(oy * peel),
        tz: cleanZero(oz * peel),
        rx: cleanZero(ex * roll),
        ry: cleanZero(ey * roll),
        rz: cleanZero(ez * roll),
        phase: peel,
      };
    }

    case "venturi-floor-drop": {
      // Heavy-mass ground-effect floor lowers cleanly vertically after plinth retraction
      const drop = easeInOutCubic(u);
      return {
        tx: cleanZero(ox * drop),
        ty: cleanZero(oy * drop),
        tz: cleanZero(oz * drop),
        rx: cleanZero(ex * drop),
        ry: cleanZero(ey * drop),
        rz: cleanZero(ez * drop),
        phase: drop,
      };
    }

    case "powertrain-vertical-extract": {
      // Vertical clearance from monocoque rear bulkhead before sliding aft
      const hoist = easeOutQuart(u);
      const aft = easeOutCubic(clamp01((u - 0.2) / 0.8));
      return {
        tx: cleanZero(ox * aft),
        ty: cleanZero(oy * hoist),
        tz: cleanZero(oz * aft),
        rx: cleanZero(ex * aft),
        ry: cleanZero(ey * aft),
        rz: cleanZero(ez * aft),
        phase: hoist,
      };
    }

    case "cockpit-vertical-stack": {
      const rise = easeOutQuart(u);
      const axial = easeInOutSine(u);
      return {
        tx: cleanZero(ox * axial),
        ty: cleanZero(oy * rise),
        tz: cleanZero(oz * axial),
        rx: cleanZero(ex * axial),
        ry: cleanZero(ey * axial),
        rz: cleanZero(ez * axial),
        phase: rise,
      };
    }

    default:
      return baselineSnap;
  }
}

export function resolveFrontWingDetachSnapshot(
  units: number,
  baselineSnap: EngineeringPartSnapshot,
): EngineeringPartSnapshot {
  const fwShot = signatureByPartId.get("FRONT_WING_ASSEMBLY")!.shot;
  return resolveChoreographedDetachSnapshot(fwShot, units, baselineSnap);
}

// ── Active Shot & Signature Phase Resolution ─────────────────────────────────

function findActiveShotAtUnits(units: number): EngineeringStoryShot | null {
  for (const shot of ENGINEERING_STORY_SHOTS) {
    if (
      units >= shot.startUnits - BOUNDARY_EPS &&
      units < shot.endUnits - BOUNDARY_EPS
    ) {
      return shot;
    }
  }
  return null;
}

function findActiveSignatureAtUnits(
  units: number,
): SignatureShotOrchestration | null {
  for (const sig of SIGNATURE_SHOT_ORCHESTRATIONS) {
    if (
      units >= sig.shot.startUnits - BOUNDARY_EPS &&
      units < sig.shot.endUnits - BOUNDARY_EPS
    ) {
      return sig;
    }
  }
  return null;
}

function resolveSignaturePhaseCue(
  sig: SignatureShotOrchestration,
  units: number,
): EngineeringMotionPhaseCue {
  const clampedUnits = clamp(units, sig.shot.startUnits, sig.shot.endUnits);
  let active = sig.phases[sig.phases.length - 1];
  for (const phase of sig.phases) {
    if (clampedUnits < phase.endUnits - BOUNDARY_EPS) {
      active = phase;
      break;
    }
  }
  const span = Math.max(1e-6, active.endUnits - active.startUnits);
  const phaseProgress = clamp01((clampedUnits - active.startUnits) / span);
  const shotProgress = clamp01(
    (clampedUnits - sig.shot.startUnits) /
      (sig.shot.endUnits - sig.shot.startUnits),
  );
  return {
    partId: sig.partId,
    phaseId: active.id,
    phaseIndex: active.index,
    phaseCount: 6,
    phaseProgress,
    shotProgress,
    label: active.label,
    caption: active.caption,
  };
}

// ── Unified Camera Cue Resolution (C0 Continuous Across 0..1600svh) ──────────

function resolveCameraCue(
  units: number,
  activeSig: SignatureShotOrchestration | null,
  activeShot: EngineeringStoryShot | null,
  baselineRoute: EngineeringCameraRoute,
): EngineeringCameraCue {
  const fwSig = signatureByPartId.get("FRONT_WING_ASSEMBLY")!;

  // Pre-arrival sweep (60.8..80vh): opening-dolly-side -> fw-establish-start (0.000m jump at 80vh)
  if (
    units > OPENING_DOLLY_SIDE_ANCHOR.holdUntilUnits + BOUNDARY_EPS &&
    units < fwSig.shot.startUnits - BOUNDARY_EPS
  ) {
    const span =
      fwSig.shot.startUnits - OPENING_DOLLY_SIDE_ANCHOR.holdUntilUnits;
    return {
      route: {
        from: OPENING_DOLLY_SIDE_ANCHOR,
        to: fwSig.establishStartAnchor!,
        progress: clamp01(
          (units - OPENING_DOLLY_SIDE_ANCHOR.holdUntilUnits) / span,
        ),
      },
      arcLiftMultiplier: 0.42,
      source: "director",
    };
  }

  if (activeSig) {
    const { shot, focusAnchor, phases } = activeSig;
    const establishEnd = phases[0].endUnits;
    const approachEnd = shot.approachEndUnits;
    const detachEnd = shot.detachEndUnits;
    const inspectEnd = phases[3].endUnits;
    const explainEnd = shot.holdEndUnits;

    // Front Wing custom Establish -> Approach wide-to-tight choreography
    if (activeSig.establishStartAnchor && activeSig.establishEndAnchor) {
      if (units < establishEnd - BOUNDARY_EPS) {
        return {
          route: {
            from: activeSig.establishStartAnchor,
            to: activeSig.establishEndAnchor,
            progress: clamp01(
              (units - shot.startUnits) / (establishEnd - shot.startUnits),
            ),
          },
          arcLiftMultiplier: 0.08,
          source: "director",
        };
      }
      if (units < approachEnd - BOUNDARY_EPS) {
        return {
          route: {
            from: activeSig.establishEndAnchor,
            to: focusAnchor,
            progress: clamp01(
              (units - establishEnd) / (approachEnd - establishEnd),
            ),
          },
          arcLiftMultiplier: activeSig.arcLiftApproach,
          source: "director",
        };
      }
    } else if (units < approachEnd - BOUNDARY_EPS) {
      // Other signature shots: use exact continuous baseline incoming route from previous shot's anchor
      // so crossing shot.startUnits has 0.000m discontinuity!
      return {
        route: baselineRoute,
        arcLiftMultiplier: activeSig.arcLiftApproach,
        source: "director",
      };
    }

    // Phase 3 — Detach: counter-tracking glide from exact focusAnchor -> detachEndAnchor
    if (units < detachEnd - BOUNDARY_EPS) {
      return {
        route: {
          from: focusAnchor,
          to: activeSig.detachEndAnchor,
          progress: clamp01((units - approachEnd) / (detachEnd - approachEnd)),
        },
        arcLiftMultiplier: activeSig.arcLiftDetach,
        source: "director",
      };
    }

    // Phase 4 — Inspect: poised sculptural macro pan from detachEndAnchor -> inspectPeakAnchor
    if (units < inspectEnd - BOUNDARY_EPS) {
      return {
        route: {
          from: activeSig.detachEndAnchor,
          to: activeSig.inspectPeakAnchor,
          progress: clamp01((units - detachEnd) / (inspectEnd - detachEnd)),
        },
        arcLiftMultiplier: activeSig.arcLiftInspect,
        source: "director",
      };
    }

    // Phase 5 — Explain: settle smoothly into exact focusAnchor over first 45-50%, then hold steady
    if (units < explainEnd - BOUNDARY_EPS) {
      const settleEnd = activeSig.explainSettleAnchor.atUnits;
      if (units < settleEnd - BOUNDARY_EPS) {
        return {
          route: {
            from: activeSig.inspectPeakAnchor,
            to: activeSig.explainSettleAnchor,
            progress: clamp01((units - inspectEnd) / (settleEnd - inspectEnd)),
          },
          arcLiftMultiplier: activeSig.arcLiftExplain,
          source: "director",
        };
      }
      return {
        route: {
          from: activeSig.explainSettleAnchor,
          to: activeSig.explainSettleAnchor,
          progress: 0,
        },
        arcLiftMultiplier: 0,
        source: "director",
      };
    }

    // Phase 6 — Transition (holdEndUnits..endUnits): exact baseline route from focusAnchor -> next shot!
    return {
      route: baselineRoute,
      arcLiftMultiplier: activeSig.arcLiftTransition,
      source: "director",
    };
  }

  // Secondary shots: keep exact baseline camera anchors with mechanical-group tuned arc lifts
  // so wheel-corner & cockpit layer transitions glide tightly without excessive overhead arcing
  if (activeShot) {
    const isSameCornerTransition =
      activeShot.chapterId === "corners" &&
      baselineRoute.from.subjectPartId &&
      baselineRoute.to.subjectPartId &&
      baselineRoute.from.subjectPartId.slice(0, 2) ===
        baselineRoute.to.subjectPartId.slice(0, 2);
    const arcLiftMultiplier = isSameCornerTransition
      ? 0.24
      : activeShot.chapterId === "cockpit"
        ? 0.34
        : activeShot.chapterId === "bodywork"
          ? 0.44
          : DEFAULT_CAMERA_ARC_LIFT;
    return {
      route: baselineRoute,
      arcLiftMultiplier,
      source: "timeline",
    };
  }

  return {
    route: baselineRoute,
    arcLiftMultiplier: DEFAULT_CAMERA_ARC_LIFT,
    source: "timeline",
  };
}

// ── Deterministic Studio Lighting Across All 8 Chapters (0..100%) ────────────

const CHAPTER_LIGHT_BLEND_VH = 10;

function resolveChapterBaseLight(
  chapterId: EngineeringStoryChapterId,
  partId: string | null,
): EngineeringLightRigState {
  return resolveTargetLightPreset(chapterId, partId);
}

function resolveDeterministicLightingCue(
  units: number,
  activeSig: SignatureShotOrchestration | null,
  phaseCue: EngineeringMotionPhaseCue | null,
  story: EngineeringStoryEvaluation,
): EngineeringLightRigState {
  // 1. Signature shots: smooth 6-phase calibrated lighting envelope
  if (activeSig && phaseCue) {
    const t = smoothstep(phaseCue.phaseProgress);
    const L = activeSig.lights;
    switch (phaseCue.phaseId) {
      case "establish":
        return interpolateLightRigStates(L.entry, L.establish, t);
      case "approach":
        return interpolateLightRigStates(L.establish, L.approach, t);
      case "detach":
        return interpolateLightRigStates(L.approach, L.detach, t);
      case "inspect":
        return interpolateLightRigStates(L.detach, L.inspect, t);
      case "explain":
        return interpolateLightRigStates(L.inspect, L.explain, t);
      case "transition":
        return interpolateLightRigStates(L.explain, L.exit, t);
    }
  }

  // 2. Reassembly (1480..1600vh): deterministic return matrix -> reassembly -> origin
  const reassemblyRange = ENGINEERING_STORY_CHAPTERS[7].range;
  const reassemblyStartUnits = reassemblyRange[0] * ENGINEERING_STORY_SCROLL_VH;
  if (units >= reassemblyStartUnits - BOUNDARY_EPS) {
    const span = ENGINEERING_STORY_SCROLL_VH - reassemblyStartUnits;
    const u = clamp01((units - reassemblyStartUnits) / span);
    if (u < 0.25) {
      return interpolateLightRigStates(
        ENGINEERING_CHAPTER_LIGHT_PRESETS.matrix,
        ENGINEERING_CHAPTER_LIGHT_PRESETS.reassembly,
        smoothstep(u / 0.25),
      );
    }
    return interpolateLightRigStates(
      ENGINEERING_CHAPTER_LIGHT_PRESETS.reassembly,
      ENGINEERING_CHAPTER_LIGHT_PRESETS.origin,
      smoothstep((u - 0.25) / 0.75),
    );
  }

  // 3. Cockpit interior smooth lighting lift for Carbon Seat & Survival Liner
  const activePartId = story.storyBeat.partId;
  if (
    story.chapter.id === "cockpit" &&
    (activePartId === "COCKPIT_SEAT_CARBON" ||
      activePartId === "COCKPIT_SURVIVAL_LINER")
  ) {
    const seatShot = getEngineeringStoryShot("COCKPIT_SEAT_CARBON")!;
    const linerShot = getEngineeringStoryShot("COCKPIT_SURVIVAL_LINER")!;
    const fadeIn = smoothstep(clamp01((units - seatShot.approachEndUnits) / 6));
    const fadeOut =
      units > linerShot.holdEndUnits
        ? 1 - smoothstep(clamp01((units - linerShot.holdEndUnits) / 6.75))
        : 1;
    return interpolateLightRigStates(
      ENGINEERING_CHAPTER_LIGHT_PRESETS.cockpit,
      COCKPIT_INTERIOR_LIGHT_PRESET,
      Math.min(fadeIn, fadeOut),
    );
  }

  // 4. Secondary shots: smooth deterministic chapter-boundary crossfade (zero step jumps)
  const chapter = story.chapter;
  const chapterStartUnits = chapter.range[0] * ENGINEERING_STORY_SCROLL_VH;
  const targetPreset = resolveChapterBaseLight(chapter.id, activePartId);
  if (story.chapterIndex > 0) {
    const elapsedInChapter = units - chapterStartUnits;
    if (elapsedInChapter >= 0 && elapsedInChapter < CHAPTER_LIGHT_BLEND_VH) {
      const prevChapter = ENGINEERING_STORY_CHAPTERS[story.chapterIndex - 1];
      const prevPreset = ENGINEERING_CHAPTER_LIGHT_PRESETS[prevChapter.id];
      return interpolateLightRigStates(
        prevPreset,
        targetPreset,
        smoothstep(elapsedInChapter / CHAPTER_LIGHT_BLEND_VH),
      );
    }
  }

  return targetPreset;
}

// ── Synchronized Annotation & Editorial Cues ─────────────────────────────────

function resolveAnnotationCue(
  phaseCue: EngineeringMotionPhaseCue | null,
  activeShot: EngineeringStoryShot | null,
  units: number,
  story: EngineeringStoryEvaluation,
  parts: Readonly<Record<string, EngineeringPartSnapshot>>,
  selectedPartId: string | null,
): EngineeringAnnotationCue {
  if (selectedPartId) {
    return {
      visible: true,
      partId: selectedPartId,
      opacity: 1,
      leaderScale: 1,
      motionPhaseId: phaseCue?.phaseId ?? null,
      phaseLabel: phaseCue?.label ?? null,
      phase: parts[selectedPartId]?.phase ?? 0,
    };
  }

  if (phaseCue) {
    const partPhase = parts[phaseCue.partId]?.phase ?? 0;
    switch (phaseCue.phaseId) {
      case "establish":
      case "approach":
        return {
          visible: false,
          partId: null,
          opacity: 0,
          leaderScale: 0,
          motionPhaseId: phaseCue.phaseId,
          phaseLabel: phaseCue.label,
          phase: partPhase,
        };
      case "detach": {
        const reveal = easeOutCubic(phaseCue.phaseProgress);
        return {
          visible: reveal > 0.04,
          partId: phaseCue.partId,
          opacity: 0.82 * reveal,
          leaderScale: 0.35 + 0.65 * reveal,
          motionPhaseId: "detach",
          phaseLabel: phaseCue.label,
          phase: partPhase,
        };
      }
      case "inspect":
        return {
          visible: true,
          partId: phaseCue.partId,
          opacity: 0.56,
          leaderScale: 0.72,
          motionPhaseId: "inspect",
          phaseLabel: phaseCue.label,
          phase: partPhase,
        };
      case "explain": {
        const ramp = easeOutCubic(clamp01(phaseCue.phaseProgress / 0.32));
        return {
          visible: true,
          partId: phaseCue.partId,
          opacity: 0.56 + 0.44 * ramp,
          leaderScale: 0.72 + 0.28 * ramp,
          motionPhaseId: "explain",
          phaseLabel: phaseCue.label,
          phase: partPhase,
        };
      }
      case "transition": {
        const fade = 1 - smoothstep(clamp01(phaseCue.phaseProgress / 0.85));
        return {
          visible: fade > 0.02,
          partId: fade > 0.02 ? phaseCue.partId : null,
          opacity: fade,
          leaderScale: 0.45 + 0.55 * fade,
          motionPhaseId: "transition",
          phaseLabel: phaseCue.label,
          phase: partPhase,
        };
      }
    }
  }

  // Secondary shots: smooth fade-in on detach & crisp hold during explain, fade-out on transition
  const baselinePartId =
    !story.showChapterTitle &&
    story.chapter.id !== "origin" &&
    story.chapter.id !== "reassembly"
      ? story.storyBeat.partId
      : null;

  if (baselinePartId && activeShot && activeShot.partId === baselinePartId) {
    const partPhase = parts[baselinePartId]?.phase ?? 0;
    if (units < activeShot.approachEndUnits) {
      return {
        visible: false,
        partId: null,
        opacity: 0,
        leaderScale: 0,
        motionPhaseId: null,
        phaseLabel: null,
        phase: partPhase,
      };
    }
    if (units > activeShot.holdEndUnits) {
      const outU = clamp01(
        (units - activeShot.holdEndUnits) /
          Math.max(1e-6, activeShot.endUnits - activeShot.holdEndUnits),
      );
      const fade = 1 - smoothstep(clamp01(outU / 0.85));
      return {
        visible: fade > 0.02,
        partId: fade > 0.02 ? baselinePartId : null,
        opacity: fade,
        leaderScale: 0.5 + 0.5 * fade,
        motionPhaseId: null,
        phaseLabel: null,
        phase: partPhase,
      };
    }
    const inU = clamp01(
      (units - activeShot.approachEndUnits) /
        Math.max(1e-6, activeShot.detachEndUnits - activeShot.approachEndUnits),
    );
    const ramp = easeOutCubic(inU);
    return {
      visible: true,
      partId: baselinePartId,
      opacity: 0.35 + 0.65 * ramp,
      leaderScale: 0.55 + 0.45 * ramp,
      motionPhaseId: null,
      phaseLabel: null,
      phase: partPhase,
    };
  }

  return {
    visible: Boolean(baselinePartId),
    partId: baselinePartId,
    opacity: baselinePartId ? 1 : 0,
    leaderScale: baselinePartId ? 1 : 0,
    motionPhaseId: null,
    phaseLabel: null,
    phase: baselinePartId ? (parts[baselinePartId]?.phase ?? 0) : 0,
  };
}

function resolveEditorialCue(
  activeSig: SignatureShotOrchestration | null,
  phaseCue: EngineeringMotionPhaseCue | null,
  story: EngineeringStoryEvaluation,
): EngineeringEditorialCue {
  if (!activeSig || !phaseCue) {
    return {
      showChapterTitle: story.showChapterTitle,
      partId: story.storyBeat.partId,
      componentIndex: story.storyBeat.componentIndex,
      title: story.storyBeat.title,
      location: story.storyBeat.location,
      caption: story.storyBeat.caption,
      phaseId: null,
      phaseIndex: null,
      phaseCount: null,
      phaseLabel: null,
    };
  }

  const showChapterTitle =
    activeSig.showChapterTitleInEstablish && phaseCue.phaseId === "establish";
  return {
    showChapterTitle,
    partId: activeSig.partId,
    componentIndex: activeSig.shot.index,
    title: showChapterTitle ? story.chapter.title : activeSig.shot.title,
    location: activeSig.shot.location,
    caption: phaseCue.caption,
    phaseId: phaseCue.phaseId,
    phaseIndex: phaseCue.phaseIndex,
    phaseCount: phaseCue.phaseCount,
    phaseLabel: phaseCue.label,
  };
}

/**
 * Pure, deterministic, side-effect-free Motion Director evaluation across all
 * 8 chapters and 47 assemblies (`1600svh`).
 * Maps `(effectiveProgress, controlState)` to unified camera, part-transform,
 * lighting, annotation, and editorial cues without allocating tweens or mutating state.
 */
export function evaluateEngineeringMotionDirector(
  input: EngineeringMotionDirectorInput,
): EngineeringMotionCueSheet {
  const progress = clamp01(input.effectiveProgress);
  const units = progress * ENGINEERING_STORY_SCROLL_VH;
  const story =
    input.precomputedStory &&
    Math.abs(input.precomputedStory.progress - progress) < 1e-9
      ? input.precomputedStory
      : evaluateEngineeringStoryTimeline(progress);

  const activeShot = findActiveShotAtUnits(units);
  const activeSig = findActiveSignatureAtUnits(units);
  const activePhaseCue = activeSig
    ? resolveSignaturePhaseCue(activeSig, units)
    : null;

  let parts: Readonly<Record<string, EngineeringPartSnapshot>> = story.parts;
  if (
    activeShot &&
    activeShot.partId !== "MONOCOQUE_CHASSIS" &&
    units > activeShot.approachEndUnits + BOUNDARY_EPS &&
    units < activeShot.detachEndUnits - BOUNDARY_EPS &&
    story.parts[activeShot.partId]
  ) {
    const choreographed = resolveChoreographedDetachSnapshot(
      activeShot,
      units,
      story.parts[activeShot.partId],
    );
    if (choreographed !== story.parts[activeShot.partId]) {
      parts = {
        ...story.parts,
        [activeShot.partId]: choreographed,
      };
    }
  }

  const cameraCue = resolveCameraCue(
    units,
    activeSig,
    activeShot,
    story.cameraRoute,
  );
  const lightingCue = resolveDeterministicLightingCue(
    units,
    activeSig,
    activePhaseCue,
    story,
  );
  const annotationCue = resolveAnnotationCue(
    activePhaseCue,
    activeShot,
    units,
    story,
    parts,
    input.selectedPartId ?? null,
  );
  const editorialCue = resolveEditorialCue(activeSig, activePhaseCue, story);

  return {
    progress,
    units,
    story,
    activePhaseCue,
    cameraCue,
    lightingCue,
    annotationCue,
    editorialCue,
    parts,
  };
}

/**
 * Single authoritative part transform & visibility resolver shared by
 * timeline, orbit, isolated, and handoff modes.
 */
export function resolveDirectorPartTransform(params: {
  readonly partId: string;
  readonly cueSheet: EngineeringMotionCueSheet;
  readonly explodeOffset: readonly [number, number, number];
  readonly explodeEuler: readonly [number, number, number];
  readonly internalSystem: boolean;
  readonly controlMode: EngineeringControlMode;
  readonly isolatedPartId: string | null;
  readonly transitionPartId: string | null;
  readonly isolationBlend: number;
  readonly xray: boolean;
}): EngineeringResolvedPartTransform | null {
  const {
    partId,
    cueSheet,
    explodeOffset,
    explodeEuler,
    internalSystem,
    controlMode,
    isolatedPartId,
    transitionPartId,
    isolationBlend,
    xray,
  } = params;
  const snap = cueSheet.parts[partId];
  if (!snap) return null;

  const isIsolated = controlMode === "isolated" && isolatedPartId === partId;
  const isTransitioning =
    transitionPartId === partId && (isIsolated || isolationBlend > 0.001);

  if (controlMode === "isolated" && !isIsolated) {
    return {
      visible: false,
      tx: 0,
      ty: 0,
      tz: 0,
      rx: 0,
      ry: 0,
      rz: 0,
      phase: snap.phase,
    };
  }

  const visible = internalSystem
    ? xray ||
      snap.phase > 0.015 ||
      cueSheet.progress > 0.48 ||
      cueSheet.story.storyBeat.partId === partId ||
      isTransitioning
    : true;

  const coupledSnap = resolveCoupledPartOffset(
    partId,
    snap,
    cueSheet.parts,
    explodeOffset,
    explodeEuler,
  );
  const pose = resolveEngineeringInspectionPose(
    coupledSnap,
    explodeOffset,
    explodeEuler,
    isTransitioning,
    isolationBlend,
  );

  return {
    visible,
    tx: pose.tx,
    ty: pose.ty,
    tz: pose.tz,
    rx: pose.rx,
    ry: pose.ry,
    rz: pose.rz,
    phase: snap.phase,
  };
}
