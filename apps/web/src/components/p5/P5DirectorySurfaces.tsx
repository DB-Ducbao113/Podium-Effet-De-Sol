import { Link } from 'react-router-dom';
import { DRIVERS_DATA } from '../../data/drivers';
import { TEAMS_DATA } from '../../data/teams';
import { getSeasonDriverNumber } from '../../data/championship/raceClassificationHelper';
import { getTeamSeasonProfile } from '../../data/teamSeasons';
import type { ConstructorStanding, DriverStanding, SeasonYear, TeamId } from '../../types';
import { getDriverCinematic } from '../../utils/driverCinematic';
import { DRIVER_PORTRAIT_CREDIT } from '../../utils/driverPortraits';
import {
  P5_DRIVER_GALLERY_VENUE,
  P5_TEAM_GALLERY_VENUE,
} from '../../utils/p5TeamAtmosphere';
import { getTeamTextColor } from '../../utils/teamColors';
import { venueHeroFor, venueHeroSrcSet } from '../../utils/venueHeroes';
import { P5Portrait } from './P5Portrait';
import { teamConcept2026, teamConceptWidth2026 } from '../../utils/f1VisualAssets2026';
import { extra2026DriverPoster, extra2026Hero, extra2026TeamPoster } from '../../utils/p5Extended2026Visuals';
import { P5_SEASONAL_REVIEW_ENABLED } from '../../utils/p5SeasonalVisuals';
import { P5ExtraArtwork } from './P5ExtraArtwork';
import { P5LocalImage } from './P5LocalImage';

type Lang = 'vi' | 'en';

const driverStyle = (teamId: TeamId) => {
  const team = TEAMS_DATA[teamId];
  return {
    '--team': getTeamTextColor(teamId, true),
    '--team-primary': team?.primaryColor || getTeamTextColor(teamId, true),
    '--team-accent': team?.accentColor || getTeamTextColor(teamId, true),
  } as React.CSSProperties;
};

export function P5GalleryHero({
  kind,
  season,
  driverCount,
  teamCount,
  lang,
}: {
  kind: 'drivers' | 'teams';
  season: SeasonYear;
  driverCount: number;
  teamCount: number;
  lang: Lang;
}) {
  const isDrivers = kind === 'drivers';
  const venueId = isDrivers ? P5_DRIVER_GALLERY_VENUE : P5_TEAM_GALLERY_VENUE;
  const venue = venueHeroFor(venueId);
  const reviewHero = extra2026Hero('constructors', season);
  return (
    <header className="p5-gallery-hero" data-p5-reveal>
      <P5ExtraArtwork artwork={reviewHero} className="p5-hero-media" eager fallback={<picture className="p5-hero-media" aria-hidden="true">
        <source type="image/avif" srcSet={venueHeroSrcSet(venueId, 'land', 'avif')} sizes="(max-width: 900px) 100vw, 1440px" />
        <source type="image/webp" srcSet={venueHeroSrcSet(venueId, 'land', 'webp')} sizes="(max-width: 900px) 100vw, 1440px" />
        <img src={`/images/p4/venues/${venueId}-land-1600.webp`} alt="" loading="eager" decoding="async" />
      </picture>} />
      <span className="p5-hero-scrim" aria-hidden="true" />
      <div className="p5-gallery-hero-copy">
        <p className="p5-kicker">
          {season} <span aria-hidden="true">/</span>{' '}
          {isDrivers
            ? lang === 'vi' ? 'TAY ĐUA' : 'DRIVERS'
            : lang === 'vi' ? 'ĐỘI ĐUA' : 'CONSTRUCTORS'}
        </p>
        <h1 aria-label={isDrivers ? 'The Grid' : 'The Garage'}>
          THE
          <span className="p5-mega-line" aria-hidden="true">{isDrivers ? 'GRID' : 'GARAGE'}</span>
        </h1>
        <p>
          {isDrivers
            ? lang === 'vi'
              ? `${driverCount} tay đua trong bảng xếp hạng ${season}. Chân dung, số xe, đội đua và vị trí vô địch — tất cả từ dữ liệu mùa giải hiện có.`
              : `${driverCount} drivers in the ${season} standings — portraits, racing numbers, teams and championship position from the season dataset.`
            : lang === 'vi'
              ? `${teamCount} đội đua trong mùa ${season}. Màu nhận diện, đội hình, động cơ và điểm số từ bảng xếp hạng hiện có.`
              : `${teamCount} constructors in the ${season} season — identity, line-ups, power units and points from the current standings.`}
        </p>
        {reviewHero ? <p className="p5-photo-credit p5-photo-credit-inline">{lang === 'vi' ? 'Ảnh minh họa AI · xem trước local' : 'AI illustration · local preview'}</p> : venue && (
          <p className="p5-photo-credit p5-photo-credit-inline">
            {lang === 'vi' ? 'Ảnh minh họa' : 'Illustrative photo'}: {venue.place} ·{' '}
            <a href={venue.sourcePage} target="_blank" rel="noopener noreferrer">{venue.credit}</a> · {venue.license}
          </p>
        )}
      </div>
    </header>
  );
}

