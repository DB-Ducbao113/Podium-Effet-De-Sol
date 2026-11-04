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
        <span className="home-title-fight__year">2026</span>
      </header>

      <div className="home-title-fight__grid">
        <article className="home-title-fight__panel">
          <div className="home-title-fight__panel-head">
            <span><Trophy size={18} aria-hidden="true" /> {lang === 'vi' ? 'TAY ĐUA' : 'DRIVERS'}</span>
            <Link to="/season/2026?tab=standings&category=drivers" aria-label={lang === 'vi' ? 'Bảng xếp hạng tay đua' : 'Driver standings'}>
              <ArrowUpRight size={21} aria-hidden="true" />
            </Link>
          </div>
          <ol className="home-title-fight__rows">
            {drivers.map((entry, index) => (
              <li key={entry.driverName}>
                <span className="home-title-fight__rank">{String(index + 1).padStart(2, '0')}</span>
                <span className="home-title-fight__portrait" data-asset-slot="driver-photo" aria-hidden="true" />
                <span className="home-title-fight__name">{entry.driverName}</span>
                <strong>{entry.points} <small>PTS</small></strong>
              </li>
            ))}
          </ol>
          {drivers.length === 0 && <span className="home-title-fight__empty">—</span>}
        </article>
        <article className="home-title-fight__panel home-title-fight__panel--constructors">
          <div className="home-title-fight__panel-head">
            <span>{lang === 'vi' ? 'ĐỘI ĐUA' : 'CONSTRUCTORS'}</span>
            <Link to="/season/2026?tab=standings&category=constructors" aria-label={lang === 'vi' ? 'Bảng xếp hạng đội đua' : 'Constructor standings'}>
              <ArrowUpRight size={21} aria-hidden="true" />
            </Link>
          </div>
          <ol className="home-title-fight__rows">
            {constructors.map((entry, index) => (
              <li key={entry.teamName}>
                <span className="home-title-fight__rank">{String(index + 1).padStart(2, '0')}</span>
                <span className="home-title-fight__team-mark" aria-hidden="true" />
                <span className="home-title-fight__name">{entry.teamName}</span>
                <strong>{entry.points} <small>PTS</small></strong>
              </li>
            ))}
          </ol>
          {constructors.length === 0 && <span className="home-title-fight__empty">—</span>}
        </article>
      </div>
    </section>
  );
}
