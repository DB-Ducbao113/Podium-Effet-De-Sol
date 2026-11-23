import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { RefreshCw, RotateCcw } from "lucide-react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CompactShowroomLayout } from "./CompactShowroomLayout";
import type { ShowroomPaintPreset } from "./CompactShowroomLayout";
import { StageLights, StudioEnvironment } from "./ShowroomStage";
import { STAGE_LIGHTING } from "./showroomStageConfig";
import {
  AdaptiveQualityController,
  type GraphicsMode,
  type QualityProfile,
} from "./model-b/adaptiveController";
import { FrameMetricsCollector } from "./model-b/frameMetrics";
import {
  persistGraphicsMode,
  readGraphicsMode,
} from "./model-b/graphicsPreference";
import {
  FP04RB_ADAPTIVE_QUALITY_CONFIG,
  getFp04rbCameraDistanceScale,
  getFp04rbHotspotDistanceFactor,
  getFp04rbRenderScale,
  getFp04rbVisibleHotspots,
  isFp04rbInteractionActive,
  shouldEnableFp04rbAntialias,
} from "./fp04rbGraphics";
import {
  disposeFp04rb,
  getFp04rbCockpitCameraPosition,
  getFp04rbCockpitFocus,
  getFp04rbMeshAnchor,
  loadFp04rb,
  type Fp04rbAsset,
} from "./Fp04rbLoader";
import {
  observeFp04rbCanvasHost,
  type CanvasSizeSetter,
} from "./fp04rbCanvasResize";
import { useNavigationStore } from "../../store/useNavigationStore";
import "./fp04rbShowroom.css";

type CameraPreset =
  "overview" | "front" | "rear" | "left" | "right" | "top" | "cockpit";
type Hotspot = {
  id: string;
  meshName: string;
  preset: CameraPreset;
  short: { vi: string; en: string };
  title: { vi: string; en: string };
  detail: { vi: string; en: string };
};
type RenderMetrics = {
  fps: number;
  drawCalls: number;
  triangles: number;
  frameTimeP95Ms: number;
  validFrameCount: number;
};

const ORIGINAL_PAINT: readonly ShowroomPaintPreset[] = [
  {
    id: "original",
    name: "Original / Màu gốc",
    colors: ["#d4d8dc", "#37424a", "#f1f3f4"],
  },
];

const HOTSPOTS: readonly Hotspot[] = [
  {
    id: "front-wing",
    meshName: "body_front_wings",
    preset: "front",
    short: { vi: "Cánh trước", en: "Front wing" },
    title: { vi: "Cụm cánh trước", en: "Front wing assembly" },
    detail: {
      vi: "Hotspot gắn trực tiếp vào mesh cánh trước của fp04rb.",
      en: "This marker is attached to the fp04rb front-wing mesh.",
    },
  },
  {
    id: "front-wheel",
    meshName: "wheel.Ft.L_object",
    preset: "left",
    short: { vi: "Bánh trước", en: "Front wheel" },
    title: { vi: "Bánh và mâm trước", en: "Front wheel and rim" },
    detail: {
      vi: "Vị trí lấy từ mesh bánh trước bên trái trong scene nguồn.",
      en: "Position comes from the source scene's left front-wheel mesh.",
    },
  },
  {
    id: "seat",
    meshName: "seat",
    preset: "cockpit",
    short: { vi: "Ghế", en: "Seat" },
    title: { vi: "Ghế lái", en: "Driver seat" },
    detail: {
      vi: "Ghế được giữ lại trong khoang lái trống.",
      en: "The seat remains in the empty cockpit.",
    },
  },
  {
    id: "seatbelts",
    meshName: "seatbelts_harness",
    preset: "cockpit",
    short: { vi: "Dây đai", en: "Harness" },
    title: { vi: "Dây đai an toàn", en: "Safety harness" },
    detail: {
      vi: "Mesh dây đai được giữ riêng và kiểm tra bằng tên node nguồn.",
      en: "The harness mesh is retained and identified by its source node.",
    },
  },
  {
    id: "steering-wheel",
    meshName: "steering_wheel_body.002",
    preset: "cockpit",
    short: { vi: "Vô-lăng", en: "Steering wheel" },
    title: {
      vi: "Vô-lăng và nút điều khiển",
      en: "Steering wheel and controls",
    },
    detail: {
      vi: "Cụm vô-lăng, nút bấm và màn hình lấy từ model nguồn.",
      en: "The steering wheel, buttons and display come from the source model.",
    },
  },
  {
    id: "dashboard",
    meshName: "ferrari_dashboard_screen",
    preset: "cockpit",
    short: { vi: "Bảng điều khiển", en: "Dashboard" },
    title: { vi: "Màn hình bảng điều khiển", en: "Dashboard display" },
    detail: {
      vi: "Hotspot bám vào mesh màn hình bảng điều khiển đã xuất.",
      en: "This marker is attached to the exported dashboard-screen mesh.",
    },
  },
  {
    id: "rear-wing",
    meshName: "rear_wing_no_mod",
    preset: "rear",
    short: { vi: "Cánh sau", en: "Rear wing" },
    title: { vi: "Cánh sau", en: "Rear wing" },
    detail: {
      vi: "Hotspot gắn vào mesh cánh sau của fp04rb.",
      en: "This marker is attached to the fp04rb rear-wing mesh.",
    },
  },
];

