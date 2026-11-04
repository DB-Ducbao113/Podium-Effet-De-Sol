import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, FlagTriangleRight, Radio } from 'lucide-react';
import type { GrandPrixRound } from '../../types';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { scheduleWallClockSecondTick } from '../../lib/live/tabSync';
import { getSessionTimeRange } from '../../utils/raceSchedule';

export function HomeRaceControl({ race }: { race?: GrandPrixRound }) {
  const lang = useNavigationStore((state) => state.lang);
  const [now, setNow] = useState(() => Date.now());
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

  const start = race ? getSessionTimeRange(race, 'race')?.start.getTime() : undefined;
  const remaining = start ? Math.max(0, Math.floor((start - now) / 1000)) : 0;
  const count = [
    Math.floor(remaining / 86400),
    Math.floor((remaining % 86400) / 3600),
    Math.floor((remaining % 3600) / 60),
  ];
  const winner = latest?.entries?.find((entry) => entry.position === 1);

  return (
    <section id="race-control" className="page-container home-rc" aria-labelledby="home-rc-title">
      <header className="home-live__heading">
        <span className="home-live__slash" aria-hidden="true">///</span>
        <h2 id="home-rc-title">RACE CONTROL</h2>
        <span className="home-live__rule" aria-hidden="true" />
        <Link to="/season/2026?tab=calendar" aria-label={lang === 'vi' ? 'Mở lịch đua' : 'Open calendar'}>
          <ArrowUpRight size={22} aria-hidden="true" />
        </Link>
      </header>
      <div className="home-rc__grid">
        <div className="home-rc__next">
          <div className="home-rc__map" data-asset-slot="circuit-map" aria-hidden="true">
            <span className="home-rc__map-corner" />
          </div>
          <div className="home-rc__identity">
            <span className="home-live__eyebrow"><FlagTriangleRight size={16} aria-hidden="true" /> {lang === 'vi' ? 'CHẶNG TIẾP THEO' : 'NEXT GRAND PRIX'}</span>
            <h3>{race?.name ?? (lang === 'vi' ? 'Lịch mùa giải' : 'Season calendar')}</h3>
            <span className="home-rc__location">{race ? `R${String(race.round).padStart(2, '0')} · ${race.location}` : '2026'}</span>
          </div>
        </div>
        <div className="home-rc__timing">
          <span className="home-live__eyebrow"><Radio size={15} aria-hidden="true" /> {start && start > now ? (lang === 'vi' ? 'ĐẾM NGƯỢC ĐUA CHÍNH' : 'RACE COUNTDOWN') : (lang === 'vi' ? 'CUỐI TUẦN ĐUA' : 'RACE WEEKEND')}</span>
          {start && start > now ? (
            <div className="home-rc__digits" role="timer" aria-label={lang === 'vi' ? `Còn ${count[0]} ngày, ${count[1]} giờ, ${count[2]} phút` : `${count[0]} days, ${count[1]} hours, ${count[2]} minutes remaining`}>
              {count.map((value, index) => (
                <div key={index}>
                  <strong>{String(value).padStart(2, '0')}</strong>
                  <small>{(lang === 'vi' ? ['NGÀY', 'GIỜ', 'PHÚT'] : ['DAYS', 'HRS', 'MIN'])[index]}</small>
                </div>
              ))}
            </div>
          ) : <div className="home-rc__no-countdown">{lang === 'vi' ? 'Xem lịch chi tiết' : 'Explore the calendar'}</div>}
          <Link to="/season/2026?tab=calendar" className="home-rc__link">
            {lang === 'vi' ? 'Lịch đua 2026' : '2026 Calendar'} <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <Link to={latest ? `/season/2026/race/${latest.round}` : '/season/2026?tab=results'} className="home-rc__result">
          <span className="home-live__eyebrow">{lang === 'vi' ? 'KẾT QUẢ GẦN NHẤT' : 'LATEST RESULT'}</span>
          <strong>{latest ? `R${String(latest.round).padStart(2, '0')}` : '—'}</strong>
          <span className="home-rc__result-meta">{latest?.grandPrix ?? (lang === 'vi' ? 'Chưa có kết quả xác minh' : 'No verified result')}</span>
          {winner && <span className="home-rc__winner">{winner.driverName}</span>}
          <ArrowUpRight size={19} aria-hidden="true" className="home-rc__result-arrow" />
        </Link>
      </div>
    </section>
  );
}
