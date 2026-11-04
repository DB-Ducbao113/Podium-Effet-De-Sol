import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { getStandings } from '../../data/championship';
import { getSeasonDriverNumber } from '../../data/championship/raceClassificationHelper';
import { DRIVERS_DATA } from '../../data/drivers';
import { TEAMS_DATA } from '../../data/teams';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import type { ConstructorStanding, DriverStanding, SeasonYear } from '../../types';
import { DRIVER_PORTRAIT_CREDIT } from '../../utils/driverPortraits';
import { podiumForm, roundsWithResults, type PodiumFormEntry } from '../../utils/p5Data';
import {
  P5_STANDINGS_CONSTRUCTORS_VENUE,
  P5_STANDINGS_DRIVERS_VENUE,
} from '../../utils/p5TeamAtmosphere';
import { venueHeroFor, venueHeroSrcSet } from '../../utils/venueHeroes';
import { getTeamTextColor } from '../../utils/teamColors';
import { verifiedMovement, type Movement } from '../../utils/standingsMovement';
import { getDriverCinematic } from '../../utils/driverCinematic';
import { teamConcept2026, teamConceptWidth2026 } from '../../utils/f1VisualAssets2026';
import { P5RaceImage } from '../p5/P5CinematicImage';
import { P5Portrait } from '../p5/P5Portrait';
import { P5DriverIcon } from '../p5/P5DriverIcon';
import { P5_SEASONAL_REVIEW_ENABLED } from '../../utils/p5SeasonalVisuals';
import { extra2026Hero } from '../../utils/p5Extended2026Visuals';
import { P5ExtraArtwork } from '../p5/P5ExtraArtwork';
import { useP5Reveal } from '../p5/useP5Reveal';
import '../p5/p5.css';

function RankImpact({ movement, lang }: { movement?: Movement; lang: 'vi' | 'en' }) {
  const change = movement?.change;
  const label = change === undefined
    ? (lang === 'vi' ? 'Chưa đủ dữ liệu so sánh hạng' : 'No verified prior rank')
    : change > 0 ? (lang === 'vi' ? `Tăng ${change} bậc` : `Up ${change} places`)
    : change < 0 ? (lang === 'vi' ? `Giảm ${-change} bậc` : `Down ${-change} places`)
    : (lang === 'vi' ? 'Không đổi hạng' : 'Rank unchanged');
  return (
    <span
      className="p5-rank-impact"
      data-direction={change === undefined ? 'unknown' : change > 0 ? 'up' : change < 0 ? 'down' : 'same'}
      title={label}
      aria-label={label}
    >
      {change === undefined ? '—' : change > 0 ? `▲${change}` : change < 0 ? `▼${-change}` : '•'}
    </span>
  );
}

function FormBadges({ entries, lang }: { entries: PodiumFormEntry[]; lang: 'vi' | 'en' }) {
  return (
    <span className="p5-form" aria-label={lang === 'vi' ? 'Chuỗi 5 vòng gần nhất' : 'Last five rounds'}>
      {entries.map((entry) => (
        <span
          key={entry.round}
          className="p5-form-cell"
          data-pos={entry.position ?? 0}
          title={entry.position
            ? lang === 'vi' ? `Vòng ${entry.round}: P${entry.position}` : `Round ${entry.round}: P${entry.position}`
            : entry.source === 'detailed'
              ? lang === 'vi' ? `Vòng ${entry.round}: không có podium` : `Round ${entry.round}: no podium`
              : lang === 'vi' ? `Vòng ${entry.round}: không có trong tóm tắt top 3` : `Round ${entry.round}: not in the podium summary`}
        >
          {entry.position ? `P${entry.position}` : '–'}
        </span>
      ))}
    </span>
  );
}

function HeroBackdrop({ venue, alt }: { venue: string; alt: string }) {
  return (
    <picture className="p5-hero-media" aria-hidden="true">
      <source type="image/avif" srcSet={venueHeroSrcSet(venue, 'land', 'avif')} sizes="(max-width: 900px) 100vw, 1440px" />
      <source type="image/webp" srcSet={venueHeroSrcSet(venue, 'land', 'webp')} sizes="(max-width: 900px) 100vw, 1440px" />
      <img src={`/images/p4/venues/${venue}-land-1600.webp`} alt={alt} loading="eager" decoding="async" />
    </picture>
  );
}

