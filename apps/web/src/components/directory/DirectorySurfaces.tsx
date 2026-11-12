import { Link } from 'react-router-dom';
import { DRIVERS_DATA } from '../../data/drivers';
import { TEAMS_DATA } from '../../data/teams';
import { getSeasonDriverNumber } from '../../data/championship/raceClassificationHelper';
import { getTeamSeasonProfile } from '../../data/teamSeasons';
import type { ConstructorStanding, DriverStanding, SeasonYear, TeamId } from '../../types';
import { getDriverCinematic } from '../../utils/driverCinematic';
import { DRIVER_PORTRAIT_CREDIT } from '../../utils/driverPortraits';
import {
  DRIVER_GALLERY_VENUE,
  TEAM_GALLERY_VENUE,
} from '../../utils/teamAtmosphere';
import { getTeamTextColor } from '../../utils/teamColors';
import { venueHeroFor, venueHeroSrcSet } from '../../utils/venueHeroes';
import { DriverPortrait } from './DriverPortrait';
import { teamConcept2026, teamConceptWidth2026 } from '../../utils/f1VisualAssets2026';
import { extra2026DriverPoster, extra2026Hero, extra2026TeamPoster } from '../../utils/extended2026Visuals';
import { ExtraArtwork } from './ExtraArtwork';
import { LocalImage } from './LocalImage';

type Lang = 'vi' | 'en';

/** Editorial palette extracted from PEDS_CINEMATIC_PROTOTYPE_V5.
 * These are visual tones, not historical team facts or official brand hexes.
 * The season's existing standings remain the only source of membership.
 */
export const EDITORIAL_TEAM_TONES: Record<TeamId, string> = {
  mclaren: '#e89c5b',
  ferrari: '#c55d50',
  mercedes: '#5cae9b',
  redbull: '#536e93',
  astonmartin: '#639b89',
  williams: '#6491bd',
  audi: '#a5b0af',
  cadillac: '#a4a297',
  alpine: '#769db7',
  haas: '#a3a3a4',
  racingbulls: '#657eaa',
};
/** One per-constructor identity: accent, deep stage and tinted paper.
 * Visual colors based on V5 palette and repo team branding metadata.
 * These do not change membership, race data or historical livery records.
 */
export const EDITORIAL_TEAM_SIGNATURES: Record<TeamId, {
  accent: string; deep: string; paper: string;
}> = {
  mclaren:     { accent: '#47c7fc', deep: '#583216', paper: '#f4e2d2' },
  ferrari:     { accent: '#ffe500', deep: '#6e1b23', paper: '#f0dedc' },
  mercedes:    { accent: '#c8ccce', deep: '#155c56', paper: '#ddece8' },
  redbull:     { accent: '#fcd700', deep: '#17294e', paper: '#dfe3ef' },
  astonmartin: { accent: '#cedc00', deep: '#0d5147', paper: '#dde9e1' },
  williams:    { accent: '#00e5ff', deep: '#143c68', paper: '#dce9f4' },
  audi:        { accent: '#f50537', deep: '#272d31', paper: '#e0e3e4' },
  cadillac:    { accent: '#d4af37', deep: '#1a1d21', paper: '#e7e4db' },
  alpine:      { accent: '#ff87bc', deep: '#284b80', paper: '#e4e6f4' },
  haas:        { accent: '#e6002b', deep: '#37383c', paper: '#e6e4e1' },
  racingbulls: { accent: '#d90429', deep: '#1f2b77', paper: '#dfe3f3' },
};

const EDITORIAL_DRIVER_TONES: Record<string, { team: TeamId; tone: string }> = {
  norris: { team: 'mclaren', tone: '#b15b31' },
  verstappen: { team: 'redbull', tone: '#30475d' },
  leclerc: { team: 'ferrari', tone: '#a4433e' },
  piastri: { team: 'mclaren', tone: '#ae6d42' },
  russell: { team: 'mercedes', tone: '#326e67' },
  antonelli: { team: 'mercedes', tone: '#477b76' },
  hamilton: { team: 'ferrari', tone: '#953b34' },
  alonso: { team: 'astonmartin', tone: '#255f58' },
};

