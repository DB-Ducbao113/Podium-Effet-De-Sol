import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CircuitBoard, Gauge, Move3d } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ErrorBoundary } from '../common/ErrorBoundary';
import type { HomeModelBMode } from './HomeModelBStage';
import './homeHudV4.css';

const HomeModelBStage = lazy(() => import('./HomeModelBStage').then((module) => ({ default: module.HomeModelBStage })));

const modes = [
  { id: 'aero', en: 'AERO', vi: 'KHÍ ĐỘNG', Icon: Activity },
  { id: 'chassis', en: 'CHASSIS', vi: 'KHUNG XE', Icon: CircuitBoard },
  { id: 'power', en: 'POWER', vi: 'ĐỘNG LỰC', Icon: Gauge },
] as const;

export function HomeHudScene({ lang }: { lang: 'vi' | 'en' }) {
  const [mode, setMode] = useState<HomeModelBMode>('aero');
  const [enabled, setEnabled] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const reducedMotion = useReducedMotion();
  const viewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Large displays activate Model B upon entering the viewport. On small screens
    // the same authentic model is available on tap without forcing a GLB/GPU load.
    if (window.matchMedia('(min-width: 860px)').matches) setEnabled(true);
    const root = viewRef.current;
    if (!root) return;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '100px 0px',
      threshold: .05,
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const refresh = () => setTabVisible(document.visibilityState === 'visible');
    refresh();
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);

  const mounted = enabled && inView;
  const active = inView && tabVisible;
  const fallback = (
    <div className="launch-hud__fallback" role="status">
      <strong>MODEL B</strong>
      <span>{lang === 'vi' ? 'Không thể hiển thị 3D' : '3D preview unavailable'}</span>
      <Link to="/showroom">{lang === 'vi' ? 'Mở Showroom' : 'Open Showroom'}</Link>
    </div>
  );

  return (
    <div className="launch-hud" data-mode={mode} data-3d-enabled={enabled}>
      <div className="launch-hud__topline">
        <span className="launch-hud__signal"><i aria-hidden="true" /> MODEL B / DIGITAL TWIN</span>
        <span className="launch-hud__topline-right">EDS / 3D SYSTEM</span>
      </div>
      <div className="launch-hud__viewport" ref={viewRef}>
        <div className="launch-hud__orbital" aria-hidden="true" />
        <div className="launch-hud__scan" aria-hidden="true" />
        <div className="launch-hud__aero-lines" aria-hidden="true">
          <span /><span /><span />
        </div>
        <span className="launch-hud__reticle launch-hud__reticle--tl" aria-hidden="true" />
        <span className="launch-hud__reticle launch-hud__reticle--br" aria-hidden="true" />
        {mounted ? (
          <ErrorBoundary fallback={fallback}>
            <Suspense fallback={<div className="launch-hud__loading" role="status">MODEL B / LOADING 3D</div>}>
              <HomeModelBStage mode={mode} active={active} reducedMotion={reducedMotion} lang={lang} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <div className="launch-hud__standby">
            <span className="launch-hud__standby-symbol" aria-hidden="true"><Move3d size={27} strokeWidth={1.2} /></span>
            <strong>MODEL B</strong>
            <button type="button" onClick={() => { setEnabled(true); setInView(true); }}>
              {lang === 'vi' ? 'BẬT XEM 3D' : 'ACTIVATE 3D'}
            </button>
          </div>
        )}
        <span className="launch-hud__concept-tag">MODEL B · {mode.toUpperCase()} VIEW</span>
      </div>
      <div className="launch-hud__controls">
        <span className="launch-hud__control-caption">{lang === 'vi' ? 'GÓC NHÌN' : 'SYSTEM VIEW'}</span>
        <div className="launch-hud__mode-list" role="group" aria-label={lang === 'vi' ? 'Chọn góc Model B' : 'Select Model B camera view'}>
          {modes.map(({ id, en, vi, Icon }) => (
            <button
              key={id}
              type="button"
              className="launch-hud__mode"
              data-active={id === mode}
              aria-pressed={id === mode}
              onClick={() => setMode(id)}
            >
              <Icon size={15} aria-hidden="true" />
              {lang === 'vi' ? vi : en}
            </button>
          ))}
        </div>
        <span className="launch-hud__current" aria-live="polite">{mode.toUpperCase()} / 0{modes.findIndex((entry) => entry.id === mode) + 1}</span>
      </div>
    </div>
  );
}
