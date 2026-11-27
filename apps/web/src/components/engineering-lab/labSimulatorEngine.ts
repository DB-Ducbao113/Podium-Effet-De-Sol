import {
  ENGINEERING_PARTS,
  type EngineeringPartSpec,
  type LocalizedText,
} from "../engineering/engineeringDisassemblyData";
import { VALID_LAB_MODES, type LabModeId } from "./engineeringLabRoutes";

export type TendencyLevel = "low" | "medium" | "high" | "peak";
export type HybridRegime = "deploy" | "balanced" | "harvest";
export type ChassisPhase = "braking" | "apex" | "exit";
export type EnergyFlowDirection =
  | "battery-to-axle"
  | "blended-loop"
  | "regen-to-battery";

export interface QualitativeTendency {
  readonly level: TendencyLevel;
  readonly scorePct: number;
  readonly label: LocalizedText;
}

export interface LabSimulatorState {
  readonly mode: LabModeId;
  readonly wingAngleDeg: number;
  readonly rideHeightMm: number;
  readonly hybridRegime: HybridRegime;
  readonly ersIntensityPct: number;
  readonly lateralLoadG: number;
  readonly chassisPhase: ChassisPhase;
  readonly explodeRatio: number;
  readonly xrayShells: boolean;
  readonly selectedPartId: string | null;
  readonly partFilterQuery: string;
}

export type LabSimulatorAction =
  | { readonly type: "set-mode"; readonly mode: LabModeId }
  | { readonly type: "set-wing-angle"; readonly angleDeg: number }
  | { readonly type: "set-ride-height"; readonly rideHeightMm: number }
  | { readonly type: "set-hybrid-regime"; readonly regime: HybridRegime }
  | { readonly type: "set-ers-intensity"; readonly pct: number }
  | { readonly type: "set-lateral-load"; readonly loadG: number }
  | { readonly type: "set-chassis-phase"; readonly phase: ChassisPhase }
  | { readonly type: "set-explode-ratio"; readonly ratio: number }
  | { readonly type: "toggle-xray" }
  | { readonly type: "select-part"; readonly partId: string | null }
  | { readonly type: "set-part-filter"; readonly query: string }
  | { readonly type: "reset-datum" };

export interface LabTelemetryEvaluation {
  readonly mode: LabModeId;
  readonly primaryMetricLabel: LocalizedText;
  readonly secondaryMetricLabel: LocalizedText;
  readonly primaryTendencyTitle: LocalizedText;
  readonly secondaryTendencyTitle: LocalizedText;
  readonly downforceTendency: QualitativeTendency;
  readonly dragTendency: QualitativeTendency;
  readonly aeroBalanceFrontPct: number;
  readonly flapPitchRad: number;
  readonly slotGapOpenRatio: number;
  readonly suctionIndexPct: number;
  readonly venturiStabilityPct: number;
  readonly stallRiskWarning: boolean;
  readonly rideHeaveMeters: number;
  readonly energyFlowDirection: EnergyFlowDirection;
  readonly mguKSharePct: number;
  readonly rearRainLightHarvesting: boolean;
  readonly outsideTireLoadSharePct: number;
  readonly frontAxleSharePct: number;
  readonly chassisRollRad: number;
  readonly chassisPitchRad: number;
  readonly highlightedPartIds: readonly string[];
  readonly statusSummary: LocalizedText;
}

export const INITIAL_LAB_SIMULATOR_STATE: LabSimulatorState = {
  mode: "active-aero",
  wingAngleDeg: 18,
  rideHeightMm: 24,
  hybridRegime: "deploy",
  ersIntensityPct: 78,
  lateralLoadG: 3.2,
  chassisPhase: "apex",
  explodeRatio: 0,
  xrayShells: false,
  selectedPartId: null,
  partFilterQuery: "",
};

const TENDENCY_LABELS: Readonly<Record<TendencyLevel, LocalizedText>> = {
  low: { en: "Low", vi: "Thấp" },
  medium: { en: "Medium", vi: "Trung bình" },
  high: { en: "High", vi: "Cao" },
  peak: { en: "Peak", vi: "Cực đại" },
};

