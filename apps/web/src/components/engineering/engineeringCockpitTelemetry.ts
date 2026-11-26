import type { LocalizedText } from "./engineeringDisassemblyData";

export type EngineeringCockpitControlId =
  "DIFF" | "BBAL" | "STRAT" | "DRS" | "RADIO" | "PIT";

export type EngineeringShiftLedBand = "green" | "red" | "blue";

export interface EngineeringShiftLedSpec {
  readonly index: number;
  readonly band: EngineeringShiftLedBand;
  readonly active: boolean;
}

export interface EngineeringCockpitControlSpec {
  readonly id: EngineeringCockpitControlId;
  readonly shortCode: string;
  readonly partId:
    | "STEERING_ENCODERS_LEDS"
    | "STEERING_WHEEL_LCD"
    | "STEERING_SHIFT_PADDLES"
    | "STEERING_COLUMN_QR";
  readonly label: LocalizedText;
  readonly dialSetting: LocalizedText;
  readonly summary: LocalizedText;
}

export interface EngineeringCockpitTelemetryState {
  readonly activeControlId: EngineeringCockpitControlId;
  readonly gear: number;
  readonly drsActive: boolean;
  readonly pitLimiter: boolean;
}

export type EngineeringCockpitTelemetryAction =
  | {
      readonly type: "select-control";
      readonly controlId: EngineeringCockpitControlId;
    }
  | { readonly type: "step-gear"; readonly delta: -1 | 1 | number }
  | { readonly type: "toggle-drs" }
  | { readonly type: "toggle-pit" }
  | { readonly type: "reset" };

export interface EngineeringCockpitTelemetryEvaluation {
  readonly gear: number;
  readonly gearLabel: string;
  readonly rpm: number;
  readonly speedKmh: number;
  readonly activeLedCount: number;
  readonly shiftLeds: readonly EngineeringShiftLedSpec[];
  readonly drsEligible: boolean;
  readonly drsStatus: "ACTIVE" | "READY" | "LOCKED";
  readonly pitLimiter: boolean;
  readonly ersMode: LocalizedText;
  readonly activeControl: EngineeringCockpitControlSpec;
}

const NOMINAL_FP04RB_GLB_BYTES = 9_966_120;

const COCKPIT_PART_IDS = new Set<string>([
  "COCKPIT_HALO",
  "STEERING_ENCODERS_LEDS",
  "STEERING_WHEEL_LCD",
  "STEERING_SHIFT_PADDLES",
  "STEERING_COLUMN_QR",
  "COCKPIT_HARNESS_BELTS",
  "COCKPIT_SEAT_CARBON",
  "COCKPIT_SURVIVAL_LINER",
  "ROLL_HOOP_TCAM",
]);

