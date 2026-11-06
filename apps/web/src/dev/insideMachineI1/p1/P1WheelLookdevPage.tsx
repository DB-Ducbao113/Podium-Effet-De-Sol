import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FRONT_LEFT_WHEEL_V2 } from '../design/frontLeftWheelV2';
import { FRONT_LEFT_WHEEL_SHOTS, wheelShotAt } from '../design/frontLeftWheelShots';
import type { QualityProfile } from '../types';
import { clampProgress, pilotFrameAt, detachmentForScope, type WheelInspectionScope } from './pilotMotion';
import type { P1SurfaceMode } from './pilotMaterials';
import { materialStudyFor } from './P1SurfaceStudy';
import './p1Wheel.css';

const P1WheelStage = lazy(() => import('./P1WheelStage'));

// Story navigation is editorial; it does not replace the single motion
// timeline, so every shot remains fully reversible with the same slider.
const SHOT_ENTRY_PROGRESS = [0, 0.18, 0.42, 0.73, 0.80, 0.93] as const;

type P1QAControl = {
  setProgress: (value: number) => void;
  setScope: (value: WheelInspectionScope) => void;
  selectPart: (id: string) => void;
  setProfile: (profile: QualityProfile) => void;
  setMaterialMode: (mode: P1SurfaceMode) => void;
  getUIState: () => {
    progress: number;
    scope: WheelInspectionScope;
    selectedPart: string;
    profile: QualityProfile;
    materialMode: P1SurfaceMode;
    orbit: boolean;
    focusPart: string | null;
    playing: boolean;
    loaded: boolean;
    error: string;
  };
};
type P1ControlWindow = Window & { __PEDS_ITM_P1_CTRL__?: P1QAControl };

class PilotBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return <div role="alert" className="itm-p1__loading">3D renderer unavailable. The source remains unchanged.</div>;
    }
    return this.props.children;
  }
}

function hasWebGL2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

