import { useEffect, useMemo, useState, type MutableRefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GarageCameraController } from "../showroom/fp04rb-garage/GarageCameraController";
import { GarageScene } from "../showroom/fp04rb-garage/GarageScene";
import type { MaintenanceState } from "../showroom/fp04rb-garage/ServiceSequence";
import {
  loadFp04rbShowroomModel,
  pickPreferredFp04rbLod,
  type CachedFp04rbAsset,
  type Fp04rbShowroomLod,
} from "../showroom/fp04rb-garage/fp04rbLoader";
import {
  INSPECTION_PARTS,
  type BayFocus,
  type CameraPresetId,
  type GarageMode,
} from "../showroom/fp04rb-garage/inspectionParts";
import type { LiveryVariantId } from "../showroom/fp04rb-garage/liveryPrdManifest2026";
import {
  loadPitCrewAsset,
  type CachedPitCrewAsset,
} from "../showroom/fp04rb-garage/pitCrewLoader";
import {
  onTeamLogosReady,
  preloadTeamLogos2026,
} from "../showroom/fp04rb-garage/teamLogos2026";
import {
  getTeam2026ById,
  type TeamId as GarageTeamId,
} from "../showroom/fp04rb-garage/teams2026";

function createEngineeringPirelliTireTexture(
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#191D23";
  ctx.fillRect(0, 0, size, size);

  const grad = ctx.createRadialGradient(
    size * 0.5,
    size * 0.5,
    size * 0.14,
    size * 0.5,
    size * 0.5,
    size * 0.52,
  );
  grad.addColorStop(0, "rgba(22, 26, 32, 0.95)");
  grad.addColorStop(0.72, "rgba(27, 31, 37, 0.95)");
  grad.addColorStop(1, "rgba(18, 21, 26, 1)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "#040507";
  ctx.lineWidth = size * 0.028;
  ctx.lineCap = "butt";
  const r = size * 0.442;
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, r, -0.34 * Math.PI, 0.34 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, r, 0.66 * Math.PI, 1.34 * Math.PI);
  ctx.stroke();

  ctx.fillStyle = "#040507";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.round(size * 0.042)}px "Inter", Arial, sans-serif`;
  ctx.fillText("PIRELLI", size * 0.5, size * 0.062);
  ctx.save();
  ctx.translate(size * 0.5, size * 0.938);
  ctx.rotate(Math.PI);
  ctx.fillText("P ZERO", 0, 0);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function createEngineeringTwillCarbonTexture(
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#161A20";
  ctx.fillRect(0, 0, size, size);

  const cell = 8;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const phase = (x / cell + y / cell) % 4;
      ctx.fillStyle =
        phase === 0
          ? "#262D37"
          : phase === 1
            ? "#1E242C"
            : phase === 2
              ? "#12161B"
              : "#191E25";
      ctx.fillRect(x, y, cell, cell);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function applyEngineeringMaterialParityToRoot(
  root: THREE.Object3D,
  tireTex: THREE.CanvasTexture,
  carbonTex: THREE.CanvasTexture,
): void {
  const seen = new Set<THREE.Material>();
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const rawMat of mats) {
      if (!rawMat || seen.has(rawMat)) continue;
      seen.add(rawMat);
      if (!(rawMat instanceof THREE.MeshStandardMaterial)) continue;

      const name = rawMat.name || "";
      const lower = name.toLowerCase();

      if (lower.includes("tyre") || lower.includes("tire")) {
        rawMat.map = tireTex;
        rawMat.color.set("#ffffff");
        rawMat.metalness = 0.05;
        rawMat.roughness = 0.48;
        if (rawMat instanceof THREE.MeshPhysicalMaterial) {
          rawMat.clearcoat = 0.14;
          rawMat.clearcoatRoughness = 0.22;
        }
        continue;
      }

      if (lower.startsWith("rubber")) {
        rawMat.color.setRGB(0.012, 0.015, 0.02);
        rawMat.metalness = 0.04;
        rawMat.roughness = 0.72;
        continue;
      }

      if (name === "Glossy Paint_wheel") {
        rawMat.color.setRGB(0.015, 0.018, 0.024);
        rawMat.metalness = 0.42;
        rawMat.roughness = 0.18;
        continue;
      }

      if (lower.includes("carbon")) {
        if (!lower.includes("steering_wheel") && rawMat.map) {
          rawMat.map = carbonTex;
        }
        rawMat.color.set("#1c2128");
        rawMat.metalness = 0.24;
        rawMat.roughness = lower.includes("rough") ? 0.34 : 0.24;
        continue;
      }

      if (name === "chrome" || name === "chrome_exhaust") {
        rawMat.color.setRGB(0.72, 0.78, 0.86);
        rawMat.metalness = 0.48;
        rawMat.roughness = 0.14;
        continue;
      }
      if (name === "chrome_exhaust_inner") {
        rawMat.color.setRGB(0.02, 0.018, 0.018);
        rawMat.metalness = 0.35;
        rawMat.roughness = 0.42;
        continue;
      }
      if (name === "AnodizedMetal_silver") {
        rawMat.color.setRGB(0.55, 0.62, 0.72);
        rawMat.metalness = 0.45;
        rawMat.roughness = 0.18;
        continue;
      }
      if (name === "AnodizedMetal_grey" || name === "AnodizedMetal_grey.001") {
        rawMat.color.setRGB(0.24, 0.29, 0.36);
        rawMat.metalness = 0.42;
        rawMat.roughness = 0.22;
        continue;
      }
      if (name === "Anodized Metal_grey") {
        rawMat.color.setRGB(0.82, 0.42, 0.04);
        rawMat.metalness = 0.44;
        rawMat.roughness = 0.2;
        continue;
      }
      if (name === "BMD_Brass" || name === "BMD_Brass.001") {
        rawMat.color.setRGB(0.68, 0.4, 0.07);
        rawMat.metalness = 0.45;
        rawMat.roughness = 0.2;
        continue;
      }
      if (
        name === "mat_Plastic.001" ||
        name === "mat_Plastic.002" ||
        name === "Black plastic PL.001"
      ) {
        rawMat.color.setRGB(0.012, 0.015, 0.022);
        rawMat.metalness = 0.15;
        rawMat.roughness = 0.36;
        continue;
      }
      if (name === "rear_led_emmitor") {
        rawMat.color.setRGB(1, 0.03, 0.04);
        rawMat.emissive.set("#ff1e27");
        rawMat.emissiveIntensity = 0.75;
        rawMat.roughness = 0.18;
      }
    }
  });
}

const calibratedAssetCache = new WeakMap<
  CachedFp04rbAsset,
  CachedFp04rbAsset
>();
let sharedPirelliTireTex: THREE.CanvasTexture | null = null;
let sharedTwillCarbonTex: THREE.CanvasTexture | null = null;

function getEngineeringCalibratedAsset(
  source: CachedFp04rbAsset,
  maxAnisotropy: number,
): CachedFp04rbAsset {
  const existing = calibratedAssetCache.get(source);
  if (existing) return existing;

  sharedPirelliTireTex ??= createEngineeringPirelliTireTexture(maxAnisotropy);
  sharedTwillCarbonTex ??= createEngineeringTwillCarbonTexture(maxAnisotropy);

  const clonedTemplate = source.template.clone(true);
  const clonedMaterials = new Map<THREE.Material, THREE.Material>();
  clonedTemplate.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const cloneOne = (m: THREE.Material) => {
      const hit = clonedMaterials.get(m);
      if (hit) return hit;
      const cloned = m.clone();
      cloned.name = m.name;
      clonedMaterials.set(m, cloned);
      return cloned;
    };
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(cloneOne)
      : cloneOne(mesh.material);
  });

  applyEngineeringMaterialParityToRoot(
    clonedTemplate,
    sharedPirelliTireTex,
    sharedTwillCarbonTex,
  );

  const calibrated: CachedFp04rbAsset = {
    ...source,
    template: clonedTemplate,
  };
  calibratedAssetCache.set(source, calibrated);
  return calibrated;
}

function Fp04rbGarageStage({
  teamId,
  variantId,
  bayFocus,
  garageMode,
  preset,
  selectedPartId,
  hoveredPartId,
  cameraTriggerVersion,
  maintenanceState,
  reducedMotion,
  crewReadyAtWheelRef,
  onStatsSample,
  onStateChange,
}: {
  teamId: GarageTeamId;
  variantId?: LiveryVariantId;
  bayFocus: BayFocus;
  garageMode: GarageMode;
  preset: CameraPresetId;
  selectedPartId: string;
  hoveredPartId?: string | null;
  cameraTriggerVersion: number;
  maintenanceState: MaintenanceState;
  reducedMotion: boolean;
  crewReadyAtWheelRef?: MutableRefObject<boolean>;
  onStatsSample?: (stats: {
    bay1Tris: number;
    bay2Tris: number;
    lod: Fp04rbShowroomLod;
  }) => void;
  onStateChange?: (state: "idle" | "loading" | "ready" | "error") => void;
}) {
  const { gl } = useThree();
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
  const maxAnisotropy = useMemo(
    () => Math.min(8, gl.capabilities.getMaxAnisotropy() || 4),
    [gl],
  );

  useEffect(() => {
    const ac = new AbortController();
    onStateChange?.("loading");

    const unsubscribeLogos = onTeamLogosReady(() => {
      if (!ac.signal.aborted) {
        setLogosVersion((v) => v + 1);
      }
    });

    // Start non-blocking background hydration for pit crew and team logos
    void preloadTeamLogos2026();
    void loadPitCrewAsset()
      .then((crew) => {
        if (!ac.signal.aborted) {
          setPitCrewAsset(crew);
        }
      })
      .catch(() => null);

    // Load only the selected LOD once and share its calibrated geometry template
    // across both bays (eliminates redundant 3.18 MB mobile GLB fetch on desktop
    // and avoids blocking initial car display on pit-crew/logo downloads).
    loadFp04rbShowroomModel(lod, ac.signal)
      .then((primary) => {
        if (ac.signal.aborted) return;
        const calibrated = getEngineeringCalibratedAsset(
          primary,
          maxAnisotropy,
        );
        setPrimaryAsset(calibrated);
        setSecondaryAsset(calibrated);
        onStateChange?.("ready");
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === "AbortError") return;
        onStateChange?.("error");
      });

    return () => {
      unsubscribeLogos();
      ac.abort();
      gl.renderLists.dispose();
    };
  }, [gl, lod, maxAnisotropy, onStateChange]);

  const team = useMemo(() => getTeam2026ById(teamId), [teamId]);
  const effectiveHighlightPartId =
    hoveredPartId ?? (garageMode === "inspection" ? selectedPartId : null);
  const highlightedPartNode = useMemo(() => {
    if (!effectiveHighlightPartId) return null;
    const spec = INSPECTION_PARTS.find(
      (p) => p.id === effectiveHighlightPartId,
    );
    return spec?.nodeName ?? null;
  }, [effectiveHighlightPartId]);
  const effectiveSceneMode: GarageMode =
    hoveredPartId && garageMode === "overview" ? "inspection" : garageMode;

  const forwardStats = useMemo(
    () => (stats: { bay1Tris: number; bay2Tris: number }) => {
      onStatsSample?.({ ...stats, lod });
    },
    [lod, onStatsSample],
  );

  return (
    <>
      <fog attach="fog" args={["#07101c", 16, 40]} />
      {primaryAsset && secondaryAsset && (
        <GarageScene
          primaryAsset={primaryAsset}
          secondaryAsset={secondaryAsset}
          pitCrewAsset={pitCrewAsset}
          logosVersion={logosVersion}
          team={team}
          liveryVariant={variantId}
          qualityTier={lod}
          bayFocus={bayFocus}
          maintenanceState={maintenanceState}
          activeMode={effectiveSceneMode}
          highlightedPartNode={highlightedPartNode}
          reducedMotion={reducedMotion}
          crewReadyAtWheelRef={crewReadyAtWheelRef}
          onStatsSample={forwardStats}
        />
      )}
      <GarageCameraController
        preset={preset}
        bayFocus={bayFocus}
        mode={garageMode}
        selectedPartId={selectedPartId}
        maintenanceCorner={maintenanceState.corner}
        reducedMotion={reducedMotion}
        cameraTriggerVersion={cameraTriggerVersion}
      />
    </>
  );
}

function ContextWatchdog({ onContextLost }: { onContextLost: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (e: Event) => {
      e.preventDefault();
      onContextLost();
    };
    canvas.addEventListener("webglcontextlost", handleLost);
    return () => canvas.removeEventListener("webglcontextlost", handleLost);
  }, [gl, onContextLost]);
  return null;
}

export interface StormGarageCanvasProps {
  readonly garageTeamId: GarageTeamId;
  readonly garageVariantId?: LiveryVariantId;
  readonly garageBayFocus: BayFocus;
  readonly garageMode: GarageMode;
  readonly garagePreset: CameraPresetId;
  readonly garageSelectedPartId: string;
  readonly garageHoveredPartId?: string | null;
  readonly garageCameraTriggerVersion: number;
  readonly garageMaintenanceState: MaintenanceState;
  readonly reducedMotion: boolean;
  readonly crewReadyAtWheelRef?: MutableRefObject<boolean>;
  readonly onGarageStatsSample?: (stats: {
    bay1Tris: number;
    bay2Tris: number;
    lod: Fp04rbShowroomLod;
  }) => void;
  readonly onShowroomStateChange?: (
    state: "idle" | "loading" | "ready" | "error",
  ) => void;
  readonly onContextLost: () => void;
}

export default function StormGarageCanvas({
  garageTeamId,
  garageVariantId,
  garageBayFocus,
  garageMode,
  garagePreset,
  garageSelectedPartId,
  garageHoveredPartId,
  garageCameraTriggerVersion,
  garageMaintenanceState,
  reducedMotion,
  crewReadyAtWheelRef,
  onGarageStatsSample,
  onShowroomStateChange,
  onContextLost,
}: StormGarageCanvasProps) {
  return (
    <Canvas
      className="sp-canvas"
      shadows
      resize={{ offsetSize: true }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.35, 5.6], fov: 40, near: 0.1, far: 80 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.06,
      }}
      onCreated={({ gl }) => gl.setClearColor("#07080a", 0)}
    >
      <ContextWatchdog onContextLost={onContextLost} />
      <Fp04rbGarageStage
        teamId={garageTeamId}
        variantId={garageVariantId}
        bayFocus={garageBayFocus}
        garageMode={garageMode}
        preset={garagePreset}
        selectedPartId={garageSelectedPartId}
        hoveredPartId={garageHoveredPartId}
        cameraTriggerVersion={garageCameraTriggerVersion}
        maintenanceState={garageMaintenanceState}
        reducedMotion={reducedMotion}
        crewReadyAtWheelRef={crewReadyAtWheelRef}
        onStatsSample={onGarageStatsSample}
        onStateChange={onShowroomStateChange}
      />
    </Canvas>
  );
}
