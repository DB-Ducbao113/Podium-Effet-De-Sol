import { FP04RB_PART_MANIFEST, type WheelCorner } from "./fp04rbLoader";

export type MaintenanceStep =
  | "IDLE"
  | "APPROACH_JACKS"
  | "LIFT_CAR"
  | "LOOSEN_WHEEL_NUT"
  | "INSPECTION_DETACHED"
  | "INSPECTION_MOUNTED"
  | "REMOUNT_TORQUE"
  | "LOWER_CAR";

export type SequenceStatus = "idle" | "running" | "paused" | "fault";

export interface MaintenanceTransforms {
  chassisLiftMeters: number;
  frontJackExtendProgress: number;
  rearJackExtendProgress: number;
  wheelOutwardOffsetMeters: number;
  wheelNutOffsetMeters: number;
  wheelNutSpinRad: number;
  crewActionProgress: number;
}

export interface MaintenanceState {
  status: SequenceStatus;
  step: MaintenanceStep;
  stepElapsedMs: number;
  stepProgress: number;
  corner: WheelCorner;
  wheelRemovalCapable: boolean;
  cycleCount: number;
  faultReason: string | null;
}

export const MAINTENANCE_DURATIONS_MS: Record<
  Exclude<MaintenanceStep, "IDLE">,
  number
> = {
  APPROACH_JACKS: 1550,
  LIFT_CAR: 1050,
  LOOSEN_WHEEL_NUT: 1650,
  INSPECTION_DETACHED: 1950,
  INSPECTION_MOUNTED: 1600,
  REMOUNT_TORQUE: 1650,
  LOWER_CAR: 1350,
};

export const CHASSIS_MAX_LIFT_METERS = 0.085;
export const NUT_EXTRACT_EXTRA_METERS = 0.09;

export function createInitialMaintenanceState(
  wheelRemovalCapable = Boolean(
    FP04RB_PART_MANIFEST.capabilities?.wheelRemoval?.supported,
  ),
): MaintenanceState {
  return {
    status: "idle",
    step: "IDLE",
    stepElapsedMs: 0,
    stepProgress: 0,
    corner: "FL",
    wheelRemovalCapable,
    cycleCount: 0,
    faultReason: null,
  };
}

export function startMaintenance(
  state: MaintenanceState,
  corner: WheelCorner = state.corner,
): MaintenanceState {
  return {
    ...state,
    status: "running",
    step: "APPROACH_JACKS",
    stepElapsedMs: 0,
    stepProgress: 0,
    corner,
    faultReason: null,
  };
}

export function pauseMaintenance(state: MaintenanceState): MaintenanceState {
  if (state.status !== "running" || state.step === "IDLE") return state;
  return { ...state, status: "paused" };
}

export function resumeMaintenance(state: MaintenanceState): MaintenanceState {
  if (state.status !== "paused" || state.step === "IDLE") return state;
  return { ...state, status: "running" };
}

export function resetMaintenance(state: MaintenanceState): MaintenanceState {
  return {
    ...state,
    status: "idle",
    step: "IDLE",
    stepElapsedMs: 0,
    stepProgress: 0,
    faultReason: null,
  };
}

export function faultMaintenance(
  state: MaintenanceState,
  reason: string,
): MaintenanceState {
  return {
    ...state,
    status: "fault",
    step: "IDLE",
    stepElapsedMs: 0,
    stepProgress: 0,
    faultReason: reason,
  };
}

export function selectMaintenanceCorner(
  state: MaintenanceState,
  corner: WheelCorner,
): MaintenanceState {
  if (state.step !== "IDLE") {
    return {
      ...resetMaintenance(state),
      corner,
    };
  }
  return { ...state, corner };
}

