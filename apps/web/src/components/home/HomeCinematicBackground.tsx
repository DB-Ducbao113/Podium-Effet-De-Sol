import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AERO_SECTION_IDS, getAeroPhase } from './aerocore/aeroMotion';
import './homeCinematicBackground.css';

export type AeroController = { phase: number; pointerX: number; pointerY: number };

const LazyAeroCanvas = lazy(() =>
  import('./aerocore/AeroCanvas').then((module) => ({ default: module.AeroCanvas })),
);

class AeroBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function canRunAero() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.matchMedia('(max-width: 850px)').matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory <= 4)) return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2', { alpha: true, powerPreference: 'low-power' });
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}

/** Single, non-interactive full-viewport world under the existing Home DOM. */
export function HomeCinematicBackground() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [failed, setFailed] = useState(false);
  const controller = useRef<AeroController>({ phase: 0, pointerX: 0, pointerY: 0 });

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const viewport = window.matchMedia('(max-width: 850px)');
    const updateGate = () => setEnabled(canRunAero());
    updateGate();
    motion.addEventListener('change', updateGate);
    viewport.addEventListener('change', updateGate);
    return () => {
      motion.removeEventListener('change', updateGate);
      viewport.removeEventListener('change', updateGate);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const sync = () => {
      frame = 0;
      const anchors = AERO_SECTION_IDS.map((id) => document.getElementById(id))
        .filter((node): node is HTMLElement => node !== null)
        .map((node) => node.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.23);
      controller.current.phase = getAeroPhase(anchors, window.scrollY);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      controller.current.pointerX = (event.clientX / Math.max(window.innerWidth, 1) - .5) * 2;
      controller.current.pointerY = (event.clientY / Math.max(window.innerHeight, 1) - .5) * 2;
    };
    const visibility = () => setVisible(!document.hidden);
    sync();
    visibility();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pointermove', pointer, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pointermove', pointer);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  return (
    <div className="home-cinematic home-aerocore" aria-hidden="true" data-home-environment="full-page" data-aerocore-mode={enabled && !failed ? 'webgl' : 'fallback'}>
      <div className="home-aerocore__aura" />
      <div className="home-aerocore__carbon-fallback" />
      {enabled && !failed && (
        <AeroBoundary onFailure={() => setFailed(true)}>
          <Suspense fallback={null}>
            <LazyAeroCanvas controller={controller} visible={visible} onFailure={() => setFailed(true)} />
          </Suspense>
        </AeroBoundary>
      )}
      <div className="home-aerocore__vignette" />
    </div>
  );
}