export const ENGINEERING_COCKPIT_CONTROLS: readonly EngineeringCockpitControlSpec[] =
  [
    {
      id: "DIFF",
      shortCode: "DIFF",
      partId: "STEERING_ENCODERS_LEDS",
      label: {
        en: "Differential Entry & Mid Rotary",
        vi: "Vi Sai Vào & Giữa Cua (DIFF)",
      },
      dialSetting: {
        en: "ENTRY 6 · MID 4",
        vi: "VÀO CUA 6 · GIỮA CUA 4",
      },
      summary: {
        en: "Thumb rotary adjusts rear axle locking torque on corner entry to stabilize braking and apex rotation.",
        vi: "Con lăn ngón cái chỉnh độ khóa vi sai cầu sau khi phanh vào cua, giúp đuôi xe ổn định và xoay mũi chính xác.",
      },
    },
    {
      id: "BBAL",
      shortCode: "BBAL",
      partId: "STEERING_ENCODERS_LEDS",
      label: {
        en: "Brake Balance & Migration (BBAL)",
        vi: "Cân Bằng Phanh Trước/Sau (BBAL)",
      },
      dialSetting: {
        en: "56.5% FRONT ·BMIG 3",
        vi: "56.5% TRƯỚC · BMIG 3",
      },
      summary: {
        en: "Shifts hydraulic vs. MGU-K rear braking bias dynamically as downforce bleeds off through the braking zone.",
        vi: "Phân bổ lực phanh thủy lực cầu trước và phanh tái sinh MGU-K cầu sau theo tốc độ giảm lực ép khí động.",
      },
    },
    {
      id: "STRAT",
      shortCode: "STRAT",
      partId: "STEERING_WHEEL_LCD",
      label: {
        en: "Hybrid ERS Deployment Strategy",
        vi: "Chế Độ Năng Lượng Hybrid (STRAT)",
      },
      dialSetting: {
        en: "STRAT 3 · DEPLOY 120 kW",
        vi: "STRAT 3 · XẢ ĐIỆN 120 kW",
      },
      summary: {
        en: "Central rotary selects MGU-K electrical deployment and energy harvest schedules shown on the OLED display.",
        vi: "Núm xoay trung tâm chọn bản đồ xả/thu hồi điện năng MGU-K 120 kW hiển thị trực tiếp trên màn hình OLED.",
      },
    },
    {
      id: "DRS",
      shortCode: "DRS",
      partId: "STEERING_SHIFT_PADDLES",
      label: {
        en: "Drag Reduction System Trigger",
        vi: "Kích Hoạt Mở Cánh Sau (DRS)",
      },
      dialSetting: {
        en: "FLAP +50 MM · STRAIGHT",
        vi: "MỞ CÁNH +50 MM · ĐOẠN THẲNG",
      },
      summary: {
        en: "Opens the upper rear-wing flap in designated zones (Gears 4–8) to shed aerodynamic drag on straights.",
        vi: "Mở cánh tà trên của cánh gió sau trong vùng cho phép (Số 4–8) để giảm lực cản gió và tăng tốc độ tối đa.",
      },
    },
    {
      id: "RADIO",
      shortCode: "RADIO",
      partId: "STEERING_WHEEL_LCD",
      label: {
        en: "Pit Wall Radio & Telemetry Ack",
        vi: "Liên Lạc Kỹ Sư & Xác Nhận (RADIO)",
      },
      dialSetting: {
        en: "CH 01 · FULL DUPLEX",
        vi: "KÊNH 01 · ĐÀM THOẠI HAI CHIỀU",
      },
      summary: {
        en: "Push-to-talk thumb switch connects the driver to the race engineer while flagging telemetry markers on the OLED.",
        vi: "Phím bấm ngón cái kết nối đàm thoại với kỹ sư đường đua và đánh dấu mốc dữ liệu lên màn hình OLED.",
      },
    },
    {
      id: "PIT",
      shortCode: "PIT",
      partId: "STEERING_COLUMN_QR",
      label: {
        en: "Pit Lane Speed Limiter (80 km/h)",
        vi: "Giới Hạn Tốc Độ Đường Pit (80 km/h)",
      },
      dialSetting: {
        en: "LOCKED 80 KM/H · DRS OFF",
        vi: "KHÓA 80 KM/H · TẮT DRS",
      },
      summary: {
        en: "Caps powertrain output strictly at 80 km/h in the pit lane and automatically disengages the rear DRS actuator.",
        vi: "Khóa cứng tốc độ xe ở mức 80 km/h khi vào đường pit và tự động đóng hoàn toàn cơ cấu cánh sau DRS.",
      },
    },
  ];

const controlById = new Map<
  EngineeringCockpitControlId,
  EngineeringCockpitControlSpec
>(ENGINEERING_COCKPIT_CONTROLS.map((c) => [c.id, c]));

export const INITIAL_COCKPIT_TELEMETRY_STATE: EngineeringCockpitTelemetryState =
  {
    activeControlId: "DIFF",
    gear: 4,
    drsActive: false,
    pitLimiter: false,
  };

const GEAR_TELEMETRY_TABLE: Readonly<
  Record<
    number,
    {
      readonly rpm: number;
      readonly speedKmh: number;
      readonly leds: number;
    }
  >
> = {
  1: { rpm: 8400, speedKmh: 112, leds: 3 },
  2: { rpm: 9250, speedKmh: 148, leds: 5 },
  3: { rpm: 9950, speedKmh: 184, leds: 8 },
  4: { rpm: 10550, speedKmh: 218, leds: 10 },
  5: { rpm: 11100, speedKmh: 252, leds: 12 },
  6: { rpm: 11600, speedKmh: 282, leds: 13 },
  7: { rpm: 12050, speedKmh: 308, leds: 14 },
  8: { rpm: 12450, speedKmh: 326, leds: 15 },
};

function clampGear(gear: number): number {
  if (!Number.isFinite(gear)) return 4;
  return Math.max(1, Math.min(8, Math.round(gear)));
}

