import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  ENGINEERING_FP04RB_GLB_URL,
  ENGINEERING_PARTS,
} from "../engineering/engineeringDisassemblyData";
import {
  applyMaterialXrayVisibility,
  disposeEngineeringInstanceMaterials,
  loadEngineeringGlbTemplate,
  resolveEngineeringMaterialSide,
  snapshotAuthoredMaterialState,
} from "../engineering/engineeringGlbLoader";
import type {
  LabSimulatorState,
  LabTelemetryEvaluation,
} from "./labSimulatorEngine";

export type SandboxStageZone = "hero" | "parked" | "lab";

export interface EngineeringLuxuryStage3DProps {
  readonly stageZone: SandboxStageZone;
  readonly heroScrollProgress: number;
  readonly labState: LabSimulatorState;
  readonly labTelemetry: LabTelemetryEvaluation;
  readonly reducedMotion: boolean;
  readonly onLoadProgress?: (pct: number) => void;
  readonly onModelReady?: () => void;
  readonly onFallbackActivated?: (code: string) => void;
  readonly onSelectPart?: (partId: string) => void;
}

let cachedWebGlSupport: boolean | null = null;

function canCreateWebGlContext(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  if (/jsdom/i.test(window.navigator?.userAgent ?? "")) {
    return false;
  }
  if (cachedWebGlSupport !== null) {
    return cachedWebGlSupport;
  }
  try {
    const probe = document.createElement("canvas");
    probe.width = 1;
    probe.height = 1;
    const gl = (probe.getContext("webgl2") ||
      probe.getContext("webgl") ||
      probe.getContext("experimental-webgl")) as
      | WebGLRenderingContext
      | WebGL2RenderingContext
      | null;
    if (!gl) {
      cachedWebGlSupport = false;
      return false;
    }
    // Immediately release probe context so active WebGL contexts never exceed 1 (CR-03 / REQ-16)
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    cachedWebGlSupport = true;
    return true;
  } catch {
    cachedWebGlSupport = false;
    return false;
  }
}

interface StageBoundaryProps {
  readonly onError: (code: string) => void;
  readonly children: ReactNode;
}

class StageWebGlErrorBoundary extends Component<
  StageBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError("ERR_WEBGL_RENDER_FAILURE");
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

interface HeroCameraKeyframe {
  readonly at: number;
  readonly pos: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly fov: number;
}

const HERO_CAMERA_KEYFRAMES: readonly HeroCameraKeyframe[] = [
  { at: 0.0, pos: [-4.35, 1.24, -4.05], target: [0, 0.42, 0.06], fov: 32 },
  { at: 0.34, pos: [-2.45, 0.54, -3.05], target: [0, 0.22, -1.05], fov: 29 },
  { at: 0.68, pos: [2.42, 1.32, 2.92], target: [0, 0.82, 1.15], fov: 30 },
  { at: 1.0, pos: [2.88, 1.58, 1.62], target: [0, 0.52, 0.46], fov: 31 },
];

const LAB_MODE_CAMERA: Readonly<
  Record<
    LabSimulatorState["mode"],
    {
      pos: readonly [number, number, number];
      target: readonly [number, number, number];
    }
  >
> = {
  "active-aero": { pos: [2.75, 1.32, 2.85], target: [0, 0.68, 0.86] },
  "ground-effect": { pos: [-3.15, 0.58, -1.95], target: [0, 0.2, 0.06] },
  "hybrid-powertrain": { pos: [2.55, 1.68, 1.35], target: [0, 0.52, 0.36] },
  "vehicle-dynamics": { pos: [-2.85, 0.95, -2.65], target: [0, 0.32, -0.52] },
};

