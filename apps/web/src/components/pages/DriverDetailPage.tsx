import { Link, useParams, useSearchParams } from 'react-router-dom';
import { DRIVERS_DATA } from '../../data/drivers';
import { TEAMS_DATA } from '../../data/teams';
import { getSeasonDriverNumber } from '../../data/championship/raceClassificationHelper';
import { getTeamSeasonProfile } from '../../data/teamSeasons';
import { useNavigationStore } from '../../store/useNavigationStore';
import type { DriverStanding, SeasonYear } from '../../types';
import { DRIVER_PORTRAIT_CREDIT } from '../../utils/driverPortraits';
import {
  driverPodiumResults,
  podiumForm,
} from '../../utils/podiumStats';
import { getTeamTextColor } from '../../utils/teamColors';
import { FormBadges } from '../directory/FormBadges';
import { DriverPortrait } from '../directory/DriverPortrait';
import { ExtraArtwork } from '../directory/ExtraArtwork';
import { extra2026Celebration, extra2026DriverPoster } from '../../utils/extended2026Visuals';
import { useDirectoryRacesBySeason, useDirectoryStandingsBySeason } from '../directory/useSeasonDirectoryData';
import { useDirectoryReveal } from '../directory/useDirectoryReveal';
import '../directory/directory.css';

const SEASONS: SeasonYear[] = [2026, 2025, 2024];