export function engineeringCockpitTelemetryReducer(
  state: EngineeringCockpitTelemetryState,
  action: EngineeringCockpitTelemetryAction,
): EngineeringCockpitTelemetryState {
  switch (action.type) {
    case "select-control": {
      if (action.controlId === "PIT") {
        return {
          ...state,
          activeControlId: "PIT",
          pitLimiter: true,
          drsActive: false,
        };
      }
      if (action.controlId === "DRS") {
        const nextGear = state.gear < 4 ? 7 : state.gear;
        return {
          ...state,
          activeControlId: "DRS",
          pitLimiter: false,
          gear: nextGear,
          drsActive: true,
        };
      }
      return {
        ...state,
        activeControlId: action.controlId,
        pitLimiter: false,
      };
    }
    case "step-gear": {
      const nextGear = clampGear(state.gear + action.delta);
      const drsEligible = nextGear >= 4;
      return {
        ...state,
        pitLimiter: false,
        gear: nextGear,
        drsActive: drsEligible ? state.drsActive : false,
      };
    }
    case "toggle-drs": {
      if (state.pitLimiter) {
        return {
          ...state,
          pitLimiter: false,
          gear: Math.max(4, state.gear),
          drsActive: true,
          activeControlId: "DRS",
        };
      }
      const nextGear = !state.drsActive && state.gear < 4 ? 6 : state.gear;
      return {
        ...state,
        gear: nextGear,
        drsActive: !state.drsActive,
      };
    }
    case "toggle-pit": {
      const nextPit = !state.pitLimiter;
      return {
        ...state,
        pitLimiter: nextPit,
        drsActive: nextPit ? false : state.drsActive,
        activeControlId: nextPit ? "PIT" : state.activeControlId,
      };
    }
    case "reset":
      return INITIAL_COCKPIT_TELEMETRY_STATE;
    default:
      return state;
  }
}

export function evaluateCockpitTelemetry(
  state: EngineeringCockpitTelemetryState,
): EngineeringCockpitTelemetryEvaluation {
  const gear = clampGear(state.gear);
  const activeControl =
    controlById.get(state.activeControlId) ?? ENGINEERING_COCKPIT_CONTROLS[0];

  if (state.pitLimiter) {
    const shiftLeds: EngineeringShiftLedSpec[] = Array.from(
      { length: 15 },
      (_, idx) => {
        const index = idx + 1;
        const band: EngineeringShiftLedBand =
          index <= 5 ? "green" : index <= 10 ? "red" : "blue";
        return {
          index,
          band,
          active: index <= 2,
        };
      },
    );
    return {
      gear,
      gearLabel: "P",
      rpm: 4200,
      speedKmh: 80,
      activeLedCount: 2,
      shiftLeds,
      drsEligible: false,
      drsStatus: "LOCKED",
      pitLimiter: true,
      ersMode: {
        en: "PIT HARVEST · 80 KM/H CAP",
        vi: "GIỚI HẠN PIT · KHÓA 80 KM/H",
      },
      activeControl,
    };
  }

  const row = GEAR_TELEMETRY_TABLE[gear] ?? GEAR_TELEMETRY_TABLE[4];
  const drsEligible = gear >= 4;
  const drsActive = drsEligible && state.drsActive;
  const rpm = drsActive ? Math.min(12850, row.rpm + 350) : row.rpm;
  const speedKmh = drsActive ? row.speedKmh + 14 : row.speedKmh;
  const activeLedCount = drsActive ? Math.min(15, row.leds + 1) : row.leds;

  const shiftLeds: EngineeringShiftLedSpec[] = Array.from(
    { length: 15 },
    (_, idx) => {
      const index = idx + 1;
      const band: EngineeringShiftLedBand =
        index <= 5 ? "green" : index <= 10 ? "red" : "blue";
      return {
        index,
        band,
        active: index <= activeLedCount,
      };
    },
  );

  return {
    gear,
    gearLabel: String(gear),
    rpm,
    speedKmh,
    activeLedCount,
    shiftLeds,
    drsEligible,
    drsStatus: drsActive ? "ACTIVE" : drsEligible ? "READY" : "LOCKED",
    pitLimiter: false,
    ersMode:
      state.activeControlId === "STRAT"
        ? {
            en: "OVERTAKE · 120 kW MGU-K",
            vi: "TĂNG TỐC · 120 kW MGU-K",
          }
        : {
            en: "BALANCED DEPLOY · ERS",
            vi: "CÂN BẰNG XẢ/NẠP · ERS",
          },
    activeControl,
  };
}

export function isCockpitInspectorVisible(
  chapterId: string,
  selectedPartId: string | null,
): boolean {
  if (chapterId === "cockpit") return true;
  if (selectedPartId && COCKPIT_PART_IDS.has(selectedPartId)) return true;
  return false;
}

export function computeGlbLoadPercent(
  loadedBytes: number,
  totalBytes: number,
  stage: "init" | "downloading" | "parsing" | "ready",
): number {
  if (stage === "init") return 0;
  if (stage === "ready") return 100;
  if (stage === "parsing") return 96;

  const safeLoaded = Number.isFinite(loadedBytes)
    ? Math.max(0, loadedBytes)
    : 0;
  const denominator =
    Number.isFinite(totalBytes) && totalBytes > 0
      ? totalBytes
      : NOMINAL_FP04RB_GLB_BYTES;
  const ratio = Math.max(0, Math.min(1, safeLoaded / denominator));
  return Math.max(2, Math.min(92, Math.round(ratio * 92)));
}
