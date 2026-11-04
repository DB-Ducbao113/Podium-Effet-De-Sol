import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, Flag, Trophy, Globe2 } from 'lucide-react';
import { getCalendarBySeason } from '../../data/championship';
import { getRaceResults } from '../../data/championship/results';
import openF1SessionResults from '../../data/championship/openF1SessionResults2026.json';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import type { SeasonYear } from '../../types';
import type { GrandPrixPracticeData } from '../../types/practice';
import type { GrandPrixQualifyingData } from '../../types/qualifying';
import {
  getSessionClassification,
  type ResultDataSources,
  type ResultSessionKey,
} from '../../results-engine/availability';
import { getCalendarRaceState } from '../../utils/raceSchedule';
import { JourneyWorldMap } from './JourneyWorldMap';
import './raceCalendarJourney.css';

// Heavy WebGL code is only fetched after the user opens the Journey on a capable device.
const JourneyGlobe3D = lazy(() => import('./JourneyGlobe3D').then((module) => ({ default: module.JourneyGlobe3D })));

type Mode = 'journey' | 'classic';
const ORDER: ResultSessionKey[] = ['fp1', 'fp2', 'fp3', 'sprintQualifying', 'sprint', 'qualifying', 'race'];
const OPEN = openF1SessionResults as {
  practice: Record<number, GrandPrixPracticeData>;
  qualifying: Record<number, GrandPrixQualifyingData>;
};
const EMPTY_PRACTICE: Record<number, GrandPrixPracticeData> = {};
const EMPTY_QUALIFYING: Record<number, GrandPrixQualifyingData> = {};

export function JourneyViewSwitch({ mode, onChange }: { mode: Mode; onChange: (next: Mode) => void }) {
  const lang = useNavigationStore((state) => state.lang);
  return (
    <div className="rcj-switch" role="group" aria-label={lang === 'vi' ? 'Chế độ xem Race và Calendar' : 'Race and Calendar view mode'}>
      <button type="button" aria-pressed={mode === 'journey'} onClick={() => onChange('journey')}>
        {lang === 'vi' ? 'Hành trình mùa giải' : 'Season Journey'}
      </button>
      <button type="button" aria-pressed={mode === 'classic'} onClick={() => onChange('classic')}>
        {lang === 'vi' ? 'Giao diện chi tiết' : 'Detailed view'}
      </button>
    </div>
  );
}