const CAMERA_LABELS: Record<CameraPreset, { vi: string; en: string }> = {
  overview: { vi: "Tổng quan", en: "Overview" },
  front: { vi: "Trước", en: "Front" },
  rear: { vi: "Sau", en: "Rear" },
  left: { vi: "Trái", en: "Left" },
  right: { vi: "Phải", en: "Right" },
  top: { vi: "Trên", en: "Top" },
  cockpit: { vi: "Buồng lái", en: "Cockpit" },
};

const GRAPHICS_MODES: readonly GraphicsMode[] = [
  "AUTO",
  "HIGH",
  "BALANCED",
  "PERFORMANCE",
];

function getShowroomStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function supportsWebGl(): boolean {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
}

function CameraRig({
  root,
  preset,
  selectedHotspot,
  reducedMotion,
  viewportWidth,
  controlsRef,
  onInteractionStart,
  onInteractionChange,
}: {
  root: THREE.Group;
  preset: CameraPreset;
  selectedHotspot: Hotspot | null;
  reducedMotion: boolean;
  viewportWidth: number;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  onInteractionStart: () => void;
  onInteractionChange: () => void;
}) {
  const { camera, invalidate, size } = useThree();
  const setControls = useCallback(
    (instance: OrbitControlsImpl | null) => {
      controlsRef.current = instance;
    },
    [controlsRef],
  );
  const bounds = useMemo(() => new THREE.Box3().setFromObject(root), [root]);
  const focus = useMemo(() => {
    if (selectedHotspot) {
      const anchor = getFp04rbMeshAnchor(root, selectedHotspot.meshName);
      if (anchor) return anchor;
    }
    if (preset === "cockpit") {
      return getFp04rbCockpitFocus(root);
    }
    return new THREE.Vector3(0, Math.max(0.72, bounds.max.y * 0.43), 0);
  }, [bounds, preset, root, selectedHotspot]);
  const distanceScale = selectedHotspot
    ? 1
    : getFp04rbCameraDistanceScale(viewportWidth, preset === "cockpit");

  useEffect(() => {
    const distance = 6.8;
    const positions: Record<CameraPreset, THREE.Vector3> = {
      overview: new THREE.Vector3(4.1, 2.5, 6.3),
      front: new THREE.Vector3(0, 1.35, distance),
      rear: new THREE.Vector3(0, 1.35, -distance),
      left: new THREE.Vector3(-distance, 1.55, 0),
      right: new THREE.Vector3(distance, 1.55, 0),
      top: new THREE.Vector3(0.02, 9.2, 0),
      cockpit: getFp04rbCockpitCameraPosition(root),
    };
    camera.position.copy(
      focus
        .clone()
        .add(
          positions[preset].clone().sub(focus).multiplyScalar(distanceScale),
        ),
    );
    camera.lookAt(focus);
    if (controlsRef.current) {
      controlsRef.current.target.copy(focus);
      controlsRef.current.update();
    }
    invalidate();
  }, [
    camera,
    controlsRef,
    distanceScale,
    focus,
    invalidate,
    preset,
    root,
    size.height,
    size.width,
  ]);

  return (
    <OrbitControls
      ref={setControls}
      makeDefault
      enablePan={false}
      enableZoom
      enableDamping={!reducedMotion}
      dampingFactor={0.08}
      minDistance={1.25}
      maxDistance={Math.max(12, 9.2 * distanceScale + 1)}
      maxPolarAngle={Math.PI / 2 - 0.025}
      rotateSpeed={0.78}
      onStart={onInteractionStart}
      onChange={onInteractionChange}
    />
  );
}

