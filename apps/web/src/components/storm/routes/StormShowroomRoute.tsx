import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  FP04RB_PART_MANIFEST,
  type Fp04rbShowroomLod,
  type WheelCorner,
} from "../../showroom/fp04rb-garage/fp04rbLoader";
import {
  INSPECTION_PARTS,
  type BayFocus,
  type CameraPresetId,
  type GarageMode,
} from "../../showroom/fp04rb-garage/inspectionParts";
import {
  getPrdTeamManifest,
  type LiveryVariantId,
} from "../../showroom/fp04rb-garage/liveryPrdManifest2026";
import {
  advanceMaintenance,
  createInitialMaintenanceState,
  faultMaintenance,
  pauseMaintenance,
  resetMaintenance,
  resumeMaintenance,
  selectMaintenanceCorner,
  startMaintenance,
  type MaintenanceState,
} from "../../showroom/fp04rb-garage/ServiceSequence";
import {
  TEAMS_2026,
  type TeamId as GarageTeamId,
} from "../../showroom/fp04rb-garage/teams2026";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { useStormShell } from "../stormShellContext";
import { StormShowroomView } from "../StormShowroomView";

const LazyStormGarageCanvas = lazy(() => import("../StormGarageCanvas"));

const GARAGE_TEAM_ALIASES: Readonly<Record<string, GarageTeamId>> = {
  redbull: "red-bull",
  racingbulls: "racing-bulls",
  astonmartin: "aston-martin",
};

const GARAGE_TEAM_SET = new Set<string>(TEAMS_2026.map((t) => t.id));

const HOTSPOT_QUERY_TO_GARAGE_PART: Record<string, string> = {
  "front-wing": "front-wing",
  "venturi-tunnels": "floor-body",
  sidepod: "sidepods",
  halo: "halo",
  "drs-rear-wing": "rear-wing",
};

function probeWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ??
      canvas.getContext("webgl");
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(ctx);
  } catch {
    return false;
  }
}

