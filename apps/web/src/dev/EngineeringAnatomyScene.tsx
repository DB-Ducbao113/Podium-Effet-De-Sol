import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  CameraController,
  type CameraPreset,
} from "../components/showroom/CameraController";
import { ANATOMY_CHAPTERS } from "../components/engineering/anatomyChapters";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { QualityProfile } from "../components/showroom/model-b/adaptiveController";
import { FrameMetricsCollector } from "../components/showroom/model-b/frameMetrics";
import { QUALITY_PROFILES } from "../components/showroom/model-b/qualityProfiles";
import { applyModelBLivery } from "../components/showroom/model-b/modelBMaterials";
import { MODEL_B_LIVERIES } from "../components/showroom/model-b/modelBExperience";
import { disposeModelB, loadModelB } from "../components/showroom/model-b/modelBLoader";

export interface AnatomySceneMetrics {
  medianFps: number;
  frameTimeP95Ms: number;
  validFrameCount: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

interface Props {
  chapterId: string;
  cameraPreset: CameraPreset;
  presetTrigger: number;
  lang: "vi" | "en";
  visible: boolean;
  profile: QualityProfile;
  onSelect: (id: string) => void;
  onLoaded: (evidence: {
    fetchMs: number;
    decodeParseMs: number;
    firstFrameMs: number;
    bytes: number;
  }) => void;
  onError: (message: string) => void;
  onContextLost: (lost: boolean) => void;
  onMetrics: (metrics: AnatomySceneMetrics) => void;
}

function Model({
  onReady,
  onError,
}: {
  onReady: (
    scene: THREE.Group,
    evidence: { fetchMs: number; decodeParseMs: number; bytes: number },
  ) => void;
  onError: (message: string) => void;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let owned: THREE.Group | null = null;
    void loadModelB(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) {
          disposeModelB(result.scene);
          return;
        }
        owned = result.scene;
        applyModelBLivery(owned, MODEL_B_LIVERIES[0]);
        setModel(owned);
        onReady(owned, result);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          onError(
            error instanceof Error ? error.message : "Model B load failed",
          );
      });
    return () => {
      controller.abort();
      if (owned) disposeModelB(owned);
    };
  }, [onReady, onError]);
  return model ? <primitive object={model} /> : null;
}

function ContextGuard({
  onContextLost,
}: {
  onContextLost: (lost: boolean) => void;
}) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onContextLost(true);
    };
    const restored = () => onContextLost(false);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, [gl, onContextLost]);
  return null;
}

function Metrics({
  active,
  onMetrics,
  onFirstFrame,
}: {
  active: boolean;
  onMetrics: (metrics: AnatomySceneMetrics) => void;
  onFirstFrame: () => void;
}) {
  const { gl } = useThree();
  const collector = useRef(new FrameMetricsCollector());
  const lastPublish = useRef(0);
  const firstSent = useRef(false);
  useFrame((_, delta) => {
    if (!active) return;
    if (!firstSent.current) {
      firstSent.current = true;
      onFirstFrame();
    }
    const now = performance.now();
    collector.current.record(
      now,
      delta * 1000,
      document.visibilityState === "visible",
    );
    if (now - lastPublish.current < 1000) return;
    lastPublish.current = now;
    const snapshot = collector.current.snapshot(60);
    onMetrics({
      medianFps: snapshot.medianFps,
      frameTimeP95Ms: snapshot.frameTimeP95Ms,
      validFrameCount: snapshot.validFrameCount,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
    });
  });
  return null;
}

export default function EngineeringAnatomyScene({
  chapterId,
  cameraPreset,
  presetTrigger,
  lang,
  visible,
  profile,
  onSelect,
  onLoaded,
  onError,
  onContextLost,
  onMetrics,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [firstFrame, setFirstFrame] = useState<number | null>(null);
  const [loadEvidence, setLoadEvidence] = useState<{
    fetchMs: number;
    decodeParseMs: number;
    bytes: number;
  } | null>(null);
  const start = useRef(0);
  useEffect(() => {
    start.current = performance.now();
  }, []);
  const onReady = useCallback(
    (
      _scene: THREE.Group,
      evidence: { fetchMs: number; decodeParseMs: number; bytes: number },
    ) => {
      setReady(true);
      setLoadEvidence(evidence);
    },
    [],
  );
  const onFirstFrame = useCallback(
    () =>
      setFirstFrame((current) => current ?? performance.now() - start.current),
    [],
  );
  useEffect(() => {
    if (loadEvidence && firstFrame !== null)
      onLoaded({ ...loadEvidence, firstFrameMs: firstFrame });
  }, [loadEvidence, firstFrame, onLoaded]);
  const selected = ANATOMY_CHAPTERS.find((chapter) => chapter.id === chapterId);
  const dpr = Math.min(
    (typeof window === "undefined" ? 1 : window.devicePixelRatio) *
    QUALITY_PROFILES[profile].renderScale,
    2,
  );
  return (
    <Canvas
      aria-label={
        lang === "vi"
          ? "Mô hình Model B tương tác"
          : "Interactive Model B vehicle"
      }
      dpr={dpr}
      resize={{ offsetSize: true }}
      frameloop={visible ? "always" : "never"}
      camera={{ position: [2.8, 1.4, -2.8], fov: 38, near: 0.01, far: 100 }}
      gl={{
        antialias: profile === "HIGH",
        alpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
      }}
    >
      <color attach="background" args={["#1b2026"]} />
      <hemisphereLight args={["#e7edf7", "#20252b", 1.25]} />
      <directionalLight color="#fff7ee" intensity={4} position={[12, 18, 15]} />
      <directionalLight
        color="#b9c8dd"
        intensity={2}
        position={[-12, 8, -14]}
      />
      <directionalLight
        color="#eef4ff"
        intensity={2.6}
        position={[-15, 18, 8]}
      />
      <Model onReady={onReady} onError={onError} />
      {ready && selected && (
        <Html
          position={selected.hotspot.position}
          center
          zIndexRange={[19, 10]}
        >
          <button
            type="button"
            onClick={() => onSelect(selected.id)}
            aria-label={`${lang === "vi" ? "Xem" : "View"} ${selected.name[lang]}`}
            className="engineering-marker"
            data-testid="anatomy-marker"
          >
            +
          </button>
        </Html>
      )}
      <CameraController
        activeHotspot={ready && selected ? selected.hotspot : null}
        cameraPreset={cameraPreset}
        presetTrigger={presetTrigger}
        autoRotate={false}
        reduceMotion={reducedMotion}
        compactStage
        narrowFramingMultiplier={1.6}
        enableWheelZoom={false}
      />
      <ContextGuard onContextLost={onContextLost} />
      <Metrics
        active={visible && ready}
        onMetrics={onMetrics}
        onFirstFrame={onFirstFrame}
      />
    </Canvas>
  );
}