export default function P1WheelLookdevPage() {
  const [progress, setProgress] = useState(0);
  const [selectedPart, setSelectedPart] = useState<string>(FRONT_LEFT_WHEEL_V2[0].id);
  const [profile, setProfile] = useState<QualityProfile>('BALANCED');
  const [materialMode, setMaterialMode] = useState<P1SurfaceMode>('cinematic');
  const [orbit, setOrbit] = useState(false);
  const [focusPart, setFocusPart] = useState<string | null>(null);
  const [scope, setScope] = useState<WheelInspectionScope>('lock-wheel');
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [metrics, setMetrics] = useState<{ drawCalls: number; triangles: number; frameMs: number } | null>(null);
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [webglAvailable] = useState(hasWebGL2);
  const playback = useRef(0);
  const selected = FRONT_LEFT_WHEEL_V2.find((part) => part.id === selectedPart) ?? FRONT_LEFT_WHEEL_V2[0];
  const shot = wheelShotAt(progress);
  const frame = useMemo(() => pilotFrameAt(progress), [progress]);

  useEffect(() => {
    if (!playing) return;
    let previous = 0;
    const loop = (now: number) => {
      if (document.visibilityState !== 'visible') {
        previous = now;
        playback.current = requestAnimationFrame(loop);
        return;
      }
      const delta = previous ? Math.min((now - previous) / 1000, 0.08) : 0;
      previous = now;
      setProgress((current) => {
        const next = clampProgress(current + delta / 24);
        if (next >= 1) setPlaying(false);
        return next;
      });
      playback.current = requestAnimationFrame(loop);
    };
    playback.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(playback.current);
  }, [playing]);

  const onReady = useCallback((isReady: boolean) => setLoaded(isReady), []);
  const onError = useCallback((message: string) => { setError(message); setPlaying(false); }, []);
  const onMetrics = useCallback((stats: { drawCalls: number; triangles: number; frameMs: number }) => setMetrics(stats), []);
  const onContextLost = useCallback((lost: boolean) => { setContextLost(lost); if (lost) setPlaying(false); }, []);

  const seek = (value: number) => {
    setProgress(clampProgress(value));
    setPlaying(false);
    setOrbit(false);
    setFocusPart(null);
  };
  const jump = (value: number) => seek(value);

  // The seven source nodes remain the only source of part identity.
  // Focusing never writes over the story progress or model baseline.
  const choosePart = useCallback((id: string) => {
    const part = FRONT_LEFT_WHEEL_V2.find((item) => item.id === id);
    if (!part) return;
    setSelectedPart(id);
    setFocusPart(id);
    setPlaying(false);
    setOrbit(false);
    if (part.order > 1) setScope('full');
    if (progress < 0.54 || progress >= 0.86) setProgress(0.54);
  }, [progress]);

  useEffect(() => {
    if (!focusPart) return;
    const leaveFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setFocusPart(null);
      setOrbit(false);
    };
    window.addEventListener('keydown', leaveFocus);
    return () => window.removeEventListener('keydown', leaveFocus);
  }, [focusPart]);

  // Test-only control adapter. No production route, no hidden fallback
  // and no manufactured visual evidence: automation reads the live canvas.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const target = window as P1ControlWindow;
    const control: P1QAControl = {
      setProgress: (value) => {
        setProgress(clampProgress(value));
        setPlaying(false);
        setOrbit(false);
        setFocusPart(null);
      },
      setScope: (value) => {
        if (value !== 'lock-wheel' && value !== 'full') return;
        setScope(value);
        setPlaying(false);
        if (value === 'lock-wheel' && (FRONT_LEFT_WHEEL_V2.find((item) => item.id === selectedPart)?.order ?? 0) > 1) {
          setFocusPart(null);
        }
      },
      selectPart: (id) => {
        choosePart(id);
      },
      setMaterialMode: (value) => {
        if (value !== 'source' && value !== 'cinematic') return;
        setMaterialMode(value);
        setPlaying(false);
      },
      setProfile: (value) => {
        if (!['HIGH', 'BALANCED', 'PERFORMANCE'].includes(value)) return;
        setProfile(value);
        setLoaded(false);
        setError('');
        setPlaying(false);
        setFocusPart(null);
      },
      getUIState: () => ({
        progress, scope, selectedPart, profile, materialMode, orbit, focusPart, playing, loaded, error,
      }),
    };
    target.__PEDS_ITM_P1_CTRL__ = control;
    return () => {
      if (target.__PEDS_ITM_P1_CTRL__ === control) delete target.__PEDS_ITM_P1_CTRL__;
    };
  }, [progress, scope, selectedPart, profile, materialMode, orbit, focusPart, playing, loaded, error, choosePart]);

  return (
    <div
      className={frame.blueprint > 0.54 ? 'itm-p1 itm-p1--blueprint' : 'itm-p1'}
      data-testid="itm-p1-pilot"
      data-p1-scene={shot.id}
      data-p1-scope={scope}
      data-p1-focus={focusPart ?? 'film'}
      data-p1-material={materialMode}
      data-p1-blueprint={frame.blueprint.toFixed(3)}
    >
      <header className="itm-p1__header">
        <Link to="/engineering" className="itm-p1__home">PODIUM EDS <span>/</span> ENGINEERING</Link>
        <div className="itm-p1__header-label">LAB P1.6 <span>·</span> SOURCE GLB / R4.5</div>
        <div className="itm-p1__header-actions">
          <button type="button" onClick={() => setLang((value) => value === 'vi' ? 'en' : 'vi')}>{lang === 'vi' ? 'EN' : 'VI'}</button>
          <Link to="/engineering">{lang === 'vi' ? 'Thoát phòng thử nghiệm' : 'Exit pilot'}</Link>
        </div>
      </header>

      <div className="itm-p1__workspace">
        <section className="itm-p1__stage" aria-label="Cinematic engineering pilot scene">
          <div className="itm-p1__stage-top">
            <span><i /> EXPERIMENT 01 / PRECISION UNDER FIRE</span>
            <span>{loaded ? 'SOURCE VERIFIED' : 'SOURCE PENDING'}</span>
          </div>
          <div className="itm-p1__canvas">
            {webglAvailable ? (
              <PilotBoundary>
                <Suspense fallback={<div className="itm-p1__loading">INITIALIZING THE P1.1 VIEWER</div>}>
                  <P1WheelStage
                    key={retryKey}
                    progress={progress}
                    selectedPart={selectedPart}
                    profile={profile}
                    orbit={orbit}
                    focusPart={focusPart}
                    materialMode={materialMode}
                    scope={scope}
                    onError={onError}
                    onReady={onReady}
                    onMetrics={onMetrics}
                    onContextLost={onContextLost}
                  />
                </Suspense>
              </PilotBoundary>
            ) : (
              <div role="alert" className="itm-p1__loading">
                {error || 'WebGL2 is not available on this device. The R4.5 review source was not modified.'}
              </div>
            )}
            {error && (
              <div role="alert" className="itm-p1__lost">
                <p>{error}</p>
                <button type="button" onClick={() => {
                  setError('');
                  setLoaded(false);
                  setRetryKey((value) => value + 1);
                }}>RETRY VERIFIED SOURCE</button>
              </div>
            )}
            {contextLost && <div role="alert" className="itm-p1__lost">GPU context lost — scene paused</div>}
          </div>
          <div className="itm-p1__shot-label" aria-live="off">
            <small>{focusPart
              ? `COMPONENT / ${String(selected.order + 1).padStart(2, '0')} / 07`
              : `0${FRONT_LEFT_WHEEL_SHOTS.indexOf(shot) + 1} / 06 — ${shot.mood.toUpperCase()}`}</small>
            <h1>{focusPart
              ? selected.id.split('.').at(-1)?.replaceAll('_', ' ')
              : shot.title[lang]}</h1>
            <p>{focusPart
              ? selected.inspection
              : lang === 'vi'
                ? 'Nghiên cứu ánh sáng, nhịp camera và lắp ráp cơ khí trên đúng geometry R4.5.'
                : 'A source-matched study of lighting, camera choreography and real 3D component separation.'}</p>
          </div>
          <div className="itm-p1__techline">
            <span>F1 MODEL B / FRONT LEFT CORNER</span>
            <span>GLTF Y-UP · 7 SOURCE NODES · NO FABRICATED TELEMETRY</span>
          </div>
        </section>

        <aside className="itm-p1__panel" aria-label="Component selection and technical information">
          <div className="itm-p1__panel-head">
            <div className="itm-p1__eyebrow">01 — CONTACT PATCH</div>
            <h2>THE WHEEL<span>.</span></h2>
            <p>{lang === 'vi'
              ? 'Bảy lớp cơ khí. Một trục liên kết. Tách rời, quan sát, lắp lại.'
              : 'Seven technical layers. One assembly axis. Inspect and reassemble.'}</p>
          </div>
          <div className="itm-p1__panel-title">
            <span>ASSEMBLY / LAYERS</span>
            <span>07</span>
          </div>
          <div className="itm-p1__part-list">
            {FRONT_LEFT_WHEEL_V2.map((part, index) => (
              <button
                type="button"
                key={part.id}
                className={selectedPart === part.id ? 'itm-p1__part itm-p1__part--active' : 'itm-p1__part'}
                aria-pressed={selectedPart === part.id}
                onClick={() => choosePart(part.id)}
              >
                <small>{String(index + 1).padStart(2, '0')}</small>
                <span>{part.id.split('.').at(-1)?.replaceAll('_', ' ')}</span>
                <b>{selectedPart === part.id ? '+' : '·'}</b>
              </button>
            ))}
          </div>
          <div className="itm-p1__part-detail">
            <span className="itm-p1__eyebrow">MATERIAL / PART FOCUS</span>
            <strong>{selected.material.replaceAll('-', ' ').toUpperCase()}</strong>
            <p>{selected.inspection}</p>
            <div className="itm-p1__focus-actions">
              <button
                type="button"
                className="itm-p1__focus-button"
                aria-pressed={focusPart === selectedPart}
                disabled={!loaded}
                onClick={() => {
                  if (focusPart) {
                    setFocusPart(null);
                    setOrbit(false);
                  } else {
                    choosePart(selectedPart);
                  }
                }}
              >
                {focusPart
                  ? (lang === 'vi' ? 'TRỞ LẠI GÓC PHIM' : 'RETURN TO FILM')
                  : (lang === 'vi' ? 'XEM CẬN LINH KIỆN' : 'FOCUS SELECTED PART')}
              </button>
              {focusPart && (
                <span className="itm-p1__focus-hint">
                  {lang === 'vi' ? 'ESC để thoát' : 'ESC to exit'}
                </span>
              )}
            </div>
          </div>
          <div className="itm-p1__surface-study" aria-label="P1.6 surface materials">
            <div className="itm-p1__surface-study-heading">
              <span>SURFACE STUDY / P1.6</span>
              <span>{materialMode === 'source' ? 'ORIGINAL' : 'CINEMATIC'}</span>
            </div>
            {materialStudyFor(selectedPart).map(({ sourceName, look }) => (
              <div key={sourceName} className="itm-p1__surface-study-row">
                <span
                  className="itm-p1__surface-study-chip"
                  style={{ background: materialMode === 'cinematic' && look
                    ? `linear-gradient(130deg, ${look.color}, #0d1924)`
                    : 'linear-gradient(130deg, #718292, #1a242e)' }}
                  aria-hidden="true"
                />
                <div>
                  <strong>{sourceName.replaceAll('PEDS_', '').replaceAll('_', ' ')}</strong>
                  <div>
                    <small>{materialMode === 'cinematic' && look
                      ? `METAL ${look.metalness.toFixed(2)} / ROUGH ${look.roughness.toFixed(2)}`
                      : 'SOURCE GLB / PBR UNCHANGED'}</small>
                  </div>
                </div>
              </div>
            ))}
            <span className="itm-p1__surface-study-caption">
              {materialMode === 'cinematic'
                ? (profile === 'PERFORMANCE'
                  ? 'Flat PBR only · procedural microfinish disabled'
                  : 'Source UV · subtle roughness-only microfinish · no invented mesh detail')
                : 'Original source material values; GLB geometry and paint remain unchanged'}
            </span>
          </div>
          <div className="itm-p1__source-note">
            MODEL B · ENGINEERING DEMONSTRATOR
            <span>{lang === 'vi'
              ? 'Chưa xác minh độ ăn khớp trục–moay-ơ. Cấu trúc bên trong mang tính minh họa.'
              : 'Shaft–hub mechanical engagement remains unverified. Internal systems are illustrative.'}</span>
          </div>
        </aside>
      </div>

      <section className="itm-p1__transport" aria-label="Cinematic timeline and scene controls">
        <nav className="itm-p1__shot-rail" aria-label="Cinematic scene navigation">
          {FRONT_LEFT_WHEEL_SHOTS.map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              aria-current={shot.id === entry.id ? 'step' : undefined}
              onClick={() => jump(SHOT_ENTRY_PROGRESS[index])}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{entry.title[lang]}</strong>
            </button>
          ))}
        </nav>
        <input
          aria-label={lang === 'vi' ? 'Tiến trình cinematic' : 'Cinematic sequence progress'}
          type="range" min="0" max="1" step="0.001"
          value={progress}
          onChange={(event) => seek(Number(event.target.value))}
          style={{ background: `linear-gradient(90deg,#ff5635 ${progress * 100}%,#344657 ${progress * 100}%)` }}
        />
        <div className="itm-p1__actions">
          <div className="itm-p1__action-group itm-p1__material-controls" aria-label="P1.6 material comparison">
            <button
              type="button"
              aria-pressed={materialMode === 'source'}
              onClick={() => { setMaterialMode('source'); setPlaying(false); }}
            >
              SOURCE MATERIALS
            </button>
            <button
              type="button"
              aria-pressed={materialMode === 'cinematic'}
              onClick={() => { setMaterialMode('cinematic'); setPlaying(false); }}
            >
              P1.6 / CINEMATIC
            </button>
          </div>
          <div className="itm-p1__action-group itm-p1__scope-controls" aria-label="Inspection scope">
            <button type="button" aria-pressed={scope === 'lock-wheel'} onClick={() => { setScope('lock-wheel'); setPlaying(false); setFocusPart(null); }}>
              P1.2 / LOCK + WHEEL
            </button>
            <button type="button" aria-pressed={scope === 'full'} onClick={() => { setScope('full'); setPlaying(false); }}>
              ALL 7 PARTS
            </button>
          </div>
          <div className="itm-p1__action-group">
            <button type="button" className="itm-p1__primary" disabled={!loaded || !!error} onClick={() => {
              if (progress >= 1) setProgress(0);
              setPlaying((value) => !value);
              setOrbit(false);
              setFocusPart(null);
            }}>
              {playing ? 'PAUSE' : 'PLAY CINEMATIC'}
            </button>
            <button type="button" onClick={() => jump(0)}>RESET</button>
            <button type="button" onClick={() => jump(0.40)}>LOCK OUT</button>
            <button type="button" onClick={() => jump(0.54)}>FULL EXPLODE</button>
            <button type="button" onClick={() => jump(0.73)}>BLUEPRINT</button>
            <button type="button" onClick={() => jump(0.80)}>MACRO</button>
          </div>
          <div className="itm-p1__action-group">
            <button type="button" aria-pressed={orbit} onClick={() => { setOrbit((x) => !x); setPlaying(false); }}>
              {orbit ? 'EXIT ORBIT' : 'ORBIT'}
            </button>
            <select aria-label="Rendering quality profile" value={profile} onChange={(event) => {
              setProfile(event.target.value as QualityProfile);
              setPlaying(false);
              setLoaded(false);
              setError('');
            }}>
              <option value="HIGH">HIGH</option>
              <option value="BALANCED">BALANCED</option>
              <option value="PERFORMANCE">PERFORMANCE</option>
            </select>
            <output>{Math.round(progress * 100)}%</output>
          </div>
        </div>
        <div className="itm-p1__footer">
          <span>{materialMode === 'cinematic' ? 'P1.6 LOOKDEV' : 'ORIGINAL GLB MATERIALS'} · {scope === 'lock-wheel' ? 'LOCK + WHEEL' : 'FULL CORNER'} EXPLODED {Math.round(detachmentForScope(progress, scope) * 100)}% · BLUEPRINT {Math.round(frame.blueprint * 100)}%</span>
          <span>{metrics ? `${metrics.drawCalls} DRAWS / ${metrics.triangles.toLocaleString()} TRIANGLES / R3F DELTA ${metrics.frameMs.toFixed(1)} MS (NOT GPU TIME)` : 'GPU METRICS PENDING'}</span>
          <span>LOOKDEV ONLY / NOT PRODUCTION READY</span>
        </div>
      </section>
    </div>
  );
}