function clampNum(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function toTendency(scorePct: number): QualitativeTendency {
  const clamped = Math.round(clampNum(scorePct, 0, 100));
  const level: TendencyLevel =
    clamped < 30
      ? "low"
      : clamped < 62
        ? "medium"
        : clamped < 86
          ? "high"
          : "peak";
  return {
    level,
    scorePct: clamped,
    label: TENDENCY_LABELS[level],
  };
}

export function parseLabModeParam(raw: string | null | undefined): LabModeId {
  if (!raw) return "active-aero";
  const normalized = raw.trim().toLowerCase();
  return (VALID_LAB_MODES as readonly string[]).includes(normalized)
    ? (normalized as LabModeId)
    : "active-aero";
}

const VALID_PART_IDS = new Set(ENGINEERING_PARTS.map((p) => p.id));

export function labSimulatorReducer(
  state: LabSimulatorState,
  action: LabSimulatorAction,
): LabSimulatorState {
  switch (action.type) {
    case "set-mode":
      return {
        ...state,
        mode: action.mode,
        xrayShells:
          action.mode === "hybrid-powertrain" ? true : state.xrayShells,
      };
    case "set-wing-angle":
      return {
        ...state,
        wingAngleDeg: Math.round(clampNum(action.angleDeg, 0, 35)),
      };
    case "set-ride-height":
      return {
        ...state,
        rideHeightMm: Math.round(clampNum(action.rideHeightMm, 15, 45)),
      };
    case "set-hybrid-regime":
      return {
        ...state,
        hybridRegime: action.regime,
      };
    case "set-ers-intensity":
      return {
        ...state,
        ersIntensityPct: Math.round(clampNum(action.pct, 0, 100)),
      };
    case "set-lateral-load":
      return {
        ...state,
        lateralLoadG:
          Math.round(clampNum(action.loadG, 0, 5.0) * 10) / 10,
      };
    case "set-chassis-phase":
      return {
        ...state,
        chassisPhase: action.phase,
      };
    case "set-explode-ratio":
      return {
        ...state,
        explodeRatio: Math.round(clampNum(action.ratio, 0, 1) * 100) / 100,
      };
    case "toggle-xray":
      return {
        ...state,
        xrayShells: !state.xrayShells,
      };
    case "select-part":
      return {
        ...state,
        selectedPartId:
          action.partId && VALID_PART_IDS.has(action.partId)
            ? action.partId
            : null,
      };
    case "set-part-filter":
      return {
        ...state,
        partFilterQuery: action.query.slice(0, 60),
      };
    case "reset-datum":
      return {
        ...INITIAL_LAB_SIMULATOR_STATE,
        mode: state.mode,
        xrayShells: state.mode === "hybrid-powertrain",
      };
  }
}

export const MODE_CURATED_PARTS: Readonly<Record<LabModeId, readonly string[]>> =
  {
    "active-aero": [
      "REAR_DRS_FLAP_ACTUATOR",
      "REAR_WING_MAINPLANE",
      "FRONT_WING_ASSEMBLY",
      "NOSE_CANARDS_PITOT",
      "FRONT_WHEEL_DEFLECTORS",
    ],
    "ground-effect": [
      "VENTURI_FLOOR_TITANIUM",
      "FRONT_WING_ASSEMBLY",
      "SIDEPOD_SHELL_LEFT",
      "SIDEPOD_SHELL_RIGHT",
      "REAR_WING_MAINPLANE",
    ],
    "hybrid-powertrain": [
      "POWERTRAIN_V6_HYBRID",
      "GEARBOX_DRIVETRAIN",
      "COOLING_RADIATOR_LEFT",
      "COOLING_RADIATOR_RIGHT",
      "REAR_EXHAUST_RAIN_LED",
    ],
    "vehicle-dynamics": [
      "FL_BRAKE_SUSPENSION",
      "FR_BRAKE_SUSPENSION",
      "RL_BRAKE_SUSPENSION",
      "RR_BRAKE_SUSPENSION",
      "FL_SLICK_TIRE",
      "RL_SLICK_TIRE",
    ],
  };

export function filterLabParts(
  mode: LabModeId,
  query: string,
  lang: "vi" | "en",
): readonly EngineeringPartSpec[] {
  const trimmed = query.trim().toLowerCase();
  const baseIds = MODE_CURATED_PARTS[mode];
  const pool = trimmed
    ? ENGINEERING_PARTS
    : ENGINEERING_PARTS.filter((p) => baseIds.includes(p.id));

  if (!trimmed) return pool;
  return pool.filter(
    (part) =>
      part.label[lang].toLowerCase().includes(trimmed) ||
      part.summary[lang].toLowerCase().includes(trimmed) ||
      part.id.toLowerCase().includes(trimmed),
  );
}

export function evaluateLabTelemetry(
  state: LabSimulatorState,
): LabTelemetryEvaluation {
  // 1. Active Aero calculations (0..35 deg, 18 deg = Medium/Medium)
  const wingNorm = state.wingAngleDeg / 35;
  const downforceScore = 14 + wingNorm * 82; // at 18 deg -> ~56 (medium)
  const dragScore = 12 + Math.pow(wingNorm, 1.18) * 86; // at 18 deg -> ~51 (medium)
  const downforceTendency = toTendency(downforceScore);
  const dragTendency = toTendency(dragScore);
  const aeroBalanceFrontPct = Math.round(48 - wingNorm * 6);
  const flapPitchRad = (1 - wingNorm) * 0.36;
  const slotGapOpenRatio = Math.round((1 - wingNorm) * 100) / 100;

  // 2. Ground Effect calculations (15..45 mm, peak stability around 22 mm, stall < 19 mm)
  const h = state.rideHeightMm;
  const stallRiskWarning = h < 19;
  const suctionIndexPct = Math.round(
    stallRiskWarning
      ? 68 - (19 - h) * 6.5
      : clampNum(94 - Math.abs(h - 22) * 2.5, 24, 94),
  );
  const venturiStabilityPct = Math.round(
    stallRiskWarning
      ? 42 - (19 - h) * 6
      : clampNum(92 - Math.max(0, h - 24) * 1.9, 38, 92),
  );
  const rideHeaveMeters = ((h - 24) / 30) * 0.09;

  // 3. Hybrid Powertrain calculations
  const energyFlowDirection: EnergyFlowDirection =
    state.hybridRegime === "harvest"
      ? "regen-to-battery"
      : state.hybridRegime === "balanced"
        ? "blended-loop"
        : "battery-to-axle";
  const mguKSharePct =
    state.hybridRegime === "deploy"
      ? Math.round(22 + state.ersIntensityPct * 0.28)
      : state.hybridRegime === "balanced"
        ? Math.round(14 + state.ersIntensityPct * 0.16)
        : Math.round(state.ersIntensityPct * 0.42);
  const rearRainLightHarvesting = state.hybridRegime === "harvest";

  // 4. Vehicle Dynamics calculations
  const loadNorm = state.lateralLoadG / 5.0;
  const outsideTireLoadSharePct = Math.round(50 + loadNorm * 31);
  const frontAxleSharePct =
    state.chassisPhase === "braking"
      ? Math.round(46 + loadNorm * 14)
      : state.chassisPhase === "exit"
        ? Math.round(44 - loadNorm * 9)
        : 46;
  const chassisRollRad =
    state.chassisPhase === "apex" ? loadNorm * 0.042 : loadNorm * 0.018;
  const chassisPitchRad =
    state.chassisPhase === "braking"
      ? loadNorm * 0.032
      : state.chassisPhase === "exit"
        ? -loadNorm * 0.022
        : 0.004;

  const highlightedPartIds = MODE_CURATED_PARTS[state.mode];

  if (state.mode === "ground-effect") {
    return {
      mode: state.mode,
      primaryMetricLabel: {
        en: `${state.rideHeightMm} mm Ride Height`,
        vi: `Độ cao gầm ${state.rideHeightMm} mm`,
      },
      secondaryMetricLabel: {
        en: stallRiskWarning ? "Boundary-Layer Choke Risk" : "Venturi Seal Active",
        vi: stallRiskWarning ? "Nguy cơ nghẽn/tách lớp biên" : "Dòng Venturi ổn định",
      },
      primaryTendencyTitle: {
        en: "VENTURI SUCTION",
        vi: "LỰC HÚT SÀN VENTURI",
      },
      secondaryTendencyTitle: {
        en: "FLOOR SEAL STABILITY",
        vi: "ĐỘ ỔN ĐỊNH KÍN SÀN",
      },
      downforceTendency: toTendency(suctionIndexPct),
      dragTendency: toTendency(venturiStabilityPct),
      aeroBalanceFrontPct,
      flapPitchRad,
      slotGapOpenRatio,
      suctionIndexPct,
      venturiStabilityPct,
      stallRiskWarning,
      rideHeaveMeters,
      energyFlowDirection,
      mguKSharePct,
      rearRainLightHarvesting,
      outsideTireLoadSharePct,
      frontAxleSharePct,
      chassisRollRad,
      chassisPitchRad,
      highlightedPartIds,
      statusSummary: stallRiskWarning
        ? {
            en: "Excessively low ground clearance constricts throat mass flow and raises oscillation/porpoising sensitivity.",
            vi: "Khe gầm quá sát mặt đường làm nghẽn lưu lượng họng sàn và tăng độ nhạy dao động áp suất (porpoising).",
          }
        : {
            en: "Controlled throat acceleration and gradual diffuser expansion sustain low underfloor pressure.",
            vi: "Dòng khí tăng tốc qua họng sàn và phục hồi áp suất êm tại bộ khuếch tán duy trì vùng áp thấp ổn định.",
          },
    };
  }

  if (state.mode === "hybrid-powertrain") {
    const ersNorm = state.ersIntensityPct / 100;
    const hybridPrimaryScore =
      state.hybridRegime === "deploy"
        ? 22 + ersNorm * 74
        : state.hybridRegime === "harvest"
          ? 18 + ersNorm * 78
          : 30 + ersNorm * 46;
    const hybridBatteryFlowScore =
      state.hybridRegime === "harvest"
        ? 28 + ersNorm * 68
        : state.hybridRegime === "balanced"
          ? 44 + ersNorm * 24
          : Math.max(12, 86 - ersNorm * 68);

    return {
      mode: state.mode,
      primaryMetricLabel: {
        en:
          state.hybridRegime === "deploy"
            ? `ERS Deploy · ${state.ersIntensityPct}%`
            : state.hybridRegime === "harvest"
              ? `Regen Harvest · ${state.ersIntensityPct}%`
              : `Lap Balance · ${state.ersIntensityPct}%`,
        vi:
          state.hybridRegime === "deploy"
            ? `Xả điện ERS · ${state.ersIntensityPct}%`
            : state.hybridRegime === "harvest"
              ? `Thu hồi phanh · ${state.ersIntensityPct}%`
              : `Cân bằng vòng đua · ${state.ersIntensityPct}%`,
      },
      secondaryMetricLabel: {
        en: `MGU-K Allocation ${mguKSharePct}%`,
        vi: `Tỷ trọng MGU-K ${mguKSharePct}%`,
      },
      primaryTendencyTitle:
        state.hybridRegime === "harvest"
          ? { en: "REGEN HARVEST RATE", vi: "CƯỜNG ĐỘ THU HỒI ERS" }
          : { en: "ELECTRIC DRIVE OUTPUT", vi: "CÔNG SUẤT ĐIỆN MGU-K" },
      secondaryTendencyTitle:
        state.hybridRegime === "harvest"
          ? { en: "ES BATTERY CHARGE RATE", vi: "TỐC ĐỘ NẠP PIN ES" }
          : { en: "ES BATTERY RESERVE", vi: "DỰ TRỮ NĂNG LƯỢNG PIN ES" },
      downforceTendency: toTendency(hybridPrimaryScore),
      dragTendency: toTendency(hybridBatteryFlowScore),
      aeroBalanceFrontPct,
      flapPitchRad,
      slotGapOpenRatio,
      suctionIndexPct,
      venturiStabilityPct,
      stallRiskWarning,
      rideHeaveMeters,
      energyFlowDirection,
      mguKSharePct,
      rearRainLightHarvesting,
      outsideTireLoadSharePct,
      frontAxleSharePct,
      chassisRollRad,
      chassisPitchRad,
      highlightedPartIds,
      statusSummary:
        state.hybridRegime === "harvest"
          ? {
              en: "Brake-by-wire blends MGU-K electromagnetic resistance with rear carbon friction rotors, charging the Energy Store.",
              vi: "Hệ brake-by-wire phối hợp mô-men hãm điện từ MGU-K với phanh đĩa carbon sau để nạp điện về pin ES.",
            }
          : {
              en: "Inverter channels DC battery power into the multi-phase MGU-K alongside V6 combustion torque at the rear axle.",
              vi: "Inverter cấp dòng từ khối pin một chiều qua MGU-K cộng hưởng cùng mô-men động cơ V6 xuống trục bánh sau.",
            },
    };
  }

  if (state.mode === "vehicle-dynamics") {
    const gripScore =
      18 + loadNorm * 72 + (state.chassisPhase === "apex" ? 8 : 2);
    const transferScore =
      14 +
      loadNorm * 70 +
      (state.chassisPhase === "braking"
        ? 12
        : state.chassisPhase === "exit"
          ? 6
          : 0);

    return {
      mode: state.mode,
      primaryMetricLabel: {
        en: `${state.lateralLoadG.toFixed(1)} G · ${state.chassisPhase.toUpperCase()}`,
        vi: `${state.lateralLoadG.toFixed(1)} G · ${
          state.chassisPhase === "braking"
            ? "PHANH GẮT"
            : state.chassisPhase === "apex"
              ? "ĐỈNH CUA"
              : "THOÁT CUA"
        }`,
      },
      secondaryMetricLabel: {
        en: `Outside Patch ${outsideTireLoadSharePct}% · Front ${frontAxleSharePct}%`,
        vi: `Lốp ngoài ${outsideTireLoadSharePct}% · Cầu trước ${frontAxleSharePct}%`,
      },
      primaryTendencyTitle: {
        en: "MECHANICAL GRIP DEMAND",
        vi: "TẢI BÁM CƠ HỌC LỐP",
      },
      secondaryTendencyTitle: {
        en: "LOAD TRANSFER INTENSITY",
        vi: "CHUYỂN DỊCH TẢI TRỌNG",
      },
      downforceTendency: toTendency(gripScore),
      dragTendency: toTendency(transferScore),
      aeroBalanceFrontPct: frontAxleSharePct,
      flapPitchRad,
      slotGapOpenRatio,
      suctionIndexPct,
      venturiStabilityPct,
      stallRiskWarning,
      rideHeaveMeters,
      energyFlowDirection,
      mguKSharePct,
      rearRainLightHarvesting,
      outsideTireLoadSharePct,
      frontAxleSharePct,
      chassisRollRad,
      chassisPitchRad,
      highlightedPartIds,
      statusSummary: {
        en: "Carbon wishbones and inboard springs/dampers manage roll-centre migration and hold the aero floor inside its window.",
        vi: "Hệ tay đòn carbon cùng lò xo/giảm chấn trong thân kiểm soát dịch chuyển tâm lăn và giữ sàn khí động ổn định.",
      },
    };
  }

  return {
    mode: "active-aero",
    primaryMetricLabel: {
      en: `${state.wingAngleDeg}° Wing Angle`,
      vi: `Góc cánh ${state.wingAngleDeg}°`,
    },
    secondaryMetricLabel: {
      en: `Aero Balance ${aeroBalanceFrontPct}% Front`,
      vi: `Cân bằng khí động ${aeroBalanceFrontPct}% Trước`,
    },
    primaryTendencyTitle: {
      en: "DOWNFORCE TENDENCY",
      vi: "XU HƯỚNG LỰC ÉP",
    },
    secondaryTendencyTitle: {
      en: "DRAG TENDENCY",
      vi: "XU HƯỚNG LỰC CẢN",
    },
    downforceTendency,
    dragTendency,
    aeroBalanceFrontPct,
    flapPitchRad,
    slotGapOpenRatio,
    suctionIndexPct,
    venturiStabilityPct,
    stallRiskWarning,
    rideHeaveMeters,
    energyFlowDirection,
    mguKSharePct,
    rearRainLightHarvesting,
    outsideTireLoadSharePct,
    frontAxleSharePct,
    chassisRollRad,
    chassisPitchRad,
    highlightedPartIds,
    statusSummary:
      state.wingAngleDeg <= 8
        ? {
            en: "Low-angle straight-line state opens the upper slot gap to shed wake drag while preserving fail-safe linkage geometry.",
            vi: "Trạng thái góc thấp trên đoạn thẳng mở rộng khe cánh giúp giảm lực cản và vẫn giữ cơ cấu liên động an toàn.",
          }
        : state.wingAngleDeg >= 27
          ? {
              en: "High-camber cornering configuration maximizes downward pressure field across braking and mid-corner phases.",
              vi: "Cấu hình góc tấn lớn tối ưu trường áp suất ép xuống mặt đường khi phanh và giữ tốc độ giữa cua.",
            }
          : {
              en: "Balanced multi-element wing trim sustains attached boundary-layer flow with predictable centre-of-pressure stability.",
              vi: "Góc cánh cân bằng duy trì lớp biên bám bề mặt đa tầng và giữ ổn định tâm áp suất trước–sau.",
            },
  };
}