export function P5DriversHero({
  season,
  driverCount,
  teamCount,
  lang,
}: {
  season: SeasonYear;
  driverCount: number;
  teamCount: number;
  lang: Lang;
}) {
  const reviewHero = extra2026Hero('drivers', season);
  return (
    <header className="p5-drivers-hero" data-p5-reveal>
      <P5ExtraArtwork artwork={reviewHero} className="p5-drivers-hero-media p5-drivers-hero-media-helmet" eager fallback={<picture className="p5-drivers-hero-media p5-drivers-hero-media-helmet" aria-hidden="true">
        <img
          src="/images/p5/hero/lando-helmet-2024.jpg"
          alt=""
          width={1280}
          height={1280}
          loading="eager"
          decoding="async"
        />
      </picture>} />
      <span className="p5-drivers-hero-glow" aria-hidden="true" />
      <span className="p5-drivers-hero-carbon" aria-hidden="true" />
      <div className="p5-drivers-hero-copy">
        <p className="p5-kicker">
          {season} <span aria-hidden="true">/</span> {lang === 'vi' ? 'TAY ĐUA' : 'DRIVERS'}
        </p>
        <h1 aria-label={lang === 'vi' ? 'Tay đua' : 'Drivers'}>DRIVERS</h1>
        <p className="p5-drivers-hero-sub">
          {lang === 'vi'
            ? 'NHỮNG TÀI NĂNG ĐỊNH HÌNH TƯƠNG LAI'
            : 'THE TALENTS SHAPING THE FUTURE'}
        </p>
        <p className="p5-drivers-hero-meta">
          <span><strong>{String(driverCount).padStart(2, '0')}</strong> {lang === 'vi' ? 'tay đua' : 'drivers'}</span>
          <span aria-hidden="true">/</span>
          <span><strong>{String(teamCount).padStart(2, '0')}</strong> {lang === 'vi' ? 'đội đua' : 'teams'}</span>
          <span aria-hidden="true">/</span>
          <span>{lang === 'vi' ? 'Mùa giải' : 'Season'} {season}</span>
        </p>
      </div>
      {reviewHero ? <p className="p5-drivers-hero-credit">{lang === 'vi' ? 'Ảnh minh họa AI · xem trước local' : 'AI illustration · local preview'}</p> : <p className="p5-drivers-hero-credit">
        <span>{lang === 'vi' ? 'Mũ đua lưu trữ 2024' : 'Archive helmet, 2024'}</span>{' '}
        <a href="https://commons.wikimedia.org/wiki/File:Lando_Norris_Helmet_2024.jpg" target="_blank" rel="noopener noreferrer">Liauzh</a>{' '}
        · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a> · {lang === 'vi' ? 'cắt khung/ánh sáng bằng CSS' : 'CSS crop and lighting'}
      </p>}
    </header>
  );
}

function splitDriverName(name: string) {
  const cut = name.lastIndexOf(' ');
  if (cut <= 0) return { first: name, last: '' };
  return { first: name.slice(0, cut), last: name.slice(cut + 1) };
}