function PodiumCardDriver({ row, season, lang }: { row: DriverStanding; season: SeasonYear; lang: 'vi' | 'en' }) {
  const driver = DRIVERS_DATA[row.driverId];
  const team = TEAMS_DATA[row.teamId];
  const number = getSeasonDriverNumber(season, row.driverId) ?? driver?.number;
  const color = getTeamTextColor(row.teamId, true);
  const cinematic = getDriverCinematic(row.driverId, season);
  return (
    <Link
      to={`/drivers/${row.driverId}`}
      className={`p5-podium-card p5-podium-${row.rank}`}
      style={{
        '--team': color,
        '--team-primary': team?.primaryColor || color,
        '--team-accent': team?.accentColor || color,
      } as React.CSSProperties}
      data-p5-reveal
      data-rank={row.rank}
      aria-label={`P${row.rank} ${row.driverName}, ${row.points} ${lang === 'vi' ? 'điểm' : 'points'}`}
    >
      <span className="p5-podium-ghost" aria-hidden="true">0{row.rank}</span>
      <div className="p5-podium-media">
        <P5Portrait
          driverId={row.driverId}
          season={season}
          alt={row.driverName}
          number={number}
          sizes="(max-width: 700px) 90vw, 33vw"
          eager={row.rank === 1}
        />
      </div>
      {cinematic && season !== 2026 && (
        <span className="p5-podium-race" aria-hidden="true">
          <P5RaceImage
            driverId={row.driverId}
            season={season}
            alt=""
            sizes="(max-width: 700px) 90vw, 33vw"
            eager={row.rank === 1}
          />
        </span>
      )}
      <span className="p5-podium-scrim" aria-hidden="true" />
      <span className="p5-podium-rank" aria-hidden="true">P{row.rank}</span>
      <div className="p5-podium-info">
        <p className="p5-podium-team">{row.teamName}</p>
        <h3>{row.driverName}</h3>
        <p className="p5-podium-meta">
          {row.countryFlag} {row.driverCode}{number ? ` · #${number}` : ''}
        </p>
        <p className="p5-podium-points">
          <strong>{row.points}</strong>
          <span>{lang === 'vi' ? 'ĐIỂM' : 'PTS'}</span>
        </p>
        <span className="p5-podium-action">{lang === 'vi' ? 'Hồ sơ tay đua' : 'Driver profile'} →</span>
      </div>
      <span className="p5-podium-rail" aria-hidden="true" />
    </Link>
  );
}

function PodiumCardTeam({ row, drivers, season, lang }: { row: ConstructorStanding; drivers: DriverStanding[]; season: SeasonYear; lang: 'vi' | 'en' }) {
  const team = TEAMS_DATA[row.teamId];
  const color = getTeamTextColor(row.teamId, true);
  const lineup = drivers.filter((driver) => driver.teamId === row.teamId).slice(0, 2);
  return (
    <Link
      to={`/teams/${row.teamId}`}
      className={`p5-podium-card p5-podium-team-card p5-podium-${row.rank}`}
      style={{
        '--team': color,
        '--team-primary': team?.primaryColor || color,
        '--team-accent': team?.accentColor || color,
      } as React.CSSProperties}
      data-p5-reveal
      data-rank={row.rank}
      aria-label={`P${row.rank} ${row.teamName}, ${row.points} ${lang === 'vi' ? 'điểm' : 'points'}`}
    >
      <span className="p5-podium-ghost" aria-hidden="true">0{row.rank}</span>
      {teamConcept2026(row.teamId, season) && <span className="p5-concept-car p5-concept-car--podium" aria-hidden="true"><img src={teamConcept2026(row.teamId, season)} alt="" width={teamConceptWidth2026(row.teamId)} height={235} loading={row.rank === 1 ? 'eager' : 'lazy'} /></span>}
      <div className="p5-podium-duo">
        {lineup.map((driver) => (
          <P5Portrait
            key={driver.driverId}
            driverId={driver.driverId}
            season={season}
            alt={driver.driverName}
            number={DRIVERS_DATA[driver.driverId]?.number}
            sizes="(max-width: 700px) 45vw, 17vw"
          />
        ))}
      </div>
      <span className="p5-podium-scrim" aria-hidden="true" />
      <span className="p5-podium-rank" aria-hidden="true">P{row.rank}</span>
      <div className="p5-podium-info">
        <p className="p5-podium-team">{row.engine}</p>
        <h3>{row.teamName}</h3>
        <p className="p5-podium-meta">
          {lineup.map((driver) => driver.driverCode).join(' · ')} · {row.wins} {lang === 'vi' ? 'thắng' : 'wins'}
        </p>
        <p className="p5-podium-points">
          <strong>{row.points}</strong>
          <span>{lang === 'vi' ? 'ĐIỂM' : 'PTS'}</span>
        </p>
        <span className="p5-podium-action">{lang === 'vi' ? 'Hồ sơ đội đua' : 'Team profile'} →</span>
      </div>
      <span className="p5-podium-rail" aria-hidden="true" />
    </Link>
  );
}

