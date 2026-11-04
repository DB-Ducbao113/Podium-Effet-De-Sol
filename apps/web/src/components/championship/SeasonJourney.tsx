import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, CalendarDays, Flag, MapPin, Trophy, Zap } from 'lucide-react';
import { getCalendarBySeason } from '../../data/championship';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import type { GrandPrixRound, SeasonYear } from '../../types';
import { getCalendarRaceState, getSessionTimeRange } from '../../utils/raceSchedule';
import { CircuitTrackMap } from '../championship/CircuitTrackMap';
import './seasonJourney.css';

type SessionKey = keyof GrandPrixRound['sessions'];
const SESSION_ORDER: SessionKey[] = ['fp1', 'fp2', 'fp3', 'sprintQualifying', 'sprint', 'qualifying', 'race'];
const LABELS: Record<SessionKey, { vi: string; en: string }> = {
  fp1: { vi: 'Thử nghiệm 1', en: 'Practice 1' },
  fp2: { vi: 'Thử nghiệm 2', en: 'Practice 2' },
  fp3: { vi: 'Thử nghiệm 3', en: 'Practice 3' },
  sprintQualifying: { vi: 'Phân hạng Sprint', en: 'Sprint Qualifying' },
  sprint: { vi: 'Sprint', en: 'Sprint' },
  qualifying: { vi: 'Phân hạng', en: 'Qualifying' },
  race: { vi: 'Đua chính', en: 'Grand Prix' },
};

function getStatus(race: GrandPrixRound, completed: boolean, now: number) {
  if (completed) return 'completed' as const;
  const scheduleState = getCalendarRaceState(race, now);
  // Do not label a race as completed merely because a scheduled time passed.
  return scheduleState === 'current' ? 'current' as const : scheduleState === 'completed' ? 'awaiting' as const : 'upcoming' as const;
}