export function P5DriverCard({
  row, season, lang,
}: {
  row: DriverStanding;
  season: SeasonYear;
  lang: Lang;
}) {
  const driver = DRIVERS_DATA[row.driverId];
  const number = getSeasonDriverNumber(season, row.driverId) ?? driver?.number;
  const { first, last } = splitDriverName(row.driverName);
  const label = `P${row.rank} ${row.driverName}, ${row.teamName}, ${row.points} ${lang === 'vi' ? 'điểm' : 'points'}`;
  const poster = extra2026DriverPoster(row.driverId, season);
  const portrait = (
    <P5Portrait
      driverId={row.driverId} season={season}
      alt={lang === 'vi' ? `Chân dung ${row.driverName}` : `Portrait of ${row.driverName}`}
      number={number} className="p5-driver-card-visual-portrait"
      sizes="(max-width: 560px) 47vw, (max-width: 1000px) 30vw, (max-width: 1500px) 23vw, 20vw"
    />
  );
  return (
    <article
      className="p5-driver-card p5-driver-card--directory"
      style={driverStyle(row.teamId)}
      data-rank={row.rank}
      data-p5-reveal
    >
      <span className="p5-driver-card-backdrop" aria-hidden="true" />
      <div className="p5-driver-card-visual">
        <P5ExtraArtwork
          artwork={poster}
          className="p5-driver-card-visual-art"
          alt={lang === 'vi'
            ? `Ảnh minh họa ${row.driverName} mùa ${season}`
            : `${row.driverName}, ${season} concept artwork`}
          sizes="(max-width: 560px) 47vw, (max-width: 1000px) 30vw, 26vw"
          fallback={portrait}
        />
      </div>
      <span className="p5-driver-card-number" aria-hidden="true">{number ?? '—'}</span>
      <span className="p5-driver-card-rank">P{row.rank}</span>
      <div className="p5-driver-card-body">
        <p className="p5-driver-card-team">{row.teamName}</p>
        <h2 aria-label={row.driverName}>
          <span className="p5-driver-card-first">{first}</span>
          <span className="p5-driver-card-last">{last || row.driverName}</span>
        </h2>
        <div className="p5-driver-card-meta">
          <span>{row.countryFlag} {row.driverCode}{number != null ? ` · #${number}` : ''}</span>
          <span className="p5-driver-card-points">{row.points} <small>PTS</small></span>
        </div>
        <span className="p5-driver-card-action" aria-hidden="true">
          {lang === 'vi' ? 'Hồ sơ tay đua' : 'Driver profile'}
          <span className="p5-driver-card-arrow">↗</span>
        </span>
      </div>
      <Link className="p5-driver-card-link" to={`/drivers/${row.driverId}?season=${season}`} aria-label={label} />
    </article>
  );
}

export function P5DriverGrid({
  rows,
  season,
  lang,
  emptyLabel,
}: {
  rows: DriverStanding[];
  season: SeasonYear;
  lang: Lang;
  emptyLabel: string;
}) {
  if (!rows.length) return <p className="p5-empty-state">{emptyLabel}</p>;
  return (
    <div className="p5-driver-grid">
      {rows.map((row) => (
        <P5DriverCard key={row.driverId} row={row} season={season} lang={lang} />
      ))}
    </div>
  );
}

export function P5TeamCard({
  row, season, lang, drivers,
}: {
  row: ConstructorStanding;
  season: SeasonYear;
  lang: Lang;
  drivers: DriverStanding[];
}) {
  const team = TEAMS_DATA[row.teamId];
  const profile = getTeamSeasonProfile(row.teamId, season);
  const lineup = drivers.filter((driver) => driver.teamId === row.teamId).slice(0, 2);
  const conceptCar = teamConcept2026(row.teamId, season);
  const teamPoster = extra2026TeamPoster(row.teamId, season);
  const duo = (
    <span className="p5-team-card-media" aria-hidden="true">
      {lineup.map((driver) => (
        <P5Portrait
          key={driver.driverId} driverId={driver.driverId}
          season={season} alt=""
          number={getSeasonDriverNumber(season, driver.driverId)}
          sizes="(max-width: 760px) 30vw, 18vw"
        />
      ))}
      {!lineup.length && <span className="p5-team-card-no-art">{team?.name ?? row.teamName}</span>}
    </span>
  );

  return (
    <Link
      to={`/teams/${row.teamId}?season=${season}`}
      className="p5-team-card p5-team-card--garage"
      style={driverStyle(row.teamId)}
      data-p5-reveal
      aria-label={`P${row.rank} ${row.teamName}, ${row.points} ${lang === 'vi' ? 'điểm' : 'points'}`}
    >
      <div className="p5-team-card-body">
        <span className="p5-team-card-rank">P{row.rank} / {season}</span>
        <h2>{row.teamName}</h2>
        <p className="p5-team-card-meta">
          {profile?.powerUnit
            ? `${lang === 'vi' ? 'Động cơ' : 'Power unit'} · ${profile.powerUnit}`
            : row.engine}
        </p>
        <div className="p5-team-card-lineup" aria-label={lang === 'vi' ? 'Đội hình' : 'Driver lineup'}>
          <small>{lang === 'vi' ? 'TAY ĐUA' : 'DRIVER LINEUP'}</small>
          <strong>{lineup.length
            ? lineup.map((driver) => driver.driverName).join(' / ')
            : lang === 'vi' ? 'Chưa có đội hình' : 'No line-up'}</strong>
        </div>
        <div className="p5-team-card-footer">
          <span>{lang === 'vi' ? 'KHÁM PHÁ ĐỘI ĐUA' : 'EXPLORE TEAM'} <span aria-hidden="true">↗</span></span>
          <span className="p5-team-card-points">{row.points}<small>PTS</small></span>
        </div>
      </div>
      <div className="p5-team-card-art" aria-hidden="true">
        <P5ExtraArtwork
          artwork={teamPoster}
          className="p5-team-card-poster"
          fallback={
            <P5LocalImage
              src={conceptCar}
              className="p5-team-card-car"
              width={teamConceptWidth2026(row.teamId)}
              height={840}
              fallback={duo}
            />
          }
        />
      </div>
    </Link>
  );
}

