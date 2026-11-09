import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Trophy } from 'lucide-react';
import { getStandings } from '../../data/championship';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useReveal } from '../../hooks/useReveal';

export function HomeSeasonOverview() {
  const lang = useNavigationStore((state) => state.lang);
  const calculated = useChampionshipStore((state) => state.calculatedStandings[2026]);
  const fallback = getStandings(2026);
  const drivers = (calculated?.drivers ?? fallback.drivers).slice(0, 3);
  const constructors = (calculated?.constructors ?? fallback.constructors).slice(0, 3);
  const driverLeader = Math.max(1, ...drivers.map((entry) => entry.points));
  const constructorLeader = Math.max(1, ...constructors.map((entry) => entry.points));
  const { ref, isRevealed } = useReveal(0.12);

  return (
    <section
      id="championship-overview"
      ref={ref}
      className="page-container home-title-fight h25-reveal scroll-mt-20"
      data-revealed={isRevealed}
      aria-labelledby="home-title-fight-heading"
    >
      <header className="home-live__heading">
        <span className="home-live__slash" aria-hidden="true">///</span>
        <h2 id="home-title-fight-heading">THE TITLE FIGHT</h2>
        <span className="home-live__rule" aria-hidden="true" />
        <span className="home-title-fight__year">TOP 3 / 2026</span>
      </header>

      <div className="home-title-fight__grid">
        <article className="home-title-fight__panel">
          <div className="home-title-fight__panel-head">
            <span><Trophy size={18} aria-hidden="true" /> {lang === 'vi' ? 'TAY ĐUA' : 'DRIVERS'}</span>
            <Link to="/season/2026?tab=standings&category=drivers" aria-label={lang === 'vi' ? 'Xem toàn bộ bảng xếp hạng tay đua' : 'View all driver standings'}>
              <span>{lang === 'vi' ? 'XEM TẤT CẢ' : 'VIEW ALL'}</span>
              <ArrowUpRight size={21} aria-hidden="true" />
            </Link>
          </div>
          <ol className="home-title-fight__rows">
            {drivers.map((entry, index) => (
              <li
                key={entry.driverName}
                style={{
                  '--home-rank-width': `${Math.round(Math.max(0, entry.points) / driverLeader * 100)}%`,
                  '--home-rank-delay': `${index * 110}ms`,
                  '--home-rank-order': index,
                } as CSSProperties}
              >
                <span className="home-title-fight__scorebar" aria-hidden="true" />
                <span className="home-title-fight__rank">{String(index + 1).padStart(2, '0')}</span>
                <span className="home-title-fight__name">{entry.driverName}</span>
                <strong>{entry.points} <small>PTS</small></strong>
              </li>
            ))}
          </ol>
          {drivers.length === 0 && <span className="home-title-fight__empty">{lang === 'vi' ? 'Chưa có bảng điểm tay đua' : 'Driver standings unavailable'}</span>}
        </article>
        <article className="home-title-fight__panel home-title-fight__panel--constructors">
          <div className="home-title-fight__panel-head">
            <span>{lang === 'vi' ? 'ĐỘI ĐUA' : 'CONSTRUCTORS'}</span>
            <Link to="/season/2026?tab=standings&category=constructors" aria-label={lang === 'vi' ? 'Xem toàn bộ bảng xếp hạng đội đua' : 'View all constructor standings'}>
              <span>{lang === 'vi' ? 'XEM TẤT CẢ' : 'VIEW ALL'}</span>
              <ArrowUpRight size={21} aria-hidden="true" />
            </Link>
          </div>
          <ol className="home-title-fight__rows">
            {constructors.map((entry, index) => (
              <li
                key={entry.teamName}
                style={{
                  '--home-rank-width': `${Math.round(Math.max(0, entry.points) / constructorLeader * 100)}%`,
                  '--home-rank-delay': `${index * 110}ms`,
                  '--home-rank-order': index,
                } as CSSProperties}
              >
                <span className="home-title-fight__scorebar" aria-hidden="true" />
                <span className="home-title-fight__rank">{String(index + 1).padStart(2, '0')}</span>
                <span className="home-title-fight__name">{entry.teamName}</span>
                <strong>{entry.points} <small>PTS</small></strong>
              </li>
            ))}
          </ol>
          {constructors.length === 0 && <span className="home-title-fight__empty">{lang === 'vi' ? 'Chưa có bảng điểm đội đua' : 'Constructor standings unavailable'}</span>}
        </article>
      </div>
    </section>
  );
}