const driverStyle = (teamId: TeamId, driverId?: string) => {
  const team = TEAMS_DATA[teamId];
  const editorialTeam = EDITORIAL_TEAM_TONES[teamId] || '#858c84';
  const signature = EDITORIAL_TEAM_SIGNATURES[teamId] || {
    accent: '#9ca5a1', deep: '#283430', paper: '#e2dfd7',
  };
  // A transferred driver adopts their actual season team's color instead of
  // retaining an outdated design-preview association.
  const prototypeDriver = driverId ? EDITORIAL_DRIVER_TONES[driverId] : undefined;
  const editorialDriver = prototypeDriver?.team === teamId
    ? prototypeDriver.tone : editorialTeam;
  return {
    '--team': getTeamTextColor(teamId, true),
    '--team-primary': team?.primaryColor || getTeamTextColor(teamId, true),
    '--team-accent': team?.accentColor || getTeamTextColor(teamId, true),
    '--peds-dir-team': editorialTeam,
    '--peds-dir-accent': signature.accent,
    '--peds-dir-deep': signature.deep,
    '--peds-dir-paper': signature.paper,
    '--peds-dir-driver': editorialDriver,
  } as React.CSSProperties;
};

/**
 * Header banner for the 2024/2025 directories: a mosaic of the season grid's
 * AI-generated portraits, so the hero shows the drivers themselves rather than
 * a single face. Decorative; the credit line below the hero names the source.
 */
export function SeasonGridBanner({
  season,
  drivers,
  className = '',
}: {
  season: SeasonYear;
  drivers: DriverStanding[];
  className?: string;
}) {
  const grid = [...drivers].sort((a, b) => a.rank - b.rank);
  if (!grid.length) return null;
  const cols = Math.max(4, Math.ceil(grid.length / 3));
  return (
    <div
      className={`p5-season-grid-banner ${className}`.trim()}
      style={{ '--banner-cols': cols } as React.CSSProperties}
      aria-hidden="true"
      data-p5-image-source="ai-generated-portrait"
    >
      {grid.map((driver, index) => (
        <span className="p5-season-grid-tile" key={driver.driverId} style={driverStyle(driver.teamId)}>
          <DriverPortrait
            driverId={driver.driverId}
            season={season}
            alt=""
            eager={index < cols}
            sizes="(max-width: 600px) 25vw, (max-width: 1024px) 16vw, 12vw"
          />
        </span>
      ))}
    </div>
  );
}