export function DriverDetailPage() {
  const { driverId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = useNavigationStore((state) => state.lang);
  const revealRef = useDirectoryReveal<HTMLDivElement>(`${driverId ?? 'missing'}-${searchParams.get('season') ?? ''}`);
  const standingsBySeason = useDirectoryStandingsBySeason();
  const racesBySeason = useDirectoryRacesBySeason();
  const driver = driverId ? DRIVERS_DATA[driverId] : undefined;
  const entries: Array<DriverStanding & { season: SeasonYear }> = driverId
    ? SEASONS.flatMap((season) =>
      standingsBySeason[season].drivers
        .filter((row) => row.driverId === driverId)
        .map((row) => ({ ...row, season })),
    )
    : [];
  const requested = Number(searchParams.get('season'));
  const entry = entries.find((row) => row.season === requested) ?? entries[0];

  if (!driver && !entry) {
    return (
      <div ref={revealRef} className="p5-profile">
        <div className="p5-profile-inner">
          <div className="p5-empty-state">
            <h1>{lang === 'vi' ? 'Không tìm thấy tay đua' : 'Driver not found'}</h1>
            <p>{lang === 'vi' ? 'Tay đua này không có trong dữ liệu hiện tại.' : 'This driver is not in the current dataset.'}</p>
            <div className="p5-footer-links">
              <Link to="/drivers">{lang === 'vi' ? 'Danh sách tay đua' : 'Driver directory'} →</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const season: SeasonYear = entry?.season ?? 2026;
  const reviewPoster = driverId ? extra2026DriverPoster(driverId, season) : undefined;
  const reviewCelebration = driverId ? extra2026Celebration(driverId, season) : undefined;
  const teamId = entry?.teamId ?? driver?.teamId;
  const team = teamId ? TEAMS_DATA[teamId] : undefined;
  const teamProfile = teamId ? getTeamSeasonProfile(teamId, season) : undefined;
  const color = teamId ? getTeamTextColor(teamId, true) : '#a4adb5';
  const name = entry?.driverName ?? driver?.name ?? '';
  const number = driverId ? getSeasonDriverNumber(season, driverId) ?? driver?.number : driver?.number;
  const country = driver?.country || (lang === 'vi' ? 'Quốc tịch chưa có dữ liệu' : 'Nationality unavailable');
  const flag = driver?.flagEmoji || entry?.countryFlag || '';
  const teamName = entry?.teamName ?? team?.name ?? '';
  const constructor = teamId
    ? standingsBySeason[season].constructors.find((row) => row.teamId === teamId)
    : undefined;
  const teammate = teamId
    ? standingsBySeason[season].drivers
      .filter((row) => row.teamId === teamId && row.driverId !== driverId)
      .sort((a, b) => a.rank - b.rank)[0]
    : undefined;
  const teammateNumber = teammate ? getSeasonDriverNumber(season, teammate.driverId) ?? DRIVERS_DATA[teammate.driverId]?.number : undefined;
  const seasonRaces = racesBySeason[season];
  const form = podiumForm(season, [name], 5, seasonRaces);
  const results = driverPodiumResults(season, [name], 5, seasonRaces);
  const credit = driverId ? DRIVER_PORTRAIT_CREDIT[driverId] : undefined;
  const identity = {
    '--team': color,
    '--team-primary': team?.primaryColor || color,
    '--team-accent': team?.accentColor || color,
  } as React.CSSProperties;
  const rankLabel = entry ? `P${entry.rank}` : '—';

  return (
    <div ref={revealRef} className="p5-profile" style={identity}>
      <div className="p5-profile-inner">
        <nav className="p5-profile-top" aria-label={lang === 'vi' ? 'Điều hướng hồ sơ' : 'Profile navigation'}>
          <Link className="p5-profile-back" to={`/drivers${entries.length ? `?season=${season}` : ''}`}>
            ← {lang === 'vi' ? 'Tay đua' : 'Drivers'}
          </Link>
          {entries.length > 0 && (
            <label className="p5-season-select">
              {lang === 'vi' ? 'Mùa giải' : 'Season'}
              <select
                value={season}
                onChange={(event) => setSearchParams({ season: event.target.value })}
              >
                {entries.map((row) => (
                  <option key={row.season} value={row.season}>{row.season}</option>
                ))}
              </select>
            </label>
          )}
        </nav>

        <div className="p5-profile-stage">
          <header className={`p5-profile-hero${reviewPoster ? ' p5-profile-hero--poster' : ''}`} data-p5-reveal>
            <span className="p5-profile-number" aria-hidden="true">{number ?? '—'}</span>
            <div className="p5-profile-portrait" data-mode="portrait">
              <span className="p5-profile-portrait-still">
                {reviewPoster ? (
                  <ExtraArtwork artwork={reviewPoster} className="p5-profile-poster" alt={lang === 'vi' ? `Poster concept 2026 của ${name}` : `${name} 2026 concept poster`} eager />
                ) : (
                  <DriverPortrait
                    driverId={driverId ?? ''}
                    season={season}
                    alt={lang === 'vi' ? `Chân dung ${name}` : `Portrait of ${name}`}
                    number={number}
                    sizes="(max-width: 760px) 64vw, 54vw"
                    eager
                  />
                )}
              </span>
            </div>
            <div className="p5-profile-copy">
              <p className="p5-kicker">{season} <span aria-hidden="true">/</span> {teamName}</p>
              <h1>{name}</h1>
              <p className="p5-profile-subtitle">
                {flag} {country}{number ? ` · #${number}` : ''}
              </p>
              <div className="p5-profile-actions">
                {teamId && (
                  <Link className="p5-cta" to={`/teams/${teamId}?season=${season}`}>
                    {lang === 'vi' ? 'Hồ sơ đội đua' : 'Team profile'} →
                  </Link>
                )}
                <Link className="p5-cta p5-cta--accent" to={`/season/${season}?tab=standings&category=drivers`}>
                  {lang === 'vi' ? 'Bảng xếp hạng' : 'Standings'} →
                </Link>
              </div>
            </div>
            {season === 2026 ? <p className="p5-profile-credit">{lang === 'vi' ? 'Ảnh minh họa AI 2026' : '2026 AI illustration'}</p> : credit && (
              <p className="p5-profile-credit">
                {lang === 'vi' ? 'Chân dung' : 'Portrait'}:{' '}
                <a href={credit.sourcePage} target="_blank" rel="noopener noreferrer">{credit.credit}</a>{' '}
                · {credit.license}
              </p>
            )}
          </header>

          {reviewCelebration && driverId && (
            <section className="p5-profile-action-section" aria-labelledby="p5-profile-action-title">
              <figure className="p5-profile-action-media">
                <ExtraArtwork
                  artwork={reviewCelebration}
                  className="p5-profile-celebration"
                  alt={lang === 'vi' ? `Ảnh concept ăn mừng của ${name}` : `${name} celebration concept`}
                  sizes="100vw"
                />
              </figure>
              <div className="p5-profile-action-copy">
                <span className="p5-profile-action-number" aria-hidden="true">{number ?? '—'}</span>
                <p className="p5-kicker">2026 / CONCEPT</p>
                <h2 id="p5-profile-action-title">{lang === 'vi' ? 'Khoảnh khắc ăn mừng' : 'Celebration'}</h2>
                <p className="p5-profile-action-credit">{lang === 'vi' ? 'Ảnh minh họa AI · không xác nhận kết quả chặng đua' : 'AI illustration · no race result implied'}</p>
              </div>
            </section>
          )}
        </div>

        {entry ? (
          <section className="p5-stat-grid" aria-label={lang === 'vi' ? 'Thống kê mùa giải' : 'Season statistics'} data-p5-reveal>
            <div className="p5-stat-card">
              <small>{lang === 'vi' ? 'Hạng vô địch' : 'Championship'}</small>
              <strong>{rankLabel}</strong>
            </div>
            <div className="p5-stat-card">
              <small>{lang === 'vi' ? 'Điểm' : 'Points'}</small>
              <strong>{entry.points}</strong>
            </div>
            <div className="p5-stat-card">
              <small>{lang === 'vi' ? 'Chiến thắng' : 'Wins'}</small>
              <strong>{entry.wins}</strong>
            </div>
            <div className="p5-stat-card">
              <small>{lang === 'vi' ? 'Podium' : 'Podiums'}</small>
              <strong>{entry.podiums}</strong>
            </div>
          </section>
        ) : (
          <p className="p5-empty-state" data-p5-reveal>
            {lang === 'vi'
              ? `Chưa có dữ liệu xếp hạng cho ${name} trong dữ liệu hiện tại.`
              : `No standings entry is available for ${name} in the current dataset.`}
          </p>
        )}

        <section id="p5-driver-results" className="p5-profile-section" aria-labelledby="p5-driver-results-title">
          <div className="p5-profile-section-head" data-p5-reveal>
            <div>
              <p className="p5-kicker">{lang === 'vi' ? '5 VÒNG GẦN NHẤT' : 'LAST FIVE ROUNDS'}</p>
              <h2 id="p5-driver-results-title">{lang === 'vi' ? 'Chuỗi podium' : 'Podium form'}</h2>
            </div>
            <FormBadges entries={form} lang={lang} />
          </div>
          {results.length > 0 ? (
            <div
              className="p5-result-list"
              role="table"
              aria-label={lang === 'vi' ? 'Kết quả podium 5 vòng gần nhất' : 'Podium results for the last five rounds'}
              data-p5-reveal
            >
              <div className="p5-result-row p5-result-head" role="row">
                <span role="columnheader">Rd</span>
                <span role="columnheader">{lang === 'vi' ? 'Chặng đua' : 'Grand Prix'}</span>
                <span role="columnheader">{lang === 'vi' ? 'Đường đua' : 'Circuit'}</span>
                <span role="columnheader">{lang === 'vi' ? 'Thời gian' : 'Gap'}</span>
                <span role="columnheader">{lang === 'vi' ? 'Kết quả' : 'Result'}</span>
              </div>
              {results.map((result) => {
                const medalNote = result.position
                  ? `${result.points} ${lang === 'vi' ? 'điểm' : 'points'}`
                  : result.source === 'detailed'
                    ? lang === 'vi' ? 'Không có podium ở vòng này' : 'No podium in this round'
                    : lang === 'vi'
                      ? 'Không có trong tóm tắt top 3; không phải kết quả toàn bộ lưới'
                      : 'Not in the published top-three summary; not a full-grid result';
                return (
                  <div
                    key={result.round}
                    className="p5-result-row"
                    role="row"
                    data-medal={result.position ?? undefined}
                  >
                    <span className="p5-result-round" role="cell">R{result.round}</span>
                    <span className="p5-result-name" role="cell">{result.grandPrix}</span>
                    <span className="p5-result-circuit" role="cell">{result.circuit}</span>
                    <span className="p5-result-gap" role="cell">{result.position ? result.gap : '—'}</span>
                    <span
                      className="p5-result-medal"
                      role="cell"
                      data-medal={result.position ?? undefined}
                      title={medalNote}
                    >
                      {result.position ? `P${result.position} · ${result.points}` : '—'}
                      {!result.position && <span className="sr-only">{medalNote}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="p5-empty-state">
              {lang === 'vi' ? 'Chưa có tóm tắt podium cho mùa này.' : 'No podium summaries are available for this season.'}
            </p>
          )}
          <details className="p5-spec-note p5-profile-data-note">
            <summary>{lang === 'vi' ? 'Cách đọc dữ liệu podium' : 'How podium data is read'}</summary>
            <p>
              {lang === 'vi'
                ? 'Chuỗi này dùng kết quả đầy đủ khi có, nếu không thì dùng tóm tắt top 3 đã công bố. Dấu – nghĩa là không có podium ở vòng đó (dữ liệu đầy đủ) hoặc không có trong tóm tắt top 3 (chỉ có tóm tắt), không phải kết quả toàn bộ lưới. Số sau dấu chấm là điểm podium.'
                : 'This sequence uses full classifications where available, falling back to published top-three summaries. “–” means no podium in that round (full data) or absent from the podium summary (summary-only), not a full-grid result. The number after the dot is podium points.'}
            </p>
          </details>
        </section>

        <section className="p5-profile-section" aria-labelledby="p5-driver-team-title">
          <div className="p5-profile-section-head" data-p5-reveal>
            <div>
              <p className="p5-kicker">{lang === 'vi' ? 'BỐI CẢNH ĐỘI ĐUA' : 'TEAM CONTEXT'}</p>
              <h2 id="p5-driver-team-title">{lang === 'vi' ? 'Đội & đồng đội' : 'Team & teammate'}</h2>
            </div>
          </div>
          <div className="p5-profile-grid-2" data-p5-reveal>
            {team && teamId ? (
              <Link
                className="p5-team-panel"
                to={`/teams/${teamId}?season=${season}`}
                style={identity}
              >
                <p className="p5-kicker">
                  {season} <span aria-hidden="true">·</span> {constructor ? `P${constructor.rank}` : '—'}
                </p>
                <h3>{teamProfile?.fullName || teamName}</h3>
                <p>
                  {teamProfile?.base || team.base}
                  {teamProfile?.powerUnit ? ` · ${teamProfile.powerUnit}` : ''}
                </p>
                <div className="p5-team-panel-stats">
                  <div><small>{lang === 'vi' ? 'Điểm' : 'Points'}</small><strong>{constructor?.points ?? '—'}</strong></div>
                  <div><small>{lang === 'vi' ? 'Thắng' : 'Wins'}</small><strong>{constructor?.wins ?? '—'}</strong></div>
                  <div><small>{lang === 'vi' ? 'Podium' : 'Podiums'}</small><strong>{constructor?.podiums ?? '—'}</strong></div>
                </div>
                <span className="p5-cta">{lang === 'vi' ? 'Hồ sơ đội đua' : 'Team profile'} →</span>
              </Link>
            ) : (
              <p className="p5-empty-state">{lang === 'vi' ? 'Không có đội đua trong dữ liệu mùa này.' : 'No team is available for this season.'}</p>
            )}

            {teammate ? (
              <Link
                className="p5-driver-mini-card"
                to={`/drivers/${teammate.driverId}?season=${season}`}
                style={{
                  '--team': getTeamTextColor(teammate.teamId, true),
                  '--team-primary': TEAMS_DATA[teammate.teamId]?.primaryColor || getTeamTextColor(teammate.teamId, true),
                } as React.CSSProperties}
              >
                <DriverPortrait
                  driverId={teammate.driverId}
                  season={season}
                  alt={lang === 'vi' ? `Chân dung ${teammate.driverName}` : `Portrait of ${teammate.driverName}`}
                  number={teammateNumber}
                  sizes="(max-width: 900px) 44vw, 22vw"
                />
                <span className="p5-driver-mini-body">
                  <small>{lang === 'vi' ? 'ĐỒNG ĐỘI' : 'TEAMMATE'} · P{teammate.rank}</small>
                  <strong>{teammate.driverName}</strong>
                  <span className="p5-driver-mini-points">
                    {teammate.points} {lang === 'vi' ? 'điểm' : 'PTS'} · {teammate.countryFlag} {teammate.driverCode}
                    {teammateNumber ? ` · #${teammateNumber}` : ''}
                  </span>
                </span>
              </Link>
            ) : (
              <p className="p5-empty-state">{lang === 'vi' ? 'Không có đồng đội trong dữ liệu mùa này.' : 'No teammate is listed for this season.'}</p>
            )}
          </div>
        </section>

        <div className="p5-footer-links p5-gallery-links">
          <Link to={`/season/${season}?tab=results`}>{lang === 'vi' ? 'Kết quả chặng đua' : 'Race results'} →</Link>
          <Link to={`/season/${season}?tab=standings&category=drivers`}>{lang === 'vi' ? 'Bảng xếp hạng tay đua' : 'Driver standings'} →</Link>
          <Link to={`/drivers?season=${season}`}>{lang === 'vi' ? 'Tất cả tay đua' : 'All drivers'} →</Link>
        </div>
      </div>
    </div>
  );
}
