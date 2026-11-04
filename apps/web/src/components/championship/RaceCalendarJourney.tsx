import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
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
import { JourneyWorldMap } from './JourneyWorldMap';
import './raceCalendarJourney.css';

// Heavy WebGL code is only fetched after the user opens the Journey on a capable device.
const JourneyGlobe3D = lazy(() => import('./JourneyGlobe3D').then((module) => ({ default: module.JourneyGlobe3D })));

const ORDER: ResultSessionKey[] = ['fp1', 'fp2', 'fp3', 'sprintQualifying', 'sprint', 'qualifying', 'race'];
const OPEN = openF1SessionResults as {
  practice: Record<number, GrandPrixPracticeData>;
  qualifying: Record<number, GrandPrixQualifyingData>;
};
const EMPTY_PRACTICE: Record<number, GrandPrixPracticeData> = {};
const EMPTY_QUALIFYING: Record<number, GrandPrixQualifyingData> = {};

/** Detail pages keep their existing data and deep links; only the large mode switch is removed. */
export function BackToJourney({
  season, round, tab,
}: { season: SeasonYear; round?: number | null; tab: 'results' | 'calendar' }) {
  const lang = useNavigationStore((state) => state.lang);
  const focus = round && round > 0 ? `&focus=${round}` : '';
  return (
    <Link className="rcj-back-link" data-back-to-map to={`/season/${season}?tab=${tab}${focus}`}>
      <ArrowLeft size={15} aria-hidden="true" />
      {lang === 'vi' ? 'Về bản đồ' : 'Back to map'}
    </Link>
  );
}

