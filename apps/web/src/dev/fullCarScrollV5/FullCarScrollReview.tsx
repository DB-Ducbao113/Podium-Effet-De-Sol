import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { ASSET_URLS, MANIFEST_URL, POSTER_URL } from '../insideMachineI1/assetPaths';
import { poseAt } from '../insideMachineI1/storyboard';
import type { AssemblyManifest, QualityProfile, RuntimeMetrics } from '../insideMachineI1/types';
import './fullCarScrollReview.css';

// The existing Inside the Machine renderer and verified R4.5 assets are reused.
// No generated car, rewritten GLB, or global style change.
const ThreeStage = lazy(() => import('../insideMachineI1/ThreeStage'));
type Step = { group: number; title: string; detail: string; assembly: string; component: string; whole: boolean };
type GroupSpec = { title: string; assembly: string; match?: RegExp; limit?: number };
const GROUPS: readonly GroupSpec[] = [
  { title: 'FULL MACHINE', assembly: '' },
  { title: 'FRONT WING', assembly: 'FRONT_WING', limit: 4 },
  { title: 'FRONT WHEELS', assembly: 'FRONT_LEFT_WHEEL', match: /WHEEL|HUB|LOCK/i, limit: 3 },
  { title: 'BRAKES', assembly: 'FRONT_LEFT_WHEEL', match: /BRAKE|DISC|CALIPER/i, limit: 3 },
  { title: 'SUSPENSION', assembly: 'FRONT_LEFT_WHEEL', match: /SUSPENSION|LINK|INTERFACE/i, limit: 3 },
  { title: 'COCKPIT + HALO', assembly: 'COCKPIT_HALO', limit: 4 },
  { title: 'MONOCOQUE', assembly: '' },
  { title: 'SIDEPODS', assembly: 'LEFT_SIDEPOD', limit: 4 },
  { title: 'COOLING', assembly: 'COOLING_LEFT', limit: 5 },
  { title: 'POWERTRAIN', assembly: 'POWERTRAIN', limit: 5 },
  { title: 'FLOOR + DIFFUSER', assembly: 'FLOOR_DIFFUSER', limit: 4 },
  { title: 'REAR AXLE', assembly: 'REAR_LEFT_WHEEL', match: /SUSPENSION|LINK|INTERFACE|BRAKE/i, limit: 4 },
  { title: 'REAR WING', assembly: 'REAR_WING', limit: 4 },
  { title: 'REASSEMBLY', assembly: '' },
];
const clamp = (x: number) => Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0));
export function buildFullCarSteps(manifest: AssemblyManifest): Step[] {
  const steps: Step[] = [];
  GROUPS.forEach((spec, group) => {
    const whole = !spec.assembly;
    steps.push({ group, title: spec.title, detail: whole ? 'FULL VEHICLE' : 'SYSTEM OVERVIEW', assembly: spec.assembly, component: '', whole });
    if (!spec.assembly) return;
    const parts = manifest.components
      .filter(item => item.parentAssemblyId === spec.assembly)
      .filter(item => !spec.match || spec.match.test(item.id))
      .sort((a, b) => a.animationOrder - b.animationOrder)
      .slice(0, spec.limit ?? 4);
    for (const part of parts) {
      steps.push({ group, title: spec.title, detail: part.label.en || part.id.split('.').pop() || 'PART', assembly: spec.assembly, component: part.id, whole: false });
    }
  });
  return steps;
}
function useProgress(ref: RefObject<HTMLElement>): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = ref.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const next = clamp(-rect.top / Math.max(1, rect.height - innerHeight));
      setProgress(previous => Math.abs(previous - next) > 0.00025 ? next : previous);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
  return progress;
}
export default function FullCarScrollReview() {
  const track = useRef<HTMLElement>(null);
  const progress = useProgress(track);
  const [manifest, setManifest] = useState<AssemblyManifest | null>(null);
  const [manifestError, setManifestError] = useState('');
  const [quality, setQuality] = useState<QualityProfile>('BALANCED');
  const [modelError, setModelError] = useState(false);
  const [metrics, setMetrics] = useState<RuntimeMetrics | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const controller = new AbortController();
    fetch(MANIFEST_URL, { signal: controller.signal, cache: 'no-store' })
      .then(response => { if (!response.ok) throw Error('Manifest HTTP ' + response.status); return response.json() as Promise<AssemblyManifest>; })
      .then(data => { if (!controller.signal.aborted) setManifest(data); })
      .catch((error: unknown) => { if (!controller.signal.aborted) setManifestError(String(error)); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const steps = useMemo(() => manifest ? buildFullCarSteps(manifest) : [], [manifest]);
  const stepIndex = steps.length ? Math.min(steps.length - 1, Math.floor(progress * steps.length)) : 0;
  const step = steps[stepIndex];
  const groupIndex = step?.group ?? 0;
  const overview = !step || step.whole;
  const firstAssembly = manifest?.assemblies[0]?.id ?? 'FRONT_WING';
  const firstComponent = manifest?.components.find(item => item.parentAssemblyId === firstAssembly)?.id ?? '';
  const seek = useCallback((fraction: number) => {
    const element = track.current;
    if (!element) return;
    const start = window.scrollY + element.getBoundingClientRect().top;
    window.scrollTo({ top: start + clamp(fraction) * Math.max(1, element.offsetHeight - innerHeight), behavior: reducedMotion ? 'instant' : 'smooth' });
  }, [reducedMotion]);
  const seekGroup = (group: number) => {
    const index = steps.findIndex(item => item.group === group);
    if (index >= 0) seek((index + 0.01) / steps.length);
  };
  // Stable callbacks prevent the existing ThreeStage asset-loading effect from restarting.
  const onStageReady = useCallback(() => setModelError(false), []);
  const onStageError = useCallback(() => setModelError(true), []);
  const onStageMetrics = useCallback((value: RuntimeMetrics) => setMetrics(value), []);
  const onStageContext = useCallback((value: boolean) => setContextLost(value), []);
  const noOp = useCallback(() => {}, []);
  const stageReady = manifest && !manifestError && !modelError && !contextLost;
  return <div className="peds-fullcar-v5">
    <a className="peds-fullcar-v5__skip" href="#peds-fullcar-end">Skip animation</a>
    <section className="peds-fullcar-v5__track" ref={track} style={{ height: Math.max(14, steps.length) * 66 + 'svh' }}>
      <div className="peds-fullcar-v5__sticky">
        <div className="peds-fullcar-v5__model" aria-label="R4.5 full Formula car">
          {stageReady ? <Suspense fallback={<img src={POSTER_URL} alt="Model B loading" />}>
            <ThreeStage modelUrl={ASSET_URLS[quality]} manifest={manifest} scrollProgress={0}
              cutaway={false} selectedAssembly={overview ? firstAssembly : step.assembly}
              selectedComponent={overview ? firstComponent : step.component}
              isolation={!overview} isolationScope={step?.component ? 'component' : 'assembly'}
              ghost storyFocusStrength={0} attachmentCue={false}
              cameraPose={poseAt(overview && groupIndex === GROUPS.length - 1 ? 1 : 0).camera}
              cameraMode={overview ? 'story' : 'inspect'} lightIntensity={1}
              profile={quality} lang="en" restarting={false}
              onReady={onStageReady} onMetrics={onStageMetrics} onEvidence={noOp}
              onContextLost={onStageContext} onProfileDisplayed={noOp}
              onLoadError={onStageError} onRetryStart={onStageReady} onUserOrbit={noOp} />
          </Suspense> :
          <div className="peds-fullcar-v5__fallback">
            <img src={POSTER_URL} alt="Model B static poster" />
            <strong>MODEL B / SOURCE REQUIRED</strong>
            <small>{manifestError || (contextLost ? 'WebGL context lost' : modelError ? 'Model could not be loaded' : 'Loading verified R4.5 assets')}</small>
          </div>}
        </div>
        <div className="peds-fullcar-v5__grid" aria-hidden="true" />
        <header className="peds-fullcar-v5__header">
          <Link to="/engineering" className="peds-fullcar-v5__brand">PODIUM <span>EDS</span></Link>
          <span>ENGINEERING / INSIDE THE MACHINE</span>
          <Link to="/engineering" className="peds-fullcar-v5__exit">EXIT ↗</Link>
        </header>
        <div className="peds-fullcar-v5__title" aria-live="off">
          <span className="peds-fullcar-v5__index">{String(groupIndex + 1).padStart(2, '0')} / 14</span>
          <h1 key={groupIndex}>{GROUPS[groupIndex].title}</h1>
          <p>{step?.detail ?? 'FULL VEHICLE'}</p>
        </div>
        <nav className="peds-fullcar-v5__rail" aria-label="Vehicle systems">
          {GROUPS.map((group, index) => <button key={group.title} type="button" className={index === groupIndex ? 'active' : ''}
            aria-label={'View ' + group.title} aria-current={index === groupIndex ? 'step' : undefined}
            onClick={() => seekGroup(index)}><i /></button>)}
        </nav>
        <footer className="peds-fullcar-v5__footer">
          <span>{Math.round(progress * 100)}% / {steps.length} STOPS</span>
          <div className="peds-fullcar-v5__progress"><i style={{ width: (progress * 100) + '%' }}/></div>
          <span className="peds-fullcar-v5__metrics">{metrics ? Math.round(metrics.fps) + ' FPS' : 'R4.5'}</span>
          <label>LOD <select aria-label="Quality" value={quality}
            onChange={event => { setModelError(false); setQuality(event.target.value as QualityProfile); }}>
            <option value="HIGH">HIGH</option><option value="BALANCED">BALANCED</option>
            <option value="PERFORMANCE">PERFORMANCE</option>
          </select></label>
        </footer>
      </div>
    </section>
    <section id="peds-fullcar-end" className="peds-fullcar-v5__end">
      <span>FULL CAR / R4.5</span><h2>ONE MACHINE.<br />EVERY PART.</h2>
      <button type="button" onClick={() => seek(0)}>REPLAY ↑</button>
    </section>
  </div>;
}
