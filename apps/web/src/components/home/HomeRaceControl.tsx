import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, FlagTriangleRight, Radio } from 'lucide-react';
import type { GrandPrixRound } from '../../types';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { CALENDAR_2026 } from '../../data/championship';
import { scheduleWallClockSecondTick } from '../../lib/live/tabSync';
import { getCalendarRaceState, getSessionTimeRange } from '../../utils/raceSchedule';
import { smoothstep } from './journey/homeJourneyMath';
import { subscribeHomeScrub } from './journey/homeScrubRegistry';
import { HomeRaceTrackScrub } from './HomeRaceTrackScrub';
import { HomeSessionTimeline } from './HomeSessionTimeline';

export function HomeRaceControl({ race }: { race?: GrandPrixRound }) {
  const lang = useNavigationStore((state) => state.lang);
  const [now, setNow] = useState(() => Date.now());
  const sectionRef = useRef<HTMLElement>(null);
  const completed = useChampionshipStore((state) => state.detailedResults[2026]);
  const latest = [...(completed ?? [])]
    .filter((entry) => entry.status === 'completed' && !entry.isSynthesized && entry.entries?.length)
    .sort((a, b) => b.round - a.round)[0];

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const stop = scheduleWallClockSecondTick(refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  // Dusk-to-night sky washes over the pinned floor as the weekend lap draws.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const mix = (from: number, to: number, t: number) => Math.round(from + (to - from) * t);
    return subscribeHomeScrub('race-control', (progress) => {
      const t = smoothstep(0, .6, progress);
      node.style.setProperty('--home-sky-top', `rgb(${mix(27, 8, t)}, ${mix(16, 10, t)}, ${mix(48, 14, t)})`);
      node.style.setProperty('--home-sky-horizon', `rgb(${mix(10, 16, t)}, ${mix(12, 20, t)}, ${mix(16, 28, t)})`);
    });
  }, []);

  const start = race ? getSessionTimeRange(race, 'race')?.start.getTime() : undefined;
  const remaining = start ? Math.max(0, Math.floor((start - now) / 1000)) : 0;
  const count = [
    Math.floor(remaining / 86400),
    Math.floor((remaining % 86400) / 3600),
    Math.floor((remaining % 3600) / 60),
    remaining % 60,
  ];
  const latestScheduledRound = CALENDAR_2026.filter(
    (entry) => getCalendarRaceState(entry, now) === 'completed',
  ).at(-1)?.round ?? 0;
  const newerResultsPending = latestScheduledRound > (latest?.round ?? 0);
  const winner = latest?.entries?.find((entry) => entry.position === 1);
  const raceDate = start ? new Date(start) : null;
  const raceTime = raceDate ? new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'UTC', hourCycle: 'h23',
  }).format(raceDate) + ' UTC' : null;

  return (
    <section id="race-control" ref={sectionRef} className="page-container home-rc" aria-labelledby="home-rc-title">
      <header className="home-live__heading">
        <span className="home-live__slash" aria-hidden="true">///</span>
        <h2 id="home-rc-title">{lang === 'vi' ? 'Điều khiển chặng đua' : 'Race Control'}</h2>
        <span className="home-live__rule" aria-hidden="true" />
        <Link to="/season/2026?tab=calendar" aria-label={lang === 'vi' ? 'Mở lịch đua' : 'Open calendar'}>
          <ArrowUpRight size={22} aria-hidden="true" />
        </Link>
      </header>
      <div className="home-rc__grid">
        <div className="home-rc__next">
          <div className="home-rc__identity">
            <span className="home-live__eyebrow"><FlagTriangleRight size={16} aria-hidden="true" /> {lang === 'vi' ? 'CHẶNG TIẾP THEO' : 'NEXT GRAND PRIX'}</span>
            <h3>{race?.name ?? (lang === 'vi' ? 'Lịch mùa giải' : 'Season calendar')}</h3>
            <span className="home-rc__location">{race ? `R${String(race.round).padStart(2, '0')} · ${race.location}` : (lang === 'vi' ? 'Không còn chặng sắp tới' : 'No upcoming race')}</span>
            {raceTime && <time className="home-rc__race-time" dateTime={raceDate?.toISOString()}>{raceTime}</time>}
          </div>
          <div className="home-rc__map" data-asset-slot="circuit-map" aria-hidden="true">
            <HomeRaceTrackScrub race={race} />
            <span className="home-rc__map-label">{race ? 'CIRCUIT / VECTOR' : 'SIGNAL / FIELD'}</span>
            <span className="home-rc__map-index">{race ? 'R' + String(race.round).padStart(2, '0') : '—'}<small>2026</small></span>
            <span className="home-rc__map-corner" />
          </div>
        </div>
        <div className="home-rc__timing">
          <span className="home-live__eyebrow"><Radio size={15} aria-hidden="true" /> {start && start > now ? (lang === 'vi' ? 'ĐẾM NGƯỢC ĐUA CHÍNH' : 'RACE COUNTDOWN') : (lang === 'vi' ? 'LỊCH ĐUA 2026' : '2026 RACE CALENDAR')}</span>
          {start && start > now ? (
            <div className="home-rc__digits" role="timer" aria-label={lang === 'vi' ? `Còn ${count[0]} ngày, ${count[1]} giờ, ${count[2]} phút, ${count[3]} giây` : `${count[0]} days, ${count[1]} hours, ${count[2]} minutes, ${count[3]} seconds remaining`}>
              {count.map((value, index) => (
                <div key={index}>
                  <strong>{String(value).padStart(2, '0')}</strong>
                  <small>{(lang === 'vi' ? ['NGÀY', 'GIỜ', 'PHÚT', 'GIÂY'] : ['DAYS', 'HRS', 'MIN', 'SEC'])[index]}</small>
                </div>
              ))}
            </div>
          ) : <div className="home-rc__no-countdown">{lang === 'vi' ? 'Không có giờ đua sắp tới để đếm ngược' : 'No upcoming race start to count down'}</div>}
          <HomeSessionTimeline race={race} now={now} />
          <Link to="/season/2026?tab=calendar" className="home-rc__link">
            {lang === 'vi' ? 'Lịch đua 2026' : '2026 Calendar'} <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <Link to={latest ? `/season/2026/race/${latest.round}` : '/season/2026?tab=results'} className="home-rc__result">
          <span className="home-live__eyebrow">{lang === 'vi' ? 'KẾT QUẢ ĐÃ XÁC MINH GẦN NHẤT' : 'LATEST VERIFIED RESULT'}</span>
          <strong>{latest ? `R${String(latest.round).padStart(2, '0')}` : '—'}</strong>
          <span className="home-rc__result-meta">{latest?.grandPrix ?? (lang === 'vi' ? 'Chưa có kết quả xác minh' : 'No verified result')}</span>
          {winner && <span className="home-rc__winner">{winner.driverName}</span>}
          {newerResultsPending && <span className="home-rc__verification-note">{lang === 'vi' ? 'Các chặng mới hơn đang chờ xác minh kết quả.' : 'Newer rounds await verified results.'}</span>}
          <ArrowUpRight size={19} aria-hidden="true" className="home-rc__result-arrow" />
        </Link>
      </div>
    </section>
  );
}