function applyStudioEnvironmentMap(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
): () => void {
  const pmrem = new THREE.PMREMGenerator(gl);
  pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color("#0c1118");

  const overheadSoftbox = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 4.5),
    new THREE.MeshBasicMaterial({ color: "#f0f6ff", side: THREE.DoubleSide }),
  );
  overheadSoftbox.position.set(0, 6.2, 0);
  overheadSoftbox.rotation.x = Math.PI / 2;
  envScene.add(overheadSoftbox);

  const cyanKeyStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 2.4),
    new THREE.MeshBasicMaterial({ color: "#00d9f5", side: THREE.DoubleSide }),
  );
  cyanKeyStrip.position.set(-6.5, 2.6, -4.5);
  cyanKeyStrip.lookAt(0, 0.5, 0);
  envScene.add(cyanKeyStrip);

  const platinumFillStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 2.4),
    new THREE.MeshBasicMaterial({ color: "#dce7f5", side: THREE.DoubleSide }),
  );
  platinumFillStrip.position.set(6.8, 3.1, 4.8);
  platinumFillStrip.lookAt(0, 0.5, 0);
  envScene.add(platinumFillStrip);

  const target = pmrem.fromScene(envScene, 0.04);
  scene.environment = target.texture;

  overheadSoftbox.geometry.dispose();
  (overheadSoftbox.material as THREE.Material).dispose();
  cyanKeyStrip.geometry.dispose();
  (cyanKeyStrip.material as THREE.Material).dispose();
  platinumFillStrip.geometry.dispose();
  (platinumFillStrip.material as THREE.Material).dispose();
  pmrem.dispose();

  return () => {
    if (scene.environment === target.texture) {
      scene.environment = null;
    }
    target.dispose();
  };
}

function interpolateHeroCamera(progress: number, aspect = 1.6) {
  const p = Math.max(0, Math.min(1, progress));
  let idx = 0;
  while (
    idx < HERO_CAMERA_KEYFRAMES.length - 2 &&
    p > HERO_CAMERA_KEYFRAMES[idx + 1].at
  ) {
    idx += 1;
  }
  const a = HERO_CAMERA_KEYFRAMES[idx];
  const b = HERO_CAMERA_KEYFRAMES[idx + 1];
  const span = Math.max(0.0001, b.at - a.at);
  const raw = Math.max(0, Math.min(1, (p - a.at) / span));
  const t = raw * raw * (3 - 2 * raw);
  const distScale = aspect < 0.85 ? 1.32 : 1;
  const fovBoost = aspect < 0.85 ? 11 : 0;
  return {
    pos: [
      (a.pos[0] + (b.pos[0] - a.pos[0]) * t) * distScale,
      (a.pos[1] + (b.pos[1] - a.pos[1]) * t) * (aspect < 0.85 ? 1.15 : 1),
      (a.pos[2] + (b.pos[2] - a.pos[2]) * t) * distScale,
    ] as [number, number, number],
    target: [
      a.target[0] + (b.target[0] - a.target[0]) * t,
      a.target[1] + (b.target[1] - a.target[1]) * t,
      a.target[2] + (b.target[2] - a.target[2]) * t,
    ] as [number, number, number],
    fov: a.fov + (b.fov - a.fov) * t + fovBoost,
  };
}

interface PartRuntimeEntry {
  readonly id: string;
  readonly outerShell: boolean;
  readonly object: THREE.Object3D;
  readonly basePosition: THREE.Vector3;
  readonly baseEuler: THREE.Euler;
  readonly explodeOffset: readonly [number, number, number];
  readonly explodeEuler: readonly [number, number, number];
  readonly materials: THREE.MeshStandardMaterial[];
}

function applyStageMaterialHighlights(
  entries: readonly PartRuntimeEntry[],
  stageZone: SandboxStageZone,
  xrayShells: boolean,
  highlighted: ReadonlySet<string>,
  rearRainLightHarvesting: boolean,
): void {
  for (const entry of entries) {
    const isHighlighted = stageZone === "lab" && highlighted.has(entry.id);
    const isRainLight =
      stageZone === "lab" &&
      entry.id === "REAR_EXHAUST_RAIN_LED" &&
      rearRainLightHarvesting;

    for (const mat of entry.materials) {
      const snap = applyMaterialXrayVisibility(
        mat,
        stageZone === "lab" && xrayShells && entry.outerShell,
      );
      if (isRainLight) {
        mat.emissive.setHex(0xff4938);
        mat.emissiveIntensity = 1.65;
      } else if (isHighlighted) {
        mat.emissive.setHex(0x00d9f5);
        mat.emissiveIntensity = 0.28;
      } else {
        mat.emissive.setHex(snap.baseEmissiveHex);
        mat.emissiveIntensity = snap.baseEmissiveIntensity;
      }
    }
  }
}

