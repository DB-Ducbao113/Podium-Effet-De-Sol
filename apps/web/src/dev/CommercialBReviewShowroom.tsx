import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { ChevronDown, Gauge, RotateCcw, Settings2 } from 'lucide-react';
import { CameraController, type CameraPreset } from '../components/showroom/CameraController';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useNavigationStore } from '../store/useNavigationStore';
import {
  AdaptiveQualityController,
  type GraphicsMode,
  type ProfileTransition,
  type QualityProfile,
} from './commercial-b/adaptiveController';
import { FrameMetricsCollector, type FrameMetrics } from './commercial-b/frameMetrics';
import {
  GRAPHICS_MODE_STORAGE_KEY,
  persistGraphicsMode,
  readGraphicsMode,
} from './commercial-b/graphicsPreference';
import { QUALITY_PROFILES } from './commercial-b/qualityProfiles';

const MODEL_URL = '/__peds-review/model-b.glb';
const MODES: GraphicsMode[] = ['AUTO', 'HIGH', 'BALANCED', 'PERFORMANCE'];
const CAMERA_PRESETS: CameraPreset[] = ['overview', 'front', 'side', 'cockpit', 'rear', 'top'];

interface LoadEvidence {
  fetchMs: number;
  decodeParseMs: number;
  firstRenderMs: number | null;
  bytes: number;
}

interface LiveMetrics extends FrameMetrics {
  gpuTimerStatus: 'PENDING' | 'AVAILABLE' | 'NOT AVAILABLE';
  gpuTimeP50Ms: number | null;
  gpuTimeP95Ms: number | null;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  renderWidth: number;
  renderHeight: number;
  effectiveDpr: number;
  transitionCount: number;
  transitions: ProfileTransition[];
  continuous: boolean;
}

const EMPTY_METRICS: LiveMetrics = {
  averageFps: 0,
  medianFps: 0,
  onePercentLowFps: 0,
  frameTimeP50Ms: 0,
  frameTimeP95Ms: 0,
  spikeCount: 0,
  validFrameCount: 0,
  gpuTimerStatus: 'PENDING',
  gpuTimeP50Ms: null,
  gpuTimeP95Ms: null,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  renderWidth: 0,
  renderHeight: 0,
  effectiveDpr: 1,
  transitionCount: 0,
  transitions: [],
  continuous: false,
};

type ReviewApiState = LiveMetrics & {
  mode: GraphicsMode;
  profile: QualityProfile;
  modelLoaded: boolean;
  contextLost: boolean;
  loadEvidence: LoadEvidence;
  storageKey: string;
};

declare global {
  interface Window {
    __PEDS_B7__?: {
      getState: () => ReviewApiState;
      setMode: (mode: GraphicsMode) => void;
      resetAuto: () => void;
      setContinuous: (value: boolean | null) => void;
      loseContext: () => boolean;
      restoreContext: () => boolean;
    };
    __PEDS_B7_READY__?: boolean;
  }
}

const disposeObject = (root: THREE.Object3D) => {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) material.dispose();
  });
};

const prepareModel = (scene: THREE.Group) => {
  scene.rotation.y = Math.PI / 2;
  scene.updateMatrixWorld(true);
  let bounds = new THREE.Box3().setFromObject(scene);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 5.05 / Math.max(size.x, size.z);
  scene.scale.setScalar(scale);
  scene.updateMatrixWorld(true);
  bounds = new THREE.Box3().setFromObject(scene);
  const center = bounds.getCenter(new THREE.Vector3());
  scene.position.set(-center.x, -bounds.min.y, -center.z);
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });
  scene.updateMatrixWorld(true);
  return scene;
};

