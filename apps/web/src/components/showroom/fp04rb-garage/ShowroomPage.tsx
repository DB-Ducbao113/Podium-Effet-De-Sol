import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import {
  AlertTriangle,
  Camera,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Wrench,
} from "lucide-react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { useNavigationStore } from "../../../store/useNavigationStore";
import {
  FP04RB_PART_MANIFEST,
  loadFp04rbShowroomModel,
  pickPreferredFp04rbLod,
  type CachedFp04rbAsset,
  type Fp04rbShowroomLod,
  type WheelCorner,
} from "./fp04rbLoader";
import {
  FP04RB_CHASSIS_DISCLAIMER,
  TEAMS_2026,
  getTeam2026ById,
  type TeamId,
} from "./teams2026";
import {
  getTeamBadgeUrl,
  onTeamLogosReady,
  preloadTeamLogos2026,
} from "./teamLogos2026";
import { loadPitCrewAsset, type CachedPitCrewAsset } from "./pitCrewLoader";
import {
  GARAGE_CAMERA_PRESETS,
  INSPECTION_PARTS,
  PRD_34_CAMERA_PRESETS,
  type BayFocus,
  type CameraPresetId,
  type GarageMode,
} from "./inspectionParts";
import {
  getPrdTeamManifest,
  type LiveryVariantId,
} from "./liveryPrdManifest2026";
import {
  MAINTENANCE_STEP_LABELS,
  advanceMaintenance,
  createInitialMaintenanceState,
  faultMaintenance,
  pauseMaintenance,
  resetMaintenance,
  resumeMaintenance,
  selectMaintenanceCorner,
  startMaintenance,
  type MaintenanceState,
} from "./ServiceSequence";
import { GarageScene } from "./GarageScene";
import { GarageCameraController } from "./GarageCameraController";
import "./showroomGarage.css";

export interface ShowroomPageProps {
  headingLevel?: "h1" | "h2";
}

const CORNERS: readonly WheelCorner[] = ["FL", "FR", "RL", "RR"];

const MODE_LABELS: Record<GarageMode, { vi: string; en: string }> = {
  overview: { vi: "Toàn cảnh Garage", en: "Garage Overview" },
  inspection: { vi: "Kiểm tra kỹ thuật", en: "Technical Inspection" },
  maintenance: { vi: "Bảo dưỡng", en: "Maintenance" },
};

