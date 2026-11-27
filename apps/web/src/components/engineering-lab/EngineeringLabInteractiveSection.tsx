import {
  CheckCircle2,
  Eye,
  Layers,
  RotateCcw,
  Search,
  Sliders,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { ENGINEERING_PARTS } from "../engineering/engineeringDisassemblyData";
import { LAB_CONCEPT_DISCLAIMER } from "./engineeringLabContent";
import type { LabModeId } from "./engineeringLabRoutes";
import { EngineeringLabSchematic2D } from "./EngineeringLabSchematic2D";
import {
  filterLabParts,
  type ChassisPhase,
  type HybridRegime,
  type LabSimulatorAction,
  type LabSimulatorState,
  type LabTelemetryEvaluation,
} from "./labSimulatorEngine";

export interface EngineeringLabInteractiveSectionProps {
  readonly lang: "vi" | "en";
  readonly reducedMotion: boolean;
  readonly state: LabSimulatorState;
  readonly telemetry: LabTelemetryEvaluation;
  readonly modelReady: boolean;
  readonly loadProgress: number;
  readonly fallbackCode: string | null;
  readonly onRetry3D: () => void;
  readonly onDispatch: (action: LabSimulatorAction) => void;
  readonly labViewportRef: React.RefObject<HTMLDivElement>;
  readonly labCanvasSlotRef?: React.RefObject<HTMLDivElement>;
}

const LAB_MODE_TABS: readonly {
  readonly id: LabModeId;
  readonly code: string;
  readonly label: { readonly en: string; readonly vi: string };
  readonly title: { readonly en: string; readonly vi: string };
}[] = [
    {
      id: "active-aero",
      code: "01",
      label: { en: "Active Aero", vi: "Khí động chủ động" },
      title: { en: "Active Aero Simulator", vi: "Mô phỏng Khí động chủ động" },
    },
    {
      id: "ground-effect",
      code: "02",
      label: { en: "Ground Effect", vi: "Hiệu ứng mặt đất" },
      title: { en: "Ground Effect Venturi Lab", vi: "Mô phỏng Sàn hút Venturi" },
    },
    {
      id: "hybrid-powertrain",
      code: "03",
      label: { en: "Hybrid Powertrain", vi: "Truyền động Hybrid" },
      title: { en: "Hybrid Energy Loop Lab", vi: "Mô phỏng Dòng năng lượng Hybrid" },
    },
    {
      id: "vehicle-dynamics",
      code: "04",
      label: { en: "Vehicle Dynamics", vi: "Động lực học" },
      title: { en: "Suspension & Load Transfer Lab", vi: "Mô phỏng Hệ treo & Tải lốp" },
    },
  ];

export const EngineeringLabInteractiveSection: React.FC<
  EngineeringLabInteractiveSectionProps
> = ({
  lang,
  reducedMotion,
  state,
  telemetry,
  modelReady,
  loadProgress,
  fallbackCode,
  onRetry3D,
  onDispatch,
  labViewportRef,
  labCanvasSlotRef,
}) => {
    const isVi = lang === "vi";
    const [showVectorOverlay, setShowVectorOverlay] = useState(true);
    const [datumConfirmed, setDatumConfirmed] = useState(false);

    const activeTabMeta =
      LAB_MODE_TABS.find((t) => t.id === state.mode) ?? LAB_MODE_TABS[0];

    const filteredParts = useMemo(
      () => filterLabParts(state.mode, state.partFilterQuery, lang),
      [lang, state.mode, state.partFilterQuery],
    );

    const selectedPartSpec = useMemo(
      () => ENGINEERING_PARTS.find((p) => p.id === state.selectedPartId) ?? null,
      [state.selectedPartId],
    );

    const handleResetDatum = () => {
      onDispatch({ type: "reset-datum" });
      setDatumConfirmed(true);
      window.setTimeout(() => setDatumConfirmed(false), 1800);
    };

    const handleTabKeyDown = (
      event: React.KeyboardEvent<HTMLButtonElement>,
      idx: number,
    ) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const nextIdx =
        (idx + delta + LAB_MODE_TABS.length) % LAB_MODE_TABS.length;
      const nextMode = LAB_MODE_TABS[nextIdx].id;
      onDispatch({ type: "set-mode", mode: nextMode });
      document.getElementById(`eng-lab-tab-id-${nextMode}`)?.focus();
    };

  return (
    <section
      id="interactive-lab"
      className="peds-eng-lux-lab-section scroll-mt-20"
      data-section="05-interactive-lab"
      data-testid="eng-lab-section-05-lab"
    >
      <div className="peds-eng-lux-container">
        {/* Header Bar */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="peds-eng-lux-mono text-xs text-[#00D9F5]">
              {isVi
                ? "PODIUM EDS / PHÒNG LAB TƯƠNG TÁC"
                : "PODIUM EDS / INTERACTIVE LAB"}
            </p>
            <h2 className="peds-eng-lux-display-title mt-3 text-3xl sm:text-5xl">
              {activeTabMeta.title[lang]}
            </h2>
          </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center gap-2 rounded-full border border-[#FF4938]/40 bg-[#FF4938]/10 px-3.5 py-1.5 text-[11px] font-medium text-[#E9EDF2]"
                data-testid="eng-lab-concept-demo-badge"
              >
                <span
                  className="h-2 w-2 rounded-full bg-[#FF4938]"
                  aria-hidden="true"
                />
                <span className="peds-eng-lux-mono">CONCEPT DEMO</span>
              </span>
            </div>
          </div>

          {/* 4-Mode Selector Tabs (WCAG ARIA tablist + ArrowLeft/ArrowRight) */}
          <div
            role="tablist"
            aria-label={
              isVi ? "Chế độ mô phỏng kỹ thuật" : "Engineering simulator modes"
            }
            className="mt-7 grid grid-cols-2 gap-2.5 lg:grid-cols-4"
          >
            {LAB_MODE_TABS.map((tab, idx) => {
              const active = tab.id === state.mode;
              return (
                <button
                  key={tab.id}
                  id={`eng-lab-tab-id-${tab.id}`}
                  type="button"
                  role="tab"
                  tabIndex={active ? 0 : -1}
                  aria-selected={active}
                  aria-controls="eng-lab-active-tabpanel"
                  data-testid={`eng-lab-tab-${tab.id}`}
                  onClick={() => onDispatch({ type: "set-mode", mode: tab.id })}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={`flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left transition ${active
                    ? "border-[#00D9F5] bg-[#00D9F5]/12 text-[#E9EDF2]"
                    : "border-[#202730] bg-[#11151B] text-[#A7B2C2] hover:border-[#E9EDF2]/25 hover:text-[#E9EDF2]"
                    }`}
                >
                  <span className="text-sm font-semibold">{tab.label[lang]}</span>
                  <span className="peds-eng-lux-mono text-[10px] text-[#00D9F5]">
                    {tab.code}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Workbench Split */}
          <div
            id="eng-lab-active-tabpanel"
            role="tabpanel"
            aria-labelledby={`eng-lab-tab-id-${state.mode}`}
            className="peds-eng-lux-lab-grid"
          >
            {/* Left: Docked 3D Stage Aperture + Synchronized 2D Blueprint Overlay / Fallback */}
            <div
              ref={labViewportRef}
              className="peds-eng-lux-lab-viewport"
              data-testid="eng-lab-stage-viewport"
            >
              {/* Top Viewport Telemetry Strip (z-20 above docked 3D canvas) */}
              <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[#202730] bg-[#080A0D]/90 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="peds-eng-lux-mono text-[11px] text-[#00D9F5]">
                    {telemetry.primaryMetricLabel[lang]}
                  </span>
                  <span className="text-[#202730]">|</span>
                  <span className="peds-eng-lux-mono text-[10px] text-[#A7B2C2]">
                    {telemetry.secondaryMetricLabel[lang]}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!fallbackCode && (
                    <>
                      <button
                        type="button"
                        onClick={() => onDispatch({ type: "toggle-xray" })}
                        aria-pressed={state.xrayShells}
                        data-testid="eng-lab-xray-toggle"
                        className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition ${state.xrayShells
                          ? "border-[#00D9F5] bg-[#00D9F5]/15 text-[#E9EDF2]"
                          : "border-[#202730] bg-[#11151B] text-[#A7B2C2]"
                          }`}
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isVi ? "Xuyên vỏ" : "X-Ray"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowVectorOverlay((v) => !v)}
                        aria-pressed={showVectorOverlay}
                        className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition ${showVectorOverlay
                          ? "border-[#00D9F5] bg-[#00D9F5]/15 text-[#E9EDF2]"
                          : "border-[#202730] bg-[#11151B] text-[#A7B2C2]"
                          }`}
                      >
                        <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isVi ? "Sơ đồ dòng" : "Vector Schematic"}</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={handleResetDatum}
                    data-testid="eng-lab-reset-datum"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#202730] bg-[#11151B] px-3.5 text-xs font-medium text-[#A7B2C2] hover:border-[#00D9F5] hover:text-[#E9EDF2]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isVi ? "Mặc định" : "Reset"}</span>
                  </button>
                </div>
              </div>

              {/* Middle Stage Slot: Persistent 3D Canvas portal mounts directly into labCanvasSlotRef! */}
              <div
                className="pointer-events-none relative flex min-h-[380px] flex-1 flex-col justify-end p-4"
                data-testid="eng-lab-canvas-slot"
              >
                <div
                  ref={labCanvasSlotRef}
                  data-testid="eng-lab-3d-aperture"
                  className="pointer-events-auto absolute inset-0 z-10 overflow-hidden"
                />

                {!modelReady && !fallbackCode && (
                  <div
                    role="status"
                    data-testid="eng-lab-3d-loading"
                    className="pointer-events-none relative z-20 mb-auto rounded-xl border border-[#202730] bg-[#11151B]/90 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="peds-eng-lux-mono text-[10px] text-[#00D9F5]">
                        {isVi
                          ? "ĐANG NẠP MÔ HÌNH 3D FP-04 RB"
                          : "LOADING FP-04 RB 3D STUDY MESH"}
                      </span>
                      <span className="peds-eng-lux-mono text-[10px] text-[#E9EDF2]">
                        {loadProgress}%
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#202730]">
                      <div
                        className="h-full bg-[#00D9F5] transition-all"
                        style={{ width: `${Math.max(8, loadProgress)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* UI State 4: WebGL Unavailable / Error -> Full 2D Interactive Blueprint */}
                {fallbackCode ? (
                  <div
                    className="pointer-events-auto relative z-20 flex h-full flex-1 flex-col justify-between rounded-2xl border border-[#202730] bg-[#080A0D]/95 p-4"
                    data-testid="eng-lab-2d-fallback"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="peds-eng-lux-mono text-[10px] text-[#00D9F5]">
                        {isVi
                          ? "CHẾ ĐỘ BẢN VẼ VECTOR TƯƠNG TÁC (FALLBACK 3D)"
                          : "INTERACTIVE 2D PRECISION SCHEMATIC (3D FALLBACK)"}
                      </span>
                      <button
                        type="button"
                        onClick={onRetry3D}
                        className="min-h-11 rounded-full border border-[#202730] bg-[#11151B] px-4 text-xs text-[#E9EDF2] hover:border-[#00D9F5]"
                      >
                        {isVi ? "Thử bật lại 3D" : "Retry 3D Stage"}
                      </button>
                    </div>
                    <div className="my-2 h-[250px]">
                      <EngineeringLabSchematic2D
                        mode={state.mode}
                        lang={lang}
                        reducedMotion={reducedMotion}
                        state={state}
                        telemetry={telemetry}
                      />
                    </div>
                  </div>
                ) : (
                  showVectorOverlay && (
                    <div className="pointer-events-none relative z-20 ml-auto w-full max-w-[320px] rounded-2xl border border-[#202730] bg-[#080A0D]/86 p-2 backdrop-blur-md">
                      <div className="h-[136px]">
                        <EngineeringLabSchematic2D
                          mode={state.mode}
                          lang={lang}
                          reducedMotion={reducedMotion}
                          state={state}
                          telemetry={telemetry}
                          compact
                        />
                      </div>
                    </div>
                  )
                )}

                {/* UI State 5: Active Confirmation / Selected Part Callout */}
                {datumConfirmed && (
                  <div
                    role="status"
                    data-testid="eng-lab-datum-toast"
                    className="pointer-events-none relative z-20 mt-3 inline-flex items-center gap-2 self-start rounded-full border border-[#00D9F5]/40 bg-[#11151B] px-3.5 py-1.5 text-xs text-[#E9EDF2]"
                  >
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-[#00D9F5]"
                      aria-hidden="true"
                    />
                    <span>
                      {isVi
                        ? "Đã khôi phục thông số chuẩn"
                        : "Baseline engineering datum restored"}
                    </span>
                  </div>
                )}

                {selectedPartSpec && (
                  <div
                    data-testid="eng-lab-selected-part-card"
                    className="pointer-events-auto relative z-20 mt-3 flex items-start justify-between gap-4 rounded-xl border border-[#00D9F5]/40 bg-[#11151B]/95 p-3.5"
                  >
                    <div>
                      <p className="peds-eng-lux-mono text-[10px] text-[#00D9F5]">
                        {selectedPartSpec.id}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#E9EDF2]">
                        {selectedPartSpec.label[lang]}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#A7B2C2]">
                        {selectedPartSpec.summary[lang]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onDispatch({ type: "select-part", partId: null })
                      }
                      aria-label={
                        isVi ? "Đóng chi tiết cụm" : "Close selected part"
                      }
                      className="min-h-11 min-w-11 rounded-lg border border-[#202730] p-2.5 text-[#A7B2C2] hover:text-[#E9EDF2]"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Stage Bar: Explode Slider + Technical Note */}
              <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-t border-[#202730] bg-[#080A0D]/90 px-4 py-3">
                <label className="flex flex-1 items-center gap-3 text-xs text-[#A7B2C2]">
                  <Sliders
                    className="h-3.5 w-3.5 shrink-0 text-[#00D9F5]"
                    aria-hidden="true"
                  />
                  <span className="peds-eng-lux-mono shrink-0 text-[10px]">
                    {isVi ? "BÓC TÁCH CỤM" : "EXPLODE VIEW"}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(state.explodeRatio * 100)}
                    onChange={(e) =>
                      onDispatch({
                        type: "set-explode-ratio",
                        ratio: Number(e.target.value) / 100,
                      })
                    }
                    aria-label={
                      isVi ? "Mức độ tách rời bộ phận" : "Exploded view ratio"
                    }
                    className="peds-eng-lux-slider max-w-[180px]"
                  />
                  <span className="peds-eng-lux-mono text-[10px] text-[#E9EDF2]">
                    {Math.round(state.explodeRatio * 100)}%
                  </span>
                </label>

                <span className="peds-eng-lux-mono text-[10px] text-[#7D899B]">
                  {isVi ? "KÉO ĐỂ XOAY 360° · CHẠM LINH KIỆN" : "DRAG TO ORBIT 360° · CLICK PARTS"}
                </span>
              </div>
            </div>

          {/* Right: Precision Parameter Control Deck */}
          <div className="peds-eng-lux-lab-panel">
            {state.mode === "active-aero" && (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <label
                    htmlFor="lab-wing-angle-slider"
                    className="text-sm font-semibold text-[#E9EDF2]"
                  >
                    {isVi ? "Góc cánh gió" : "Wing angle"}
                  </label>
                  <strong
                    className="peds-eng-lux-display-title text-3xl text-[#00D9F5]"
                    data-testid="eng-lab-wing-angle-value"
                  >
                    {state.wingAngleDeg}°
                  </strong>
                </div>

                  <input
                    id="lab-wing-angle-slider"
                    data-testid="eng-lab-wing-angle-slider"
                    type="range"
                    min={0}
                    max={35}
                    step={1}
                    value={state.wingAngleDeg}
                    onChange={(e) =>
                      onDispatch({
                        type: "set-wing-angle",
                        angleDeg: Number(e.target.value),
                      })
                    }
                    className="peds-eng-lux-slider"
                  />

                  <div className="peds-eng-lux-mono flex justify-between text-[11px] text-[#7D899B]">
                    <span>0°</span>
                    <span>18°</span>
                    <span>35°</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { deg: 0, label: isVi ? "0° Cản thấp" : "0° Low-Drag" },
                      { deg: 18, label: isVi ? "18° Cân bằng" : "18° Balanced" },
                      { deg: 35, label: isVi ? "35° Tải cực đại" : "35° Max-Load" },
                    ].map((preset) => (
                      <button
                        key={preset.deg}
                        type="button"
                        onClick={() =>
                          onDispatch({
                            type: "set-wing-angle",
                            angleDeg: preset.deg,
                          })
                        }
                        className={`min-h-11 rounded-lg border px-3.5 text-xs font-medium transition ${state.wingAngleDeg === preset.deg
                          ? "border-[#00D9F5] bg-[#00D9F5]/14 text-[#E9EDF2]"
                          : "border-[#202730] bg-[#080A0D] text-[#A7B2C2] hover:text-[#E9EDF2]"
                          }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {state.mode === "ground-effect" && (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <label
                    htmlFor="lab-ride-height-slider"
                    className="text-sm font-semibold text-[#E9EDF2]"
                  >
                    {isVi ? "Khoảng sáng gầm" : "Ride height / Ground clearance"}
                  </label>
                  <strong
                    className="peds-eng-lux-display-title text-3xl text-[#00D9F5]"
                    data-testid="eng-lab-ride-height-value"
                  >
                    {state.rideHeightMm} mm
                  </strong>
                </div>

                  <input
                    id="lab-ride-height-slider"
                    data-testid="eng-lab-ride-height-slider"
                    type="range"
                    min={15}
                    max={45}
                    step={1}
                    value={state.rideHeightMm}
                    onChange={(e) =>
                      onDispatch({
                        type: "set-ride-height",
                        rideHeightMm: Number(e.target.value),
                      })
                    }
                    className="peds-eng-lux-slider"
                  />

                <div className="peds-eng-lux-mono flex justify-between text-[11px] text-[#7D899B]">
                  <span>15 mm</span>
                  <span>{isVi ? "22 mm (TỐI ƯU)" : "22 mm (OPTIMAL)"}</span>
                  <span>45 mm</span>
                </div>

                {telemetry.stallRiskWarning && (
                  <p
                    role="alert"
                    data-testid="eng-lab-stall-warning"
                    className="rounded-lg border border-[#FF4938]/50 bg-[#FF4938]/12 px-3 py-2 text-xs text-[#FF4938]"
                  >
                    {isVi
                      ? "Cảnh báo dưới 19 mm: Nguy cơ nghẽn luồng hút Venturi và dao động porpoising."
                      : "Below 19 mm threshold: Venturi throat choking & porpoising oscillation risk."}
                  </p>
                )}
              </div>
            )}

              {state.mode === "hybrid-powertrain" && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-[#E9EDF2]">
                    {isVi
                      ? "Chế độ vận hành năng lượng"
                      : "Supervisory Energy Regime"}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "deploy", en: "Deploy", vi: "Xả điện" },
                        { id: "balanced", en: "Balanced", vi: "Cân bằng" },
                        { id: "harvest", en: "Harvest", vi: "Thu hồi" },
                      ] as const
                    ).map((reg) => (
                      <button
                        key={reg.id}
                        type="button"
                        data-testid={`eng-lab-regime-${reg.id}`}
                        onClick={() =>
                          onDispatch({
                            type: "set-hybrid-regime",
                            regime: reg.id as HybridRegime,
                          })
                        }
                        className={`min-h-11 rounded-lg border px-3 text-xs font-semibold transition ${state.hybridRegime === reg.id
                          ? "border-[#00D9F5] bg-[#00D9F5]/14 text-[#E9EDF2]"
                          : "border-[#202730] bg-[#080A0D] text-[#A7B2C2]"
                          }`}
                      >
                        {reg[lang]}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-[#A7B2C2]">
                      <label htmlFor="lab-ers-slider">
                        {isVi ? "Cường độ dòng điện ERS" : "ERS Current Intensity"}
                      </label>
                      <span className="peds-eng-lux-mono text-[#00D9F5]">
                        {state.ersIntensityPct}%
                      </span>
                    </div>
                    <input
                      id="lab-ers-slider"
                      type="range"
                      min={0}
                      max={100}
                      value={state.ersIntensityPct}
                      onChange={(e) =>
                        onDispatch({
                          type: "set-ers-intensity",
                          pct: Number(e.target.value),
                        })
                      }
                      className="peds-eng-lux-slider mt-2"
                    />
                  </div>
                </div>
              )}

              {state.mode === "vehicle-dynamics" && (
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <label
                      htmlFor="lab-load-slider"
                      className="text-sm font-semibold text-[#E9EDF2]"
                    >
                      {isVi
                        ? "Tải gia tốc / Cornering G"
                        : "Cornering & Braking Load"}
                    </label>
                    <strong
                      className="peds-eng-lux-display-title text-3xl text-[#00D9F5]"
                      data-testid="eng-lab-load-value"
                    >
                      {state.lateralLoadG.toFixed(1)} G
                    </strong>
                  </div>

                  <input
                    id="lab-load-slider"
                    data-testid="eng-lab-load-slider"
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={Math.round(state.lateralLoadG * 10)}
                    onChange={(e) =>
                      onDispatch({
                        type: "set-lateral-load",
                        loadG: Number(e.target.value) / 10,
                      })
                    }
                    className="peds-eng-lux-slider"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "braking", en: "Braking", vi: "Phanh vào cua" },
                        { id: "apex", en: "Mid-Apex", vi: "Đỉnh cua" },
                        { id: "exit", en: "Traction Exit", vi: "Thoát cua" },
                      ] as const
                    ).map((ph) => (
                      <button
                        key={ph.id}
                        type="button"
                        onClick={() =>
                          onDispatch({
                            type: "set-chassis-phase",
                            phase: ph.id as ChassisPhase,
                          })
                        }
                        className={`min-h-11 rounded-lg border px-2.5 text-xs font-semibold transition ${state.chassisPhase === ph.id
                          ? "border-[#00D9F5] bg-[#00D9F5]/14 text-[#E9EDF2]"
                          : "border-[#202730] bg-[#080A0D] text-[#A7B2C2]"
                          }`}
                      >
                        {ph[lang]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode-Specific Qualitative Tendency Readouts (BUG-04 / REQ-13, REQ-14) */}
              <div className="grid grid-cols-2 gap-3 border-y border-[#202730] py-4">
                <div className="rounded-xl border border-[#202730] bg-[#080A0D] p-3.5">
                  <p
                    className="peds-eng-lux-mono text-[10px] text-[#7D899B]"
                    data-testid="eng-lab-primary-tendency-title"
                  >
                    {telemetry.primaryTendencyTitle[lang]}
                  </p>
                  <p
                    className="mt-1.5 text-base font-semibold text-[#E9EDF2]"
                    data-testid="eng-lab-downforce-tendency"
                  >
                    {telemetry.downforceTendency.label[lang]}
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#202730]">
                    <div
                      className="h-full bg-[#00D9F5] transition-all"
                      style={{ width: `${telemetry.downforceTendency.scorePct}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[#202730] bg-[#080A0D] p-3.5">
                  <p
                    className="peds-eng-lux-mono text-[10px] text-[#7D899B]"
                    data-testid="eng-lab-secondary-tendency-title"
                  >
                    {telemetry.secondaryTendencyTitle[lang]}
                  </p>
                  <p
                    className="mt-1.5 text-base font-semibold text-[#E9EDF2]"
                    data-testid="eng-lab-drag-tendency"
                  >
                    {telemetry.dragTendency.label[lang]}
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#202730]">
                    <div
                      className="h-full bg-[#FF4938] transition-all"
                      style={{ width: `${telemetry.dragTendency.scorePct}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs leading-6 text-[#A7B2C2]">
                {telemetry.statusSummary[lang]}
              </p>

              {/* 47-Part Hotspot Selector + Empty State Handling */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="peds-eng-lux-mono text-[10px] text-[#A7B2C2]">
                    {isVi
                      ? "CHỌN BỘ PHẬN TRÊN MÔ HÌNH"
                      : "SELECT 3D TECHNICAL HOTSPOT"}
                  </span>
                  <span className="peds-eng-lux-mono text-[10px] text-[#7D899B]">
                    {filteredParts.length} / {ENGINEERING_PARTS.length}
                  </span>
                </div>

                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7D899B]"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={state.partFilterQuery}
                    onChange={(e) =>
                      onDispatch({
                        type: "set-part-filter",
                        query: e.target.value,
                      })
                    }
                    placeholder={
                      isVi
                        ? "Tìm cụm chi tiết (DRS, Halo, V6...)"
                        : "Filter parts (DRS, Floor, V6...)"
                    }
                    aria-label={
                      isVi ? "Lọc bộ phận kỹ thuật" : "Filter engineering parts"
                    }
                    data-testid="eng-lab-part-filter"
                    className="min-h-11 w-full rounded-lg border border-[#202730] bg-[#080A0D] pl-9 pr-3 text-xs text-[#E9EDF2] placeholder:text-[#7D899B]"
                  />
                </div>

                {filteredParts.length === 0 ? (
                  <div
                    data-testid="eng-lab-parts-empty"
                    className="rounded-xl border border-[#202730] bg-[#080A0D] p-4 text-center"
                  >
                    <p className="text-xs text-[#A7B2C2]">
                      {isVi
                        ? "Không tìm thấy cụm cơ khí khớp từ khóa."
                        : "No mechanical assembly matches your filter."}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        onDispatch({ type: "set-part-filter", query: "" })
                      }
                      className="mt-2 min-h-11 rounded-full border border-[#00D9F5]/40 px-4 text-xs text-[#00D9F5]"
                    >
                      {isVi ? "Xóa bộ lọc" : "Clear filter"}
                    </button>
                  </div>
                ) : (
                  <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1">
                    {filteredParts.slice(0, 8).map((part) => {
                      const selected = state.selectedPartId === part.id;
                      return (
                        <button
                          key={part.id}
                          type="button"
                          onClick={() =>
                            onDispatch({
                              type: "select-part",
                              partId: selected ? null : part.id,
                            })
                          }
                          className={`min-h-11 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition ${selected
                            ? "border-[#00D9F5] bg-[#00D9F5]/16 text-[#E9EDF2]"
                            : "border-[#202730] bg-[#080A0D] text-[#A7B2C2] hover:border-[#E9EDF2]/25 hover:text-[#E9EDF2]"
                            }`}
                        >
                          {part.label[lang]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mandatory Non-CFD Concept Disclaimer (REQ-15) */}
              <p
                className="rounded-xl border border-[#202730] bg-[#080A0D] px-3.5 py-3 text-[11.5px] leading-5 text-[#A7B2C2]"
                data-testid="eng-lab-non-cfd-disclaimer"
              >
                {LAB_CONCEPT_DISCLAIMER[lang]}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  };