const FrozenCommercialModel: React.FC<{
  onLoaded: (evidence: Omit<LoadEvidence, 'firstRenderMs'>) => void;
  onError: (message: string) => void;
}> = ({ onLoaded, onError }) => {
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ownedModel: THREE.Group | null = null;
    const load = async () => {
      try {
        const fetchStarted = performance.now();
        const response = await fetch(MODEL_URL, { cache: 'no-store', signal: controller.signal });
        if (!response.ok)
          throw new Error(`HTTP ${response.status} while loading the local candidate`);
        const buffer = await response.arrayBuffer();
        const fetchMs = performance.now() - fetchStarted;
        await MeshoptDecoder.ready;
        const parseStarted = performance.now();
        const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
        const gltf = await new Promise<Awaited<ReturnType<GLTFLoader['parseAsync']>>>(
          (resolve, reject) => loader.parse(buffer, '', resolve, reject),
        );
        if (controller.signal.aborted) {
          disposeObject(gltf.scene);
          return;
        }
        ownedModel = prepareModel(gltf.scene);
        setModel(ownedModel);
        onLoaded({
          fetchMs,
          decodeParseMs: performance.now() - parseStarted,
          bytes: buffer.byteLength,
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          onError(error instanceof Error ? error.message : 'Unknown Model B load failure');
        }
      }
    };
    void load();
    return () => {
      controller.abort();
      if (ownedModel) disposeObject(ownedModel);
    };
  }, [onError, onLoaded]);

  return model ? <primitive object={model} /> : null;
};

const ReviewContextGuard: React.FC<{
  onContextState: (lost: boolean) => void;
  onExtension: (extension: WEBGL_lose_context | null) => void;
}> = ({ onContextState, onExtension }) => {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    onExtension(gl.getContext().getExtension('WEBGL_lose_context'));
    const lost = (event: Event) => {
      event.preventDefault();
      onContextState(true);
    };
    const restored = () => onContextState(false);
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    return () => {
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
    };
  }, [gl, onContextState, onExtension]);
  return null;
};

const PerformanceProbe: React.FC<{
  active: boolean;
  transitions: ProfileTransition[];
  onMetrics: (metrics: LiveMetrics) => void;
  onFirstRender: (atMs: number) => void;
}> = ({ active, transitions, onMetrics, onFirstRender }) => {
  const { gl, scene, camera } = useThree();
  const collector = useRef(new FrameMetricsCollector());
  const lastPublish = useRef(0);
  const firstRenderSent = useRef(false);
  const gpuValues = useRef<number[]>([]);
  const pendingQueries = useRef<WebGLQuery[]>([]);
  const context = gl.getContext();
  const webgl2 = context instanceof WebGL2RenderingContext ? context : null;
  const timerExtension = useMemo(
    () => webgl2?.getExtension('EXT_disjoint_timer_query_webgl2') ?? null,
    [webgl2],
  );

  useEffect(() => {
    collector.current.reset();
    firstRenderSent.current = false;
  }, [active]);

  useEffect(
    () => () => {
      if (!webgl2) return;
      for (const query of pendingQueries.current) webgl2.deleteQuery(query);
    },
    [webgl2],
  );

  useFrame((_, delta) => {
    const now = performance.now();
    const valid = active && document.visibilityState === 'visible';
    collector.current.record(now, delta * 1000, valid);

    let query: WebGLQuery | null = null;
    if (timerExtension && webgl2 && valid) {
      query = webgl2.createQuery();
      if (query) webgl2.beginQuery(timerExtension.TIME_ELAPSED_EXT, query);
    }
    gl.render(scene, camera);
    if (query && timerExtension && webgl2) {
      webgl2.endQuery(timerExtension.TIME_ELAPSED_EXT);
      pendingQueries.current.push(query);
    }
    if (!firstRenderSent.current && active) {
      firstRenderSent.current = true;
      onFirstRender(now);
    }

    if (timerExtension && webgl2) {
      const retained: WebGLQuery[] = [];
      for (const pending of pendingQueries.current) {
        if (webgl2.getQueryParameter(pending, webgl2.QUERY_RESULT_AVAILABLE)) {
          const disjoint = webgl2.getParameter(timerExtension.GPU_DISJOINT_EXT);
          if (!disjoint) {
            gpuValues.current.push(
              webgl2.getQueryParameter(pending, webgl2.QUERY_RESULT) / 1_000_000,
            );
          }
          webgl2.deleteQuery(pending);
        } else {
          retained.push(pending);
        }
      }
      pendingQueries.current = retained.slice(-12);
      gpuValues.current = gpuValues.current.slice(-180);
    }

    if (now - lastPublish.current >= 500) {
      lastPublish.current = now;
      const snapshot = collector.current.snapshot(60);
      const gpu = [...gpuValues.current].sort((a, b) => a - b);
      const percentile = (ratio: number) =>
        gpu.length ? gpu[Math.floor((gpu.length - 1) * ratio)] : null;
      onMetrics({
        ...snapshot,
        gpuTimerStatus: timerExtension ? (gpu.length ? 'AVAILABLE' : 'PENDING') : 'NOT AVAILABLE',
        gpuTimeP50Ms: percentile(0.5),
        gpuTimeP95Ms: percentile(0.95),
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        renderWidth: context.drawingBufferWidth,
        renderHeight: context.drawingBufferHeight,
        effectiveDpr: gl.getPixelRatio(),
        transitionCount: transitions.length,
        transitions,
        continuous: active,
      });
    }
  }, 1);
  return null;
};