function stepLuxuryThreeFrame(params: {
  readonly camera: THREE.Camera;
  readonly root: THREE.Group | null;
  readonly entries: readonly PartRuntimeEntry[];
  readonly stageZone: SandboxStageZone;
  readonly heroScrollProgress: number;
  readonly labState: LabSimulatorState;
  readonly labTelemetry: LabTelemetryEvaluation;
  readonly reducedMotion: boolean;
  readonly delta: number;
  readonly desiredPos: THREE.Vector3;
  readonly desiredTarget: THREE.Vector3;
  readonly invalidate: () => void;
}): void {
  const {
    camera,
    root,
    entries,
    stageZone,
    heroScrollProgress,
    labState,
    labTelemetry,
    reducedMotion,
    delta,
    desiredPos,
    desiredTarget,
    invalidate,
  } = params;

  if (root) {
    const targetY = stageZone === "lab" ? labTelemetry.rideHeaveMeters : 0;
    const targetRoll = stageZone === "lab" ? labTelemetry.chassisRollRad : 0;
    const targetPitch = stageZone === "lab" ? labTelemetry.chassisPitchRad : 0;
    const alpha = reducedMotion ? 1 : Math.min(1, delta * 8);
    root.position.y = THREE.MathUtils.lerp(root.position.y, targetY, alpha);
    root.rotation.z = THREE.MathUtils.lerp(root.rotation.z, targetRoll, alpha);
    root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, targetPitch, alpha);
  }

  const explode = stageZone === "lab" ? labState.explodeRatio : 0;
  for (const entry of entries) {
    const extraDrsPitch =
      stageZone === "lab" &&
      labState.mode === "active-aero" &&
      entry.id === "REAR_DRS_FLAP_ACTUATOR"
        ? labTelemetry.flapPitchRad
        : 0;

    entry.object.position.set(
      entry.basePosition.x + entry.explodeOffset[0] * explode,
      entry.basePosition.y + entry.explodeOffset[1] * explode,
      entry.basePosition.z + entry.explodeOffset[2] * explode,
    );
    entry.object.rotation.set(
      entry.baseEuler.x + entry.explodeEuler[0] * explode + extraDrsPitch,
      entry.baseEuler.y + entry.explodeEuler[1] * explode,
      entry.baseEuler.z + entry.explodeEuler[2] * explode,
    );
  }

  if (stageZone === "hero") {
    const aspect =
      camera instanceof THREE.PerspectiveCamera && camera.aspect > 0
        ? camera.aspect
        : 1.6;
    const shot = interpolateHeroCamera(
      reducedMotion ? 0 : heroScrollProgress,
      aspect,
    );
    desiredPos.set(shot.pos[0], shot.pos[1], shot.pos[2]);
    desiredTarget.set(shot.target[0], shot.target[1], shot.target[2]);
    const camAlpha = reducedMotion ? 1 : Math.min(1, delta * 5.2);
    camera.position.lerp(desiredPos, camAlpha);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, shot.fov, camAlpha);
      camera.updateProjectionMatrix();
    }
    camera.lookAt(desiredTarget);
    if (
      !reducedMotion &&
      camera.position.distanceToSquared(desiredPos) > 0.0004
    ) {
      invalidate();
    }
  }
}