function nextStepAfter(
  current: Exclude<MaintenanceStep, "IDLE">,
  wheelRemovalCapable: boolean,
): MaintenanceStep {
  switch (current) {
    case "APPROACH_JACKS":
      return "LIFT_CAR";
    case "LIFT_CAR":
      return "LOOSEN_WHEEL_NUT";
    case "LOOSEN_WHEEL_NUT":
      return wheelRemovalCapable ? "INSPECTION_DETACHED" : "INSPECTION_MOUNTED";
    case "INSPECTION_DETACHED":
    case "INSPECTION_MOUNTED":
      return "REMOUNT_TORQUE";
    case "REMOUNT_TORQUE":
      return "LOWER_CAR";
    case "LOWER_CAR":
      return "IDLE";
  }
}

export function advanceMaintenance(
  state: MaintenanceState,
  deltaMs: number,
): MaintenanceState {
  if (state.status !== "running" || state.step === "IDLE") return state;
  const clampedDelta = Math.max(0, Math.min(deltaMs, 250));
  let step: Exclude<MaintenanceStep, "IDLE"> = state.step;
  let elapsed = state.stepElapsedMs + clampedDelta;
  const cycles = state.cycleCount;

  for (;;) {
    const duration = MAINTENANCE_DURATIONS_MS[step];
    if (elapsed < duration) {
      return {
        ...state,
        step,
        stepElapsedMs: elapsed,
        stepProgress: Math.min(1, elapsed / duration),
        cycleCount: cycles,
      };
    }
    elapsed -= duration;
    const next = nextStepAfter(step, state.wheelRemovalCapable);
    if (next === "IDLE") {
      return {
        ...state,
        status: "idle",
        step: "IDLE",
        stepElapsedMs: 0,
        stepProgress: 0,
        cycleCount: cycles + 1,
      };
    }
    step = next;
  }
}

function smoothStep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

const CORNER_CLEARANCES = FP04RB_PART_MANIFEST.capabilities.wheelRemoval
  .cornerClearances as Record<WheelCorner, { extractDistanceMeters: number }>;

