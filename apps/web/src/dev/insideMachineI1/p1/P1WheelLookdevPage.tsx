import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FRONT_LEFT_WHEEL_V2 } from '../design/frontLeftWheelV2';
import { FRONT_LEFT_WHEEL_SHOTS, wheelShotAt } from '../design/frontLeftWheelShots';
import type { QualityProfile } from '../types';
import { clampProgress, pilotFrameAt, detachmentForScope, type WheelInspectionScope } from './pilotMotion';
import './p1Wheel.css';

const P1WheelStage = lazy(() => import('./P1WheelStage'));

type P1QAControl = {
  setProgress: (value: number) => void;
  setScope: (value: WheelInspectionScope) => void;
  selectPart: (id: string) => void;
  setProfile: (profile: QualityProfile) => void;
  getUIState: () => {
    progress: number;
    scope: WheelInspectionScope;
    selectedPart: string;
    profile: QualityProfile;
    orbit: boolean;
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
  const [orbit, setOrbit] = useState(false);
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
  };
  const jump = (value: number) => seek(value);

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
      },
      setScope: (value) => {
        if (value !== 'lock-wheel' && value !== 'full') return;
        setScope(value);
        setPlaying(false);
      },
      selectPart: (id) => {
        const part = FRONT_LEFT_WHEEL_V2.find((item) => item.id === id);
        if (!part) return;
        setSelectedPart(id);
        if (part.order > 1) setScope('full');
        setPlaying(false);
      },
      setProfile: (value) => {
        if (!['HIGH', 'BALANCED', 'PERFORMANCE'].includes(value)) return;
        setProfile(value);
        setLoaded(false);
        setError('');
        setPlaying(false);
      },
      getUIState: () => ({
        progress, scope, selectedPart, profile, orbit, playing, loaded, error,
      }),
    };
    target.__PEDS_ITM_P1_CTRL__ = control;
    return () => {
      if (target.__PEDS_ITM_P1_CTRL__ === control) delete target.__PEDS_ITM_P1_CTRL__;
    };
  }, [progress, scope, selectedPart, profile, orbit, playing, loaded, error]);

  return (
    <div
      className={frame.blueprint > 0.54 ? 'itm-p1 itm-p1--blueprint' : 'itm-p1'}
      data-testid="itm-p1-pilot"
      data-p1-scene={shot.id}
      data-p1-scope={scope}
      data-p1-blueprint={frame.blueprint.toFixed(3)}
    >
      <header className="itm-p1__header">
        <Link to="/engineering" className="itm-p1__home">PODIUM EDS <span>/</span> ENGINEERING</Link>
        <div className="itm-p1__header-label">LAB P1.2 <span>·</span> SOURCE GLB / R4.5</div>
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
            <small>0{FRONT_LEFT_WHEEL_SHOTS.indexOf(shot) + 1} / 06 — {shot.mood.toUpperCase()}</small>
            <h1>{shot.title[lang]}</h1>
            <p>{lang === 'vi'
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
                onClick={() => {
                  setSelectedPart(part.id);
                  if (index > 1) setScope('full');
                  setPlaying(false);
                }}
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
        <div className="itm-p1__transport-head">
          <span>00 / REVEAL</span><span>01 / DISASSEMBLE</span><span>02 / BLUEPRINT</span><span>03 / REBUILD</span>
        </div>
        <input
          aria-label={lang === 'vi' ? 'Tiến trình cinematic' : 'Cinematic sequence progress'}
          type="range" min="0" max="1" step="0.001"
          value={progress}
          onChange={(event) => seek(Number(event.target.value))}
          style={{ background: `linear-gradient(90deg,#ff5635 ${progress * 100}%,#344657 ${progress * 100}%)` }}
        />
        <div className="itm-p1__actions">
          <div className="itm-p1__action-group itm-p1__scope-controls" aria-label="Inspection scope">
            <button type="button" aria-pressed={scope === 'lock-wheel'} onClick={() => { setScope('lock-wheel'); setPlaying(false); }}>
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
          <span>{scope === 'lock-wheel' ? 'LOCK + WHEEL' : 'FULL CORNER'} EXPLODED {Math.round(detachmentForScope(progress, scope) * 100)}% · BLUEPRINT {Math.round(frame.blueprint * 100)}%</span>
          <span>{metrics ? `${metrics.drawCalls} DRAWS / ${metrics.triangles.toLocaleString()} TRIANGLES / R3F DELTA ${metrics.frameMs.toFixed(1)} MS (NOT GPU TIME)` : 'GPU METRICS PENDING'}</span>
          <span>LOOKDEV ONLY / NOT PRODUCTION READY</span>
        </div>
      </section>
    </div>
  );
}