export function StormShowroomRoute() {
  const [searchParams] = useSearchParams();
  const lang = useNavigationStore((s) => s.lang);
  const reducedMotion = useReducedMotion();
  const { setShowroomStageReady } = useStormShell();

  const initialTeam = useMemo<GarageTeamId>(() => {
    const qTeam = searchParams.get("team");
    if (qTeam) {
      if (GARAGE_TEAM_ALIASES[qTeam]) return GARAGE_TEAM_ALIASES[qTeam];
      if (GARAGE_TEAM_SET.has(qTeam)) return qTeam as GarageTeamId;
    }
    return "mclaren";
  }, [searchParams]);

  const initialPart = useMemo(() => {
    const qHotspot = searchParams.get("hotspot");
    if (!qHotspot) return null;
    const mapped = HOTSPOT_QUERY_TO_GARAGE_PART[qHotspot] ?? qHotspot;
    return INSPECTION_PARTS.some((p) => p.id === mapped) ? mapped : null;
  }, [searchParams]);

  const [webglReady, setWebglReady] = useState(() => probeWebGL());
  const [showroomLoadState, setShowroomLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [garageTeamId, setGarageTeamId] = useState<GarageTeamId>(initialTeam);
  const [garageCadillacVariant, setGarageCadillacVariant] =
    useState<LiveryVariantId>("cadillac-spa-2026");
  const [garageBayFocus, setGarageBayFocus] = useState<BayFocus>("bay-1");
  const [garageMode, setGarageMode] = useState<GarageMode>(
    initialPart ? "inspection" : "overview",
  );
  const [garagePreset, setGaragePreset] = useState<CameraPresetId>(
    initialPart ? "technical-closeup" : "pit-lane-overview",
  );
  const [garageCameraTriggerVersion, setGarageCameraTriggerVersion] =
    useState(0);
  const [garageSelectedPartId, setGarageSelectedPartId] = useState<string>(
    initialPart ?? "front-wing",
  );
  const [garageHoveredPartId, setGarageHoveredPartId] = useState<string | null>(
    null,
  );
  const [garageStatsSample, setGarageStatsSample] = useState<{
    bay1Tris: number;
    bay2Tris: number;
    lod: Fp04rbShowroomLod;
  } | null>(null);
  const [garageMaintenanceState, setGarageMaintenanceState] =
    useState<MaintenanceState>(() =>
      createInitialMaintenanceState(
        Boolean(FP04RB_PART_MANIFEST.capabilities?.wheelRemoval?.supported),
      ),
    );
  const [stageSlot, setStageSlot] = useState<HTMLElement | null>(null);
  const crewReadyAtWheelRef = useRef(true);

  useEffect(() => {
    setStageSlot(document.getElementById("storm-3d-stage-slot"));
    return () => {
      setShowroomStageReady(false);
    };
  }, [setShowroomStageReady]);

  useEffect(() => {
    setShowroomStageReady(webglReady && showroomLoadState === "ready");
  }, [setShowroomStageReady, showroomLoadState, webglReady]);

  const garageVariantId: LiveryVariantId = useMemo(() => {
    const manifest = getPrdTeamManifest(garageTeamId);
    return garageTeamId === "cadillac"
      ? garageCadillacVariant
      : manifest.defaultVariantId;
  }, [garageCadillacVariant, garageTeamId]);

  useEffect(() => {
    if (garageMaintenanceState.status !== "running") return;
    let rafId = 0;
    let lastTs = performance.now();

    const stepFrame = (now: number) => {
      const dt = now - lastTs;
      lastTs = now;
      setGarageMaintenanceState((prev) =>
        advanceMaintenance(prev, dt, crewReadyAtWheelRef.current),
      );
      rafId = requestAnimationFrame(stepFrame);
    };
    rafId = requestAnimationFrame(stepFrame);

    const onVisibilityChange = () => {
      if (document.hidden) {
        setGarageMaintenanceState((prev) => pauseMaintenance(prev));
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [garageMaintenanceState.status]);

  useEffect(() => {
    if (garageMode !== "maintenance") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        tag === "BUTTON"
      ) {
        return;
      }
      e.preventDefault();
      setGarageMaintenanceState((prev) => {
        if (prev.status === "running") return pauseMaintenance(prev);
        if (prev.status === "paused") return resumeMaintenance(prev);
        return prev;
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [garageMode]);

  const handleSelectGarageMode = useCallback((nextMode: GarageMode) => {
    setGarageMode(nextMode);
    if (nextMode !== "maintenance") {
      setGarageMaintenanceState((prev) =>
        prev.step === "IDLE" ? prev : resetMaintenance(prev),
      );
    } else {
      setGaragePreset("technical-closeup");
      setGarageCameraTriggerVersion((v) => v + 1);
    }
    if (nextMode === "inspection") {
      setGaragePreset("technical-closeup");
      setGarageCameraTriggerVersion((v) => v + 1);
    } else if (nextMode === "overview") {
      setGaragePreset("pit-lane-overview");
      setGarageCameraTriggerVersion((v) => v + 1);
    }
  }, []);

  const handleSelectGarageBay = useCallback((nextBay: BayFocus) => {
    setGarageBayFocus(nextBay);
    setGarageMaintenanceState((prev) =>
      prev.step === "IDLE" ? prev : resetMaintenance(prev),
    );
    setGarageCameraTriggerVersion((v) => v + 1);
  }, []);

  const handleSelectGaragePreset = useCallback((nextPreset: CameraPresetId) => {
    setGaragePreset(nextPreset);
    setGarageCameraTriggerVersion((v) => v + 1);
  }, []);

  const handleSelectGaragePart = useCallback((partId: string) => {
    setGarageSelectedPartId(partId);
    setGarageMode("inspection");
    const spec = INSPECTION_PARTS.find((p) => p.id === partId);
    if (spec?.supported) {
      setGaragePreset("technical-closeup");
      setGarageCameraTriggerVersion((v) => v + 1);
    }
  }, []);

  const handleSelectGarageCorner = useCallback((corner: WheelCorner) => {
    setGarageMaintenanceState((prev) => selectMaintenanceCorner(prev, corner));
    setGaragePreset("technical-closeup");
    setGarageCameraTriggerVersion((v) => v + 1);
  }, []);

  const handleStartGarageMaintenance = useCallback(() => {
    setGarageMode("maintenance");
    setGarageMaintenanceState((prev) => {
      if (prev.status === "paused") {
        return resumeMaintenance(prev);
      }
      crewReadyAtWheelRef.current = false;
      setGaragePreset("technical-closeup");
      setGarageCameraTriggerVersion((v) => v + 1);
      return startMaintenance(prev);
    });
  }, []);

  const handlePauseGarageMaintenance = useCallback(() => {
    setGarageMaintenanceState((prev) =>
      prev.status === "paused"
        ? resumeMaintenance(prev)
        : pauseMaintenance(prev),
    );
  }, []);

  const handleResetGarageMaintenance = useCallback(() => {
    setGarageMaintenanceState((prev) => resetMaintenance(prev));
  }, []);

  return (
    <>
      {webglReady && stageSlot
        ? createPortal(
            <Suspense fallback={null}>
              <LazyStormGarageCanvas
                garageTeamId={garageTeamId}
                garageVariantId={garageVariantId}
                garageBayFocus={garageBayFocus}
                garageMode={garageMode}
                garagePreset={garagePreset}
                garageSelectedPartId={garageSelectedPartId}
                garageHoveredPartId={garageHoveredPartId}
                garageCameraTriggerVersion={garageCameraTriggerVersion}
                garageMaintenanceState={garageMaintenanceState}
                reducedMotion={reducedMotion}
                crewReadyAtWheelRef={crewReadyAtWheelRef}
                onGarageStatsSample={setGarageStatsSample}
                onShowroomStateChange={setShowroomLoadState}
                onContextLost={() => {
                  setWebglReady(false);
                  setGarageMaintenanceState((prev) =>
                    faultMaintenance(prev, "WebGL context lost"),
                  );
                }}
              />
            </Suspense>,
            stageSlot,
          )
        : null}

      <div className="sp-overview-wrap">
        <StormShowroomView
          lang={lang}
          webglReady={webglReady}
          showroomLoadState={showroomLoadState}
          garageTeamId={garageTeamId}
          garageVariantId={garageVariantId}
          garageBayFocus={garageBayFocus}
          garageMode={garageMode}
          garagePreset={garagePreset}
          garageSelectedPartId={garageSelectedPartId}
          garageHoveredPartId={garageHoveredPartId}
          garageStatsSample={garageStatsSample}
          garageMaintenanceState={garageMaintenanceState}
          onSelectGarageTeam={setGarageTeamId}
          onSelectCadillacVariant={setGarageCadillacVariant}
          onSelectGarageBay={handleSelectGarageBay}
          onSelectGarageMode={handleSelectGarageMode}
          onSelectGaragePreset={handleSelectGaragePreset}
          onHoverGaragePart={setGarageHoveredPartId}
          onSelectGaragePart={handleSelectGaragePart}
          onSelectGarageCorner={handleSelectGarageCorner}
          onStartGarageMaintenance={handleStartGarageMaintenance}
          onPauseGarageMaintenance={handlePauseGarageMaintenance}
          onResetGarageMaintenance={handleResetGarageMaintenance}
        />
      </div>
    </>
  );
}

export default StormShowroomRoute;