function LuxuryFp04Scene({
  stageZone,
  heroScrollProgress,
  labState,
  labTelemetry,
  reducedMotion,
  onLoadProgress,
  onModelReady,
  onFallbackActivated,
  onSelectPart,
}: EngineeringLuxuryStage3DProps) {
  const { get, invalidate } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const [sceneClone, setSceneClone] = useState<THREE.Group | null>(null);
  const partsRef = useRef<PartRuntimeEntry[]>([]);
  const lastLabModeRef = useRef<string>("");
  const desiredPos = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);

  // Stable callback refs prevent GLB re-cloning on scroll or slider ticks (CR-02)
  const onLoadProgressRef = useRef(onLoadProgress);
  const onModelReadyRef = useRef(onModelReady);
  const onFallbackActivatedRef = useRef(onFallbackActivated);
  useEffect(() => {
    onLoadProgressRef.current = onLoadProgress;
    onModelReadyRef.current = onModelReady;
    onFallbackActivatedRef.current = onFallbackActivated;
  }, [onFallbackActivated, onLoadProgress, onModelReady]);

  useEffect(() => {
    const { gl, scene } = get();
    const disposeEnv = applyStudioEnvironmentMap(gl, scene);
    invalidate();
    return () => {
      disposeEnv();
    };
  }, [get, invalidate]);

  useEffect(() => {
    const controller = new AbortController();
    const clonedMaterials: THREE.Material[] = [];

    loadEngineeringGlbTemplate(ENGINEERING_FP04RB_GLB_URL, {
      signal: controller.signal,
      onDownloadProgress: (loaded, total) => {
        if (total > 0) {
          onLoadProgressRef.current?.(
            Math.min(99, Math.round((loaded / total) * 100)),
          );
        }
      },
    })
      .then((asset) => {
        if (controller.signal.aborted) return;
        const cloned = asset.template.clone(true);
        const runtimeEntries: PartRuntimeEntry[] = [];

        for (const spec of ENGINEERING_PARTS) {
          const node = cloned.getObjectByName(spec.node);
          if (!node) continue;
          const mats: THREE.MeshStandardMaterial[] = [];
          node.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (!mesh.isMesh) return;
            mesh.userData.partId = spec.id;
            const rawMats = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];
            const instanceMats = rawMats.map((m) => {
              const c = m.clone() as THREE.MeshStandardMaterial;
              c.side = resolveEngineeringMaterialSide(
                Boolean(spec.outerShell),
                c.side,
              );
              snapshotAuthoredMaterialState(c);
              clonedMaterials.push(c);
              mats.push(c);
              return c;
            });
            mesh.material = Array.isArray(mesh.material)
              ? instanceMats
              : instanceMats[0];
          });

          runtimeEntries.push({
            id: spec.id,
            outerShell: Boolean(spec.outerShell),
            object: node,
            basePosition: node.position.clone(),
            baseEuler: node.rotation.clone(),
            explodeOffset: spec.explodeOffset,
            explodeEuler: spec.explodeEuler,
            materials: mats,
          });
        }

        partsRef.current = runtimeEntries;
        setSceneClone(cloned);
        onLoadProgressRef.current?.(100);
        onModelReadyRef.current?.();
        invalidate();
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "ERR_GLB_LOAD_FAILED";
        if (message !== "Engineering GLB load aborted") {
          onFallbackActivatedRef.current?.("ERR_GLB_LOAD_FAILED");
        }
      });

    return () => {
      controller.abort();
      disposeEngineeringInstanceMaterials(clonedMaterials);
    };
  }, [invalidate]);

  useEffect(() => {
    const highlighted = new Set(
      labState.selectedPartId
        ? [labState.selectedPartId]
        : labTelemetry.highlightedPartIds,
    );
    applyStageMaterialHighlights(
      partsRef.current,
      stageZone,
      labState.xrayShells,
      highlighted,
      labTelemetry.rearRainLightHarvesting,
    );
    invalidate();
  }, [
    invalidate,
    labState.selectedPartId,
    labState.xrayShells,
    labTelemetry.highlightedPartIds,
    labTelemetry.rearRainLightHarvesting,
    stageZone,
    sceneClone,
  ]);

  useEffect(() => {
    if (stageZone !== "lab") {
      lastLabModeRef.current = "";
      return;
    }
    const modeKey = `${labState.mode}:${labState.selectedPartId ?? ""}`;
    if (modeKey === lastLabModeRef.current) return;
    lastLabModeRef.current = modeKey;

    const preset = LAB_MODE_CAMERA[labState.mode];
    const activeCam = get().camera;
    activeCam.position.set(preset.pos[0], preset.pos[1], preset.pos[2]);
    if (controlsRef.current) {
      controlsRef.current.target.set(
        preset.target[0],
        preset.target[1],
        preset.target[2],
      );
      controlsRef.current.update();
    } else {
      activeCam.lookAt(preset.target[0], preset.target[1], preset.target[2]);
    }
    invalidate();
  }, [get, invalidate, labState.mode, labState.selectedPartId, stageZone]);

  useEffect(() => {
    invalidate();
  }, [heroScrollProgress, labState, reducedMotion, stageZone, invalidate]);

  useFrame((frameState, delta) => {
    if (stageZone === "parked") return;
    stepLuxuryThreeFrame({
      camera: frameState.camera,
      root: rootGroupRef.current,
      entries: partsRef.current,
      stageZone,
      heroScrollProgress,
      labState,
      labTelemetry,
      reducedMotion,
      delta,
      desiredPos,
      desiredTarget,
      invalidate,
    });
  });

  return (
    <>
      <ambientLight intensity={0.62} color="#dce6f2" />
      <directionalLight position={[6, 8, 5]} intensity={2.2} color="#f2f6fb" />
      <directionalLight
        position={[-6, 4, -4]}
        intensity={1.25}
        color="#00d9f5"
      />
      <spotLight
        position={[0, 7.5, -1.5]}
        angle={0.52}
        penumbra={0.85}
        intensity={1.75}
        color="#ffffff"
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[1.65, 2.95, 64]} />
        <meshBasicMaterial
          color={
            labTelemetry.stallRiskWarning && stageZone === "lab"
              ? "#ff4938"
              : "#00d9f5"
          }
          transparent
          opacity={
            stageZone === "lab" && labState.mode === "ground-effect"
              ? 0.3
              : 0.1
          }
        />
      </mesh>

      <group
        ref={rootGroupRef}
        onClick={(event) => {
          if (stageZone !== "lab") return;
          event.stopPropagation();
          let cursor: THREE.Object3D | null = event.object;
          while (cursor) {
            if (typeof cursor.userData?.partId === "string") {
              onSelectPart?.(cursor.userData.partId);
              break;
            }
            cursor = cursor.parent;
          }
        }}
      >
        {sceneClone && <primitive object={sceneClone} />}
      </group>

      {stageZone === "lab" && (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          minDistance={2.1}
          maxDistance={6.8}
          maxPolarAngle={Math.PI * 0.49}
          onChange={() => invalidate()}
        />
      )}
    </>
  );
}