function PerformanceProbe({
  controller,
  interactionRef,
  onMetrics,
  onProfileChange,
}: {
  controller: AdaptiveQualityController;
  interactionRef: React.MutableRefObject<{
    lastChangeMs: number;
    epoch: number;
  }>;
  onMetrics: (metrics: RenderMetrics) => void;
  onProfileChange: (profile: QualityProfile) => void;
}) {
  const collector = useRef(new FrameMetricsCollector(5_000));
  const lastPublish = useRef(0);
  const previousEpoch = useRef(-1);
  useFrame(({ gl }, delta) => {
    const now = performance.now();
    const interaction = interactionRef.current;
    if (interaction.epoch !== previousEpoch.current) {
      previousEpoch.current = interaction.epoch;
      collector.current.reset();
      lastPublish.current = 0;
    }
    const continuous = isFp04rbInteractionActive(now, interaction.lastChangeMs);
    if (!continuous) {
      collector.current.reset();
      controller.ingest({
        nowMs: now,
        averageFps: 0,
        frameTimeP95Ms: 0,
        refreshRateHz: 60,
        validFrameCount: 0,
        continuous: false,
      });
      return;
    }

    collector.current.record(now, delta * 1000, true);
    if (now - lastPublish.current < 1_000) return;
    const metrics = collector.current.snapshot(60);
    if (metrics.validFrameCount < 30) return;
    lastPublish.current = now;
    const transition = controller.ingest({
      nowMs: now,
      averageFps: metrics.averageFps,
      frameTimeP95Ms: metrics.frameTimeP95Ms,
      refreshRateHz: 60,
      validFrameCount: metrics.validFrameCount,
      continuous: true,
    });
    if (transition) onProfileChange(transition.to);
    onMetrics({
      fps: Math.round(metrics.averageFps),
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      frameTimeP95Ms: metrics.frameTimeP95Ms,
      validFrameCount: metrics.validFrameCount,
    });
  });
  return null;
}

function ContextGuard({ onContextLost }: { onContextLost: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };
    canvas.addEventListener("webglcontextlost", handleLost);
    return () => canvas.removeEventListener("webglcontextlost", handleLost);
  }, [gl, onContextLost]);
  return null;
}