export function computeMaintenanceTransforms(
  state: MaintenanceState,
): MaintenanceTransforms {
  const p = smoothStep(state.stepProgress);
  const maxExtract =
    CORNER_CLEARANCES[state.corner]?.extractDistanceMeters ??
    (state.corner.startsWith("F") ? 0.42 : 0.52);

  switch (state.step) {
    case "IDLE":
      return {
        chassisLiftMeters: 0,
        frontJackExtendProgress: 0,
        rearJackExtendProgress: 0,
        wheelOutwardOffsetMeters: 0,
        wheelNutOffsetMeters: 0,
        wheelNutSpinRad: 0,
        crewActionProgress: 0,
      };
    case "APPROACH_JACKS":
      return {
        chassisLiftMeters: 0,
        frontJackExtendProgress: p,
        rearJackExtendProgress: p,
        wheelOutwardOffsetMeters: 0,
        wheelNutOffsetMeters: 0,
        wheelNutSpinRad: 0,
        crewActionProgress: p * 0.4,
      };
    case "LIFT_CAR":
      return {
        chassisLiftMeters: CHASSIS_MAX_LIFT_METERS * p,
        frontJackExtendProgress: 1,
        rearJackExtendProgress: 1,
        wheelOutwardOffsetMeters: 0,
        wheelNutOffsetMeters: 0,
        wheelNutSpinRad: 0,
        crewActionProgress: 0.4 + p * 0.3,
      };
    case "LOOSEN_WHEEL_NUT": {
      // 0.00..0.42: gunner crouched loosening the center-lock nut (wheel stays seated on hub).
      // 0.42..0.72: gunner steps safely clear of the wheel extraction corridor.
      // 0.72..1.00: wheel slides cleanly outward into clear space (zero overlap with mechanic).
      const nutPhase = smoothStep(state.stepProgress / 0.42);
      const extractPhase = smoothStep((state.stepProgress - 0.72) / 0.28);
      return {
        chassisLiftMeters: CHASSIS_MAX_LIFT_METERS,
        frontJackExtendProgress: 1,
        rearJackExtendProgress: 1,
        wheelOutwardOffsetMeters: state.wheelRemovalCapable
          ? maxExtract * extractPhase
          : 0,
        wheelNutOffsetMeters: NUT_EXTRACT_EXTRA_METERS * nutPhase,
        wheelNutSpinRad: nutPhase * Math.PI * 6,
        crewActionProgress: 0.7 + nutPhase * 0.3,
      };
    }
    case "INSPECTION_DETACHED":
      return {
        chassisLiftMeters: CHASSIS_MAX_LIFT_METERS,
        frontJackExtendProgress: 1,
        rearJackExtendProgress: 1,
        wheelOutwardOffsetMeters: maxExtract,
        wheelNutOffsetMeters: NUT_EXTRACT_EXTRA_METERS,
        wheelNutSpinRad: Math.PI * 6,
        crewActionProgress: 1,
      };
    case "INSPECTION_MOUNTED":
      return {
        chassisLiftMeters: CHASSIS_MAX_LIFT_METERS,
        frontJackExtendProgress: 1,
        rearJackExtendProgress: 1,
        wheelOutwardOffsetMeters: 0,
        wheelNutOffsetMeters: NUT_EXTRACT_EXTRA_METERS,
        wheelNutSpinRad: Math.PI * 6,
        crewActionProgress: 1,
      };
    case "REMOUNT_TORQUE": {
      // 0.00..0.35: wheel slides back onto hub FIRST while gunner remains clear to the side.
      // 0.35..1.00: gunner steps back in and torques the center-lock nut tight.
      const wheelRemaining = 1 - smoothStep(state.stepProgress / 0.35);
      const torquePhase = smoothStep((state.stepProgress - 0.55) / 0.45);
      const nutRemaining = 1 - torquePhase;
      return {
        chassisLiftMeters: CHASSIS_MAX_LIFT_METERS,
        frontJackExtendProgress: 1,
        rearJackExtendProgress: 1,
        wheelOutwardOffsetMeters: state.wheelRemovalCapable
          ? maxExtract * wheelRemaining
          : 0,
        wheelNutOffsetMeters: NUT_EXTRACT_EXTRA_METERS * nutRemaining,
        wheelNutSpinRad: nutRemaining * Math.PI * 6,
        crewActionProgress: 0.7 + nutRemaining * 0.3,
      };
    }
    case "LOWER_CAR": {
      const inv = 1 - p;
      return {
        chassisLiftMeters: CHASSIS_MAX_LIFT_METERS * inv,
        frontJackExtendProgress: inv,
        rearJackExtendProgress: inv,
        wheelOutwardOffsetMeters: 0,
        wheelNutOffsetMeters: 0,
        wheelNutSpinRad: 0,
        crewActionProgress: inv * 0.4,
      };
    }
  }
}

export const MAINTENANCE_STEP_LABELS: Record<
  MaintenanceStep,
  { vi: string; en: string }
> = {
  IDLE: { vi: "Sẵn sàng bảo dưỡng", en: "Standby Ready" },
  APPROACH_JACKS: {
    vi: "Đưa kích trước & sau vào vị trí",
    en: "Engaging Front & Rear Jacks",
  },
  LIFT_CAR: {
    vi: "Nâng khung xe lên khỏi sàn",
    en: "Lifting Chassis Off Floor",
  },
  LOOSEN_WHEEL_NUT: {
    vi: "Mở đai ốc trung tâm bằng súng hơi",
    en: "Loosening Center-Lock Wheel Nut",
  },
  INSPECTION_DETACHED: {
    vi: "Tháo bánh kiểm tra cụm phanh & trục",
    en: "Wheel Detached — Brake & Hub Check",
  },
  INSPECTION_MOUNTED: {
    vi: "Kiểm tra mâm & kẹp phanh tại chỗ",
    en: "On-Hub Rim & Brake Check",
  },
  REMOUNT_TORQUE: {
    vi: "Lắp bánh & siết lực đúng tiêu chuẩn",
    en: "Remounting & Torquing Center Nut",
  },
  LOWER_CAR: {
    vi: "Hạ xe và rút kích về vị trí chờ",
    en: "Lowering Chassis & Stowing Jacks",
  },
};