export const EngineeringLuxuryStage3D: React.FC<
  EngineeringLuxuryStage3DProps
> = (props) => {
  const [webglSupported] = useState(() => canCreateWebGlContext());
  const fallbackRef = useRef(props.onFallbackActivated);
  const cleanupContextLossRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fallbackRef.current = props.onFallbackActivated;
  }, [props.onFallbackActivated]);

  useEffect(() => {
    if (!webglSupported) {
      fallbackRef.current?.("ERR_WEBGL_UNAVAILABLE");
    }
    return () => {
      cleanupContextLossRef.current?.();
      cleanupContextLossRef.current = null;
    };
  }, [webglSupported]);

  if (!webglSupported) return null;

  return (
    <StageWebGlErrorBoundary
      onError={(code) => fallbackRef.current?.(code)}
    >
      <Canvas
        frameloop="demand"
        resize={{ offsetSize: true }}
        dpr={[1, 1.75]}
        camera={{
          position: [-4.35, 1.24, -4.05],
          fov: 32,
          near: 0.1,
          far: 60,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          const dom = gl.domElement;
          const handleContextLost = (event: Event) => {
            event.preventDefault();
            fallbackRef.current?.("ERR_WEBGL_CONTEXT_LOST");
          };
          dom.addEventListener("webglcontextlost", handleContextLost);
          cleanupContextLossRef.current = () => {
            dom.removeEventListener("webglcontextlost", handleContextLost);
          };
        }}
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: props.stageZone === "lab" ? "auto" : "none",
        }}
      >
        <LuxuryFp04Scene {...props} />
      </Canvas>
    </StageWebGlErrorBoundary>
  );
};