function Fp04rbScene({
  asset,
  preset,
  selectedHotspot,
  hotspotsEnabled,
  reducedMotion,
  viewportWidth,
  controlsRef,
  onSelectHotspot,
  onMetrics,
  controller,
  interactionRef,
  onProfileChange,
  onInteractionStart,
  onInteractionChange,
  onContextLost,
  lang,
}: {
  asset: Fp04rbAsset;
  preset: CameraPreset;
  selectedHotspot: Hotspot | null;
  hotspotsEnabled: boolean;
  reducedMotion: boolean;
  viewportWidth: number;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  onSelectHotspot: (hotspot: Hotspot) => void;
  onMetrics: (metrics: RenderMetrics) => void;
  controller: AdaptiveQualityController;
  interactionRef: React.MutableRefObject<{
    lastChangeMs: number;
    epoch: number;
  }>;
  onProfileChange: (profile: QualityProfile) => void;
  onInteractionStart: () => void;
  onInteractionChange: () => void;
  onContextLost: () => void;
  lang: "vi" | "en";
}) {
  const root = asset.root;
  const visibleHotspots = getFp04rbVisibleHotspots(
    HOTSPOTS,
    preset,
    selectedHotspot,
  );
  return (
    <>
      <color attach="background" args={["#11161a"]} />
      <fog attach="fog" args={["#11161a", 12, 26]} />
      <StudioEnvironment intensity={STAGE_LIGHTING.neutral.environment} />
      <StageLights mode="neutral" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.018, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#20272d"
          metalness={0.24}
          roughness={0.7}
        />
      </mesh>
      <primitive object={root} dispose={null} />
      {hotspotsEnabled &&
        visibleHotspots.map((hotspot) => {
          const anchor = getFp04rbMeshAnchor(root, hotspot.meshName);
          if (!anchor) return null;
          const active = selectedHotspot?.id === hotspot.id;
          return (
            <Html
              key={hotspot.id}
              position={[anchor.x, anchor.y, anchor.z]}
              center
              distanceFactor={getFp04rbHotspotDistanceFactor(
                preset === "cockpit",
              )}
              zIndexRange={[20, 0]}
            >
              <button
                type="button"
                className={`fp04rb-hotspot${active ? " is-active" : ""}`}
                aria-label={`${lang === "vi" ? "Chi tiết" : "Inspect"}: ${hotspot.title[lang]}`}
                aria-pressed={active}
                onClick={() => onSelectHotspot(hotspot)}
              >
                {HOTSPOTS.findIndex((item) => item.id === hotspot.id) + 1}
              </button>
            </Html>
          );
        })}
      <CameraRig
        root={root}
        preset={preset}
        selectedHotspot={selectedHotspot}
        reducedMotion={reducedMotion}
        viewportWidth={viewportWidth}
        controlsRef={controlsRef}
        onInteractionStart={onInteractionStart}
        onInteractionChange={onInteractionChange}
      />
      <PerformanceProbe
        controller={controller}
        interactionRef={interactionRef}
        onMetrics={onMetrics}
        onProfileChange={onProfileChange}
      />
      <ContextGuard onContextLost={onContextLost} />
    </>
  );
}