export function SeasonJourney({ season }: { season: SeasonYear }) {
  const { lang } = useNavigationStore();
  const vi = lang === 'vi';
  const calendar = useMemo(() => getCalendarBySeason(season), [season]);
  const detailed = useChampionshipStore((s) => s.detailedResults[season]);
  const syncMeta = useChampionshipStore((s) => s.syncMeta);
  const [now, setNow] = useState(() => Date.now());
  const completed = useMemo(() => new Set((detailed ?? []).filter((r) =>
    r.status === 'completed' && !r.isSynthesized && r.entries.length > 0
  ).map((r) => r.round)), [detailed]);
  const [activeRound, setActiveRound] = useState(() => calendar[0]?.round ?? 1);
  const [openRound, setOpenRound] = useState<number | null>(null);
  const [quickMode, setQuickMode] = useState(false);
  const sectionRefs = useRef(new Map<number, HTMLElement>());
  const relevant = calendar.find((race) => !completed.has(race.round)) ?? calendar[calendar.length - 1];
  const active = calendar.find((race) => race.round === activeRound) ?? calendar[0];
  const activeIndex = Math.max(0, calendar.findIndex((race) => race.round === activeRound));
  const journeyProgress = calendar.length < 2 ? 0 : (activeIndex / (calendar.length - 1)) * 100;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setActiveRound(calendar[0]?.round ?? 1);
    setOpenRound(null);
  }, [season, calendar]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActiveRound(Number((visible[0].target as HTMLElement).dataset.round));
    }, { rootMargin: '-22% 0px -42% 0px', threshold: [0, 0.15, 0.35, 0.7] });
    sectionRefs.current.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [calendar, quickMode]);

  const jump = (round: number) => {
    setActiveRound(round);
    sectionRefs.current.get(round)?.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };

  if (!calendar.length) return <main className="sj-empty">{vi ? 'Chưa có lịch thi đấu cho mùa giải này.' : 'No race calendar available for this season.'}</main>;

  return (
    <div className="sj" data-mode={quickMode ? 'quick' : 'journey'}>
      <header className="sj-hero">
        <p className="sj-overline">PODIUM EDS <span>/</span> SEASON JOURNEY <span>/</span> {season}</p>
        <h1>ONE YEAR.<br /><em>ONE RACE.</em></h1>
        <p className="sj-hero-description">{vi ? 'Một mùa giải. Một hành trình vòng quanh thế giới. Cuộn để khám phá từng Grand Prix, hoặc chọn chặng để truy cập nhanh.' : 'One championship. One journey around the world. Scroll through each Grand Prix or jump straight to a round.'}</p>
        <div className="sj-hero-actions">
          <button type="button" onClick={() => relevant && jump(relevant.round)} className="sj-primary">
            <Flag size={16} aria-hidden="true" /> {vi ? 'Đến chặng liên quan' : 'Go to relevant race'} <ArrowRight size={16} aria-hidden="true" />
          </button>
          <Link to={`/season/${season}?tab=standings`} className="sj-secondary"><ArrowLeft size={15} aria-hidden="true" /> {vi ? 'Bảng xếp hạng' : 'Standings'}</Link>
        </div>
        <div className="sj-season-stats">
          <span><strong>{String(calendar.length).padStart(2, '0')}</strong> {vi ? 'CHẶNG TRONG LỊCH' : 'SCHEDULED ROUNDS'}</span>
          <span><strong>{String(completed.size).padStart(2, '0')}</strong> {vi ? 'CÓ KẾT QUẢ' : 'RESULTS CONFIRMED'}</span>
          <span><strong>{String(calendar.filter((r) => r.hasSprint).length).padStart(2, '0')}</strong> SPRINT WEEKENDS</span>
        </div>
        <div className="sj-scroll-cue"><ArrowDown size={15} aria-hidden="true" /> SCROLL TO EXPLORE</div>
      </header>

      <nav className="sj-navigation" aria-label={vi ? 'Điều hướng hành trình' : 'Journey navigation'}>
        <div className="sj-nav-main">
          <span className="sj-nav-name">SEASON <strong>{season}</strong></span>
          <span className="sj-nav-current">R{String(active.round).padStart(2, '0')} <span> / </span> {active.name}</span>
          <div className="sj-nav-controls">
            <button type="button" onClick={() => setQuickMode((v) => !v)} aria-pressed={quickMode}>{quickMode ? 'JOURNEY' : 'QUICK ACCESS'}</button>
            <select aria-label={vi ? 'Chọn chặng đua' : 'Select race round'} value={activeRound} onChange={(event) => jump(Number(event.target.value))}>
              {calendar.map((race) => <option key={race.round} value={race.round}>R{String(race.round).padStart(2, '0')} · {race.name}</option>)}
            </select>
          </div>
        </div>
        <div className="sj-nav-progress" role="progressbar" aria-label={vi ? 'Tiến độ khám phá' : 'Journey exploration progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(journeyProgress)}>
          <span style={{ width: `${journeyProgress}%` }} />
        </div>
        <div className="sj-round-rail" aria-label={vi ? 'Chọn round' : 'Round selector'}>
          {calendar.map((race) => <button key={race.round} type="button" title={race.name} aria-label={`Round ${race.round}: ${race.name}`} aria-current={activeRound === race.round ? 'step' : undefined} className={completed.has(race.round) ? 'is-complete' : ''} onClick={() => jump(race.round)}>{race.round}</button>)}
        </div>
      </nav>

      <div className="sj-world-layout">
        <aside className="sj-atlas" aria-label={vi ? 'Bản đồ tiến trình mùa giải' : 'Season progress atlas'}>
          <div className="sj-atlas-top"><span>WORLD TOUR / {season}</span><span>R{String(active.round).padStart(2, '0')}</span></div>
          <svg viewBox="0 0 440 340" role="img" aria-label={vi ? 'Đồ họa hành trình dạng sơ đồ qua các chặng' : 'Schematic journey through the rounds'}>
            <defs><linearGradient id="sj-path" x1="0" x2="1"><stop stopColor="#FF4A18"/><stop offset="1" stopColor="#E51B37"/></linearGradient></defs>
            <path d="M18 48 H422 M18 112 H422 M18 176 H422 M18 240 H422 M18 304 H422" stroke="#FFFFFF" strokeOpacity=".055" strokeDasharray="3 9" />
            <path d="M30 48 C170 8 290 112 405 70 S110 125 44 174 S280 175 398 222 S160 278 44 310" fill="none" stroke="#53606B" strokeWidth="2" strokeDasharray="5 8" opacity=".55"/>
            <path d="M30 48 C170 8 290 112 405 70 S110 125 44 174 S280 175 398 222 S160 278 44 310" fill="none" stroke="url(#sj-path)" strokeWidth="3.5" pathLength="100" strokeDasharray={`${journeyProgress} 100`} strokeLinecap="round"/>
            {calendar.map((race, index) => {
              const x = 32 + (index % 6) * 74;
              const y = 50 + Math.floor(index / 6) * 70;
              return <g key={race.round} transform={`translate(${index % 2 ? 440 - x : x}, ${y})`}>
                <circle r={activeRound === race.round ? 10 : 5} fill={activeRound === race.round ? '#FF4A18' : completed.has(race.round) ? '#F4F0E8' : '#48515D'} stroke="#0A0C10" strokeWidth="2" />
              </g>;
            })}
          </svg>
          <p className="sj-map-disclaimer">{vi ? 'Sơ đồ hành trình · chưa phải bản đồ địa lý' : 'Journey schematic · not a geographic map'}</p>
          <div className="sj-atlas-feature"><span>{active.flag} {active.country}</span><strong>{active.name}</strong><small>{active.circuit} · {active.location}</small><span className="sj-atlas-counter">{activeIndex + 1} / {calendar.length}</span></div>
          <p className="sj-atlas-note">{vi ? 'Đồ họa chuyển động nhẹ theo vị trí cuộn. Bản đồ địa lý và camera 3D là giai đoạn tiếp theo.' : 'Lightweight scroll-reactive visual. Geographic map and 3D camera are planned for the next phase.'}</p>
        </aside>

        <main className="sj-chapters" id="sj-chapters">
          {calendar.map((race) => {
            const status = getStatus(race, completed.has(race.round), now);
            const result = detailed?.find((r) => r.round === race.round && r.status === 'completed' && !r.isSynthesized);
            const sessions = SESSION_ORDER.filter((key) => Boolean(race.sessions[key]));
            const open = openRound === race.round;
            return (
              <section key={race.round} id={`journey-round-${race.round}`} data-round={race.round} data-status={status}
                ref={(node) => { if (node) sectionRefs.current.set(race.round, node); else sectionRefs.current.delete(race.round); }}
                className="sj-chapter" aria-labelledby={`sj-race-${race.round}`}>
                <div className="sj-chapter-top">
                  <span className="sj-round-number">{String(race.round).padStart(2, '0')}</span>
                  <div className="sj-chapter-kicker"><span>CHAPTER {String(race.round).padStart(2, '0')} / {String(calendar.length).padStart(2, '0')}</span><span>{race.flag} {race.country}</span></div>
                </div>
                <div className="sj-chapter-body">
                  <span className={`sj-status sj-status--${status}`}>{status === 'completed' ? vi ? 'ĐÃ CÓ KẾT QUẢ' : 'RESULTS AVAILABLE' : status === 'current' ? vi ? 'CUỐI TUẦN ĐUA' : 'RACE WEEKEND' : status === 'awaiting' ? vi ? 'CHỜ KẾT QUẢ XÁC NHẬN' : 'AWAITING VERIFIED RESULTS' : vi ? 'SẮP DIỄN RA' : 'UPCOMING'}</span>
                  <h2 id={`sj-race-${race.round}`}>{race.name}</h2>
                  <p className="sj-venue"><MapPin size={15} aria-hidden="true" /> {race.circuit} · {race.location}</p>
                  <div className="sj-info-grid">
                    <div><span>RACE WEEKEND</span><strong>{race.dates}</strong></div>
                    <div><span>{vi ? 'SỐ VÒNG' : 'LAPS'}</span><strong>{race.laps || '—'}</strong></div>
                    <div><span>{vi ? 'CHIỀU DÀI' : 'CIRCUIT LENGTH'}</span><strong>{race.circuitLengthKm ? `${race.circuitLengthKm} KM` : '—'}</strong></div>
                  </div>
                  <div className="sj-track"><CircuitTrackMap season={season} round={race.round} circuitName={race.circuit} variant="thumbnail" /><span>{race.hasSprint ? 'SPRINT WEEKEND' : 'GRAND PRIX WEEKEND'}</span></div>
                  {result?.winner && <div className="sj-winner"><Trophy size={20} aria-hidden="true" /><div><small>{vi ? 'CHIẾN THẮNG CHẶNG' : 'RACE WINNER'}</small><strong>{result.winner.driver}</strong><span>{result.winner.team}</span></div></div>}
                  <button type="button" className="sj-session-toggle" aria-expanded={open} aria-controls={`sj-sessions-${race.round}`} onClick={() => setOpenRound(open ? null : race.round)}>
                    <CalendarDays size={16} aria-hidden="true" /> {vi ? 'Lịch các phiên thi đấu' : 'Race weekend sessions'} <span>{open ? '−' : '+'}</span>
                  </button>
                  {open && <div className="sj-sessions" id={`sj-sessions-${race.round}`}>
                    {sessions.map((key) => {
                      const session = race.sessions[key];
                      const range = getSessionTimeRange(race, key);
                      return session && <div className="sj-session" key={key}>
                        <span>{LABELS[key][lang]}</span>
                        <span>{range ? new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(range.start) + ' ICT' : `${session.dateStr} · ${session.timeStr} (venue)`}</span>
                      </div>;
                    })}
                  </div>}
                  <div className="sj-chapter-actions">
                    <Link to={`/season/${season}?tab=calendar&round=${race.round}`}>{vi ? 'Chi tiết lịch' : 'Calendar details'} <ArrowRight size={15} aria-hidden="true" /></Link>
                    <Link to={`/season/${season}?tab=results&round=${race.round}`}>{vi ? 'Trung tâm kết quả' : 'Race results'} <ArrowRight size={15} aria-hidden="true" /></Link>
                  </div>
                </div>
                <div className="sj-chapter-footer"><Zap size={13} aria-hidden="true" /> PODIUM EDS / {season} <span>R{String(race.round).padStart(2, '0')}</span></div>
              </section>
            );
          })}
          <footer className="sj-finale"><Flag size={30} aria-hidden="true" /><h2>THE SEASON NEVER STOPS.</h2><p>{vi ? 'Đã khám phá toàn bộ lịch mùa giải. Quay lại chặng liên quan hoặc xem bảng xếp hạng.' : 'You have explored the full calendar. Jump back to the relevant race or view the standings.'}</p><button type="button" className="sj-primary" onClick={() => relevant && jump(relevant.round)}>{vi ? 'Về chặng liên quan' : 'Return to relevant race'} <ArrowRight size={16} aria-hidden="true" /></button></footer>
        </main>
      </div>
      <span className="sj-data-note" role="status">{syncMeta.syncStatus === 'error' ? (vi ? 'Đồng bộ dữ liệu tạm gián đoạn; hiển thị dữ liệu hiện có.' : 'Sync unavailable; showing available data.') : (vi ? 'Kết quả chỉ hiển thị khi nguồn dữ liệu xác nhận.' : 'Results are displayed only when verified data is available.')}</span>
    </div>
  );
}