export function GalleryHero({
  kind,
  season,
  driverCount,
  teamCount,
  drivers,
  lang,
}: {
  kind: 'drivers' | 'teams';
  season: SeasonYear;
  driverCount: number;
  teamCount: number;
  drivers: DriverStanding[];
  lang: Lang;
}) {
  const isDrivers = kind === 'drivers';
  const venueId = isDrivers ? DRIVER_GALLERY_VENUE : TEAM_GALLERY_VENUE;
  const venue = venueHeroFor(venueId);
  const reviewHero = extra2026Hero('constructors', season);
  const isHistorical = season === 2024 || season === 2025;
  return (
    <header className="p5-gallery-hero" data-p5-reveal>
      <ExtraArtwork artwork={reviewHero} className="p5-hero-media" eager fallback={isHistorical ? <SeasonGridBanner season={season} drivers={drivers} className="p5-gallery-hero-banner" /> : <picture className="p5-hero-media" aria-hidden="true">
        <source type="image/avif" srcSet={venueHeroSrcSet(venueId, 'land', 'avif')} sizes="(max-width: 900px) 100vw, 1440px" />
        <source type="image/webp" srcSet={venueHeroSrcSet(venueId, 'land', 'webp')} sizes="(max-width: 900px) 100vw, 1440px" />
        <img src={`/images/championship/venues/${venueId}-land-1600.webp`} alt="" loading="eager" decoding="async" />
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
          {isDrivers
            ? lang === 'vi' ? 'Đội hình' : 'The'
            : lang === 'vi' ? 'Gara' : 'The'}
          <span className="p5-mega-line" aria-hidden="true">
            {isDrivers ? (lang === 'vi' ? 'Tay đua' : 'Grid') : (lang === 'vi' ? 'Đội đua' : 'Garage')}
          </span>
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
        {isHistorical && <p className="p5-photo-credit p5-photo-credit-inline">{lang === 'vi' ? `Chân dung AI tạo dựng · mùa ${season}` : `AI-generated portraits · ${season} season`}</p>}
        {reviewHero ? <p className="p5-photo-credit p5-photo-credit-inline">{lang === 'vi' ? 'Ảnh minh họa AI' : 'AI illustration'}</p> : !isHistorical && venue && (
          <p className="p5-photo-credit p5-photo-credit-inline">
            {lang === 'vi' ? 'Ảnh minh họa' : 'Illustrative photo'}: {venue.place} ·{' '}
            <a href={venue.sourcePage} target="_blank" rel="noopener noreferrer">{venue.credit}</a> · {venue.license}
          </p>
        )}
      </div>
    </header>
  );
}

export function DriversHero({
  season,
  driverCount,
  teamCount,
  drivers,
  lang,
}: {
  season: SeasonYear;
  driverCount: number;
  teamCount: number;
  drivers: DriverStanding[];
  lang: Lang;
}) {
  const reviewHero = extra2026Hero('drivers', season);
  const isHistorical = season === 2024 || season === 2025;
  return (
    <header className="p5-drivers-hero" data-p5-reveal>
      <ExtraArtwork
        artwork={reviewHero}
        className="p5-drivers-hero-media p5-drivers-hero-media-helmet"
        eager
        fallback={isHistorical ? <SeasonGridBanner season={season} drivers={drivers} className="p5-drivers-hero-banner" /> : undefined}
      />
      <span className="p5-drivers-hero-glow" aria-hidden="true" />
      <span className="p5-drivers-hero-carbon" aria-hidden="true" />
      <div className="p5-drivers-hero-copy">
        <p className="p5-kicker">
          {season} <span aria-hidden="true">/</span> {lang === 'vi' ? 'TAY ĐUA' : 'DRIVERS'}
        </p>
        <h1 aria-label={lang === 'vi' ? 'Tay đua' : 'Drivers'}>{lang === 'vi' ? 'Tay đua' : 'Drivers'}</h1>
        <p className="p5-drivers-hero-sub">
          {lang === 'vi'
            ? 'Những tài năng định hình tương lai'
            : 'The talents shaping the future'}
        </p>
        <p className="p5-drivers-hero-meta">
          <span><strong>{String(driverCount).padStart(2, '0')}</strong> {lang === 'vi' ? 'tay đua' : 'drivers'}</span>
          <span aria-hidden="true">/</span>
          <span><strong>{String(teamCount).padStart(2, '0')}</strong> {lang === 'vi' ? 'đội đua' : 'teams'}</span>
          <span aria-hidden="true">/</span>
          <span>{lang === 'vi' ? 'Mùa giải' : 'Season'} {season}</span>
        </p>
        {isHistorical && <p className="p5-drivers-hero-credit">{lang === 'vi' ? `Chân dung AI tạo dựng · mùa ${season}` : `AI-generated portraits · ${season} gallery`}</p>}
        {reviewHero && <p className="p5-drivers-hero-credit">{lang === 'vi' ? 'Ảnh minh họa AI' : 'AI illustration'}</p>}
      </div>
    </header>
  );
}

function splitDriverName(name: string) {
  const cut = name.lastIndexOf(' ');
  if (cut <= 0) return { first: name, last: '' };
  return { first: name.slice(0, cut), last: name.slice(cut + 1) };
}

export function DriverCard({
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
    <DriverPortrait
      driverId={row.driverId} season={season}
      alt={lang === 'vi' ? `Chân dung ${row.driverName}` : `Portrait of ${row.driverName}`}
      number={number} className="p5-driver-card-visual-portrait"
      sizes="(max-width: 560px) 47vw, (max-width: 1000px) 30vw, (max-width: 1500px) 23vw, 20vw"
    />
  );
  return (
    <article
      className={`p5-driver-card p5-driver-card--directory${season !== 2026 ? ' p5-driver-card--generated' : ''}`}
      style={driverStyle(row.teamId, row.driverId)}
      data-rank={row.rank}
      data-team-identity={row.teamId}
      data-p5-reveal
    >
      <span className="p5-driver-card-backdrop" aria-hidden="true" />
      <div className="p5-driver-card-visual">
        <ExtraArtwork
          artwork={poster}
          className="p5-driver-card-visual-art"
          alt={lang === 'vi'
            ? `Ảnh minh họa ${row.driverName} mùa ${season}`
            : `${row.driverName}, ${season} concept artwork`}
          sizes="(max-width: 560px) 47vw, (max-width: 1000px) 30vw, 26vw"
          fallback={portrait}
        />
      </div>
      <div className="p5-driver-card-body">
        <div className="p5-driver-card-top">
          <p className="p5-driver-card-team">{row.teamName}</p>
          <span className="p5-driver-card-rank">P{row.rank}</span>
        </div>
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

export function DriverGrid({
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
        <DriverCard key={row.driverId} row={row} season={season} lang={lang} />
      ))}
    </div>
  );
}