export function ChampionshipStandings({ season }: { season: SeasonYear }) {
  const lang = useNavigationStore((state) => state.lang);
  const { standingsCategory, calculatedStandings, detailedResults, syncMeta } = useChampionshipStore();
  const baseline = getStandings(season);
  const current = calculatedStandings[season] || baseline;
  const movement = useMemo(
    () => verifiedMovement(season, detailedResults[season] || [], current, baseline),
    [season, detailedResults, current, baseline],
  );
  const isDrivers = standingsCategory === 'drivers';
  const rows = isDrivers ? current.drivers : current.constructors;
  const title = isDrivers
    ? (lang === 'vi' ? 'BXH Tay đua' : 'Driver standings')
    : (lang === 'vi' ? 'BXH Đội đua' : 'Constructor standings');
  const venueId = isDrivers ? P5_STANDINGS_DRIVERS_VENUE : P5_STANDINGS_CONSTRUCTORS_VENUE;
  const venue = venueHeroFor(venueId);
  const reviewHero = extra2026Hero('championship', season);
  const rounds = roundsWithResults(season, detailedResults[season]);
  const topDrivers = current.drivers.slice(0, 3);
  const topTeams = current.constructors.slice(0, 3);
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
            {lang === 'vi' ? `SAU ${rounds} VÒNG CÓ KẾT QUẢ` : `AFTER ${rounds} ROUNDS WITH RESULTS`}
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
                ? `${leaderDriver?.driverName} dẫn đầu với ${leaderDriver?.points} điểm, hơn ${current.drivers[1]?.driverName} ${leaderDriver && current.drivers[1] ? Math.max(0, leaderDriver.points - current.drivers[1].points) : 0} điểm.`
                : `${leaderDriver?.driverName} leads on ${leaderDriver?.points} points, ${leaderDriver && current.drivers[1] ? Math.max(0, leaderDriver.points - current.drivers[1].points) : 0} clear of ${current.drivers[1]?.driverName}.`
            ) : (
              lang === 'vi'
                ? `${leaderTeam?.teamName} dẫn đầu với ${leaderTeam?.points} điểm, hơn ${current.constructors[1]?.teamName} ${leaderTeam && current.constructors[1] ? Math.max(0, leaderTeam.points - current.constructors[1].points) : 0} điểm.`
                : `${leaderTeam?.teamName} leads on ${leaderTeam?.points} points, ${leaderTeam && current.constructors[1] ? Math.max(0, leaderTeam.points - current.constructors[1].points) : 0} clear of ${current.constructors[1]?.teamName}.`
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

      <div className="p5-podium-field" aria-label={lang === 'vi' ? 'Ba hạng dẫn đầu' : 'Top three'}>
        {isDrivers
          ? [topDrivers[1], topDrivers[0], topDrivers[2]]
              .filter((row): row is DriverStanding => Boolean(row))
              .map((row) => <PodiumCardDriver key={row.driverId} row={row} season={season} lang={lang} />)
          : [topTeams[1], topTeams[0], topTeams[2]]
              .filter((row): row is ConstructorStanding => Boolean(row))
              .map((row) => (
                <PodiumCardTeam key={row.teamId} row={row} drivers={current.drivers} season={season} lang={lang} />
              ))}
      </div>

      <div className="p5-section-head" data-p5-reveal>
        <div>
          <p className="p5-kicker">{lang === 'vi' ? 'PHÂN LOẠI ĐẦY ĐỦ' : 'FULL CLASSIFICATION'}</p>
          <h2>{lang === 'vi' ? 'Toàn bộ bảng xếp hạng' : 'Full standings'}</h2>
        </div>
        <p className="p5-section-note">
          {baseline.status === 'ongoing'
            ? lang === 'vi' ? 'Mùa giải đang diễn ra · thứ hạng có thể thay đổi' : 'Season in progress · positions may change'
            : lang === 'vi' ? 'Mùa giải đã kết thúc' : 'Completed season'}
          {baseline.lastUpdated ? ` · ${lang === 'vi' ? 'Cập nhật' : 'Updated'} ${baseline.lastUpdated}` : ''}
        </p>
      </div>

      <div className="p5-table-scroll" tabIndex={0} role="region" aria-label={title}>
        <table className="p5-table">
          <thead>
            <tr>
              <th scope="col" className="p5-col-rank">{lang === 'vi' ? 'Hạng' : 'Pos'}</th>
              <th scope="col">{isDrivers ? (lang === 'vi' ? 'Tay đua' : 'Driver') : (lang === 'vi' ? 'Đội đua' : 'Team')}</th>
              <th scope="col">{isDrivers ? (lang === 'vi' ? 'Đội' : 'Team') : (lang === 'vi' ? 'Tay đua' : 'Drivers')}</th>
              <th scope="col" className="p5-col-form">{lang === 'vi' ? '5 vòng gần nhất' : 'Last 5'}</th>
              <th scope="col" className="p5-col-num">{lang === 'vi' ? 'Thắng' : 'Wins'}</th>
              <th scope="col" className="p5-col-num">{lang === 'vi' ? 'Podium' : 'Podiums'}</th>
              <th scope="col" className="p5-col-num">{lang === 'vi' ? 'Điểm' : 'Pts'}</th>
            </tr>
          </thead>
          <tbody>
            {isDrivers
              ? current.drivers.map((row) => {
                  const driver = DRIVERS_DATA[row.driverId];
                  const number = getSeasonDriverNumber(season, row.driverId) ?? driver?.number;
                  const delta = movement.drivers.get(row.driverId);
                  const form = podiumForm(season, [row.driverName], 5, detailedResults[season]);
                  return (
                    <tr
                      key={row.driverId}
                      className="p5-table-row"
                      data-rank={row.rank}
                      style={{ '--team': getTeamTextColor(row.teamId, true) } as React.CSSProperties}
                      data-p5-reveal
                    >
                      <td className="p5-col-rank">
                        <span className="p5-table-rank">{String(row.rank).padStart(2, '0')}</span>
                        <RankImpact movement={delta} lang={lang} />
                      </td>
                      <th scope="row">
                        <div className="p5-table-identity">
                          {P5_SEASONAL_REVIEW_ENABLED
                            ? <P5DriverIcon season={season} driverId={row.driverId} code={row.driverCode} teamId={row.teamId} size={44} />
                            : <P5Portrait season={season} driverId={row.driverId} alt="" number={number} />}
                          <span>
                            <Link to={`/drivers/${row.driverId}?season=${season}`}>{row.driverName}</Link>
                            <small>{row.driverCode}{number ? ` · #${number}` : ''} · {row.countryFlag}</small>
                          </span>
                        </div>
                      </th>
                      <td><Link className="p5-team-link" to={`/teams/${row.teamId}?season=${season}`}>{row.teamName}</Link></td>
                      <td className="p5-col-form"><FormBadges entries={form} lang={lang} /></td>
                      <td className="p5-col-num">{row.wins}</td>
                      <td className="p5-col-num">{row.podiums}</td>
                      <td className="p5-col-num p5-points-cell">{row.points}</td>
                    </tr>
                  );
                })
              : current.constructors.map((row) => {
                  const team = TEAMS_DATA[row.teamId];
                  const delta = movement.constructors.get(row.teamId);
                  const lineup = current.drivers.filter((driver) => driver.teamId === row.teamId);
                  const form = podiumForm(season, lineup.map((driver) => driver.driverName), 5, detailedResults[season]);
                  return (
                    <tr
                      key={row.teamId}
                      className="p5-table-row"
                      data-rank={row.rank}
                      style={{ '--team': getTeamTextColor(row.teamId, true) } as React.CSSProperties}
                      data-p5-reveal
                    >
                      <td className="p5-col-rank">
                        <span className="p5-table-rank">{String(row.rank).padStart(2, '0')}</span>
                        <RankImpact movement={delta} lang={lang} />
                      </td>
                      <th scope="row">
                        <div className="p5-table-identity p5-table-team">
                          <span className="p5-team-slash" aria-hidden="true" style={{ background: team?.primaryColor }} />
                          <span>
                            <Link to={`/teams/${row.teamId}?season=${season}`}>{row.teamName}</Link>
                            <small>{row.engine}</small>
                          </span>
                        </div>
                      </th>
                      <td>
                        <span className="p5-lineup">
                          {lineup.length
                            ? lineup.map((driver) => driver.driverCode).join(' · ')
                            : (lang === 'vi' ? 'Chưa có đội hình' : 'No line-up')}
                        </span>
                      </td>
                      <td className="p5-col-form"><FormBadges entries={form} lang={lang} /></td>
                      <td className="p5-col-num">{row.wins}</td>
                      <td className="p5-col-num">{row.podiums}</td>
                      <td className="p5-col-num p5-points-cell">{row.points}</td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      <div className="p5-mobile-standings">
        {isDrivers
          ? current.drivers.map((row) => {
              const number = getSeasonDriverNumber(season, row.driverId) ?? DRIVERS_DATA[row.driverId]?.number;
              return (
                <Link
                  key={row.driverId}
                  to={`/drivers/${row.driverId}?season=${season}`}
                  className="p5-mobile-row"
                  style={{ '--team': getTeamTextColor(row.teamId, true) } as React.CSSProperties}
                  data-rank={row.rank}
                  data-p5-reveal
                >
                  <span className="p5-mobile-rank">{String(row.rank).padStart(2, '0')}</span>
                  {P5_SEASONAL_REVIEW_ENABLED
                    ? <P5DriverIcon season={season} driverId={row.driverId} code={row.driverCode} teamId={row.teamId} size={44} />
                    : <P5Portrait season={season} driverId={row.driverId} alt="" number={number} />}
                  <span className="p5-mobile-main">
                    <strong>{row.driverName}</strong>
                    <small>{row.driverCode}{number ? ` · #${number}` : ''} · {row.teamName}</small>
                  </span>
                  <span className="p5-mobile-points">{row.points}<small>PTS</small></span>
                </Link>
              );
            })
          : current.constructors.map((row) => (
              <Link
                key={row.teamId}
                to={`/teams/${row.teamId}?season=${season}`}
                className="p5-mobile-row"
                style={{ '--team': getTeamTextColor(row.teamId, true) } as React.CSSProperties}
                data-rank={row.rank}
                data-p5-reveal
              >
                <span className="p5-mobile-rank">{String(row.rank).padStart(2, '0')}</span>
                <span className="p5-mobile-team-mark" aria-hidden="true">
                  <span style={{ background: TEAMS_DATA[row.teamId]?.primaryColor }} />
                </span>
                <span className="p5-mobile-main">
                  <strong>{row.teamName}</strong>
                  <small>{row.engine} · {row.wins} {lang === 'vi' ? 'thắng' : 'wins'}</small>
                </span>
                <span className="p5-mobile-points">{row.points}<small>PTS</small></span>
              </Link>
            ))}
      </div>

      <footer className="p5-table-footer">
        <p>
          {lang === 'vi'
            ? 'Chuỗi 5 vòng dùng kết quả đầy đủ khi có, nếu không thì dùng tóm tắt top 3 đã công bố. Dấu – nghĩa là không có podium trong vòng đó (dữ liệu đầy đủ) hoặc không có trong tóm tắt top 3 (chỉ có tóm tắt), không phải kết quả toàn bộ lưới.'
            : 'The last-five sequence uses full classifications where available and published top-three summaries otherwise. “–” means no podium in that round (full data) or absent from the podium summary (summary-only), not a full-grid result.'}
        </p>
        <div className="p5-footer-links">
          <a href={`https://www.formula1.com/en/results/${season}/${isDrivers ? 'drivers' : 'team'}`} target="_blank" rel="noopener noreferrer">
            {lang === 'vi' ? 'Đối chiếu F1.com' : 'Check F1.com'} <ExternalLink size={14} aria-hidden="true" />
          </a>
          <Link to={`/season/${season}?tab=results`}>{lang === 'vi' ? 'Kết quả chặng đua' : 'Race results'} →</Link>
          <Link to={`/season/${season}?tab=${isDrivers ? 'teams' : 'drivers'}`}>
            {lang === 'vi' ? (isDrivers ? 'Xem đội đua' : 'Xem tay đua') : (isDrivers ? 'Explore teams' : 'Explore drivers')} →
          </Link>
        </div>
      </footer>

      {season === 2026 ? <p className="p5-portrait-credit">{lang === 'vi' ? 'Chân dung và xe 2026: ảnh concept do chủ sở hữu cung cấp · chờ duyệt hình' : '2026 portraits and cars: owner-provided concept artwork · pending visual review'}</p> : <p className="p5-portrait-credit">
        {lang === 'vi' ? 'Chân dung' : 'Portraits'}: Wikimedia Commons ·{' '}
        {Object.values(DRIVER_PORTRAIT_CREDIT)
          .slice(0, 4)
          .map((credit, index) => (
            <span key={credit.sourcePage}>
              {index > 0 ? ', ' : ''}
              <a href={credit.sourcePage} target="_blank" rel="noopener noreferrer">{credit.credit}</a>
            </span>
          ))}{' '}
        {lang === 'vi' ? 'và các tác giả khác' : 'and other credited authors'} ·{' '}
        <Link to="/about">{lang === 'vi' ? 'Chi tiết bản quyền' : 'Licence details'}</Link>
      </p>}

      {!rows.length && <p className="p5-empty">{lang === 'vi' ? 'Chưa có bảng xếp hạng.' : 'Standings unavailable.'}</p>}
    </section>
  );
}
