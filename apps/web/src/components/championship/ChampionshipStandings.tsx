import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { getStandings } from '../../data/championship';
import { roundsWithResults } from '../../utils/p5Data';
import type { SeasonYear } from '../../types';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import {
  P5_STANDINGS_CONSTRUCTORS_VENUE,
  P5_STANDINGS_DRIVERS_VENUE,
} from '../../utils/p5TeamAtmosphere';
import { venueHeroFor, venueHeroSrcSet } from '../../utils/venueHeroes';
import { extra2026Hero, historicalStandingsHero } from '../../utils/p5Extended2026Visuals';
import { P5ExtraArtwork } from '../p5/P5ExtraArtwork';
import { useP5Reveal } from '../p5/useP5Reveal';
import { MiniRaceLeaderboard } from './mini-race/MiniRaceLeaderboard';
import '../p5/p5.css';

function HeroBackdrop({ venue, alt }: { venue: string; alt: string }) {
  return (
    <picture className="p5-hero-media" aria-hidden="true">
      <source type="image/avif" srcSet={venueHeroSrcSet(venue, 'land', 'avif')} sizes="(max-width: 900px) 100vw, 1440px" />
      <source type="image/webp" srcSet={venueHeroSrcSet(venue, 'land', 'webp')} sizes="(max-width: 900px) 100vw, 1440px" />
      <img src={`/images/p4/venues/${venue}-land-1600.webp`} alt={alt} loading="eager" decoding="async" />
    </picture>
  );
}

export function ChampionshipStandings({ season }: { season: SeasonYear }) {
  const lang = useNavigationStore((state) => state.lang);
  const { standingsCategory, calculatedStandings, detailedResults, syncMeta } = useChampionshipStore();
  const baseline = getStandings(season);
  const current = calculatedStandings[season] || baseline;
  const isDrivers = standingsCategory === 'drivers';
  const rows = isDrivers ? current.drivers : current.constructors;
  const title = isDrivers
    ? (lang === 'vi' ? 'BXH Tay đua' : 'Driver standings')
    : (lang === 'vi' ? 'BXH Đội đua' : 'Constructor standings');
  const venueId = isDrivers ? P5_STANDINGS_DRIVERS_VENUE : P5_STANDINGS_CONSTRUCTORS_VENUE;
  const venue = venueHeroFor(venueId);
  const reviewHero = historicalStandingsHero(season) ?? extra2026Hero('championship', season);
  const rounds = roundsWithResults(season, detailedResults[season]);
  const revealRef = useP5Reveal<HTMLElement>(`${season}-${standingsCategory}-${Math.round(rows[0]?.points ?? 0)}`);
  const leaderDriver = current.drivers[0];
  const leaderTeam = current.constructors[0];

  return (
    <section
      ref={revealRef}
      className="p5-standings"
      aria-label={title}
      data-motion-engine="p5"
    >
      <header className="p5-hero p5-standings-hero">
        <P5ExtraArtwork artwork={reviewHero} className="p5-hero-media" eager fallback={<HeroBackdrop
          venue={venueId}
          alt={venue ? `${venue.place} · ${lang === 'vi' ? 'ảnh minh họa' : 'illustrative venue photo'}` : ''}
        />} />
        <span className="p5-hero-scrim" aria-hidden="true" />
        <div className="p5-hero-inner" data-p5-reveal>
          <p className="p5-kicker">
            {season} <span aria-hidden="true">/</span>{' '}
            {lang === 'vi' ? `${rounds} VÒNG CÓ KẾT QUẢ` : `${rounds} ROUNDS WITH RESULTS`}
          </p>
          <h1 className="p5-mega">
            {isDrivers ? (
              <>
                DRIVERS<span className="p5-mega-line">CHAMPIONSHIP</span>
              </>
            ) : (
              <>
                CONSTRUCTORS<span className="p5-mega-line">CHAMPIONSHIP</span>
              </>
            )}
          </h1>
          <p className="p5-hero-lead">
            {isDrivers ? (
              lang === 'vi'
                ? leaderDriver ? `${leaderDriver.driverName} dẫn đầu · ${leaderDriver.points} điểm` : 'Chưa có xếp hạng'
                : leaderDriver ? `${leaderDriver.driverName} leads · ${leaderDriver.points} pts` : 'Standings unavailable'
            ) : (
              lang === 'vi'
                ? leaderTeam ? `${leaderTeam.teamName} dẫn đầu · ${leaderTeam.points} điểm` : 'Chưa có xếp hạng'
                : leaderTeam ? `${leaderTeam.teamName} leads · ${leaderTeam.points} pts` : 'Standings unavailable'
            )}
          </p>
          {reviewHero ? <p className="p5-photo-credit p5-photo-credit-inline">{lang === 'vi' ? 'Ảnh minh họa AI · xem trước local' : 'AI illustration · local preview'}</p> : venue && (
            <p className="p5-photo-credit p5-photo-credit-inline">
              {lang === 'vi' ? 'Ảnh minh họa' : 'Illustrative photo'}: {venue.place} ·{' '}
              <a href={venue.sourcePage} target="_blank" rel="noopener noreferrer">
                {venue.credit}
              </a>{' '}
              · {venue.license}
            </p>
          )}
        </div>
      </header>

      {syncMeta.syncStatus === 'error' && (
        <p className="p5-warning" role="status">
          {lang === 'vi'
            ? 'Không thể cập nhật. Đang hiển thị dữ liệu đã lưu hoặc dữ liệu nền.'
            : 'Update unavailable. Showing saved or baseline data.'}
        </p>
      )}

      <MiniRaceLeaderboard season={season} category={standingsCategory} rows={rows} lang={lang} />
      <div className="p5-standings-links">
        <a href={`https://www.formula1.com/en/results/${season}/${isDrivers ? 'drivers' : 'team'}`} target="_blank" rel="noopener noreferrer">
          {lang === 'vi' ? 'Đối chiếu F1.com' : 'Check F1.com'} <ExternalLink size={14} aria-hidden="true" />
        </a>
        <Link to={`/season/${season}?tab=results`}>{lang === 'vi' ? 'Kết quả chặng đua' : 'Race results'} →</Link>
      </div>

    </section>
  );
}