export default function Fp04rbShowroom() {
  const lang = useNavigationStore((state) => state.lang);
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const [asset, setAsset] = useState<Fp04rbAsset | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadMetrics, setLoadMetrics] = useState<Pick<
    Fp04rbAsset,
    "bytes" | "triangles" | "fetchMs" | "decodeParseMs" | "prepareMs"
  > | null>(null);
  const [renderMetrics, setRenderMetrics] = useState<RenderMetrics | null>(
    null,
  );
  const [preset, setPreset] = useState<CameraPreset>("overview");
  const [mode, setMode] = useState<GraphicsMode>(() =>
    readGraphicsMode(getShowroomStorage()),
  );
  const [adaptiveController] = useState(
    () =>
      new AdaptiveQualityController(
        0,
        mode === "AUTO" ? "BALANCED" : mode,
        FP04RB_ADAPTIVE_QUALITY_CONFIG,
      ),
  );
  const [qualityProfile, setQualityProfile] = useState<QualityProfile>(() =>
    mode === "AUTO" ? "BALANCED" : mode,
  );
  const [hotspotsEnabled, setHotspotsEnabled] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const assetRef = useRef<Fp04rbAsset | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasSetSizeRef = useRef<CanvasSizeSetter | null>(null);
  const interactionRef = useRef({ lastChangeMs: 0, epoch: 0 });
  const interactionMetricsIdleTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const english = lang === "en";
  useEffect(() => {
    const host = stageRef.current;
    if (!host) return;
    return observeFp04rbCanvasHost(host, (width, height) =>
      canvasSetSizeRef.current?.(width, height),
    );
  }, []);

  useEffect(() => () => {
    if (interactionMetricsIdleTimerRef.current !== null) {
      clearTimeout(interactionMetricsIdleTimerRef.current);
    }
  });

  useEffect(() => {
    const now = performance.now();
    if (mode === "AUTO") adaptiveController.resetAuto(now, "BALANCED");
    else adaptiveController.setMode(mode, now);
  }, [adaptiveController, mode]);

  useEffect(() => {
    setWebglAvailable(supportsWebGl());
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateViewport = () => setViewportWidth(window.innerWidth);
    updateMotion();
    updateViewport();
    media.addEventListener("change", updateMotion);
    window.addEventListener("resize", updateViewport);
    return () => {
      media.removeEventListener("change", updateMotion);
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(() => {
    if (!asset || loadError || webglAvailable === false) {
      canvasSetSizeRef.current = null;
    }
    if (loadError || webglAvailable === false) {
      const current = assetRef.current;
      if (current) {
        assetRef.current = null;
        disposeFp04rb(current.root);
        setAsset(null);
        setLoadMetrics(null);
        setRenderMetrics(null);
      }
    }
  }, [asset, loadError, webglAvailable]);
  useEffect(() => {
    if (webglAvailable !== true) return;
    const controller = new AbortController();
    setAsset(null);
    setLoadError("");
    setLoadMetrics(null);
    setRenderMetrics(null);
    setSelectedHotspot(null);
    setPreset("overview");
    void loadFp04rb(controller.signal)
      .then((loaded) => {
        if (controller.signal.aborted) {
          disposeFp04rb(loaded.root);
          return;
        }
        assetRef.current = loaded;
        setLoadMetrics({
          bytes: loaded.bytes,
          triangles: loaded.triangles,
          fetchMs: loaded.fetchMs,
          decodeParseMs: loaded.decodeParseMs,
          prepareMs: loaded.prepareMs,
        });
        setAsset(loaded);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          reason instanceof Error
            ? reason.message
            : english
              ? "The fp04rb model could not be loaded."
              : "Không tải được model fp04rb.",
        );
      });
    return () => {
      controller.abort();
      const current = assetRef.current;
      if (current) {
        assetRef.current = null;
        disposeFp04rb(current.root);
      }
    };
  }, [english, loadAttempt, webglAvailable]);

  const onMetrics = useCallback((metrics: RenderMetrics) => {
    setRenderMetrics(metrics);
  }, []);
  const onProfileChange = useCallback((profile: QualityProfile) => {
    setQualityProfile(profile);
  }, []);
  const changeMode = useCallback((next: GraphicsMode) => {
    setQualityProfile(next === "AUTO" ? "BALANCED" : next);
    setMode(next);
    persistGraphicsMode(getShowroomStorage(), next);
  }, []);
  const onContextLost = useCallback(() => {
    setLoadError(
      english ? "The WebGL context was lost." : "WebGL đã mất kết nối.",
    );
  }, [english]);
  const onInteractionStart = useCallback(() => {
    if (interactionMetricsIdleTimerRef.current !== null) {
      clearTimeout(interactionMetricsIdleTimerRef.current);
      interactionMetricsIdleTimerRef.current = null;
    }
    const nowMs = performance.now();
    const interaction = interactionRef.current;
    if (!isFp04rbInteractionActive(nowMs, interaction.lastChangeMs)) {
      interaction.epoch += 1;
      setRenderMetrics(null);
      adaptiveController.ingest({
        nowMs,
        averageFps: 0,
        frameTimeP95Ms: 0,
        refreshRateHz: 60,
        validFrameCount: 0,
        continuous: false,
      });
    }
    interaction.lastChangeMs = nowMs;
  }, [adaptiveController]);
  const onInteractionChange = useCallback(() => {
    interactionRef.current.lastChangeMs = performance.now();
    if (interactionMetricsIdleTimerRef.current !== null) {
      clearTimeout(interactionMetricsIdleTimerRef.current);
    }
    interactionMetricsIdleTimerRef.current = setTimeout(() => {
      interactionMetricsIdleTimerRef.current = null;
      setRenderMetrics(null);
    }, 750);
  }, []);

  const pixelRatio = useMemo(
    () => getFp04rbRenderScale(mode, qualityProfile, viewportWidth),
    [mode, qualityProfile, viewportWidth],
  );
  const adaptiveState = adaptiveController.getState();

  const zoom = useCallback((factor: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const offset = controls.object.position.clone().sub(controls.target);
    offset.multiplyScalar(factor);
    const distance = THREE.MathUtils.clamp(offset.length(), 1.25, 12);
    offset.setLength(distance);
    controls.object.position.copy(controls.target).add(offset);
    controls.update();
  }, []);

  const resetCamera = useCallback(() => {
    setSelectedHotspot(null);
    setPreset("overview");
    controlsRef.current?.reset();
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const controls = controlsRef.current;
      if (!controls) return;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoom(0.88);
        return;
      }
      if (event.key === "-") {
        event.preventDefault();
        zoom(1.14);
        return;
      }
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        resetCamera();
        return;
      }
      if (
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
      )
        return;
      event.preventDefault();
      const spherical = new THREE.Spherical().setFromVector3(
        controls.object.position.clone().sub(controls.target),
      );
      const step = event.shiftKey ? 0.16 : 0.08;
      if (event.key === "ArrowLeft") spherical.theta -= step;
      if (event.key === "ArrowRight") spherical.theta += step;
      if (event.key === "ArrowUp")
        spherical.phi = Math.max(0.08, spherical.phi - step);
      if (event.key === "ArrowDown")
        spherical.phi = Math.min(Math.PI / 2 - 0.03, spherical.phi + step);
      controls.object.position
        .copy(controls.target)
        .add(new THREE.Vector3().setFromSpherical(spherical));
      controls.update();
    },
    [resetCamera, zoom],
  );

  const selectedPaintId = "original";
  const graphicsSummary = `${mode} · ${pixelRatio.toFixed(2)}×`;
  const retry = () => {
    setWebglAvailable(supportsWebGl());
    setLoadError("");
    setLoadAttempt((attempt) => attempt + 1);
  };

  return (
    <section className="fp04rb-showroom" data-testid="fp04rb-showroom">
      <CompactShowroomLayout
        paintPresets={ORIGINAL_PAINT}
        selectedPaintId={selectedPaintId}
        onSelectPaint={() => undefined}
        modelLabel="FP04RB"
        lang={lang}
        graphicsSummary={graphicsSummary}
        hotspotsEnabled={hotspotsEnabled}
        onToggleHotspots={() => setHotspotsEnabled((value) => !value)}
        cameraControls={
          <nav
            className="fp04rb-camera-bar"
            aria-label={english ? "Camera views" : "Góc camera"}
          >
            {(Object.keys(CAMERA_LABELS) as CameraPreset[]).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={preset === item && !selectedHotspot}
                onClick={() => {
                  setSelectedHotspot(null);
                  setPreset(item);
                }}
              >
                {CAMERA_LABELS[item][lang]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => zoom(1.2)}
              aria-label={english ? "Zoom out" : "Thu nhỏ"}
            >
              −
            </button>
            <button
              type="button"
              onClick={() => zoom(0.83)}
              aria-label={english ? "Zoom in" : "Phóng to"}
            >
              +
            </button>
            <button
              type="button"
              onClick={resetCamera}
              aria-label={english ? "Reset camera" : "Đặt lại camera"}
            >
              <RotateCcw aria-hidden="true" size={14} />
            </button>
          </nav>
        }
        anatomyPanel={
          <div className="fp04rb-panel-list">
            {HOTSPOTS.map((hotspot) => (
              <button
                key={hotspot.id}
                type="button"
                className={
                  selectedHotspot?.id === hotspot.id ? "is-active" : ""
                }
                onClick={() => {
                  setSelectedHotspot(hotspot);
                  setPreset(hotspot.preset);
                }}
                aria-pressed={selectedHotspot?.id === hotspot.id}
              >
                <span>{hotspot.title[lang]}</span>
                <small>{hotspot.detail[lang]}</small>
              </button>
            ))}
          </div>
        }
        graphicsPanel={
          <section
            aria-label={english ? "Graphics quality" : "Chất lượng đồ họa"}
          >
            <h3>{english ? "Graphics quality" : "Chất lượng đồ họa"}</h3>
            <div className="fp04rb-mode-list">
              {GRAPHICS_MODES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={mode === option}
                  onClick={() => changeMode(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="fp04rb-reset-quality"
              onClick={() => changeMode("AUTO")}
            >
              {english ? "Reset to AUTO" : "Đặt lại AUTO"}
            </button>
            <p>
              {english
                ? `Render scale ${pixelRatio.toFixed(2)}×`
                : `Tỷ lệ dựng hình ${pixelRatio.toFixed(2)}×`}
            </p>
          </section>
        }
        specificationsPanel={
          <section
            aria-label={
              english ? "Showroom render metrics" : "Chỉ số dựng hình Showroom"
            }
          >
            <h3>{english ? "Render metrics" : "Chỉ số dựng hình"}</h3>
            <dl className="fp04rb-metrics-list">
              <dt>{english ? "Asset" : "Dung lượng"}</dt>
              <dd>
                {loadMetrics
                  ? `${(loadMetrics.bytes / 1024 / 1024).toFixed(2)} MiB`
                  : "—"}
              </dd>
              <dt>{english ? "Triangles" : "Tam giác"}</dt>
              <dd>{loadMetrics?.triangles.toLocaleString(lang) ?? "—"}</dd>
              <dt>
                {english
                  ? "Fetch / parse / prepare"
                  : "Tải / phân tích / chuẩn bị"}
              </dt>
              <dd>
                {loadMetrics
                  ? `${Math.round(loadMetrics.fetchMs)} / ${Math.round(loadMetrics.decodeParseMs)} / ${Math.round(loadMetrics.prepareMs)} ms`
                  : "—"}
              </dd>
              <dt>FPS / draw calls</dt>
              <dd>
                {renderMetrics
                  ? `${renderMetrics.fps} / ${renderMetrics.drawCalls}`
                  : "—"}
              </dd>
              <dt>Frame P95</dt>
              <dd>
                {renderMetrics
                  ? `${renderMetrics.frameTimeP95Ms.toFixed(1)} ms`
                  : "—"}
              </dd>
              <dt>{english ? "Rendered triangles" : "Tam giác đang dựng"}</dt>
              <dd>{renderMetrics?.triangles.toLocaleString(lang) ?? "—"}</dd>
            </dl>
          </section>
        }
      >
        <div
          className="fp04rb-showroom__stage"
          data-testid="fp04rb-stage"
          data-render-fps={import.meta.env.DEV ? renderMetrics?.fps : undefined}
          data-render-draw-calls={
            import.meta.env.DEV ? renderMetrics?.drawCalls : undefined
          }
          data-render-triangles={
            import.meta.env.DEV ? renderMetrics?.triangles : undefined
          }
          data-render-frame-p95={
            import.meta.env.DEV
              ? renderMetrics?.frameTimeP95Ms.toFixed(1)
              : undefined
          }
          data-render-valid-frames={
            import.meta.env.DEV ? renderMetrics?.validFrameCount : undefined
          }
          data-controller-mode={
            import.meta.env.DEV ? adaptiveState.mode : undefined
          }
          data-controller-profile={
            import.meta.env.DEV ? adaptiveState.profile : undefined
          }
          data-controller-transitions={
            import.meta.env.DEV ? adaptiveState.transitionCount : undefined
          }
          data-controller-cooldown-until={
            import.meta.env.DEV ? adaptiveState.cooldownUntilMs : undefined
          }
          data-controller-warmup-until={
            import.meta.env.DEV ? adaptiveState.warmupUntilMs : undefined
          }
          data-quality-profile={
            import.meta.env.DEV ? qualityProfile : undefined
          }
          data-render-scale={import.meta.env.DEV ? pixelRatio : undefined}
          ref={stageRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label={
            english ? "Interactive fp04rb model" : "Model fp04rb tương tác"
          }
        >
          {webglAvailable && asset && !loadError && (
            <Canvas
              frameloop="demand"
              camera={{
                position: [4.1, 2.5, 6.3],
                fov: 37,
                near: 0.1,
                far: 80,
              }}
              dpr={pixelRatio}
              resize={{ offsetSize: true }}
              gl={{
                antialias: shouldEnableFp04rbAntialias(mode),
                alpha: false,
                powerPreference: "high-performance",
              }}
              onCreated={({ invalidate, setSize }) => {
                canvasSetSizeRef.current = setSize;
                const host = stageRef.current;
                if (host && host.offsetWidth > 0 && host.offsetHeight > 0) {
                  setSize(host.offsetWidth, host.offsetHeight);
                }
                invalidate();
              }}
              onPointerMissed={() => setSelectedHotspot(null)}
            >
              <Suspense fallback={null}>
                <Fp04rbScene
                  asset={asset}
                  preset={preset}
                  selectedHotspot={selectedHotspot}
                  hotspotsEnabled={hotspotsEnabled}
                  reducedMotion={reducedMotion}
                  viewportWidth={viewportWidth}
                  controlsRef={controlsRef}
                  controller={adaptiveController}
                  interactionRef={interactionRef}
                  onSelectHotspot={(hotspot) => {
                    setSelectedHotspot(hotspot);
                    setPreset(hotspot.preset);
                  }}
                  onMetrics={onMetrics}
                  onProfileChange={onProfileChange}
                  onInteractionStart={onInteractionStart}
                  onInteractionChange={onInteractionChange}
                  onContextLost={onContextLost}
                  lang={lang}
                />
              </Suspense>
            </Canvas>
          )}
          {(webglAvailable === false || loadError) && (
            <div className="fp04rb-showroom__fallback" role="alert">
              <strong>
                {english
                  ? "3D model unavailable"
                  : "Không thể hiển thị model 3D"}
              </strong>
              <span>
                {loadError ||
                  (english
                    ? "WebGL is unavailable in this browser."
                    : "Trình duyệt này không hỗ trợ WebGL.")}
              </span>
              <button type="button" onClick={retry}>
                <RefreshCw aria-hidden="true" size={14} />
                {english ? "Try again" : "Thử lại"}
              </button>
            </div>
          )}
          {webglAvailable === null && (
            <div className="fp04rb-showroom__loading" role="status">
              {english ? "Checking WebGL…" : "Đang kiểm tra WebGL…"}
            </div>
          )}
          {webglAvailable && !asset && !loadError && (
            <div className="fp04rb-showroom__loading" role="status">
              {english ? "Loading fp04rb…" : "Đang tải fp04rb…"}
            </div>
          )}
          <div className="fp04rb-showroom__identity">
            <span>DEV · PRIVATE MODEL REVIEW</span>
            <strong>fp04rb</strong>
            <a
              href="https://www.behance.net/gallery/151353017/FP-04-RB-FREE-3D-MODEL"
              target="_blank"
              rel="noreferrer"
            >
              {english ? "Model by Peter Kiss" : "Model của Peter Kiss"}
            </a>
          </div>
          {selectedHotspot && (
            <div className="fp04rb-showroom__hotspot-card" role="status">
              <strong>{selectedHotspot.title[lang]}</strong>
              <span>{selectedHotspot.detail[lang]}</span>
            </div>
          )}
          <p className="fp04rb-showroom__rights" role="note">
            {english
              ? "Public redistribution is not cleared. Local DEV review only."
              : "Chưa có quyền phát tán công khai. Chỉ xem trong DEV local."}
          </p>
        </div>
      </CompactShowroomLayout>
    </section>
  );
}
