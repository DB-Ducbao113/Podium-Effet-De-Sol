import type {
  ControllerConfig,
  GraphicsMode,
  QualityProfile,
} from "./model-b/adaptiveController";
import { DEFAULT_CONTROLLER_CONFIG } from "./model-b/adaptiveController";

export const FP04RB_ADAPTIVE_QUALITY_CONFIG: ControllerConfig = {
  ...DEFAULT_CONTROLLER_CONFIG,
  warmupMs: 800,
  degradeMs: 1_500,
  cooldownMs: 5_000,
  minValidFrames: 20,
};

export function getFp04rbRenderScale(
  mode: GraphicsMode,
  profile: QualityProfile,
  viewportWidth: number,
): number {
  const desktop = viewportWidth >= 760;
  const autoCap =
    profile === "PERFORMANCE"
      ? 1
      : profile === "BALANCED"
        ? 1.25
        : desktop
          ? 1.6
          : 1.25;
  const cap =
    mode === "AUTO"
      ? autoCap
      : mode === "HIGH"
        ? 1.75
        : mode === "BALANCED"
          ? 1.25
          : 0.67;

  return cap;
}

export function shouldEnableFp04rbAntialias(mode: GraphicsMode): boolean {
  return mode === "HIGH";
}

export function getFp04rbCameraDistanceScale(
  viewportWidth: number,
  cockpitPreset = false,
): number {
  if (viewportWidth >= 760) return 1;
  if (cockpitPreset) return 1.15;
  return viewportWidth < 520 ? 1.7 : 1.35;
}

export function getFp04rbHotspotDistanceFactor(cockpitPreset: boolean): number {
  return cockpitPreset ? 2 : 8;
}

export function getFp04rbVisibleHotspots<T extends { preset: string }>(
  hotspots: readonly T[],
  preset: string,
  selectedHotspot: T | null,
): readonly T[] {
  if (preset !== "cockpit") return hotspots;
  return selectedHotspot?.preset === "cockpit" ? [selectedHotspot] : [];
}

export function isFp04rbInteractionActive(
  nowMs: number,
  lastChangeMs: number,
  gracePeriodMs = 500,
) {
  return nowMs >= lastChangeMs && nowMs - lastChangeMs < gracePeriodMs;
}
