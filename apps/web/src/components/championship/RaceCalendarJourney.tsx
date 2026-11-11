import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
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
import { JourneyCircuitOverlay } from './JourneyCircuitOverlay';
import { getJourneyIntroTier } from './journeyIntroState';
import { formatLatitude, formatLongitude, resolveCircuit } from './journeyCoordinates';
import { getJourneyPhase, getJourneyScrollPosition, getJourneyScrollTarget } from './journeyScrollMotion';
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
  const syncSeasonData = useChampionshipStore((state) => state.syncSeasonData);
  const [activeRound, setActiveRound] = useState(calendar[0]?.round ?? 1);
  const [journeyPosition, setJourneyPosition] = useState(0);
  const [webglAvailable, setWebglAvailable] = useState(false);
  const [closeUp, setCloseUp] = useState(false);
  const sections = useRef(new Map<number, HTMLElement>());
  const scrollEntryRef = useRef(0);
  const pixelsPerRoundRef = useRef(1);

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
  const tab = new URLSearchParams(location.search).get('tab') === 'calendar' ? 'calendar' : 'results';
  const focusRound = Number.isInteger(focusParam) && calendar.some((race) => race.round === focusParam)
    ? focusParam : null;
  const introTier = getJourneyIntroTier({
    webglAvailable,
    reducedMotion: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: typeof navigator !== 'undefined' && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData),
    effectiveType: typeof navigator !== 'undefined' ? (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType : undefined,
    deviceMemory: typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory : undefined,
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined,
  });
  const show3D = introTier !== 'T0';
  const phase = getJourneyPhase(journeyPosition, calendar.length);
  const introOpacity = tab === 'calendar' ? phase.introOpacity : 0;
  const progress = calendar.length ? 100 * journeyPosition / calendar.length : 0;
  const activeGeo = active ? resolveCircuit(active) : null;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    let supported = false;
    try {
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
      const debugInfo = context?.getExtension('WEBGL_debug_renderer_info');
      const renderer = context && debugInfo
        ? String(context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : '';
      supported = Boolean(context) && !/swiftshader|llvmpipe|software rasterizer/i.test(renderer);
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch { /* WebGL unavailable: retain the non-GPU 2D map. */ }
    setWebglAvailable(supported);
  }, []);

  useEffect(() => {
    setActiveRound(calendar[0]?.round ?? 1);
    setJourneyPosition(0);
  }, [calendar]);

  // Start moving on the FIRST wheel gesture after opening Results / Calendar.
  // Previously R01 stayed frozen until its first invisible section crossed 55% of the viewport.
  useEffect(() => {
    if (!calendar.length) return;
    const firstBeat = sections.current.get(calendar[0].round);
    pixelsPerRoundRef.current = firstBeat?.getBoundingClientRect().height || window.innerHeight * 0.85;
    scrollEntryRef.current = window.scrollY;

    let frame = 0;
    const measure = () => {
      const amount = getJourneyScrollPosition(
        window.scrollY, scrollEntryRef.current, pixelsPerRoundRef.current, calendar.length,
      );
      const index = getJourneyPhase(amount, calendar.length).roundIndex;
      setActiveRound((previous) => previous === calendar[index].round ? previous : calendar[index].round);
      setJourneyPosition((previous) => Math.abs(previous - amount) > 0.001 ? amount : previous);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(() => { frame = 0; measure(); });
    };
    const onResize = () => {
      pixelsPerRoundRef.current =
        sections.current.get(calendar[0].round)?.getBoundingClientRect().height || window.innerHeight * 0.85;
      schedule();
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize);

    // Back to map &focus=N restores the saved round using the SAME scroll coordinate system.
    if (focusRound !== null) {
      const index = calendar.findIndex((race) => race.round === focusRound);
      if (index >= 0) {
        const target = getJourneyScrollTarget(scrollEntryRef.current, index, pixelsPerRoundRef.current, 0.52);
        window.requestAnimationFrame(() => window.scrollTo({ top: target, behavior: 'instant' }));
      }
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
    };
  }, [calendar, focusRound]);

  const jump = (round: number) => {
    const index = calendar.findIndex((race) => race.round === round);
    if (index < 0) return;
    setActiveRound(round);
    window.scrollTo({
      top: getJourneyScrollTarget(scrollEntryRef.current, index, pixelsPerRoundRef.current, 0.52),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
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
            <div className="rcj-stage-heading">
              <span className="rcj-stage-kicker">{vi ? 'HÀNH TRÌNH MÙA GIẢI' : 'WORLD TOUR'} / {season}</span>
              <h2 className="rcj-stage-title">{tab === 'results' ? (vi ? 'KẾT QUẢ' : 'RESULTS') : (vi ? 'LỊCH ĐUA' : 'CALENDAR')}</h2>
            </div>
            <div className="rcj-stage-actions">
              <nav className="rcj-stage-controls" aria-label={vi ? 'Trang giải vô địch' : 'Championship pages'}>
                <Link to={`/season/${season}?tab=results`} aria-current={tab === 'results' ? 'page' : undefined}>{vi ? 'Kết quả' : 'Results'}</Link>
                <Link to={`/season/${season}?tab=calendar`} aria-current={tab === 'calendar' ? 'page' : undefined}>{vi ? 'Lịch đua' : 'Calendar'}</Link>
                {show3D && <button type="button" className="rcj-zoom-control" aria-pressed={closeUp}
                  aria-label={vi ? 'Chuyển mức phóng to bản đồ' : 'Toggle globe zoom'}
                  onClick={() => setCloseUp((value) => !value)}>{closeUp ? '−' : '+'}</button>}
              </nav>
            </div>
          </header>
          {tab === 'calendar' && <div className="rcj-season-controls" role="group" aria-label={vi ? 'Chọn mùa giải' : 'Choose season'}>
            <span>{vi ? 'Mùa giải' : 'Season'}</span>
            {[2026, 2025, 2024].map((year) =>
              <Link key={year} to={`/season/${year}?tab=${tab}`} aria-current={season === year ? 'page' : undefined}>{year}</Link>)}
            <button type="button" onClick={() => void syncSeasonData(season)}
              disabled={syncMeta.syncStatus === 'syncing'}
              aria-label={vi ? 'Làm mới dữ liệu mùa giải' : 'Refresh season data'}>
              <RefreshCw size={15} aria-hidden="true" />
            </button>
          </div>}
          <div className="rcj-stage-viewport">
            {show3D ? (
              <Suspense fallback={<JourneyWorldMap season={season} calendar={calendar} activeRound={activeRound} onSelectRound={jump} lang={lang} tab={tab} markerOpacity={phase.markerOpacity} />}>
                <JourneyGlobe3D season={season} calendar={calendar} travelProgress={phase.globeProgress}
                  introOpacity={introOpacity} trackReveal={phase.trackReveal} markerOpacity={phase.markerOpacity}
                  onSelectRound={jump} lang={lang} closeUp={closeUp} />
              </Suspense>
            ) : (
              <JourneyWorldMap season={season} calendar={calendar} activeRound={activeRound} onSelectRound={jump} lang={lang} tab={tab} markerOpacity={phase.markerOpacity} />
            )}
          </div>
          {tab === 'calendar' && <div className="rcj-journey-intro" style={{ opacity: introOpacity }} aria-hidden={introOpacity < 0.5}>
            <span>{vi ? 'HÀNH TRÌNH MÙA GIẢI' : 'SEASON JOURNEY'} / {season}</span>
            <p>{vi ? `${calendar.length} chặng đua. Một hành trình quanh thế giới.` : `${calendar.length} rounds. One journey around the world.`}</p>
            <small>{vi ? 'Cuộn để bắt đầu' : 'Scroll to begin'}</small>
          </div>}
          {active && <JourneyCircuitOverlay season={season} race={active} tab={tab} lang={lang} reveal={phase.trackReveal} />}
          <div className="rcj-stage-data" aria-live="polite" aria-atomic="true"
            aria-hidden={phase.trackReveal > 0.55 || introOpacity > 0.5}
            style={{ opacity: (1 - phase.trackReveal) * (1 - introOpacity),
              visibility: phase.trackReveal > 0.55 || introOpacity > 0.5 ? 'hidden' : 'visible' }}>
            <span className="rcj-stage-counter">R{String(activeRound).padStart(2, '0')}</span>
            <div className="rcj-stage-active">
              <strong>{active?.name}</strong>
              <span>{active?.circuit} · {active?.location}</span>
              {activeGeo && <span className="rcj-stage-coords">{formatLatitude(activeGeo.latitude)} · {formatLongitude(activeGeo.longitude)}</span>}
              {activeChapter?.winner && <small>{vi ? 'Chiến thắng' : 'Winner'} · {activeChapter.winner.driverName}</small>}
              <Link className="rcj-globe-details" data-view-details tabIndex={phase.trackReveal > 0.55 || introOpacity > 0.5 ? -1 : 0}
                to={`/season/${season}?tab=${tab}&round=${activeRound}`}
                aria-label={tab === 'results'
                  ? (vi ? `Mở kết quả chặng ${activeRound}: ${active?.name}` : `Open results for round ${activeRound}: ${active?.name}`)
                  : (vi ? `Mở lịch chặng ${activeRound}: ${active?.name}` : `Open weekend details for round ${activeRound}: ${active?.name}`)}>
                {tab === 'results' ? (vi ? 'Xem kết quả' : 'View results') : (vi ? 'Xem lịch chặng' : 'View weekend')} <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
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
          {syncMeta.syncStatus === 'error' && <p className="rcj-sync-note" role="status">{vi ? 'Dữ liệu có thể chưa được cập nhật.' : 'Data may be out of date.'}</p>}
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
    </div>
  );
}