export function RaceCalendarJourney({ season }: { season: SeasonYear }) {
  const lang = useNavigationStore((state) => state.lang);
  const vi = lang === 'vi';
  const calendar = useMemo(() => getCalendarBySeason(season), [season]);
  const detailed = useChampionshipStore((state) => state.detailedResults[season]);
  const syncMeta = useChampionshipStore((state) => state.syncMeta);
  const [now, setNow] = useState(() => Date.now());
  const [activeRound, setActiveRound] = useState(calendar[0]?.round ?? 1);
  const [travelProgress, setTravelProgress] = useState(0);
  const [webglAvailable, setWebglAvailable] = useState(false);
  const [auto3D, setAuto3D] = useState(false);
  const [preferredMap, setPreferredMap] = useState<'3d' | '2d' | null>(null);
  const [closeUp, setCloseUp] = useState(false);
  const sections = useRef(new Map<number, HTMLElement>());

  const sources: ResultDataSources = useMemo(() => ({
    season,
    calendar,
    detailedResults: detailed ?? [],
    raceSummaries: getRaceResults(season),
    practice: season === 2026 ? OPEN.practice : EMPTY_PRACTICE,
    qualifying: season === 2026 ? OPEN.qualifying : EMPTY_QUALIFYING,
  }), [season, calendar, detailed]);

  const chapterData = useMemo(() => calendar.map((race) => {
    const sessions = ORDER.filter((key) => Boolean(race.sessions[key])).map((key) => ({
      key,
      classification: getSessionClassification(sources, race.round, key),
    }));
    const confirmations = sessions.filter((entry) => entry.classification !== null);
    const verifiedRace = sessions.find((entry) => entry.key === 'race')?.classification;
    const winner = verifiedRace?.status === 'final' && !verifiedRace.partial && verifiedRace.rows[0]?.position === 1
      ? verifiedRace.rows[0] : null;
    return { race, sessions, confirmations: confirmations.length, winner };
  }), [calendar, sources]);

  const completedCount = chapterData.filter((chapter) =>
    chapter.sessions.some((s) => s.key === 'race' && s.classification?.status === 'final')
  ).length;
  const relevantRound = chapterData.find((chapter) =>
    !chapter.sessions.some((s) => s.key === 'race' && s.classification?.status === 'final')
  )?.race.round ?? chapterData[chapterData.length - 1]?.race.round;
  const active = calendar.find((race) => race.round === activeRound) ?? calendar[0];
  const activeChapter = chapterData.find((chapter) => chapter.race.round === activeRound);
  const activeRaceClassification = activeChapter?.sessions.find((entry) => entry.key === 'race')?.classification;
  const activeRaceStatus = activeRaceClassification?.status === 'final'
    ? (vi ? 'KẾT QUẢ CHÍNH THỨC' : 'RACE CLASSIFICATION')
    : activeChapter?.confirmations ? (vi ? 'ĐÃ CÓ KẾT QUẢ PHIÊN' : 'SESSION RESULTS AVAILABLE')
    : active ? (getCalendarRaceState(active, now) === 'current' ? (vi ? 'ĐANG DIỄN RA' : 'RACE WEEKEND') : (vi ? 'THEO LỊCH MÙA GIẢI' : 'SEASON SCHEDULE'))
    : '';
  const show3D = webglAvailable && (preferredMap === '3d' || (preferredMap === null && auto3D));
  const progress = calendar.length > 1 ? 100 * travelProgress / (calendar.length - 1) : 0;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    let supported = false;
    try {
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
      supported = Boolean(context);
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch { /* WebGL unavailable: retain the non-GPU 2D map. */ }
    setWebglAvailable(supported);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const weak = typeof navigator !== 'undefined' &&
      typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2;
    setAuto3D(supported && !reduced && !weak && window.innerWidth >= 750);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setActiveRound(calendar[0]?.round ?? 1);
    setTravelProgress(0);
  }, [calendar]);

  // Drive the traced route directly from the page's scroll position, not a decorative timer.
  useEffect(() => {
    if (!calendar.length) return;
    let frame = 0;
    const measure = () => {
      const guide = Math.min(window.innerHeight * 0.55, 580);
      const tops = calendar.map((race) =>
        sections.current.get(race.round)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
      );
      if (!Number.isFinite(tops[0]) || tops[0] > guide) {
        setActiveRound(calendar[0].round);
        setTravelProgress(0);
        return;
      }
      let index = 0;
      for (let i = 1; i < tops.length; i++) {
        if (tops[i] <= guide) index = i;
        else break;
      }
      const next = tops[index + 1];
      const span = next - tops[index];
      const fraction = Number.isFinite(next) && span > 0
        ? Math.max(0, Math.min(1, (guide - tops[index]) / span))
        : 0;
      setActiveRound((previous) => previous === calendar[index].round ? previous : calendar[index].round);
      setTravelProgress((previous) =>
        Math.abs(previous - (index + fraction)) > 0.008 ? index + fraction : previous
      );
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(() => { frame = 0; measure(); });
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [calendar]);

  const jump = (round: number) => {
    setActiveRound(round);
    sections.current.get(round)?.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  if (!calendar.length) return (
    <div className="rcj-empty" role="status">{vi ? 'Chưa có lịch mùa giải này.' : 'No calendar is available for this season.'}</div>
  );

  return (
    <div className="rcj rcj--immersive" data-experience="world-tour-v5">
      <header className="rcj-hero">
        <p className="rcj-eyebrow">PODIUM EDS / SEASON {season} / THE WORLD TOUR</p>
        <h2>ONE YEAR.<span>ONE RACE.</span></h2>
        <p className="rcj-subtitle">{vi ? 'Cuộn để khám phá đường đua xuyên lục địa: mỗi Grand Prix hiện lên đúng vị trí và đường sáng nối tới chặng kế tiếp.' : 'Scroll the world tour: each Grand Prix lights up on the map, with a racing line connecting every stop.'}</p>
        <div className="rcj-metrics">
          <div><strong>{calendar.length}</strong><span>{vi ? 'CHẶNG TRONG LỊCH' : 'SCHEDULED ROUNDS'}</span></div>
          <div><strong>{completedCount}</strong><span>{vi ? 'CHẶNG CÓ KẾT QUẢ' : 'RACE RESULTS'}</span></div>
          <div><strong>{calendar.filter((r) => r.hasSprint).length}</strong><span>SPRINT WEEKENDS</span></div>
        </div>
        <div className="rcj-intro-bottom">
          <button type="button" className="rcj-cta" onClick={() => relevantRound && jump(relevantRound)}>
            <Flag size={16} aria-hidden="true" /> {vi ? 'Đến chặng liên quan' : 'Go to relevant round'} <ArrowRight size={15} aria-hidden="true" />
          </button>
          <span><ArrowDown size={14} aria-hidden="true" /> SCROLL TO EXPLORE</span>
        </div>
      </header>

      <div className="rcj-content">
        <div className="rcj-map-stage">
          <header className="rcj-stage-top">
            <div className="rcj-stage-heading">
              <span><Globe2 size={14} aria-hidden="true" /> GEO / RACE NAVIGATION SYSTEM</span>
              <strong>{vi ? 'CẢ MÙA GIẢI. MỘT HÀNH TRÌNH.' : 'THE ENTIRE SEASON. ONE JOURNEY.'}</strong>
            </div>
            <div className="rcj-stage-controls" role="group" aria-label={vi ? 'Chế độ bản đồ' : 'Map rendering mode'}>
              <button type="button" disabled={!webglAvailable} aria-pressed={show3D} onClick={() => setPreferredMap('3d')}>3D</button>
              <button type="button" aria-pressed={!show3D} onClick={() => setPreferredMap('2d')}>2D</button>
              {show3D && <button type="button" className="rcj-zoom-control" aria-pressed={closeUp}
                onClick={() => setCloseUp((value) => !value)}>{closeUp ? '−' : '+'}</button>}
            </div>
            <Link
              className="rcj-view-details"
              data-view-details
              to={`/season/${season}?tab=calendar&round=${activeRound}`}
              aria-label={vi ? `Xem chi tiết lịch chặng ${activeRound} — ${active?.name}` : `View calendar details for round ${activeRound} — ${active?.name}`}
            >
              <span className="rcj-view-details-icon"><ArrowUpRight size={21} aria-hidden="true" /></span>
              <span className="rcj-view-details-text">VIEW<br/>DETAILS</span>
            </Link>
          </header>
          <div className="rcj-stage-viewport">
            {show3D ? (
              <Suspense fallback={<JourneyWorldMap season={season} calendar={calendar} activeRound={activeRound} travelProgress={travelProgress} onSelectRound={jump} lang={lang} />}>
                <JourneyGlobe3D season={season} calendar={calendar} travelProgress={travelProgress} onSelectRound={jump} lang={lang} closeUp={closeUp} />
              </Suspense>
            ) : (
              <JourneyWorldMap season={season} calendar={calendar} activeRound={activeRound} travelProgress={travelProgress} onSelectRound={jump} lang={lang} />
            )}
            <div className="rcj-stage-edge" aria-hidden="true"/>
          </div>
          <div className="rcj-stage-data" aria-live="polite" aria-atomic="true">
            <div className="rcj-stage-counter"><span>R{String(activeRound).padStart(2, '0')}</span><small>/ {String(calendar.length).padStart(2, '0')}</small></div>
            <div className="rcj-stage-active">
              <span>{activeRaceStatus}</span>
              <strong>{active?.flag} {active?.name}</strong>
              <p>{active?.circuit} · {active?.location} · {active?.dates}</p>
            </div>
            <div className="rcj-stage-winner">
              {activeChapter?.winner ? <><Trophy size={18} aria-hidden="true" /><span>{vi ? 'CHIẾN THẮNG CHẶNG' : 'RACE WINNER'}<strong>{activeChapter.winner.driverName}</strong></span></>
                : <><Flag size={18} aria-hidden="true" /><span>{vi ? 'LỊCH & KẾT QUẢ' : 'CALENDAR / RESULTS'}<strong>{activeChapter?.confirmations ?? 0} / {activeChapter?.sessions.length ?? 0} SESSIONS</strong></span></>}
            </div>
          </div>

          <nav className="rcj-nav" aria-label={vi ? 'Điều hướng hành trình' : 'Journey navigation'}>
        <div className="rcj-nav-main">
          <span className="rcj-nav-season">{season} <b>/</b> R{String(active?.round ?? 1).padStart(2, '0')}</span>
          <span className="rcj-nav-active">{active?.flag} {active?.name}</span>
          <select aria-label={vi ? 'Chuyển đến chặng' : 'Jump to Grand Prix'} value={activeRound} onChange={(event) => jump(Number(event.target.value))}>
            {calendar.map((race) => <option key={race.round} value={race.round}>R{String(race.round).padStart(2, '0')} · {race.name}</option>)}
          </select>
        </div>
        <div className="rcj-progress" role="progressbar" aria-label={vi ? 'Tiến trình khám phá' : 'Exploration progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="rcj-rounds">
          {calendar.map((race) => <button key={race.round} type="button" onClick={() => jump(race.round)}
            aria-label={`Round ${race.round}: ${race.name}`} aria-current={activeRound === race.round ? 'step' : undefined}>
            {String(race.round).padStart(2, '0')}
          </button>)}
        </div>
      </nav>
        </div>
        <div className="rcj-scroll-track" aria-label={vi ? 'Cuộn qua các chặng trong mùa giải' : 'Scroll through the season rounds'}>
          {calendar.map((race) => (
            <section
              key={race.round}
              id={`rcj-round-${race.round}`}
              data-round={race.round}
              className="rcj-scroll-beat"
              aria-label={`Round ${race.round}: ${race.name}`}
              ref={(node) => {
                if (node) sections.current.set(race.round, node);
                else sections.current.delete(race.round);
              }}
            >
              <div className="rcj-scroll-beat-caption" aria-hidden="true">
                <span>R{String(race.round).padStart(2, '0')}</span>
                <span>{race.flag} {race.name}</span>
              </div>
            </section>
          ))}
          <div className="rcj-scroll-finish" aria-hidden="true">
            <Flag size={23} />
            <span>{vi ? 'HẾT HÀNH TRÌNH' : 'SEASON FINISH'}</span>
          </div>
        </div>
      </div>
      {syncMeta.syncStatus === 'error' && <p className="rcj-sync-note" role="status">{vi ? 'Đồng bộ tạm gián đoạn — đang sử dụng dữ liệu đã lưu.' : 'Sync currently unavailable — showing saved data.'}</p>}
    </div>
  );
}
