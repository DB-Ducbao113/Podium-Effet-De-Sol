import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { getStandings } from '../../data/championship';
import { roundsWithResults } from '../../utils/podiumStats';
import type { SeasonYear } from '../../types';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import {
  STANDINGS_CONSTRUCTORS_VENUE,
  STANDINGS_DRIVERS_VENUE,
} from '../../utils/teamAtmosphere';
import { venueHeroFor, venueHeroSrcSet } from '../../utils/venueHeroes';
import { extra2026Hero } from '../../utils/extended2026Visuals';
import { ExtraArtwork } from '../directory/ExtraArtwork';
import { useMotionGate } from '../../hooks/useMotionGate';
import { MiniRaceLeaderboard } from './mini-race/MiniRaceLeaderboard';
import '../directory/directory.css';
import './standingsCinematicV5.css';

function HeroBackdrop({ venue, alt }: { venue: string; alt: string }) {
  return (
    <picture className="p5-hero-media" aria-hidden="true">
      <source type="image/avif" srcSet={venueHeroSrcSet(venue, 'land', 'avif')} sizes="(max-width: 900px) 100vw, 1440px" />
      <source type="image/webp" srcSet={venueHeroSrcSet(venue, 'land', 'webp')} sizes="(max-width: 900px) 100vw, 1440px" />
      <img src={`/images/championship/venues/${venue}-land-1600.webp`} alt={alt} loading="eager" decoding="async" />
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
  const venueId = isDrivers ? STANDINGS_DRIVERS_VENUE : STANDINGS_CONSTRUCTORS_VENUE;
  const venue = venueHeroFor(venueId);
  const reviewHero = extra2026Hero('championship', season);
  const rounds = roundsWithResults(season, detailedResults[season]);
  const motionEnabled = useMotionGate();
  const leaderPoints = rows[0]?.points ?? null;
  const runnerUpPoints = rows[1]?.points ?? null;
  const pointsGap = leaderPoints !== null && runnerUpPoints !== null
    ? Math.max(0, leaderPoints - runnerUpPoints) : null;
  const leaderName = isDrivers ? current.drivers[0]?.driverName : current.constructors[0]?.teamName;

  return (
    <section
      className="p5-standings p5-standings-v5"
      data-standings-category={standingsCategory}
      aria-label={title}
      data-motion-engine={motionEnabled ? 'css-scroll' : 'static'}
    >
      <header className="p5-hero p5-standings-hero">
        <ExtraArtwork artwork={reviewHero} className="p5-hero-media" eager fallback={<HeroBackdrop
          venue={venueId}
          alt={venue ? `${venue.place} · ${lang === 'vi' ? 'ảnh minh họa' : 'illustrative venue photo'}` : ''}
        />} />
        <span className="p5-hero-scrim" aria-hidden="true" />
        <div className="p5-hero-inner">
          <p className="p5-kicker">
            {season} <span aria-hidden="true">/</span>{' '}
            {lang === 'vi' ? `${rounds} VÒNG CÓ KẾT QUẢ` : `${rounds} ROUNDS WITH RESULTS`}
          </p>
          <h2 className="p5-mega">
            {lang === 'vi' ? 'Bảng xếp hạng' : 'Championship'}
            <span className="p5-mega-line">
              {isDrivers
                ? (lang === 'vi' ? 'Tay đua.' : 'Drivers.')
                : (lang === 'vi' ? 'Đội đua.' : 'Constructors.')}
            </span>
          </h2>
          <div className="standings-v5__snapshot" aria-label={lang === 'vi' ? 'Tổng quan xếp hạng' : 'Standings snapshot'}>
            <div className="standings-v5__leader">
              <span>{lang === 'vi' ? 'VỊ TRÍ P1' : 'STANDINGS P1'}</span>
              <strong>{leaderName ?? (lang === 'vi' ? 'Chưa có dữ liệu' : 'Unavailable')}</strong>
            </div>
            <dl className="standings-v5__facts">
              <div>
                <dt>{lang === 'vi' ? 'Điểm' : 'Points'}</dt>
                <dd>{leaderPoints ?? '—'}</dd>
              </div>
              <div>
                <dt>{lang === 'vi' ? 'Cách P2' : 'Lead to P2'}</dt>
                <dd>{pointsGap ?? '—'}</dd>
              </div>
            </dl>
          </div>
          {reviewHero ? <p className="p5-photo-credit p5-photo-credit-inline">{lang === 'vi' ? 'Ảnh minh họa AI' : 'AI illustration'}</p> : venue && (
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