const GraphicsSettings: React.FC<{
  lang: 'vi' | 'en';
  mode: GraphicsMode;
  profile: QualityProfile;
  metrics: LiveMetrics;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMode: (mode: GraphicsMode) => void;
  onReset: () => void;
}> = ({ lang, mode, profile, metrics, open, onOpenChange, onMode, onReset }) => {
  const [advanced, setAdvanced] = useState(false);
  useEffect(() => {
    if (!open) setAdvanced(false);
  }, [open]);
  const labels = {
    AUTO: lang === 'vi' ? 'Tự động' : 'Auto',
    HIGH: lang === 'vi' ? 'Cao' : 'High',
    BALANCED: lang === 'vi' ? 'Cân bằng' : 'Balanced',
    PERFORMANCE: lang === 'vi' ? 'Hiệu năng' : 'Performance',
  } as const;
  return (
    <div className="absolute right-3 top-3 z-30 w-[min(22rem,calc(100%-1.5rem))] text-left">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="ml-auto flex items-center gap-2 rounded-xl border border-white/15 bg-black/75 px-3 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-f1red"
      >
        <Settings2 className="h-4 w-4 text-f1red" />
        {lang === 'vi' ? 'Cài đặt đồ họa' : 'Graphics Settings'}
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-studio-200">
          {profile}
        </span>
      </button>
      {open && (
        <section
          className="mt-2 rounded-2xl border border-white/15 bg-[#080a0f]/95 p-3 shadow-2xl backdrop-blur-xl"
          aria-label={lang === 'vi' ? 'Cài đặt đồ họa' : 'Graphics settings'}
        >
          <div className="mb-3 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg bg-white/5 p-2">
              <span className="block text-studio-400">
                {lang === 'vi' ? 'Chế độ chọn' : 'Selected mode'}
              </span>
              <strong>{labels[mode]}</strong>
              <span className="ml-1.5 rounded bg-black/40 px-1.5 py-0.5 text-[9px] text-amber-300">
                {mode === 'AUTO' ? 'AUTO' : 'MANUAL'}
              </span>
            </div>
            <div className="rounded-lg bg-white/5 p-2">
              <span className="block text-studio-400">
                {lang === 'vi' ? 'Hồ sơ đang chạy' : 'Active profile'}
              </span>
              <strong>
                {profile} · {QUALITY_PROFILES[profile].renderScale.toFixed(2)}×
              </strong>
            </div>
          </div>
          <div
            className="grid grid-cols-2 gap-2"
            role="group"
            aria-label={lang === 'vi' ? 'Chế độ chất lượng' : 'Quality mode'}
          >
            {MODES.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={mode === item}
                onClick={() => onMode(item)}
                className={`rounded-lg border px-2 py-2 text-[11px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-f1red ${mode === item ? 'border-f1red bg-f1red/20 text-white' : 'border-white/10 bg-white/5 text-studio-300 hover:bg-white/10'}`}
              >
                {labels[item]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onReset}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2 py-2 text-[11px] font-bold text-studio-300 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-f1red"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {lang === 'vi' ? 'Đặt lại AUTO' : 'Reset AUTO'}
          </button>
          <button
            type="button"
            aria-expanded={advanced}
            onClick={() => setAdvanced((value) => !value)}
            className="mt-3 flex w-full items-center justify-between border-t border-white/10 pt-3 text-[11px] font-bold text-studio-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-f1red"
          >
            <span>{lang === 'vi' ? 'Chỉ số nâng cao' : 'Advanced metrics'}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${advanced ? 'rotate-180' : ''}`}
            />
          </button>
          {advanced && (
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-studio-300">
              <dt>FPS avg / 1% low</dt>
              <dd className="text-right text-white">
                {metrics.averageFps.toFixed(1)} / {metrics.onePercentLowFps.toFixed(1)}
              </dd>
              <dt>Frame P50 / P95</dt>
              <dd className="text-right text-white">
                {metrics.frameTimeP50Ms.toFixed(1)} / {metrics.frameTimeP95Ms.toFixed(1)} ms
              </dd>
              <dt>GPU P50 / P95</dt>
              <dd className="text-right text-white">
                {metrics.gpuTimerStatus === 'AVAILABLE'
                  ? `${metrics.gpuTimeP50Ms?.toFixed(1)} / ${metrics.gpuTimeP95Ms?.toFixed(1)} ms`
                  : metrics.gpuTimerStatus}
              </dd>
              <dt>Render / DPR</dt>
              <dd className="text-right text-white">
                {metrics.renderWidth}×{metrics.renderHeight} / {metrics.effectiveDpr.toFixed(2)}
              </dd>
              <dt>Calls / triangles</dt>
              <dd className="text-right text-white">
                {metrics.drawCalls} / {metrics.triangles.toLocaleString()}
              </dd>
              <dt>Spikes / transitions</dt>
              <dd className="text-right text-white">
                {metrics.spikeCount} / {metrics.transitionCount}
              </dd>
            </dl>
          )}
        </section>
      )}
    </div>
  );
};

const ReviewFallback: React.FC<{ message?: string }> = ({ message }) => (
  <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#07090d] p-8 text-center">
    <div className="max-w-md rounded-2xl border border-white/10 bg-black/50 p-6">
      <Gauge className="mx-auto mb-3 h-8 w-8 text-f1red" />
      <h2 className="font-display text-lg font-black uppercase">Model B review unavailable</h2>
      <p className="mt-2 text-xs leading-relaxed text-studio-300">
        {message ??
          'WebGL context or the ignored local candidate is unavailable. The production Showroom remains unchanged.'}
      </p>
    </div>
  </div>
);

export const CommercialBReviewShowroom: React.FC = () => {
  const { lang } = useNavigationStore();
  const initialMode = useMemo(() => readGraphicsMode(window.localStorage), []);
  const [controller] = useState(
    () =>
      new AdaptiveQualityController(
        performance.now(),
        initialMode === 'AUTO' ? 'HIGH' : initialMode,
      ),
  );
  const [mode, setMode] = useState<GraphicsMode>(initialMode);
  const [profile, setProfile] = useState<QualityProfile>(
    initialMode === 'AUTO' ? 'HIGH' : initialMode,
  );
  const [metrics, setMetrics] = useState<LiveMetrics>(EMPTY_METRICS);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadEvidence, setLoadEvidence] = useState<LoadEvidence>({
    fetchMs: 0,
    decodeParseMs: 0,
    firstRenderMs: null,
    bytes: 0,
  });
  const [contextLost, setContextLost] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(document.visibilityState === 'visible');
  const [stageVisible, setStageVisible] = useState(true);
  const [continuousOverride, setContinuousOverride] = useState<boolean | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [presetTrigger, setPresetTrigger] = useState(0);
  const [autoRotate, setAutoRotate] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [zoomTrigger, setZoomTrigger] = useState(0);
  const [zoomDirection, setZoomDirection] = useState<'in' | 'out' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const contextExtension = useRef<WEBGL_lose_context | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const navigationStartedAt = useRef(0);
  const paused = !modelLoaded || contextLost || !documentVisible || !stageVisible;
  const continuous = continuousOverride ?? !paused;

  useEffect(() => {
    navigationStartedAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (initialMode !== 'AUTO') controller.setMode(initialMode, performance.now());
  }, [controller, initialMode]);

  useEffect(() => {
    const onVisibility = () => setDocumentVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setStageVisible(entry.isIntersecting), {
      rootMargin: '120px 0px',
      threshold: 0.01,
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    controller.setPaused(paused, performance.now());
  }, [controller, paused]);

  const applyMode = useCallback(
    (nextMode: GraphicsMode) => {
      controller.setMode(nextMode, performance.now());
      const state = controller.getState();
      setMode(nextMode);
      setProfile(state.profile);
      persistGraphicsMode(window.localStorage, nextMode);
    },
    [controller],
  );

  const resetAuto = useCallback(() => {
    controller.resetAuto(performance.now(), 'HIGH');
    setMode('AUTO');
    setProfile('HIGH');
    persistGraphicsMode(window.localStorage, 'AUTO');
  }, [controller]);

  const receiveMetrics = useCallback(
    (next: LiveMetrics) => {
      const event = controller.ingest({
        nowMs: performance.now(),
        averageFps: next.averageFps,
        frameTimeP95Ms: next.frameTimeP95Ms,
        refreshRateHz: 60,
        validFrameCount: next.validFrameCount,
        continuous: next.continuous,
      });
      const state = controller.getState();
      if (event) setProfile(state.profile);
      setMetrics({
        ...next,
        transitionCount: state.transitionCount,
        transitions: state.transitions,
      });
    },
    [controller],
  );

  const handleLoaded = useCallback((evidence: Omit<LoadEvidence, 'firstRenderMs'>) => {
    setLoadEvidence({ ...evidence, firstRenderMs: null });
    setModelLoaded(true);
  }, []);
  const handleError = useCallback((message: string) => setLoadError(message), []);
  const handleFirstRender = useCallback((atMs: number) => {
    setLoadEvidence((current) =>
      current.firstRenderMs === null
        ? { ...current, firstRenderMs: atMs - navigationStartedAt.current }
        : current,
    );
  }, []);
  const setContextExtension = useCallback((extension: WEBGL_lose_context | null) => {
    contextExtension.current = extension;
  }, []);

  useEffect(() => {
    const api = {
      getState: (): ReviewApiState => ({
        ...metrics,
        mode,
        profile,
        modelLoaded,
        contextLost,
        loadEvidence,
        storageKey: GRAPHICS_MODE_STORAGE_KEY,
      }),
      setMode: applyMode,
      resetAuto,
      setContinuous: setContinuousOverride,
      loseContext: () => {
        const extension = contextExtension.current;
        extension?.loseContext();
        return Boolean(extension);
      },
      restoreContext: () => {
        const extension = contextExtension.current;
        extension?.restoreContext();
        return Boolean(extension);
      },
    };
    window.__PEDS_B7__ = api;
    window.__PEDS_B7_READY__ = modelLoaded && !loadError;
    return () => {
      delete window.__PEDS_B7__;
      delete window.__PEDS_B7_READY__;
    };
  }, [
    applyMode,
    contextLost,
    loadError,
    loadEvidence,
    metrics,
    mode,
    modelLoaded,
    profile,
    resetAuto,
  ]);

  const selectPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    setPresetTrigger((value) => value + 1);
    setAutoRotate(false);
  };
  const resetCamera = () => {
    setCameraPreset('overview');
    setPresetTrigger((value) => value + 1);
    setAutoRotate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  const scale = QUALITY_PROFILES[profile].renderScale;
  const isCanvasActive = documentVisible && stageVisible && !contextLost;

  return (
    <main className="min-h-screen bg-studio-950 text-white">
      <header className="border-b border-amber-400/20 bg-[#0b0d12] px-4 py-3">
        <div className="page-container flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
              DEV REVIEW ONLY · LOCAL CANDIDATE
            </p>
            <h1 className="font-display text-lg font-black uppercase sm:text-xl">
              Model B Meshopt v1
            </h1>
          </div>
          <p className="max-w-xl text-[11px] leading-relaxed text-studio-300">
            {lang === 'vi'
              ? 'Route tách biệt để đánh giá tích hợp và đồ họa thích ứng. Livery, hotspot và hồ sơ EDS-G01 được ẩn vì không tương thích với vật liệu/tọa độ của Model B.'
              : 'Isolated route for integration and adaptive-graphics review. EDS-G01 liveries, hotspots and dossier are hidden because they are incompatible with Model B materials and coordinates.'}
          </p>
        </div>
      </header>
      <section
        ref={stageRef}
        className="relative h-[calc(100vh-9rem)] min-h-[560px] w-full overflow-hidden bg-[#0b0d12]"
        aria-label="Model B Meshopt development review"
      >
        <div
          className={`relative h-full transition-[width] duration-300 ease-out ${settingsOpen ? 'lg:w-[calc(100%_-_23rem)]' : 'w-full'}`}
          data-testid="commercial-b-stage"
        >
          <div className="absolute left-3 top-3 z-20 max-w-[16rem] rounded-xl border border-white/10 bg-black/65 p-3 text-[10px] text-studio-300 backdrop-blur-lg">
            <strong className="block font-display text-xs uppercase text-white">
              Frozen candidate · 79,925 triangles
            </strong>
            <span>
              {(loadEvidence.bytes / 1_048_576).toFixed(2)} MiB · Meshopt decoder · original PBR
              materials
            </span>
          </div>
          <div
            className="absolute bottom-4 left-1/2 z-30 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-wrap justify-center gap-1 rounded-2xl border border-white/10 bg-black/70 p-2 backdrop-blur-xl"
            role="group"
            aria-label={lang === 'vi' ? 'Góc camera' : 'Camera views'}
          >
            {CAMERA_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={cameraPreset === preset}
                onClick={() => selectPreset(preset)}
                className={`rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-f1red ${cameraPreset === preset ? 'bg-f1red text-white' : 'text-studio-300 hover:bg-white/10'}`}
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setZoomDirection('in');
                setZoomTrigger((value) => value + 1);
              }}
              className="rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase text-studio-300 hover:bg-white/10"
            >
              Zoom +
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomDirection('out');
                setZoomTrigger((value) => value + 1);
              }}
              className="rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase text-studio-300 hover:bg-white/10"
            >
              Zoom −
            </button>
            <button
              type="button"
              onClick={resetCamera}
              className="rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase text-studio-300 hover:bg-white/10"
            >
              Reset
            </button>
          </div>
          <ErrorBoundary fallback={<ReviewFallback />}>
            <Canvas
              dpr={Math.min(window.devicePixelRatio * scale, 2)}
              frameloop={isCanvasActive ? 'always' : 'never'}
              camera={{ position: [2.8, 1.4, -2.8], fov: 38, near: 0.01, far: 100 }}
              gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
              onCreated={({ gl }) => {
                gl.outputColorSpace = THREE.SRGBColorSpace;
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1;
              }}
              className="h-full w-full cursor-grab active:cursor-grabbing"
            >
              <color attach="background" args={['#0b0d12']} />
              <hemisphereLight args={['#dde8ff', '#111318', 1.65]} />
              <directionalLight color="#fff5ec" intensity={4} position={[12, 18, 15]} />
              <directionalLight color="#b8ceff" intensity={2.1} position={[-12, 8, -14]} />
              <directionalLight color="#e9f2ff" intensity={2.7} position={[-15, 18, 8]} />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[18, 18]} />
                <meshStandardMaterial color="#11151a" roughness={0.82} metalness={0.05} />
              </mesh>
              <FrozenCommercialModel onLoaded={handleLoaded} onError={handleError} />
              <ReviewContextGuard
                onContextState={setContextLost}
                onExtension={setContextExtension}
              />
              <CameraController
                activeHotspot={null}
                cameraPreset={cameraPreset}
                presetTrigger={presetTrigger}
                autoRotate={autoRotate}
                enableWheelZoom
                zoomTrigger={zoomTrigger}
                zoomDirection={zoomDirection}
              />
              <PerformanceProbe
                active={continuous}
                transitions={controller.getState().transitions}
                onMetrics={receiveMetrics}
                onFirstRender={handleFirstRender}
              />
            </Canvas>
          </ErrorBoundary>
          {!modelLoaded && !loadError && (
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#080a0e]/70"
              role="status"
            >
              <div className="rounded-xl border border-white/10 bg-black/70 px-5 py-3 text-xs font-bold">
                {lang === 'vi' ? 'Đang tải Model B Meshopt…' : 'Loading Model B Meshopt…'}
              </div>
            </div>
          )}
          {(loadError || contextLost) && (
            <ReviewFallback
              message={
                loadError ??
                (lang === 'vi'
                  ? 'WebGL context đã bị mất. Hãy khôi phục context hoặc tải lại trang.'
                  : 'The WebGL context was lost. Restore it or reload the page.')
              }
            />
          )}
        </div>
        <GraphicsSettings
          lang={lang}
          mode={mode}
          profile={profile}
          metrics={metrics}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onMode={applyMode}
          onReset={resetAuto}
        />
      </section>
    </main>
  );
};

export default CommercialBReviewShowroom;
