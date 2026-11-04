import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, CalendarDays, Flag, MapPin, Trophy } from 'lucide-react';
import { getCalendarBySeason } from '../../data/championship';
import { getRaceResults } from '../../data/championship/results';
import openF1SessionResults from '../../data/championship/openF1SessionResults2026.json';
import { findCircuitByName } from '../../data/championship/circuitsData';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import type { GrandPrixRound, SeasonYear } from '../../types';
import type { GrandPrixPracticeData } from '../../types/practice';
import type { GrandPrixQualifyingData } from '../../types/qualifying';
import {
  getSessionClassification,
  type ResultDataSources,
  type ResultSessionKey,
} from '../../results-engine/availability';
import { getCalendarRaceState, getSessionTimeRange } from '../../utils/raceSchedule';
import { getSeasonCircuit } from '../../utils/p5SeasonalVisuals';
import { CircuitTrace } from './CircuitTrace';
import { JourneyWorldMap } from './JourneyWorldMap';
import './raceCalendarJourney.css';

type Mode = 'journey' | 'classic';
type SessionState = 'final' | 'provisional' | 'awaiting' | 'scheduled';
const ORDER: ResultSessionKey[] = ['fp1', 'fp2', 'fp3', 'sprintQualifying', 'sprint', 'qualifying', 'race'];
const LABELS: Record<ResultSessionKey, { vi: string; en: string }> = {
  fp1: { vi: 'Thử nghiệm 1', en: 'Practice 1' },
  fp2: { vi: 'Thử nghiệm 2', en: 'Practice 2' },
  fp3: { vi: 'Thử nghiệm 3', en: 'Practice 3' },
  sprintQualifying: { vi: 'Phân hạng Sprint', en: 'Sprint Qualifying' },
  sprint: { vi: 'Sprint', en: 'Sprint' },
  qualifying: { vi: 'Phân hạng', en: 'Qualifying' },
  race: { vi: 'Đua chính', en: 'Race' },
};
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
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
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
      range: getSessionTimeRange(race, key),
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
  const progress = calendar.length > 1 ? 100 * travelProgress / (calendar.length - 1) : 0;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setActiveRound(calendar[0]?.round ?? 1);
    setTravelProgress(0);
    setExpandedRound(null);
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

  const sessionState = (entry: (typeof chapterData)[number]['sessions'][number]): SessionState => {
    if (entry.classification) return entry.classification.status;
    if (entry.range && now >= entry.range.end.getTime()) return 'awaiting';
    return 'scheduled';
  };

  if (!calendar.length) return (
    <div className="rcj-empty" role="status">{vi ? 'Chưa có lịch mùa giải này.' : 'No calendar is available for this season.'}</div>
  );

  return (
    <div className="rcj">
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
      <div className="rcj-content">
        <JourneyWorldMap season={season} calendar={calendar} activeRound={activeRound} travelProgress={travelProgress} onSelectRound={jump} lang={lang} />
        <div className="rcj-chapters">
          {chapterData.map(({ race, sessions, confirmations, winner }) => {
            const scheduleState = getCalendarRaceState(race, now);
            const raceFinal = sessions.some((s) => s.key === 'race' && s.classification?.status === 'final');
            const status = raceFinal ? 'completed' : confirmations ? 'partial' : scheduleState === 'completed' ? 'awaiting' : scheduleState;
            const circuit = getSeasonCircuit(season, race.round) ?? findCircuitByName(race.circuit);
            const expanded = expandedRound === race.round;
            return (
              <section key={race.round} data-round={race.round} data-state={status} className="rcj-chapter"
                id={`rcj-round-${race.round}`} aria-labelledby={`rcj-title-${race.round}`}
                ref={(node) => { if (node) sections.current.set(race.round, node); else sections.current.delete(race.round); }}>
                <div className="rcj-chapter-bar"><span>CHAPTER {String(race.round).padStart(2, '0')} / {String(calendar.length).padStart(2, '0')}</span><span>{race.flag} {race.country}</span></div>
                <div className="rcj-chapter-inner">
                  <div className="rcj-chapter-top"><span className="rcj-chapter-number">{String(race.round).padStart(2, '0')}</span><span className={`rcj-badge rcj-badge--${status}`}>{raceFinal ? vi ? 'CÓ KẾT QUẢ ĐUA CHÍNH' : 'RACE RESULT AVAILABLE' : confirmations ? vi ? 'CÓ KẾT QUẢ MỘT SỐ PHIÊN' : 'SESSION RESULTS AVAILABLE' : scheduleState === 'completed' ? vi ? 'CHỜ PHÂN HẠNG' : 'AWAITING RESULTS' : scheduleState === 'current' ? vi ? 'CUỐI TUẦN THI ĐẤU' : 'RACE WEEKEND' : vi ? 'SẮP TỚI' : 'UPCOMING'}</span></div>
                  <h3 id={`rcj-title-${race.round}`}>{race.name}</h3>
                  <p className="rcj-location"><MapPin size={15} aria-hidden="true" /> {race.circuit} · {race.location}</p>
                  <div className="rcj-spec"><div><small>RACE WEEKEND</small><strong>{race.dates}</strong></div><div><small>{vi ? 'VÒNG ĐUA' : 'LAPS'}</small><strong>{race.laps || '—'}</strong></div><div><small>{vi ? 'CHIỀU DÀI' : 'LENGTH'}</small><strong>{race.circuitLengthKm || '—'} km</strong></div></div>
                  <div className="rcj-track"><div className="rcj-track-image">{circuit ? <CircuitTrace circuit={circuit} variant="thumbnail" /> : <Flag size={40} aria-hidden="true" />}</div><div><span>CIRCUIT PROFILE</span><strong>{race.hasSprint ? 'SPRINT WEEKEND' : 'GRAND PRIX WEEKEND'}</strong></div></div>
                  {winner && <div className="rcj-winner"><Trophy size={19} aria-hidden="true" /><span><small>{vi ? 'NGƯỜI CHIẾN THẮNG CHẶNG' : 'RACE WINNER'}</small><strong>{winner.driverName}</strong><em>{winner.teamName}</em></span></div>}
                  <button type="button" className="rcj-session-toggle" aria-expanded={expanded} aria-controls={`rcj-sessions-${race.round}`} onClick={() => setExpandedRound(expanded ? null : race.round)}><CalendarDays size={16} aria-hidden="true" /> {vi ? 'Lịch và kết quả các phiên' : 'Weekend sessions and results'} <span>{expanded ? '−' : '+'}</span></button>
                  {expanded && <div className="rcj-sessions" id={`rcj-sessions-${race.round}`}>
                    {sessions.map((entry) => {
                      const state = sessionState(entry);
                      const date = entry.range ? new Intl.DateTimeFormat(vi ? 'vi-VN' : 'en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(entry.range.start) + ' ICT' : `${race.sessions[entry.key]?.dateStr ?? ''} · ${race.sessions[entry.key]?.timeStr ?? ''} (venue)`;
                      const leader = entry.classification?.rows[0];
                      return <div className="rcj-session" key={entry.key}>
                        <div><strong>{LABELS[entry.key][lang]}</strong><small>{date}</small>{leader && <small> P1 · {leader.driverName}</small>}</div>
                        <div><span data-result-state={state}>{state === 'final' ? 'FINAL' : state === 'provisional' ? 'PROVISIONAL' : state === 'awaiting' ? 'AWAITING' : 'SCHEDULED'}</span><Link to={`/season/${season}?tab=results&round=${race.round}&session=${entry.key}`}>{vi ? 'Chi tiết' : 'Details'} <ArrowRight size={13} aria-hidden="true" /></Link></div>
                      </div>;
                    })}
                  </div>}
                  <div className="rcj-chapter-links">
                    <Link to={`/season/${season}?tab=calendar&round=${race.round}`}>{vi ? 'Chi tiết lịch' : 'Calendar details'} <ArrowRight size={14} aria-hidden="true" /></Link>
                    <Link to={`/season/${season}?tab=results&round=${race.round}`}>{vi ? 'Trung tâm kết quả' : 'Race Center'} <ArrowRight size={14} aria-hidden="true" /></Link>
                  </div>
                </div>
              </section>
            );
          })}
          <div className="rcj-end"><Flag size={30} aria-hidden="true" /><h3>THE FINAL FLAG.</h3><p>{vi ? 'Hành trình vẫn tiếp diễn khi có kết quả mới.' : 'The journey updates as new results arrive.'}</p><button type="button" onClick={() => relevantRound && jump(relevantRound)}>{vi ? 'Đến chặng liên quan' : 'Return to relevant round'} <ArrowRight size={16} aria-hidden="true" /></button></div>
        </div>
      </div>
      {syncMeta.syncStatus === 'error' && <p className="rcj-sync-note" role="status">{vi ? 'Đồng bộ tạm gián đoạn — đang sử dụng dữ liệu đã lưu.' : 'Sync currently unavailable — showing saved data.'}</p>}
    </div>
  );
}
