import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { ChevronDown } from 'lucide-react';
import { CameraController, CameraPreset } from './CameraController';
import { EDSHotspotDetailsModal } from './EDSHotspotDetailsModal';
import { EDSHotspotSelectorBar } from './EDSHotspotSelectorBar';
import { EDSLiverySelector } from './EDSLiverySelector';
import { EDSSchematicModal } from './EDSSchematicModal';
import { EDSStudioStage } from './EDSStudioStage';
import { EDSTechnicalDossier } from './EDSTechnicalDossier';
import { F1Car3DModel } from './F1Car3DModel';
import { Showroom3DLoader } from './Showroom3DLoader';
import { ShowroomControlDock } from './ShowroomControlDock';
import { ShowroomQuickHUD } from './ShowroomQuickHUD';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { EDS_HOTSPOTS } from '../../data/showroom/edsHotspots';
import { DEFAULT_EDS_LIVERY_ID, EDSLiveryId, getEDSLivery } from '../../data/showroom/edsLiveries';
import type { HotspotItem } from '../../data/showroom/hotspotsData';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useMobileHub } from '../../hooks/useMobileHub';

const CommercialBReviewShowroom = import.meta.env.DEV
  ? React.lazy(() => import('../../dev/CommercialBReviewShowroom'))
  : null;

const WebGLContextGuard: React.FC<{
  onContextStateChange: (isLost: boolean) => void;
}> = ({ onContextStateChange }) => {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      onContextStateChange(true);
    };
    const handleRestored = () => onContextStateChange(false);
    canvas.addEventListener('webglcontextlost', handleLost);
    canvas.addEventListener('webglcontextrestored', handleRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost);
      canvas.removeEventListener('webglcontextrestored', handleRestored);
    };
  }, [gl, onContextStateChange]);
  return null;
};

const RendererDiagnostics: React.FC = () => {
  const { gl } = useThree();
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const update = () =>
      window.dispatchEvent(
        new CustomEvent('eds-renderer-stats', {
          detail: {
            drawCalls: gl.info.render.calls,
            triangles: gl.info.render.triangles,
            geometries: gl.info.memory.geometries,
            textures: gl.info.memory.textures,
          },
        }),
      );
    update();
    const interval = window.setInterval(update, 500);
    return () => window.clearInterval(interval);
  }, [gl]);
  return null;
};

const ShowroomWebGLFallback: React.FC<{ accent: string; lang: 'vi' | 'en' }> = ({
  accent,
  lang,
}) => (
  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#09090e] text-white">
    <img
      src="/images/eds/editorial/eds-g01-hero.svg"
      alt="EDS-G01 original concept car"
      className="absolute inset-0 h-full w-full object-cover opacity-35"
    />
    <div className="relative flex flex-col items-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black mb-4 shadow-xl"
        style={{ backgroundColor: accent }}
      >
        EDS
      </div>
      <h3 className="font-display text-xl font-bold uppercase tracking-wider mb-2">
        Podium EDS — EDS-G01
      </h3>
      <p className="text-xs text-studio-400 max-w-md leading-relaxed mb-6">
        {lang === 'vi'
          ? 'Thiết bị chưa cung cấp tăng tốc WebGL. Hồ sơ kỹ thuật nguyên bản vẫn có sẵn bên dưới.'
          : 'WebGL hardware acceleration is unavailable. The original engineering dossier remains available below.'}
      </p>
      <button
        type="button"
        onClick={() =>
          document.getElementById('technical-dossier')?.scrollIntoView({ behavior: 'smooth' })
        }
        className="px-5 py-2.5 rounded-xl bg-f1red text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-all cursor-pointer"
      >
        {lang === 'vi' ? 'Xem hồ sơ kỹ thuật' : 'View technical dossier'}
      </button>
    </div>
  </div>
);

