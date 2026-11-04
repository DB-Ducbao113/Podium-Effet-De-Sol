import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { WORLD_CHAPTERS, normalizeWorldPointer, resolveWorldPhase } from './worldModel';
import type { WorldController, WorldLabMode, WorldQuality } from './worldModel';
import { selectWorldQuality } from './worldQuality';
import './homeWorld.css';

const WorldCanvas = lazy(() => import('./HomeWorldCanvas'));

type Props = {
  mode?: 'page' | 'lab';
  lab?: WorldLabMode;
};

/**
 * V9 preview only. This host is placed ABOVE both HomeView and the shared Footer
 * in App.tsx, but visually BEHIND their DOM. Exactly one isolated renderer.
 */
export function HomeWorldHost({ mode = 'page', lab = null }: Props) {
  const controller = useRef<WorldController>({
    phase: 0, pointerX: 0, pointerY: 0, pointerSpeed: 0,
    quality: 'low', lab,
  });
  const [quality, setQuality] = useState<WorldQuality>('static');
  const [active, setActive] = useState(true);
  const failure = useCallback(() => setQuality('static'), []);
  const degrade = useCallback(() => setQuality((previous) =>
    previous === 'high' ? 'balanced' : previous === 'balanced' ? 'low' : previous,
  ), []);

  controller.current.lab = lab;
  if (quality !== 'static') controller.current.quality = quality;

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    const choose = () => {
      let supported = false;
      try {
        const probe = document.createElement('canvas');
        const context = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
        supported = Boolean(context);
        context?.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        supported = false;
      }
      setQuality(selectWorldQuality({
        reducedMotion: motion.matches, saveData: Boolean(nav.connection?.saveData),
        webgl2: supported, width: window.innerWidth, memoryGB: nav.deviceMemory,
      }));
    };
    choose();
    motion.addEventListener('change', choose);
    window.addEventListener('resize', choose, { passive: true });
    return () => {
      motion.removeEventListener('change', choose);
      window.removeEventListener('resize', choose);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let previousX = 0;
    let previousY = 0;
    let lastPointer = 0;
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const target = normalizeWorldPointer(event.clientX, event.clientY, window.innerWidth, window.innerHeight);
      const delta = Math.max(16, event.timeStamp - lastPointer);
      const distance = Math.hypot(target.x - previousX, target.y - previousY);
      controller.current.pointerX = target.x;
      controller.current.pointerY = target.y;
      controller.current.pointerSpeed = Math.min(1, (distance / delta) * 75);
      previousX = target.x;
      previousY = target.y;
      lastPointer = event.timeStamp;
    };
    const measure = () => {
      frame = 0;
      if (mode === 'lab') return;
      const anchors = WORLD_CHAPTERS.flatMap((chapter) => {
        const el = document.getElementById(chapter.id);
        if (!el) return [];
        const rect = el.getBoundingClientRect();
        return [{ id: chapter.id, top: rect.top, height: rect.height }];
      });
      controller.current.phase = resolveWorldPhase(anchors, window.innerHeight);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const visibility = () => setActive(!document.hidden);
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    const body = document.body;
    if (body) resizeObserver?.observe(body);
    const observer = typeof MutationObserver !== 'undefined' ? new MutationObserver(() => {
      schedule();
    }) : null;
    // React Suspense mounts Home after the host, so wait for its DOM anchors.
    observer?.observe(document.getElementById('root') ?? body, { childList: true, subtree: true });
    const onWindowLeave = () => {
      controller.current.pointerX = 0;
      controller.current.pointerY = 0;
      controller.current.pointerSpeed = 0;
    };
    window.addEventListener('pointermove', pointer, { passive: true });
    window.addEventListener('pointerout', onWindowLeave);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      observer?.disconnect();
      window.removeEventListener('pointermove', pointer);
      window.removeEventListener('pointerout', onWindowLeave);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [mode]);

  return (
    <div className="home-v9-world" data-world-mode={mode} data-world-quality={quality} aria-hidden="true">
      <div className="home-v9-world__poster" />
      <div className="home-v9-world__edge-light" />
      {quality !== 'static' && (
        <ErrorBoundary fallback={<div className="home-v9-world__fallback" />}>
          <Suspense fallback={null}>
            <WorldCanvas
              controller={controller}
              quality={quality}
              active={active}
              onFailure={failure}
              onDegrade={degrade}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      <span className="home-v9-world__copyright">PEDS V9 / CONCEPTUAL FLOW VISUALIZATION</span>
    </div>
  );
}
