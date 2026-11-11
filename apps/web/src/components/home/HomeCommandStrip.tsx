import { Link } from 'react-router-dom';
import { FlagTriangleRight, Gauge, Trophy } from 'lucide-react';
import type { GrandPrixRound } from '../../types';
import { CALENDAR_2026, getStandings } from '../../data/championship';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';

/**
 * Live season instrument strip for the Launch Control hero. Every figure comes
 * from the verified season contracts (calendar, calculated standings, detailed
 * results); nothing is invented. Renders a calm fallback when data is absent.
 */
export function HomeCommandStrip({ race }: { race?: GrandPrixRound }) {
  const lang = useNavigationStore((state) => state.lang);
  const vi = lang === 'vi';
  const calculated = useChampionshipStore((state) => state.calculatedStandings[2026]);
  const detailed = useChampionshipStore((state) => state.detailedResults[2026]);
  const fallback = getStandings(2026);
  const leader = (calculated?.drivers ?? fallback.drivers)[0];
  const completedRounds = (Array.isArray(detailed) ? detailed : [])
    .filter((entry) => entry && entry.status === 'completed').length;
  const totalRounds = CALENDAR_2026.length;
  const progress = totalRounds ? Math.round((completedRounds / totalRounds) * 100) : 0;

  return (
    <div className="home-command__strip" data-home-instruments aria-label={vi ? 'Thông số mùa giải 2026' : '2026 season instruments'}>
      <Link to="/season/2026?tab=calendar" className="home-command__cell home-command__cell--next">
        <span className="home-command__cell-head"><FlagTriangleRight size={14} aria-hidden="true" /> {vi ? 'CHẶNG TIẾP THEO' : 'NEXT GRAND PRIX'}</span>
        <strong className="home-command__value">{race ? race.name.replace(' Grand Prix', ' GP') : (vi ? 'Mùa giải hoàn tất' : 'Season complete')}</strong>
        <span className="home-command__meta">{race ? `R${String(race.round).padStart(2, '0')} · ${race.location}` : (vi ? 'Xem lịch 2026' : 'View 2026 calendar')}</span>
      </Link>
      <Link to="/season/2026?tab=standings&category=drivers" className="home-command__cell home-command__cell--leader">
        <span className="home-command__cell-head"><Trophy size={14} aria-hidden="true" /> {vi ? 'DẪN ĐẦU VĐQG' : 'CHAMPIONSHIP LEADER'}</span>
        <strong className="home-command__value">{leader?.driverName ?? (vi ? 'Chưa có dữ liệu' : 'No data yet')}</strong>
        <span className="home-command__meta">{leader ? <><b data-numeric>{leader.points}</b> {vi ? 'ĐIỂM' : 'PTS'} · {leader.teamName}</> : '—'}</span>
      </Link>
      <div className="home-command__cell home-command__cell--progress">
        <span className="home-command__cell-head"><Gauge size={14} aria-hidden="true" /> {vi ? 'TIẾN ĐỘ MÙA' : 'SEASON PROGRESS'}</span>
        <strong className="home-command__value"><span data-numeric>{completedRounds}</span><span>/</span>{totalRounds}</strong>
        <span className="home-command__bar" aria-hidden="true"><span style={{ width: `${progress}%` }} /></span>
        <span className="home-command__meta">{vi ? `${progress}% chặng đã hoàn thành` : `${progress}% rounds complete`}</span>
      </div>
    </div>
  );
}