export function RaceCalendarJourney({ season }: { season: SeasonYear }) {
  const location = useLocation();
  const lang = useNavigationStore((state) => state.lang);
  const vi = lang === 'vi';
  const calendar = useMemo(() => getCalendarBySeason(season), [season]);
  const detailed = useChampionshipStore((state) => state.detailedResults[season]);
  const syncMeta = useChampionshipStore((state) => state.syncMeta);
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

  const active = calendar.find((race) => race.round === activeRound) ?? calendar[0];
  const activeChapter = chapterData.find((chapter) => chapter.race.round === activeRound);
  const focusParam = Number(new URLSearchParams(location.search).get('focus'));
  const focusRound = Number.isInteger(focusParam) && calendar.some((race) => race.round === focusParam)
    ? focusParam : null;
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
    setActiveRound(calendar[0]?.round ?? 1);
    setTravelProgress(0);
  }, [calendar]);

  // Return from details to the same Grand Prix without using round=N (reserved for detail mode).
  useEffect(() => {
    if (focusRound === null) return;
    const frame = window.requestAnimationFrame(() => {
      sections.current.get(focusRound)?.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [season, focusRound]);

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
    <div className="rcj rcj--immersive" data-experience="world-tour-v6">
      <div className="rcj-content">
        <section className="rcj-map-stage" aria-label={vi ? 'Bản đồ hành trình mùa giải' : 'Season journey world map'}>
          <header className="rcj-stage-top">
            <h2 className="rcj-stage-title">{season} <span>/</span> {vi ? 'HÀNH TRÌNH' : 'WORLD TOUR'}</h2>
            <div className="rcj-stage-actions">
              <div className="rcj-stage-controls" role="group" aria-label={vi ? 'Chế độ bản đồ' : 'Map rendering mode'}>
                <button type="button" disabled={!webglAvailable} aria-pressed={show3D} onClick={() => setPreferredMap('3d')}>3D</button>
                <button type="button" aria-pressed={!show3D} onClick={() => setPreferredMap('2d')}>2D</button>
                {show3D && <button type="button" className="rcj-zoom-control" aria-pressed={closeUp}
                  aria-label={vi ? 'Chuyển mức phóng to bản đồ' : 'Toggle globe zoom'}
                  onClick={() => setCloseUp((value) => !value)}>{closeUp ? '−' : '+'}</button>}
              </div>
              <Link className="rcj-view-details" data-view-details
                to={`/season/${season}?tab=calendar&round=${activeRound}`}
                aria-label={vi ? `Xem lịch chi tiết chặng ${activeRound}: ${active?.name}` : `Calendar details for round ${activeRound}: ${active?.name}`}>
                <ArrowUpRight size={19} aria-hidden="true" />
                <span>{vi ? 'CHI TIẾT' : 'DETAILS'}</span>
              </Link>
            </div>
          </header>
          <div className="rcj-stage-viewport">
            {show3D ? (
              <Suspense fallback={<JourneyWorldMap season={season} calendar={calendar} activeRound={activeRound} travelProgress={travelProgress} onSelectRound={jump} lang={lang} />}>
                <JourneyGlobe3D season={season} calendar={calendar} travelProgress={travelProgress} onSelectRound={jump} lang={lang} closeUp={closeUp} />
              </Suspense>
            ) : (
              <JourneyWorldMap season={season} calendar={calendar} activeRound={activeRound} travelProgress={travelProgress} onSelectRound={jump} lang={lang} />
            )}
          </div>
          <div className="rcj-stage-data" aria-live="polite" aria-atomic="true">
            <span className="rcj-stage-counter">R{String(activeRound).padStart(2, '0')}</span>
            <div className="rcj-stage-active">
              <strong>{active?.name}</strong>
              <span>{active?.circuit} · {active?.location}</span>
              {activeChapter?.winner && <small>{vi ? 'Chiến thắng' : 'Winner'} · {activeChapter.winner.driverName}</small>}
            </div>
          </div>
          <nav className="rcj-nav" aria-label={vi ? 'Chọn chặng trong năm' : 'Season round navigation'}>
            <div className="rcj-nav-main">
              <span className="rcj-scroll-hint">{vi ? 'CUỘN ĐỂ KHÁM PHÁ' : 'SCROLL TO TRAVEL'}</span>
              <div className="rcj-progress" role="progressbar" aria-label={vi ? 'Tiến trình hành trình' : 'Journey progress'}
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <select aria-label={vi ? 'Chuyển tới chặng' : 'Jump to race'} value={activeRound}
                onChange={(event) => jump(Number(event.target.value))}>
                {calendar.map((race) => <option key={race.round} value={race.round}>R{String(race.round).padStart(2, '0')} · {race.name}</option>)}
              </select>
              <span className="rcj-round-count">{String(Math.max(0, calendar.findIndex((race) => race.round === activeRound) + 1)).padStart(2, '0')} / {String(calendar.length).padStart(2, '0')}</span>
            </div>
            <div className="rcj-rounds" aria-label={vi ? 'Các chặng' : 'Grand Prix stops'}>
              {calendar.map((race) => <button key={race.round} type="button" onClick={() => jump(race.round)}
                aria-label={`Round ${race.round}: ${race.name}`} aria-current={activeRound === race.round ? 'step' : undefined}
                title={race.name}><span aria-hidden="true" /></button>)}
            </div>
          </nav>
        </section>
        <div className="rcj-scroll-track" aria-label={vi ? 'Cuộn qua tất cả Grand Prix' : 'Scroll through all Grand Prix'}>
          {calendar.map((race) => (
            <section key={race.round} id={`rcj-round-${race.round}`} data-round={race.round}
              className="rcj-scroll-beat" aria-label={`Round ${race.round}: ${race.name}`}
              ref={(node) => { if (node) sections.current.set(race.round, node); else sections.current.delete(race.round); }} />
          ))}
          <div className="rcj-scroll-finish" aria-hidden="true" />
        </div>
      </div>
      {syncMeta.syncStatus === 'error' && <p className="rcj-sync-note" role="status">{vi ? 'Dữ liệu có thể chưa được cập nhật.' : 'Data may be out of date.'}</p>}
    </div>
  );
}
