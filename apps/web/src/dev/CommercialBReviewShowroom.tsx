import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  ExternalLink,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { CameraController, type CameraPreset } from '../components/showroom/CameraController';
import { CompactShowroomLayout } from '../components/showroom/CompactShowroomLayout';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useReducedMotion } from '../hooks/useReducedMotion';
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
import { applyModelBLivery } from './commercial-b/modelBMaterials';
import { MODEL_B_HOTSPOTS, MODEL_B_LIVERIES, type ModelBHotspot, type ModelBLivery } from './commercial-b/modelBExperience';
import { disposeModelB, loadModelB } from './commercial-b/modelBLoader';
import { getModelBPaintStorage, persistModelBPaint, readModelBPaint } from './commercial-b/paintPreference';

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
  autoRotate: boolean;
  liveryId: ModelBLivery['id'];
  hotspotId: string | null;
  cameraPreset: CameraPreset;
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

const FrozenCommercialModel: React.FC<{
  livery: ModelBLivery;
  onLoaded: (evidence: Omit<LoadEvidence, 'firstRenderMs'>) => void;
  onError: (message: string) => void;
}> = ({ livery, onLoaded, onError }) => {
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ownedModel: THREE.Group | null = null;
    const load = async () => {
      try {
        const result = await loadModelB(controller.signal);
        if (controller.signal.aborted) {
          disposeModelB(result.scene);
          return;
        }
        ownedModel = result.scene;
        setModel(ownedModel);
        onLoaded({
          fetchMs: result.fetchMs,
          decodeParseMs: result.decodeParseMs,
          bytes: result.bytes,
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
      if (ownedModel) disposeModelB(ownedModel);
    };
  }, [onError, onLoaded]);

  useEffect(() => {
    if (model) applyModelBLivery(model, livery);
  }, [livery, model]);

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
      for (const expired of retained.slice(0, -12)) webgl2.deleteQuery(expired);
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
  onMode: (mode: GraphicsMode) => void;
  onReset: () => void;
}> = ({ lang, mode, profile, onMode, onReset }) => {
  const labels = {
    AUTO: lang === 'vi' ? 'Tự động' : 'Auto',
    HIGH: lang === 'vi' ? 'Cao' : 'High',
    BALANCED: lang === 'vi' ? 'Cân bằng' : 'Balanced',
    PERFORMANCE: lang === 'vi' ? 'Hiệu năng' : 'Performance',
  } as const;
  return (
    <div className="relative w-full text-left">
        <section className="mt-2 rounded-xl border border-white/15 bg-[#20262d] p-3" aria-label={lang === 'vi' ? 'Cài đặt đồ họa' : 'Graphics settings'}>
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

        </section>
    </div>
  );
};

const ReviewFallback: React.FC<{
  lang: 'vi' | 'en';
  message?: string;
}> = ({ lang, message }) => (
  <div
    className="absolute inset-0 z-20 flex items-center justify-center bg-[#07090d] p-8 text-center"
    role="alert"
  >
    <div className="max-w-md rounded-2xl border border-white/10 bg-black/50 p-6">
      <Gauge className="mx-auto mb-3 h-8 w-8 text-f1red" />
      <h2 className="font-display text-lg font-black uppercase">
        {lang === 'vi' ? 'Không thể tải Model B' : 'Model B unavailable'}
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-studio-300">
        {message ??
          (lang === 'vi'
            ? 'WebGL hoặc Model B không khả dụng. Hãy kiểm tra tăng tốc phần cứng rồi tải lại trang.'
            : 'WebGL or Model B is unavailable. Check hardware acceleration, then reload the page.')}
      </p>
      <button type="button" onClick={() => window.location.reload()} className="mt-4 min-h-11 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-f1red">
        {lang === 'vi' ? 'Tải lại Showroom' : 'Reload showroom'}
      </button>
    </div>
  </div>
);

const MARKER_VIEWS: Partial<Record<CameraPreset, string[]>> = {
  front: ['front-wing', 'suspension'],
  side: ['sidepods', 'floor', 'suspension'],
  cockpit: ['halo', 'sidepods'],
  rear: ['rear-wing', 'diffuser'],
};

const ModelBMarkers: React.FC<{
  selected: string | null;
  cameraPreset: CameraPreset;
  onSelect: (item: ModelBHotspot) => void;
  lang: 'vi' | 'en';
}> = ({ selected, cameraPreset, onSelect, lang }) => (
  <group>
    {MODEL_B_HOTSPOTS.filter((item) => selected ? item.id === selected : !MARKER_VIEWS[cameraPreset] || MARKER_VIEWS[cameraPreset]?.includes(item.id)).map((item) => (
      <Html key={item.id} position={item.position} center zIndexRange={[19, 10]}>
        <button
          type="button"
          onClick={() => onSelect(item)}
          aria-label={`${lang === 'vi' ? 'Khám phá' : 'Explore'} ${lang === 'vi' ? item.nameVi : item.nameEn}`}
          aria-pressed={selected === item.id}
          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg shadow-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${selected === item.id ? 'border-white bg-[#cf2539] text-white' : 'border-[#cf2539] bg-[#171b21]/90 text-white hover:bg-[#cf2539]'}`}
        >
          +
        </button>
      </Html>
    ))}
  </group>
);

export const CommercialBReviewShowroom: React.FC<{ headingLevel?: 'h1' | 'h2' }> = ({
  headingLevel = 'h1',
}) => {
  const { lang } = useNavigationStore();
  const reduceMotion = useReducedMotion();
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
  const [selectedLiveryId, setSelectedLiveryId] = useState<ModelBLivery['id']>(() => readModelBPaint(getModelBPaintStorage()));
  const [selectedHotspot, setSelectedHotspot] = useState<ModelBHotspot | null>(null);
  const [hotspotsVisible, setHotspotsVisible] = useState(false);
  const [lighting, setLighting] = useState<'neutral' | 'dramatic'>('dramatic');
  const contextExtension = useRef<WEBGL_lose_context | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const navigationStartedAt = useRef(0);
  const paused = !modelLoaded || contextLost || !documentVisible || !stageVisible;
  const continuous = continuousOverride ?? !paused;
  const livery = useMemo(() => MODEL_B_LIVERIES.find((item) => item.id === selectedLiveryId) ?? MODEL_B_LIVERIES[0], [selectedLiveryId]);
  const selectLivery = useCallback((id: string) => {
    setSelectedLiveryId(id);
    persistModelBPaint(getModelBPaintStorage(), id);
  }, []);

  useEffect(() => {
    navigationStartedAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (reduceMotion) setAutoRotate(false);
  }, [reduceMotion]);

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
        autoRotate,
        liveryId: selectedLiveryId,
        hotspotId: selectedHotspot?.id ?? null,
        cameraPreset,
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
    autoRotate,
    contextLost,
    loadError,
    loadEvidence,
    metrics,
    mode,
    modelLoaded,
    profile,
    resetAuto,
    selectedLiveryId,
    selectedHotspot,
    cameraPreset,
  ]);

  const selectPreset = (preset: CameraPreset) => {
    setSelectedHotspot(null);
    setCameraPreset(preset);
    setPresetTrigger((value) => value + 1);
    setAutoRotate(false);
  };
  const resetCamera = () => {
    setSelectedHotspot(null);
    setCameraPreset('overview');
    setPresetTrigger((value) => value + 1);
    setAutoRotate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  const scale = QUALITY_PROFILES[profile].renderScale;
  const isCanvasActive = documentVisible && stageVisible && !contextLost;
  useEffect(() => {
    if (!selectedHotspot) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedHotspot(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedHotspot]);

  const selectHotspot = (item: ModelBHotspot) => {
    setSelectedHotspot(item);
    setAutoRotate(false);
  };

  return (
    <main className="min-h-screen bg-[#111417] text-white" data-testid="model-b-showroom">
      <header className="border-b border-white/10 bg-[#171b21] px-4 py-5">
        <div className="page-container">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {React.createElement(
                headingLevel,
                { className: 'font-display text-2xl font-bold tracking-tight text-white sm:text-3xl' },
                lang === 'vi' ? 'Studio kỹ thuật' : 'Engineering studio',
              )}
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#b8c0c8]">
                {lang === 'vi'
                  ? 'Formula 1 2022 Car · Model B — mô hình thử nghiệm local, có thể xoay và khám phá.'
                  : 'Formula 1 2022 Car · Model B — local review model for rotation and exploration.'}
              </p>
            </div>
            <span className="rounded-md border border-[#cf2539]/45 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#f2a9b2]">DEV · Model B</span>
          </div>
        </div>
      </header>
      <CompactShowroomLayout
        lang={lang}
        modelLabel="MODEL B"
        paintPresets={MODEL_B_LIVERIES.map((item) => ({ id: item.id, name: lang === 'vi' ? item.nameVi : item.name, colors: [item.primary, item.secondary, item.accent] as [string, string, string] }))}
        selectedPaintId={selectedLiveryId}
        onSelectPaint={(id) => selectLivery(id as ModelBLivery['id'])}
        graphicsSummary={`${mode} · ${profile} · ${scale.toFixed(2)}×`}
        hotspotsEnabled={hotspotsVisible}
        onToggleHotspots={() => setHotspotsVisible((value) => !value)}
        cameraControls={modelLoaded && !loadError && !contextLost ? (
          <div
            className="flex items-center gap-1 p-1.5"
            role="group"
            aria-label={lang === 'vi' ? 'Góc camera' : 'Camera views'}
          >
            {CAMERA_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={cameraPreset === preset && !selectedHotspot}
                onClick={() => selectPreset(preset)}
                className={`min-h-9 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#cf2539] ${cameraPreset === preset && !selectedHotspot ? 'bg-[#cf2539] text-white' : 'text-[#c5cdd4] hover:bg-white/10'}`}
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={autoRotate}
              onClick={() => setAutoRotate((value) => !value)}
              className={`min-h-9 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#cf2539] ${autoRotate ? 'bg-white/10 text-white' : 'text-[#c5cdd4] hover:bg-white/10'}`}
            >
              {autoRotate ? (
                <Pause className="mr-1 inline h-3 w-3" aria-hidden="true" />
              ) : (
                <Play className="mr-1 inline h-3 w-3" aria-hidden="true" />
              )}
              {autoRotate
                ? lang === 'vi'
                  ? 'Dừng xoay'
                  : 'Pause'
                : lang === 'vi'
                  ? 'Tự xoay'
                  : 'Rotate'}
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomDirection('in');
                setZoomTrigger((value) => value + 1);
              }}
              className="min-h-9 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase text-[#c5cdd4] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#cf2539]"
            >
              Zoom +
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomDirection('out');
                setZoomTrigger((value) => value + 1);
              }}
              className="min-h-9 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase text-[#c5cdd4] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#cf2539]"
            >
              Zoom −
            </button>
            <button
              type="button"
              onClick={resetCamera}
              className="min-h-9 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase text-[#c5cdd4] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#cf2539]"
            >
              Reset
            </button>
          </div>
        ) : null}
        anatomyPanel={(
            <section aria-label={lang === 'vi' ? 'Giải phẫu xe' : 'Car anatomy'}>
              <h3 className="font-display text-base font-bold">{lang === 'vi' ? 'Giải phẫu xe' : 'Car anatomy'}</h3>
              <p className="mt-1 text-xs text-[#b8c0c8]">{lang === 'vi' ? 'Các điểm tham chiếu gần đúng trên mô hình một mesh.' : 'Approximate anchors on a single-mesh model.'}</p>

              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={lang === 'vi' ? 'Bộ phận xe' : 'Car components'}>{MODEL_B_HOTSPOTS.map((item) => <button key={item.id} type="button" aria-pressed={selectedHotspot?.id === item.id} onClick={() => selectHotspot(item)} className={`min-h-10 rounded-lg px-3 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#cf2539] ${selectedHotspot?.id === item.id ? 'bg-[#cf2539] text-white' : 'bg-white/[0.07] text-[#cbd2d8] hover:bg-white/15'}`}>{lang === 'vi' ? item.nameVi : item.nameEn}</button>)}</div>
              <div className="mt-3 min-h-16 text-xs leading-5 text-[#c5cdd4]" aria-live="polite">{selectedHotspot ? <><strong className="block text-white">{lang === 'vi' ? selectedHotspot.nameVi : selectedHotspot.nameEn}</strong>{lang === 'vi' ? selectedHotspot.summaryVi : selectedHotspot.summaryEn}</> : (lang === 'vi' ? 'Chọn bộ phận để lấy nét camera và xem giải thích.' : 'Choose a component to focus the camera and read its explanation.')}</div>
            </section>
        )}
        graphicsPanel={(
          <section aria-label={lang === 'vi' ? 'Hình ảnh và hiệu năng' : 'Visuals and performance'}>
            <h3 className="font-display text-base font-bold">{lang === 'vi' ? 'Hình ảnh và hiệu năng' : 'Visuals and performance'}</h3>
              <div className="mt-3 flex gap-2" role="group" aria-label={lang === 'vi' ? 'Kiểu ánh sáng' : 'Lighting preset'}>{(['dramatic', 'neutral'] as const).map((item) => <button key={item} type="button" aria-pressed={lighting === item} onClick={() => setLighting(item)} className={`min-h-11 rounded-lg border px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#cf2539] ${lighting === item ? 'border-white/55 bg-white/10 text-white' : 'border-white/15 text-[#b8c0c8] hover:bg-white/5'}`}>{item === 'dramatic' ? 'Studio' : lang === 'vi' ? 'Trung tính' : 'Neutral'}</button>)}</div>
            <GraphicsSettings lang={lang} mode={mode} profile={profile} onMode={applyMode} onReset={resetAuto} />
          </section>
        )}
        specificationsPanel={(
          <section aria-label={lang === 'vi' ? 'Thông số hiệu năng' : 'Performance metrics'}>
            <h3 className="font-display text-base font-bold">{lang === 'vi' ? 'Thông số hiệu năng' : 'Performance metrics'}</h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-[10px] text-studio-300">
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
          </section>
        )}
      >
        <div ref={stageRef} className="relative h-full min-w-0 overflow-hidden bg-[#111417]" aria-label="Formula 1 2022 Car Model B canvas" aria-busy={!modelLoaded && !loadError} data-testid="commercial-b-stage">
          <ErrorBoundary fallback={<ReviewFallback lang={lang} />}>
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
              <color attach="background" args={['#1b2026']} />
              <hemisphereLight args={['#e7edf7', '#20252b', lighting === 'dramatic' ? 1.25 : 1.75]} />
              <directionalLight color="#fff7ee" intensity={lighting === 'dramatic' ? 4 : 3.1} position={[12, 18, 15]} />
              <directionalLight color="#b9c8dd" intensity={lighting === 'dramatic' ? 2 : 2.6} position={[-12, 8, -14]} />
              <directionalLight color="#eef4ff" intensity={lighting === 'dramatic' ? 2.6 : 2.2} position={[-15, 18, 8]} />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshBasicMaterial color="#1b2026" toneMapped={false} />
              </mesh>
              <FrozenCommercialModel
                livery={livery}
                onLoaded={handleLoaded}
                onError={handleError}
              />
              {hotspotsVisible && modelLoaded && <ModelBMarkers selected={selectedHotspot?.id ?? null} cameraPreset={cameraPreset} onSelect={selectHotspot} lang={lang} />}
              <ContactShadows
                position={[0, 0.015, 0]}
                opacity={0.22}
                scale={6}
                blur={2.4}
                far={3.5}
                frames={1}
                resolution={profile === 'HIGH' ? 256 : 128}
                color="#000000"
              />
              <ReviewContextGuard
                onContextState={setContextLost}
                onExtension={setContextExtension}
              />
              <CameraController
                activeHotspot={selectedHotspot}
                cameraPreset={cameraPreset}
                presetTrigger={presetTrigger}
                autoRotate={autoRotate}
                enableWheelZoom
                zoomTrigger={zoomTrigger}
                zoomDirection={zoomDirection}
                reduceMotion={reduceMotion}
                compactStage
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
              aria-live="polite"
            >
              <div className="rounded-xl border border-white/10 bg-black/70 px-5 py-3 text-xs font-bold">
                {lang === 'vi' ? 'Đang tải Model B Meshopt…' : 'Loading Model B Meshopt…'}
              </div>
            </div>
          )}
          {(loadError || contextLost) && (
            <ReviewFallback
              lang={lang}
              message={
                loadError ??
                (lang === 'vi'
                  ? 'WebGL context đã bị mất. Hãy khôi phục context hoặc tải lại trang.'
                  : 'The WebGL context was lost. Restore it or reload the page.')
              }
            />
          )}
        </div>
      </CompactShowroomLayout>
      <section className="border-t border-white/10 bg-[#080a0e]">
        <div className="page-container grid gap-4 py-5 text-xs text-studio-300 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex gap-3">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
              aria-hidden="true"
            />
            <div>
              <p className="font-bold text-white">
                {lang === 'vi'
                  ? 'Thông tin mô hình và giới hạn kỹ thuật'
                  : 'Model information and technical boundary'}
              </p>
              <p className="mt-1 max-w-3xl leading-relaxed">
                {lang === 'vi'
                  ? 'Một mesh với 13 vùng vật liệu: phù hợp cho raycast hotspot và camera focus, không hỗ trợ true exploded geometry hoặc lựa chọn assembly độc lập.'
                  : 'One mesh with 13 material regions: suitable for raycast hotspots and camera focus, but not true exploded geometry or independent assembly selection.'}
              </p>
            </div>
          </div>
          <p className="leading-relaxed lg:max-w-md lg:text-right">
            “Formula 1 2022 Car” by{' '}
            <a
              href="https://sketchfab.com/3d-models/formula-1-2022-car-65dcd974798f4f03be5cdf4f79e228d8"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-white underline decoration-white/35 underline-offset-4 hover:decoration-f1red"
            >
              Luis Adrian V.{' '}
              <ExternalLink className="inline h-3 w-3" aria-hidden="true" />
            </a>{' '}
            ·{' '}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-white underline decoration-white/35 underline-offset-4 hover:decoration-f1red"
            >
              CC BY 4.0
            </a>
            . Modified by Podium EDS: materials replaced, textures removed, scene consolidated,
            geometry quantized and Meshopt-compressed.
          </p>
        </div>
      </section>
    </main>
  );
};

export default CommercialBReviewShowroom;