export function TeamCard({
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
        <DriverPortrait
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
      data-team-identity={row.teamId}
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
          <span className="p5-team-card-lineup-detail">
            <span className="p5-team-card-lineup-faces" aria-hidden="true">
              {lineup.map((driver) => (
                <DriverPortrait
                  key={driver.driverId}
                  driverId={driver.driverId}
                  season={season}
                  alt=""
                  number={getSeasonDriverNumber(season, driver.driverId)}
                  sizes="48px"
                />
              ))}
            </span>
            <strong>{lineup.length
              ? lineup.map((driver) => driver.driverName).join(' / ')
              : lang === 'vi' ? 'Chưa có đội hình' : 'No line-up'}</strong>
          </span>
        </div>
        <div className="p5-team-card-footer">
          <span>{lang === 'vi' ? 'KHÁM PHÁ ĐỘI ĐUA' : 'EXPLORE TEAM'} <span aria-hidden="true">↗</span></span>
          <span className="p5-team-card-points">{row.points}<small>PTS</small></span>
        </div>
      </div>
      <div className="p5-team-card-art" aria-hidden="true">
        {(season === 2024 || season === 2025) ? duo : <ExtraArtwork
          artwork={teamPoster}
          className="p5-team-card-poster"
          fallback={
            <LocalImage
              src={conceptCar}
              className="p5-team-card-car"
              width={teamConceptWidth2026(row.teamId)}
              height={840}
              fallback={duo}
            />
          }
        />}
      </div>
    </Link>
  );
}

export function TeamGrid({
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
        <TeamCard key={row.teamId} row={row} season={season} lang={lang} drivers={drivers} />
      ))}
    </div>
  );
}

export function PortraitCredits({
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
            return image ? [image.race.artist] : [];
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
      {(season === 2024 || season === 2025) && <p className="p5-portrait-credit">{lang === 'vi' ? 'Chân dung mùa này được tạo dựng bằng AI từ ảnh tham chiếu, không phải ảnh chụp sự kiện.' : 'Season portraits are AI-generated from reference photos, not event photography.'}</p>}
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