function canUseWebGl(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined")
    return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

export const ShowroomPage: React.FC<ShowroomPageProps> = ({
  headingLevel = "h1",
}) => {
  const lang = useNavigationStore((s) => s.lang);
  const reducedMotion = useReducedMotion();

  const [teamId, setTeamId] = useState<TeamId>("mclaren");
  const [cadillacVariant, setCadillacVariant] =
    useState<LiveryVariantId>("cadillac-spa-2026");
  const [bayFocus, setBayFocus] = useState<BayFocus>("bay-1");
  const [mode, setMode] = useState<GarageMode>("overview");
  const [preset, setPreset] = useState<CameraPresetId>("pit-lane-overview");
  const [cameraTriggerVersion, setCameraTriggerVersion] = useState(0);
  const [selectedPartId, setSelectedPartId] = useState<string>("front-wing");
  const [mobileSheetTab, setMobileSheetTab] = useState<
    "controls" | "teams" | "cameras"
  >("controls");

  const [lod] = useState<Fp04rbShowroomLod>(() => pickPreferredFp04rbLod());
  const [primaryAsset, setPrimaryAsset] = useState<CachedFp04rbAsset | null>(
    null,
  );
  const [secondaryAsset, setSecondaryAsset] =
    useState<CachedFp04rbAsset | null>(null);
  const [pitCrewAsset, setPitCrewAsset] = useState<CachedPitCrewAsset | null>(
    null,
  );
  const [logosVersion, setLogosVersion] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [webglSupported] = useState<boolean>(() => canUseWebGl());
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [sceneMountCount, setSceneMountCount] = useState(0);
  const [statsSample, setStatsSample] = useState<{
    bay1Tris: number;
    bay2Tris: number;
  } | null>(null);

  const [maintenanceState, setMaintenanceState] = useState<MaintenanceState>(
    () =>
      createInitialMaintenanceState(
        Boolean(FP04RB_PART_MANIFEST.capabilities?.wheelRemoval?.supported),
      ),
  );

  const rendererCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const glCleanupRef = useRef<(() => void) | null>(null);

  const team = useMemo(() => getTeam2026ById(teamId), [teamId]);
  const prdManifest = useMemo(() => getPrdTeamManifest(team.id), [team.id]);
  const activeVariantId: LiveryVariantId =
    team.id === "cadillac" ? cadillacVariant : prdManifest.defaultVariantId;
  const activeVariantMeta =
    prdManifest.availableVariants.find((v) => v.id === activeVariantId) ??
    prdManifest.availableVariants[0];
  const selectedPart = useMemo(
    () =>
      INSPECTION_PARTS.find((p) => p.id === selectedPartId) ??
      INSPECTION_PARTS[0],
    [selectedPartId],
  );

  // Load Desktop/Mobile GLB + Rigged Pit Crew GLB + 2026 Transparent Team Logos once and cache for all 11-team switches
  useEffect(() => {
    if (!webglSupported) return;
    const ac = new AbortController();
    setLoadError(null);

    const unsubscribeLogos = onTeamLogosReady(() => {
      if (!ac.signal.aborted) {
        setLogosVersion((v) => v + 1);
      }
    });

    Promise.all([
      loadFp04rbShowroomModel(lod, ac.signal),
      loadFp04rbShowroomModel("mobile", ac.signal),
      loadPitCrewAsset().catch(() => null),
      preloadTeamLogos2026(),
    ])
      .then(([primary, secondary, crew]) => {
        if (ac.signal.aborted) return;
        setPitCrewAsset(crew);
        setPrimaryAsset(primary);
        setSecondaryAsset(secondary);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === "AbortError") return;
        setLoadError(
          err instanceof Error
            ? err.message
            : "Unable to load FP-04 RB Showroom GLB",
        );
      });

    return () => {
      unsubscribeLogos();
      ac.abort();
    };
  }, [lod, webglSupported]);

  // Expose lightweight runtime QA hook only for automated local/headless inspection
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as Record<string, unknown>).__PEDS_GARAGE_STATE__ = {
      teamId,
      variantId: activeVariantId,
      bayFocus,
      mode,
      preset,
      lod,
      sceneMountCount,
      maintenanceStep: maintenanceState.step,
      maintenanceStatus: maintenanceState.status,
      maintenanceCorner: maintenanceState.corner,
      wheelRemovalCapable: maintenanceState.wheelRemovalCapable,
      bay1Tris: statsSample?.bay1Tris ?? null,
      bay2Tris: statsSample?.bay2Tris ?? null,
      contextLost,
    };
  }, [
    teamId,
    activeVariantId,
    bayFocus,
    mode,
    preset,
    lod,
    sceneMountCount,
    maintenanceState.step,
    maintenanceState.status,
    maintenanceState.corner,
    maintenanceState.wheelRemovalCapable,
    statsSample,
    contextLost,
  ]);

  // Maintenance simulation loop (auto-pauses on document.hidden)
  useEffect(() => {
    if (maintenanceState.status !== "running") return;
    let rafId = 0;
    let lastTs = performance.now();

    const stepFrame = (now: number) => {
      const dt = now - lastTs;
      lastTs = now;
      setMaintenanceState((prev) => advanceMaintenance(prev, dt));
      rafId = requestAnimationFrame(stepFrame);
    };
    rafId = requestAnimationFrame(stepFrame);

    const onVisibilityChange = () => {
      if (document.hidden) {
        setMaintenanceState((prev) => pauseMaintenance(prev));
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [maintenanceState.status]);

  useEffect(() => () => glCleanupRef.current?.(), []);

  const handleSelectTeam = useCallback((nextId: TeamId) => {
    // Switching team keeps GLB loaded and camera unchanged; swaps materials & garage signage in place
    setTeamId(nextId);
  }, []);

  const handleSelectMode = useCallback((nextMode: GarageMode) => {
    setMode(nextMode);
    if (nextMode !== "maintenance") {
      setMaintenanceState((prev) =>
        prev.step === "IDLE" ? prev : resetMaintenance(prev),
      );
    } else {
      setPreset("technical-closeup");
      setCameraTriggerVersion((v) => v + 1);
    }
    if (nextMode === "inspection") {
      setPreset("technical-closeup");
      setCameraTriggerVersion((v) => v + 1);
    } else if (nextMode === "overview") {
      setPreset("pit-lane-overview");
      setCameraTriggerVersion((v) => v + 1);
    }
  }, []);

  const handleSelectBay = useCallback((nextBay: BayFocus) => {
    setBayFocus(nextBay);
    setMaintenanceState((prev) =>
      prev.step === "IDLE" ? prev : resetMaintenance(prev),
    );
    setCameraTriggerVersion((v) => v + 1);
  }, []);

  const handleSelectPreset = useCallback((nextPreset: CameraPresetId) => {
    setPreset(nextPreset);
    setCameraTriggerVersion((v) => v + 1);
  }, []);

  const handleSelectPart = useCallback((partId: string) => {
    setSelectedPartId(partId);
    const spec = INSPECTION_PARTS.find((p) => p.id === partId);
    // Only refocus camera when the GLB actually models that part; never fake focus for unsupported internals
    if (spec?.supported) {
      setMode("inspection");
      setPreset("technical-closeup");
      setCameraTriggerVersion((v) => v + 1);
    }
  }, []);

  const handleStatsSample = useCallback(
    (sample: { bay1Tris: number; bay2Tris: number }) => {
      setStatsSample(sample);
      setSceneMountCount((c) => c + 1);
    },
    [],
  );

  const HeadingTag = headingLevel;
  const stepLabel = MAINTENANCE_STEP_LABELS[maintenanceState.step][lang];

  return (
    <section
      className="peds-garage-shell"
      data-testid="fp04rb-garage-showroom"
      data-team={team.id}
      data-mode={mode}
      style={
        {
          "--team-primary": team.primaryColor,
          "--team-secondary": team.secondaryColor,
          "--team-accent": team.accentColor,
        } as React.CSSProperties
      }
    >
      {/* Top Pit Garage Header Bar */}
      <header className="peds-garage-topbar">
        <div className="peds-garage-title-wrap">
          <span className="peds-garage-kicker">
            {lang === "vi"
              ? "GARAGE PIT 2 KHOANG · FP-04 RB"
              : "TWO-BAY F1 PIT GARAGE · FP-04 RB"}
          </span>
          <HeadingTag className="peds-garage-title">
            {team.name} — {team.constructorTitle} (
            {team.drivers[bayFocus === "bay-1" ? "bay1" : "bay2"]})
          </HeadingTag>
          <p className="peds-garage-disclaimer">
            {FP04RB_CHASSIS_DISCLAIMER[lang]}
          </p>
        </div>

        <div
          className="peds-garage-controls-row"
          role="toolbar"
          aria-label={lang === "vi" ? "Chế độ Garage" : "Garage modes"}
        >
          {(["overview", "inspection", "maintenance"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className="peds-garage-btn"
              aria-pressed={mode === m}
              onClick={() => handleSelectMode(m)}
            >
              {MODE_LABELS[m][lang]}
            </button>
          ))}
          <button
            type="button"
            className="peds-garage-btn"
            aria-pressed={bayFocus === "bay-1"}
            onClick={() => handleSelectBay("bay-1")}
          >
            {lang === "vi"
              ? `Khoang 1 (#${team.carNumbers.bay1})`
              : `Bay 1 (#${team.carNumbers.bay1})`}
          </button>
          <button
            type="button"
            className="peds-garage-btn"
            aria-pressed={bayFocus === "bay-2"}
            onClick={() => handleSelectBay("bay-2")}
          >
            {lang === "vi"
              ? `Khoang 2 (#${team.carNumbers.bay2})`
              : `Bay 2 (#${team.carNumbers.bay2})`}
          </button>
        </div>
      </header>

      {/* Main 3-Column Desktop / Stacked Mobile Workspace */}
      <div className="peds-garage-workspace">
        {/* Left Team Rail (11 2026 Concept Liveries) */}
        <aside
          aria-label={
            lang === "vi" ? "Danh sách 11 đội đua" : "11 F1 2026 teams"
          }
          className={`peds-garage-rail ${mobileSheetTab !== "teams" ? "peds-mobile-hidden" : ""}`}
        >
          {TEAMS_2026.map((t) => (
            <button
              key={t.id}
              type="button"
              className="peds-team-btn"
              aria-pressed={team.id === t.id}
              data-team-option={t.id}
              onClick={() => handleSelectTeam(t.id)}
            >
              <span
                className="peds-team-swatch"
                style={{
                  background: `linear-gradient(135deg, ${t.zonePaint.nose} 55%, ${t.accentColor} 55%)`,
                }}
                aria-hidden="true"
              />
              <img
                src={getTeamBadgeUrl(t.id)}
                alt=""
                aria-hidden="true"
                className="peds-team-logo-badge"
              />
              <span className="flex flex-col leading-tight">
                <span className="text-xs font-bold">{t.name}</span>
                <span className="text-[11px] text-slate-400">
                  #{t.carNumbers.bay1} · #{t.carNumbers.bay2}
                </span>
              </span>
            </button>
          ))}
        </aside>

        {/* Central 3D Pit Garage Viewport */}
        <div className="peds-garage-viewport-wrap">
          <div className="peds-garage-hud-overlay">
            <div className="peds-garage-pill">
              <span>{bayFocus === "bay-1" ? "BAY 01" : "BAY 02"}</span>
              <span>·</span>
              <span>{lod.toUpperCase()} LOD</span>
              {statsSample && (
                <>
                  <span>·</span>
                  <span>
                    {(statsSample.bay1Tris / 1000).toFixed(0)}k /{" "}
                    {(statsSample.bay2Tris / 1000).toFixed(0)}k tris
                  </span>
                </>
              )}
            </div>
            <div className="peds-garage-pill">
              <span>16m × 12m × 5m</span>
              <span>·</span>
              <span>
                {lang === "vi" ? "Không gian đề xuất" : "Proposed garage"}
              </span>
            </div>
          </div>

          {contextLost && (
            <div
              role="alert"
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center"
            >
              <AlertTriangle
                className="h-8 w-8 text-amber-400"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold">
                {lang === "vi"
                  ? "Ngữ cảnh WebGL tạm gián đoạn. Chuỗi bảo dưỡng đã tự đưa về trạng thái an toàn."
                  : "WebGL context interrupted. Maintenance sequence safely reset to standby."}
              </p>
              <button
                type="button"
                className="peds-garage-btn peds-garage-btn-primary"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {lang === "vi" ? "Khôi phục hiển thị" : "Reload Viewport"}
              </button>
            </div>
          )}

          {(!webglSupported || loadError) && (
            <div
              role="status"
              data-testid="garage-fallback"
              className="flex h-full min-h-[340px] flex-col items-center justify-center gap-4 p-6 text-center"
            >
              <AlertTriangle
                className="h-9 w-9 text-amber-400"
                aria-hidden="true"
              />
              <h3 className="text-lg font-bold">
                {lang === "vi"
                  ? "Hiển thị kỹ thuật FP-04 RB (Chế độ dự phòng)"
                  : "FP-04 RB Garage Fallback View"}
              </h3>
              <p className="max-w-md text-xs text-slate-300">
                {loadError
                  ? loadError
                  : lang === "vi"
                    ? "Trình duyệt hoặc môi trường hiện tại không hỗ trợ WebGL. Bảng màu 11 đội, dữ liệu kỹ thuật và trạng thái bảo dưỡng vẫn khả dụng."
                    : "WebGL is unavailable in this environment. Team palettes, structural manifest, and maintenance state controls remain accessible."}
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <span
                  className="rounded px-3 py-1 font-bold"
                  style={{
                    backgroundColor: team.primaryColor,
                    color: team.textOnPrimary,
                  }}
                >
                  Primary {team.primaryColor}
                </span>
                <span
                  className="rounded px-3 py-1 font-bold"
                  style={{
                    backgroundColor: team.secondaryColor,
                    color: team.textOnSecondary,
                  }}
                >
                  Secondary {team.secondaryColor}
                </span>
                <span
                  className="rounded px-3 py-1 font-bold"
                  style={{
                    backgroundColor: team.accentColor,
                    color: "#111417",
                  }}
                >
                  Accent {team.accentColor}
                </span>
              </div>
            </div>
          )}

          {webglSupported && !loadError && (
            <div className="peds-garage-canvas-host">
              <Canvas
                shadows
                resize={{ offsetSize: true }}
                dpr={lod === "mobile" ? [1, 1.5] : [1, 2]}
                gl={{
                  antialias: true,
                  powerPreference: "high-performance",
                  toneMapping: THREE.ACESFilmicToneMapping,
                  toneMappingExposure: 1.06,
                }}
                camera={{
                  fov: 52,
                  near: 0.1,
                  far: 80,
                  position: [0, 3.15, 7.45],
                }}
                onCreated={({ gl }) => {
                  glCleanupRef.current?.();
                  const canvas = gl.domElement;
                  rendererCanvasRef.current = canvas;
                  const onLost = (e: Event) => {
                    e.preventDefault();
                    setContextLost(true);
                    setMaintenanceState((prev) =>
                      faultMaintenance(prev, "WebGL context lost"),
                    );
                  };
                  const onRestored = () => {
                    setContextLost(false);
                    setMaintenanceState((prev) => resetMaintenance(prev));
                  };
                  canvas.addEventListener("webglcontextlost", onLost);
                  canvas.addEventListener("webglcontextrestored", onRestored);
                  glCleanupRef.current = () => {
                    canvas.removeEventListener("webglcontextlost", onLost);
                    canvas.removeEventListener(
                      "webglcontextrestored",
                      onRestored,
                    );
                  };
                }}
              >
                <color attach="background" args={["#101318"]} />
                <fog attach="fog" args={["#101318", 14, 34]} />

                {primaryAsset && secondaryAsset && (
                  <GarageScene
                    primaryAsset={primaryAsset}
                    secondaryAsset={secondaryAsset}
                    pitCrewAsset={pitCrewAsset}
                    logosVersion={logosVersion}
                    team={team}
                    liveryVariant={activeVariantId}
                    qualityTier={lod}
                    bayFocus={bayFocus}
                    maintenanceState={maintenanceState}
                    activeMode={mode}
                    highlightedPartNode={selectedPart.nodeName}
                    reducedMotion={reducedMotion}
                    onStatsSample={handleStatsSample}
                  />
                )}

                <GarageCameraController
                  preset={preset}
                  bayFocus={bayFocus}
                  mode={mode}
                  selectedPartId={selectedPartId}
                  maintenanceCorner={maintenanceState.corner}
                  reducedMotion={reducedMotion}
                  cameraTriggerVersion={cameraTriggerVersion}
                />
              </Canvas>
            </div>
          )}

          {webglSupported &&
            (!primaryAsset || !secondaryAsset) &&
            !loadError && (
              <div
                role="status"
                className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-semibold uppercase tracking-widest"
              >
                {lang === "vi"
                  ? "Đang nạp FP-04 RB GLB…"
                  : "Loading FP-04 RB GLB…"}
              </div>
            )}

          {/* Camera Preset Ribbon */}
          <div
            className={`peds-garage-preset-bar ${mobileSheetTab !== "cameras" ? "md:flex peds-mobile-hidden" : ""}`}
            role="toolbar"
            aria-label={
              lang === "vi" ? "Góc camera Garage" : "Garage camera presets"
            }
          >
            {GARAGE_CAMERA_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="peds-garage-btn"
                aria-pressed={preset === p.id}
                onClick={() => handleSelectPreset(p.id)}
              >
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                {p.label[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Right Context Inspector & Maintenance Console */}
        <aside
          className={`peds-garage-inspector ${mobileSheetTab !== "controls" ? "peds-mobile-hidden" : ""}`}
          aria-label={
            lang === "vi"
              ? "Bảng thông tin và thao tác"
              : "Inspection and service panel"
          }
        >
          {/* Team Concept Spec Summary & PRD 2026 Variant / 3/4 Angle Controls */}
          <div
            className="peds-garage-card space-y-2"
            data-variant-id={activeVariantId}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {team.shortCode} · {team.garageTagline[lang]}
              </span>
              <span className="peds-badge-supported">
                {activeVariantMeta.asymmetricSplit
                  ? "L/R Asymmetric"
                  : "PRD 2026 Z01–Z11"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 rounded"
                style={{ backgroundColor: team.zonePaint.nose }}
                title={team.zonePaint.nose}
              />
              <span
                className="inline-block h-4 w-4 rounded"
                style={{ backgroundColor: team.zonePaint.sidepod }}
                title={team.zonePaint.sidepod}
              />
              <span
                className="inline-block h-4 w-4 rounded"
                style={{ backgroundColor: team.accentColor }}
                title={team.accentColor}
              />
              <span className="text-xs text-slate-300">
                Bay 1 #{team.carNumbers.bay1} · Bay 2 #{team.carNumbers.bay2}
              </span>
            </div>
            <p className="text-[11px] leading-snug text-slate-400">
              {activeVariantMeta.summary[lang]}
            </p>

            {/* Cadillac Belgian GP (Spa · Default) vs Debut Launch Variant Switcher (§3.11) */}
            {team.id === "cadillac" && (
              <div
                className="space-y-1 pt-1"
                data-testid="cadillac-variant-switcher"
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {lang === "vi"
                    ? "Phiên bản Livery Cadillac MAC-26"
                    : "Cadillac MAC-26 Livery Variant"}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {prdManifest.availableVariants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="peds-garage-btn text-[11px]"
                      aria-pressed={activeVariantId === v.id}
                      data-variant-option={v.id}
                      onClick={() => setCadillacVariant(v.id)}
                    >
                      {v.id === "cadillac-spa-2026"
                        ? lang === "vi"
                          ? "Belgian GP (Spa)"
                          : "Belgian GP (Spa)"
                        : lang === "vi"
                          ? "Debut (Trái/Phải)"
                          : "Debut (L/R Split)"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PRD §6 Additional 3/4 Paint Review Camera Presets */}
            <div className="space-y-1 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {lang === "vi"
                  ? "Góc duyệt sơn 3/4 (PRD §6)"
                  : "PRD §6 3/4 Paint Review Angles"}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PRD_34_CAMERA_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="peds-garage-btn text-[11px]"
                    aria-pressed={preset === p.id}
                    data-camera-preset={p.id}
                    onClick={() => handleSelectPreset(p.id)}
                  >
                    <Camera className="h-3 w-3" aria-hidden="true" />
                    {p.label[lang]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Technical Inspection Panel */}
          {(mode === "inspection" || mode === "overview") && (
            <div className="peds-garage-card space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {lang === "vi"
                  ? "Kiểm tra bộ phận (6 khả dụng · 4 unsupported)"
                  : "Technical Inspection (6 Supported · 4 Unsupported)"}
              </h2>
              <div className="space-y-1.5">
                {INSPECTION_PARTS.map((part) => (
                  <button
                    key={part.id}
                    type="button"
                    className="peds-part-item"
                    aria-pressed={selectedPart.id === part.id}
                    data-part-id={part.id}
                    onClick={() => handleSelectPart(part.id)}
                  >
                    <span className="text-xs font-medium">
                      {part.label[lang]}
                    </span>
                    <span
                      className={
                        part.supported
                          ? "peds-badge-supported"
                          : "peds-badge-unsupported"
                      }
                    >
                      {part.supported ? "3D" : "unsupported"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-2 rounded-lg bg-black/40 p-2.5 text-xs text-slate-200">
                <div className="font-bold">{selectedPart.label[lang]}</div>
                <p className="mt-1 text-slate-300">
                  {selectedPart.summary[lang]}
                </p>
                {!selectedPart.supported && selectedPart.unsupportedReason && (
                  <p className="mt-1 font-medium text-amber-300">
                    {selectedPart.unsupportedReason[lang]}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Maintenance Service Panel */}
          <div className="peds-garage-card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Wrench
                  className="h-3.5 w-3.5 text-red-400"
                  aria-hidden="true"
                />
                {lang === "vi"
                  ? "Quy trình bảo dưỡng bánh xe"
                  : "Wheel Service Sequence"}
              </h2>
              <span
                className="text-[11px] font-mono text-emerald-300"
                data-testid="service-step"
              >
                {maintenanceState.step}
              </span>
            </div>

            <p className="text-xs text-slate-300">
              {bayFocus === "bay-2"
                ? `${lang === "vi" ? "Khoang 2" : "Bay 2"} (#${team.carNumbers.bay2})`
                : `${lang === "vi" ? "Khoang 1" : "Bay 1"} (#${team.carNumbers.bay1})`}{" "}
              · {stepLabel}
            </p>

            {/* Corner selector (FL, FR, RL, RR) */}
            <div
              className="grid grid-cols-4 gap-1.5"
              role="group"
              aria-label="Corner selection"
            >
              {CORNERS.map((corner) => (
                <button
                  key={corner}
                  type="button"
                  className="peds-garage-btn"
                  aria-pressed={maintenanceState.corner === corner}
                  onClick={() => {
                    setMaintenanceState((prev) =>
                      selectMaintenanceCorner(prev, corner),
                    );
                    if (mode === "maintenance") {
                      setCameraTriggerVersion((v) => v + 1);
                    }
                  }}
                >
                  {corner}
                </button>
              ))}
            </div>

            {/* Service Actions: Start / Pause / Resume / Reset */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="peds-garage-btn peds-garage-btn-primary flex-1"
                disabled={maintenanceState.status === "running"}
                onClick={() => {
                  setMode("maintenance");
                  setPreset("technical-closeup");
                  setCameraTriggerVersion((v) => v + 1);
                  setMaintenanceState((prev) =>
                    prev.status === "paused"
                      ? resumeMaintenance(prev)
                      : startMaintenance(prev),
                  );
                }}
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {maintenanceState.status === "paused"
                  ? lang === "vi"
                    ? "Tiếp tục"
                    : "Resume"
                  : lang === "vi"
                    ? "Bắt đầu bảo dưỡng"
                    : "Start Service"}
              </button>

              <button
                type="button"
                className="peds-garage-btn"
                disabled={maintenanceState.status !== "running"}
                onClick={() =>
                  setMaintenanceState((prev) => pauseMaintenance(prev))
                }
              >
                <Pause className="h-4 w-4" aria-hidden="true" />
                {lang === "vi" ? "Tạm dừng" : "Pause"}
              </button>

              <button
                type="button"
                className="peds-garage-btn"
                onClick={() =>
                  setMaintenanceState((prev) => resetMaintenance(prev))
                }
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {lang === "vi" ? "Khôi phục" : "Reset"}
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              {maintenanceState.wheelRemovalCapable
                ? lang === "vi"
                  ? "Tháo bánh thực theo manifest P1 (sweep 4 góc đạt chuẩn, trục & phanh giữ nguyên vị trí)."
                  : "Manifest-verified wheel detachment enabled (4-corner sweep pass; hub & brake stationary)."
                : lang === "vi"
                  ? "Chế độ kiểm tra tại chỗ."
                  : "On-hub inspection mode."}
            </div>
          </div>
        </aside>

        {/* Mobile Bottom Sheet Tab Switcher (ordered directly below 3D viewport on <=768px) */}
        <nav
          className="peds-mobile-sheet-tabs"
          aria-label={
            lang === "vi" ? "Bảng điều khiển di động" : "Mobile garage controls"
          }
        >
          <button
            type="button"
            className="peds-garage-btn"
            aria-pressed={mobileSheetTab === "controls"}
            onClick={() => setMobileSheetTab("controls")}
          >
            {lang === "vi" ? "Kỹ thuật & Bảo dưỡng" : "Inspect & Service"}
          </button>
          <button
            type="button"
            className="peds-garage-btn"
            aria-pressed={mobileSheetTab === "teams"}
            onClick={() => setMobileSheetTab("teams")}
          >
            {lang === "vi" ? "11 Đội" : "11 Teams"}
          </button>
          <button
            type="button"
            className="peds-garage-btn"
            aria-pressed={mobileSheetTab === "cameras"}
            onClick={() => setMobileSheetTab("cameras")}
          >
            {lang === "vi" ? "Góc nhìn (7)" : "Cameras (7)"}
          </button>
        </nav>
      </div>
    </section>
  );
};

export default ShowroomPage;