export function P5TeamGrid({
  rows,
  season,
  lang,
  drivers,
  emptyLabel,
}: {
  rows: ConstructorStanding[];
  season: SeasonYear;
  lang: Lang;
  drivers: DriverStanding[];
  emptyLabel: string;
}) {
  if (!rows.length) return <p className="p5-empty-state">{emptyLabel}</p>;
  return (
    <div className="p5-team-grid">
      {rows.map((row) => (
        <P5TeamCard key={row.teamId} row={row} season={season} lang={lang} drivers={drivers} />
      ))}
    </div>
  );
}

export function P5PortraitCredit({
  lang,
  driverIds,
  season,
}: {
  lang: Lang;
  driverIds: string[];
  season?: SeasonYear;
}) {
  const credits = Array.from(
    new Set(
      (season === 2026 ? [] : driverIds)
        .map((driverId) => DRIVER_PORTRAIT_CREDIT[driverId]?.credit)
        .filter((credit): credit is string => Boolean(credit)),
    ),
  );
  const cinematicCredits = season
    ? Array.from(
        new Set(
          driverIds
            .flatMap((driverId) => {
              const image = getDriverCinematic(driverId, season);
              return image ? [image.race.artist, image.action.artist] : [];
            })
            .filter(Boolean),
        ),
      )
    : [];
  if (!credits.length && !cinematicCredits.length && season !== 2026) return null;
  const visible = credits.slice(0, 4);
  return (
    <>
      {season === 2026 && <p className="p5-portrait-credit">{lang === 'vi' ? 'Ảnh chân dung và xe 2026: concept do chủ sở hữu cung cấp · chờ duyệt hình' : '2026 driver and car artwork: owner-provided concepts · pending visual review'}</p>}
      {credits.length > 0 && (
        <p className="p5-portrait-credit">
          {lang === 'vi' ? 'Chân dung' : 'Portraits'}: Wikimedia Commons ·{' '}
          {visible.join(', ')}
          {credits.length > visible.length
            ? lang === 'vi' ? ` và ${credits.length - visible.length} tác giả khác` : ` and ${credits.length - visible.length} more`
            : ''}{' '}
          · <Link to="/about">{lang === 'vi' ? 'Chi tiết bản quyền' : 'Licence details'}</Link>
        </p>
      )}
      {cinematicCredits.length > 0 && (
        <p className="p5-portrait-credit">
          {lang === 'vi' ? 'Ảnh đua 2026' : '2026 race photography'}: Wikimedia Commons ·{' '}
          {cinematicCredits.slice(0, 4).join(', ')}
          {cinematicCredits.length > 4
            ? lang === 'vi' ? ` và ${cinematicCredits.length - 4} tác giả khác` : ` and ${cinematicCredits.length - 4} more`
            : ''}{' '}
          · <Link to="/about">{lang === 'vi' ? 'Chi tiết bản quyền' : 'Licence details'}</Link>
        </p>
      )}
    </>
  );
}