const DefaultShowroomView: React.FC = () => {
  const { lang } = useNavigationStore();
  const [searchParams] = useSearchParams();
  const reviewG02 = import.meta.env.DEV && searchParams.get('model') === 'eds-g02';
  const location = useLocation();
  const mobileHub = useMobileHub();
  const [selectedLiveryId, setSelectedLiveryId] = useState<EDSLiveryId>(DEFAULT_EDS_LIVERY_ID);
  const [activeHotspot, setActiveHotspot] = useState<HotspotItem | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset | null>('overview');
  const [presetTrigger, setPresetTrigger] = useState(0);
  const [autoRotate, setAutoRotate] = useState(
    () =>
      typeof window === 'undefined' ||
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [showHotspots, setShowHotspots] = useState(false);
  const [enableWheelZoom, setEnableWheelZoom] = useState(false);
  const [zoomTrigger, setZoomTrigger] = useState(0);
  const [zoomDirection, setZoomDirection] = useState<'in' | 'out' | null>(null);
  const [isSchematicOpen, setIsSchematicOpen] = useState(false);
  const [isWebGLContextLost, setIsWebGLContextLost] = useState(false);
  const [isStageVisible, setIsStageVisible] = useState(false);
  const [hasMountedCanvas, setHasMountedCanvas] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  );
  const stageRef = useRef<HTMLDivElement | null>(null);
  const livery = useMemo(() => getEDSLivery(selectedLiveryId), [selectedLiveryId]);

  useEffect(() => {
    const requestedId = searchParams.get('hotspot');
    if (!requestedId) {
      setActiveHotspot(null);
      return;
    }
    const requestedHotspot = EDS_HOTSPOTS.find((hotspot) => hotspot.id === requestedId);
    if (!requestedHotspot) return;
    setActiveHotspot(requestedHotspot);
    setCameraPreset(null);
    setShowHotspots(true);
    setAutoRotate(false);
  }, [searchParams]);

  useEffect(() => {
    if (mobileHub && location.hash && location.hash !== '#showroom') {
      setActiveHotspot(null);
      setIsSchematicOpen(false);
    }
  }, [mobileHub, location.hash]);

  useEffect(() => {
    const handleVisibility = () => setIsDocumentVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setAutoRotate(!media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsStageVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsStageVisible(entry.isIntersecting),
      { rootMargin: '160px 0px', threshold: 0.01 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isStageVisible) setHasMountedCanvas(true);
  }, [isStageVisible]);

  const handleResetView = useCallback(() => {
    setActiveHotspot(null);
    setCameraPreset('overview');
    setPresetTrigger((value) => value + 1);
    setAutoRotate(true);
  }, []);
  const handleSelectPreset = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    setPresetTrigger((value) => value + 1);
    setActiveHotspot(null);
    setAutoRotate(false);
  }, []);
  const handleSelectHotspot = useCallback((hotspot: HotspotItem) => {
    setActiveHotspot(hotspot);
    setCameraPreset(null);
    setAutoRotate(false);
  }, []);
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setZoomDirection(direction);
    setZoomTrigger((value) => value + 1);
  }, []);

  const isCanvasActive = isDocumentVisible && isStageVisible && !isWebGLContextLost;

  return (
    <div className="min-h-screen bg-studio-950 text-white flex flex-col font-sans">
      <div className="bg-studio-950/95 backdrop-blur-xl border-b border-studio-800/80 sticky top-16 z-30 shadow-md">
        <div className="page-container py-2.5 space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-f1red flex items-center justify-center font-display text-[11px] font-black shadow-md shadow-f1red/30 shrink-0">
                3D
              </span>
              <div>
                <h1 className="font-display text-sm sm:text-base font-black uppercase tracking-wider">
                  {reviewG02
                    ? lang === 'vi'
                      ? 'Xem thử EDS-G02 — chưa duyệt'
                      : 'EDS-G02 Review — Not Approved'
                    : lang === 'vi'
                      ? 'Showroom Kỹ thuật EDS-G01'
                      : 'EDS-G01 Technical Showroom'}
                </h1>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                  {reviewG02
                    ? lang === 'vi'
                      ? 'CHỈ XEM THỬ TRONG DEV'
                      : 'DEV REVIEW ONLY'
                    : lang === 'vi'
                      ? 'NGUYÊN MẪU GỐC'
                      : 'ORIGINAL PROTOTYPE'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                document.getElementById('technical-dossier')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-studio-900 hover:bg-studio-800 text-xs font-bold border border-studio-700/70 cursor-pointer"
            >
              <span>{lang === 'vi' ? 'Hồ sơ kỹ thuật' : 'Technical dossier'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-f1red" />
            </button>
          </div>
          <EDSLiverySelector
            selectedId={selectedLiveryId}
            onSelect={setSelectedLiveryId}
            lang={lang}
          />
        </div>
      </div>

      <div
        ref={stageRef}
        className="relative w-full h-[620px] sm:h-[680px] lg:h-[720px] overflow-hidden bg-gradient-to-b from-[#0f1118] via-[#07080c] to-[#020204] select-none"
      >
        <div
          className="absolute inset-0 pointer-events-none transition-colors duration-700"
          style={{
            background: `radial-gradient(ellipse 65% 55% at 50% 38%, ${livery.accent}16 0%, transparent 68%)`,
          }}
        />
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 pointer-events-none p-3 sm:p-3.5 rounded-2xl bg-studio-950/85 backdrop-blur-xl border border-studio-800/80 shadow-2xl space-y-1.5 max-w-[280px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-studio-400">
            PODIUM EDS · {livery.name}
          </span>
          <h2 className="font-display text-sm sm:text-base font-black uppercase">
            {reviewG02 ? 'EDS-G02 · Visual Review Candidate' : 'EDS-G01 Ground Effect Prototype'}
          </h2>
          <p className="text-[11px] text-studio-300 pt-1.5 border-t border-studio-800/60">
            5.05 m · 3.60 m wheelbase · original procedural source
          </p>
        </div>
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
          <ShowroomControlDock
            cameraPreset={cameraPreset}
            onSelectPreset={handleSelectPreset}
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((value) => !value)}
            onResetView={handleResetView}
            lang={lang}
            showHotspots={showHotspots}
            onToggleHotspots={() => setShowHotspots((value) => !value)}
            onOpenSchematic={() => setIsSchematicOpen(true)}
          />
        </div>

        {!hasMountedCanvas && <ShowroomWebGLFallback accent={livery.accent} lang={lang} />}
        {hasMountedCanvas && (
          <ErrorBoundary fallback={<ShowroomWebGLFallback accent={livery.accent} lang={lang} />}>
            <Canvas
              shadows
              dpr={[1, 1.25]}
              frameloop={isCanvasActive ? 'always' : 'never'}
              camera={{ position: [3.4, 1.25, -2.8], fov: 38 }}
              gl={{
                antialias: false,
                alpha: true,
                powerPreference: 'high-performance',
                toneMappingExposure: 1.2,
              }}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            >
              <WebGLContextGuard onContextStateChange={setIsWebGLContextLost} />
              <RendererDiagnostics />
              <EDSStudioStage lang={lang} livery={livery} />
              <Suspense fallback={<Showroom3DLoader />}>
                <F1Car3DModel
                  activeHotspot={activeHotspot}
                  onSelectHotspot={handleSelectHotspot}
                  lang={lang}
                  showHotspots={showHotspots}
                  edsLiveryId={selectedLiveryId}
                  hotspots={EDS_HOTSPOTS}
                  reviewG02={reviewG02}
                />
              </Suspense>
              <ContactShadows
                position={[0, 0, 0]}
                opacity={0.9}
                scale={10}
                blur={2}
                far={4.5}
                frames={1}
                resolution={256}
                color="#000000"
              />
              <CameraController
                activeHotspot={activeHotspot}
                cameraPreset={cameraPreset}
                presetTrigger={presetTrigger}
                autoRotate={autoRotate}
                enableWheelZoom={enableWheelZoom}
                zoomTrigger={zoomTrigger}
                zoomDirection={zoomDirection}
              />
            </Canvas>
          </ErrorBoundary>
        )}

        {isWebGLContextLost && (
          <div className="absolute inset-0 z-30">
            <ShowroomWebGLFallback accent={livery.accent} lang={lang} />
          </div>
        )}
        <ShowroomQuickHUD
          enableWheelZoom={enableWheelZoom}
          onToggleWheelZoom={() => setEnableWheelZoom((value) => !value)}
          onZoom={handleZoom}
          onResetView={handleResetView}
          autoRotate={autoRotate}
          onToggleAutoRotate={() => setAutoRotate((value) => !value)}
          cameraPreset={cameraPreset}
          onSelectPreset={handleSelectPreset}
          lang={lang}
          onOpenSchematic={() => setIsSchematicOpen(true)}
        />
        <EDSHotspotDetailsModal
          hotspot={activeHotspot}
          hotspots={EDS_HOTSPOTS}
          onClose={() => {
            setActiveHotspot(null);
            setCameraPreset('overview');
          }}
          onSelectHotspot={handleSelectHotspot}
          lang={lang}
        />
        <EDSSchematicModal
          isOpen={isSchematicOpen}
          onClose={() => setIsSchematicOpen(false)}
          lang={lang}
        />
      </div>

      <EDSHotspotSelectorBar
        activeHotspot={activeHotspot}
        onSelectHotspot={handleSelectHotspot}
        lang={lang}
        hotspots={EDS_HOTSPOTS}
      />
      <EDSTechnicalDossier lang={lang} livery={livery} />
    </div>
  );
};

export const ShowroomView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reviewCommercialB = import.meta.env.DEV && searchParams.get('model') === 'commercial-b';

  if (reviewCommercialB && CommercialBReviewShowroom) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-studio-950 text-white flex items-center justify-center text-xs font-bold uppercase tracking-widest">
            Loading isolated Model B review…
          </div>
        }
      >
        <CommercialBReviewShowroom />
      </Suspense>
    );
  }

  return <DefaultShowroomView />;
};
