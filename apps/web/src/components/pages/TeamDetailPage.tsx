import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getCarsBySeason, resolveTechnicalHighlights } from '../../data/cars';
import { TEAMS_DATA } from '../../data/teams';
import { getTeamSeasonProfile } from '../../data/teamSeasons';
import { getSeasonDriverNumber } from '../../data/championship/raceClassificationHelper';
import { DRIVERS_DATA } from '../../data/drivers';
import { useNavigationStore } from '../../store/useNavigationStore';
import type { SeasonYear, TeamId } from '../../types';
import { getDriverCinematic } from '../../utils/driverCinematic';
import { podiumForm } from '../../utils/podiumStats';
import { TEAM_VENUE } from '../../utils/teamAtmosphere';
import { getTeamTextColor } from '../../utils/teamColors';
import { venueHeroFor, venueHeroSrcSet } from '../../utils/venueHeroes';
import { DriverRaceImage } from '../directory/CinematicImage';
import { PortraitCredits } from '../directory/DirectorySurfaces';
import { FormBadges } from '../directory/FormBadges';
import { DriverPortrait } from '../directory/DriverPortrait';
import { ExtraArtwork } from '../directory/ExtraArtwork';
import { extra2026TeamPoster } from '../../utils/extended2026Visuals';
import { teamConcept2026, teamConceptWidth2026 } from '../../utils/f1VisualAssets2026';
import { useSeasonDirectoryData } from '../directory/useSeasonDirectoryData';
import { useDirectoryReveal } from '../directory/useDirectoryReveal';
import '../directory/directory.css';

const SEASONS: SeasonYear[] = [2026, 2025, 2024];

export function TeamDetailPage() {
  const { teamId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = useNavigationStore((state) => state.lang);
  const revealRef = useDirectoryReveal<HTMLDivElement>(`${teamId ?? 'missing'}-${searchParams.get('season') ?? ''}`);
  const requested = Number(searchParams.get('season'));
  const season: SeasonYear = requested === 2025 || requested === 2024 ? requested : 2026;
  const { standings: seasonStandings, detailedResults } = useSeasonDirectoryData(season);
  const team = teamId && teamId in TEAMS_DATA ? TEAMS_DATA[teamId as TeamId] : undefined;

  if (!team) {
    return (
      <div ref={revealRef} className="p5-profile">
        <div className="p5-profile-inner">
          <div className="p5-empty-state">
            <h1>{lang === 'vi' ? 'Không tìm thấy đội đua' : 'Team not found'}</h1>
            <p>{lang === 'vi' ? 'Đội đua này không có trong dữ liệu hiện tại.' : 'This team is not in the current dataset.'}</p>
            <div className="p5-footer-links">
              <Link to="/teams">{lang === 'vi' ? 'Danh sách đội' : 'Team directory'} →</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profile = getTeamSeasonProfile(team.id, season);
  const reviewPoster = extra2026TeamPoster(team.id, season);
  const drivers = seasonStandings.drivers
    .filter((entry) => entry.teamId === team.id)
    .sort((a, b) => a.rank - b.rank);
  const constructor = seasonStandings.constructors.find((entry) => entry.teamId === team.id);
  const car = getCarsBySeason(season).find((entry) => entry.teamId === team.id);
  const leaderPoints = Math.max(
    0,
    ...seasonStandings.constructors.map((entry) => entry.points),
  );
  const gap = constructor ? Math.max(0, leaderPoints - constructor.points) : null;
  const form = podiumForm(season, drivers.map((driver) => driver.driverName), 5, detailedResults);
  const color = getTeamTextColor(team.id, true);
  const identity = {
    '--team': color,
    '--team-primary': team.primaryColor || color,
    '--team-accent': team.accentColor || color,
  } as React.CSSProperties;
  const venueId = TEAM_VENUE[team.id] || 'silverstone';
  const venue = venueHeroFor(venueId);
  const carDescription = lang === 'vi'
    ? car?.descriptionVi || car?.descriptionEn
    : car?.descriptionEn || car?.descriptionVi;
  const highlights = resolveTechnicalHighlights(car?.technicalHighlights, lang);

  return (
    <div ref={revealRef} className="p5-profile" style={identity}>
      <div className="p5-profile-inner">
        <nav className="p5-profile-top" aria-label={lang === 'vi' ? 'Điều hướng hồ sơ' : 'Profile navigation'}>
          <Link className="p5-profile-back" to={`/teams?season=${season}`}>
            ← {lang === 'vi' ? 'Đội đua' : 'Teams'}
          </Link>
          <label className="p5-season-select">
            {lang === 'vi' ? 'Mùa giải' : 'Season'}
            <select
              value={season}
              onChange={(event) => setSearchParams({ season: event.target.value })}
            >
              {SEASONS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </nav>

        <header className="p5-team-hero" data-p5-reveal>
          <div className="p5-team-hero-stage" aria-hidden="true">
            {(season === 2024 || season === 2025) ? <span className="p5-hero-media p5-generated-team-hero">{drivers.slice(0, 2).map((driver) => <DriverPortrait key={driver.driverId} season={season} driverId={driver.driverId} alt="" eager />)}</span> : <picture className="p5-hero-media">
              <source type="image/avif" srcSet={venueHeroSrcSet(venueId, 'land', 'avif')} sizes="(max-width: 900px) 100vw, 1440px" />
              <source type="image/webp" srcSet={venueHeroSrcSet(venueId, 'land', 'webp')} sizes="(max-width: 900px) 100vw, 1440px" />
              <img src={`/images/championship/venues/${venueId}-land-1600.webp`} alt="" loading="eager" decoding="async" />
            </picture>}
            {teamConcept2026(team.id, season) && <span className="p5-concept-car p5-concept-car--profile"><img src={teamConcept2026(team.id, season)} alt="" width={teamConceptWidth2026(team.id)} height={235} loading="eager" /></span>}
          </div>
          <span className="p5-hero-scrim" aria-hidden="true" />
          <div className="p5-team-hero-copy">
            <div className="p5-team-hero-kicker-row">
              <p className="p5-kicker">{season} <span aria-hidden="true">/</span> CONSTRUCTOR</p>
              <span className="p5-team-hero-rank">
                P{constructor ? String(constructor.rank).padStart(2, '0') : '—'}
              </span>
            </div>
            <h1>{team.name}</h1>
            <p className="p5-profile-subtitle">{profile?.fullName || team.fullName}</p>
            <p className="p5-profile-summary">
              {constructor
                ? lang === 'vi'
                  ? `P${constructor.rank} ở giải vô địch đội đua ${season} · ${constructor.points} điểm · ${constructor.wins} chiến thắng · ${constructor.podiums} lần podium.`
                  : `P${constructor.rank} in the ${season} constructors' championship · ${constructor.points} points · ${constructor.wins} ${constructor.wins === 1 ? 'win' : 'wins'} · ${constructor.podiums} ${constructor.podiums === 1 ? 'podium' : 'podiums'}.`
                : lang === 'vi'
                  ? `Không có dữ liệu xếp hạng ${season} cho đội này.`
                  : `No ${season} standings entry is available for this team.`}
            </p>
            {season === 2026 && <p className="p5-photo-credit p5-photo-credit-inline">{lang === 'vi' ? 'Xe minh họa 2026 · ảnh concept, chờ duyệt' : '2026 car illustration · concept artwork, pending review'}</p>}
            {(season === 2024 || season === 2025) && <p className="p5-photo-credit p5-photo-credit-inline">{lang === 'vi' ? `Chân dung AI tạo dựng · mùa ${season}` : `AI-generated portraits · ${season} season`}</p>}
            {season === 2026 && <p className="p5-photo-credit p5-photo-credit-inline">
              {lang === 'vi' ? 'Ảnh minh họa' : 'Illustrative photo'}: {venue?.place || 'Circuit atmosphere'} ·{' '}
              {venue && (
                <>
                  <a href={venue.sourcePage} target="_blank" rel="noopener noreferrer">{venue.credit}</a> · {venue.license}
                </>
              )}
            </p>}
            <div className="p5-profile-actions">
              {car && (
                <Link className="p5-cta" to={`/cars/${car.id}`}>
                  {lang === 'vi' ? 'Chi tiết xe' : 'Car detail'} →
                </Link>
              )}
              <Link className="p5-cta p5-cta--accent" to={`/season/${season}?tab=standings&category=constructors`}>
                {lang === 'vi' ? 'Bảng xếp hạng đội đua' : 'Constructor standings'} →
              </Link>
            </div>
          </div>
          <div className="p5-team-hero-lineup p5-team-hero-duo" aria-label={lang === 'vi' ? 'Tay đua của đội' : 'Team drivers'}>
            {drivers.map((driver) => {
              const number = getSeasonDriverNumber(season, driver.driverId) ?? DRIVERS_DATA[driver.driverId]?.number;
              const cinematic = getDriverCinematic(driver.driverId, season);
              return (
                <Link
                  className="p5-team-hero-driver"
                  key={driver.driverId}
                  to={`/drivers/${driver.driverId}?season=${season}`}
                >
                  <span className="p5-team-hero-driver-media">
                    <DriverPortrait
                      driverId={driver.driverId}
                      season={season}
                      alt={lang === 'vi' ? `Chân dung ${driver.driverName}` : `Portrait of ${driver.driverName}`}
                      number={number}
                      sizes="(max-width: 760px) 30vw, 11vw"
                    />
                    {cinematic && (
                      <span className="p5-team-hero-race" aria-hidden="true">
                        <DriverRaceImage
                          driverId={driver.driverId}
                          season={season}
                          alt=""
                          sizes="(max-width: 760px) 30vw, 11vw"
                        />
                      </span>
                    )}
                  </span>
                  <span className="p5-team-hero-driver-label">
                    <strong>{driver.driverCode}</strong>
                    <small>{number ? `#${number}` : driver.countryFlag}</small>
                  </span>
                </Link>
              );
            })}
          </div>
        </header>

        {reviewPoster && (
          <section className="p5-extra-review p5-extra-review--team" aria-label={lang === 'vi' ? 'Tranh concept đội đua 2026' : '2026 team concept artwork'}>
            <div className="p5-extra-review-copy">
              <p className="p5-kicker">2026 / {lang === 'vi' ? 'BỘ ẢNH CONCEPT' : 'CONCEPT ARTWORK'}</p>
              <h2>{team.name}</h2>
              <p>{lang === 'vi' ? 'Ảnh minh họa AI. Gương mặt, logo, số xe và chi tiết xe trong ảnh chưa được xác minh.' : 'AI illustration. Faces, marks, numbers and car details in the image are unverified.'}</p>
            </div>
            <figure className="p5-extra-review-grid">
              <ExtraArtwork artwork={reviewPoster} alt={lang === 'vi' ? `Tranh concept đội ${team.name}` : `${team.name} concept poster`} />
            </figure>
          </section>
        )}

        <section className="p5-stat-grid" aria-label={lang === 'vi' ? 'Thống kê mùa giải' : 'Season statistics'} data-p5-reveal>
          <div className="p5-stat-card">
            <small>{lang === 'vi' ? 'Hạng vô địch' : 'Championship'}</small>
            <strong>{constructor ? `P${constructor.rank}` : '—'}</strong>
            <span>{season} {lang === 'vi' ? 'bảng xếp hạng đội đua' : 'constructors’ standings'}</span>
          </div>
          <div className="p5-stat-card">
            <small>{lang === 'vi' ? 'Điểm' : 'Points'}</small>
            <strong>{constructor?.points ?? '—'}</strong>
            <span>{lang === 'vi' ? 'Từ dữ liệu mùa giải' : 'From the season dataset'}</span>
          </div>
          <div className="p5-stat-card">
            <small>{lang === 'vi' ? 'Chiến thắng' : 'Wins'}</small>
            <strong>{constructor?.wins ?? '—'}</strong>
            <span>{season} {lang === 'vi' ? 'mùa giải' : 'season'}</span>
          </div>
          <div className="p5-stat-card">
            <small>{lang === 'vi' ? 'Podium' : 'Podiums'}</small>
            <strong>{constructor?.podiums ?? '—'}</strong>
            <span>{season} {lang === 'vi' ? 'mùa giải' : 'season'}</span>
          </div>
        </section>

        <section className="p5-profile-section" aria-labelledby="p5-team-drivers-title">
          <div className="p5-profile-section-head" data-p5-reveal>
            <div>
              <p className="p5-kicker">{lang === 'vi' ? 'ĐỘI HÌNH' : 'LINE-UP'}</p>
              <h2 id="p5-team-drivers-title">{lang === 'vi' ? 'Tay đua của đội' : 'Team drivers'}</h2>
            </div>
            <p>{season} {lang === 'vi' ? 'bảng xếp hạng tay đua' : 'drivers’ standings'}</p>
          </div>
          {drivers.length ? (
            <div className="p5-profile-grid-2 p5-team-drivers-grid" data-p5-reveal>
              {drivers.map((driver) => {
                const number = getSeasonDriverNumber(season, driver.driverId) ?? DRIVERS_DATA[driver.driverId]?.number;
                return (
                  <Link
                    className="p5-driver-mini-card"
                    key={driver.driverId}
                    to={`/drivers/${driver.driverId}?season=${season}`}
                    style={identity}
                  >
                    <DriverPortrait
                      driverId={driver.driverId}
                      season={season}
                      alt={lang === 'vi' ? `Chân dung ${driver.driverName}` : `Portrait of ${driver.driverName}`}
                      number={number}
                      sizes="(max-width: 900px) 44vw, 22vw"
                    />
                    <span className="p5-driver-mini-body">
                      <small>P{driver.rank} · {driver.countryFlag} {driver.driverCode}</small>
                      <strong>{driver.driverName}</strong>
                      <span className="p5-driver-mini-points">
                        {driver.points} {lang === 'vi' ? 'điểm' : 'PTS'}{number ? ` · #${number}` : ''}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="p5-empty-state">
              {lang === 'vi' ? 'Chưa có đội hình trong dữ liệu mùa này.' : 'No driver line-up is available for this season.'}
            </p>
          )}
        </section>

        <section className="p5-profile-section" aria-labelledby="p5-team-overview-title">
          <div className="p5-profile-section-head" data-p5-reveal>
            <div>
              <p className="p5-kicker">{lang === 'vi' ? 'TỔNG QUAN MÙA GIẢI' : 'SEASON OVERVIEW'}</p>
              <h2 id="p5-team-overview-title">{lang === 'vi' ? 'Đội trong mùa' : 'Season snapshot'}</h2>
            </div>
            <p>{lang === 'vi' ? 'Chỉ dữ liệu đã có trong kho dự án' : 'Verified project data only'}</p>
          </div>
          <dl className="p5-facts" data-p5-reveal>
            <div><dt>{lang === 'vi' ? 'Khoảng cách tới đầu' : 'Gap to leader'}</dt><dd>{gap === null ? '—' : gap === 0 ? (lang === 'vi' ? 'Dẫn đầu' : 'Leader') : `−${gap} ${lang === 'vi' ? 'điểm' : 'pts'}`}</dd></div>
            <div><dt>{lang === 'vi' ? 'Động cơ' : 'Power unit'}</dt><dd>{profile?.powerUnit || team.powerUnit}</dd></div>
            <div><dt>{lang === 'vi' ? 'Cơ sở' : 'Base'}</dt><dd>{profile?.base || team.base}</dd></div>
            <div><dt>{lang === 'vi' ? 'Lãnh đạo đội' : 'Team lead'}</dt><dd>{profile ? `${profile.teamLead} · ${profile.teamLeadTitle}` : team.teamPrincipal}</dd></div>
            <div><dt>{lang === 'vi' ? 'Tay đua trong dữ liệu' : 'Drivers in dataset'}</dt><dd>{drivers.length}</dd></div>
            <div><dt>{lang === 'vi' ? 'Mùa giải' : 'Season'}</dt><dd>{season}</dd></div>
          </dl>
          <div className="p5-form-row" data-p5-reveal>
            <span>{lang === 'vi' ? 'Chuỗi 5 vòng gần nhất' : 'Last five rounds'}</span>
            <FormBadges entries={form} lang={lang} scope="team" />
          </div>
          <p className="p5-spec-note">
            {lang === 'vi'
              ? 'Chuỗi podium lấy từ kết quả đầy đủ khi có, nếu không thì từ tóm tắt top 3 đã công bố cho một trong hai tay đua. Dấu – nghĩa là không có podium ở vòng đó hoặc không có trong tóm tắt, không phải kết quả toàn bộ lưới. Kho dữ liệu hiện tại không có năm thành lập, quy mô nhà máy hoặc thành tích lịch sử nên các mục đó không được hiển thị.'
              : 'Podium form uses full classifications where available, falling back to published top-three summaries for either driver. “–” means no podium in that round or absent from the summary, not a full-grid result. The current dataset does not contain founding year, factory headcount or historical honours, so those are not shown.'}
          </p>
        </section>

        <section className="p5-profile-section" aria-labelledby="p5-team-car-title">
          <div className="p5-profile-section-head" data-p5-reveal>
            <div>
              <p className="p5-kicker">{lang === 'vi' ? 'KỸ THUẬT' : 'TECHNICAL'}</p>
              <h2 id="p5-team-car-title">{lang === 'vi' ? 'Thông số xe' : 'Car specification'}{car ? ` · ${car.name}` : ''}</h2>
            </div>
            {car && <p>{car.shortName}</p>}
          </div>
          {car ? (
            <div className="p5-spec-grid" data-p5-reveal>
              <div className="p5-spec-panel">
                <dl className="p5-spec-list">
                  <div><dt>{lang === 'vi' ? 'Động cơ' : 'Power unit'}</dt><dd>{car.powerUnit}</dd></div>
                  {car.designer && <div><dt>{lang === 'vi' ? 'Thiết kế' : 'Designer'}</dt><dd>{car.designer}</dd></div>}
                  {car.officialSpecs && (
                    <>
                      <div><dt>{lang === 'vi' ? 'Khối lượng tối thiểu' : 'Minimum weight'}</dt><dd>{car.officialSpecs.minWeightKg} kg</dd></div>
                      <div><dt>{lang === 'vi' ? 'Cấu hình động cơ' : 'Engine'}</dt><dd>{car.officialSpecs.engineConfig}</dd></div>
                      <div><dt>{lang === 'vi' ? 'Dung tích' : 'Displacement'}</dt><dd>{car.officialSpecs.displacementLiters} L</dd></div>
                      <div><dt>{lang === 'vi' ? 'Hộp số' : 'Gearbox'}</dt><dd>{car.officialSpecs.gearbox}</dd></div>
                      <div><dt>{lang === 'vi' ? 'Vành' : 'Wheels'}</dt><dd>{car.officialSpecs.wheelSizeInch} in</dd></div>
                      <div><dt>{lang === 'vi' ? 'Dung tích nhiên liệu' : 'Fuel capacity'}</dt><dd>{car.officialSpecs.fuelCapacityKg} kg</dd></div>
                    </>
                  )}
                </dl>
                {carDescription && <p className="p5-spec-note">{carDescription}</p>}
              </div>
              <div className="p5-spec-panel">
                <ul className="p5-spec-highlights">
                  {highlights?.frontSuspension && <li><strong>{lang === 'vi' ? 'Treo trước' : 'Front suspension'}</strong>{highlights.frontSuspension}</li>}
                  {highlights?.rearSuspension && <li><strong>{lang === 'vi' ? 'Treo sau' : 'Rear suspension'}</strong>{highlights.rearSuspension}</li>}
                  {highlights?.aeroPhilosophy && <li><strong>{lang === 'vi' ? 'Khí động học' : 'Aerodynamics'}</strong>{highlights.aeroPhilosophy}</li>}
                  {highlights?.groundEffectNotes && <li><strong>{lang === 'vi' ? 'Hiệu ứng mặt đất' : 'Ground effect'}</strong>{highlights.groundEffectNotes}</li>}
                  {highlights?.chassisConstruction && <li><strong>{lang === 'vi' ? 'Khung xe' : 'Chassis'}</strong>{highlights.chassisConstruction}</li>}
                </ul>
              </div>
            </div>
          ) : (
            <p className="p5-empty-state">
              {lang === 'vi' ? 'Chưa có thông số xe cho mùa này.' : 'No car specification is available for this season.'}
            </p>
          )}
          <p className="p5-spec-note">
            {lang === 'vi'
              ? 'Thông số lấy từ bộ dữ liệu xe của dự án. Kích thước ngoài dữ liệu và lịch sử đội đua không được suy diễn.'
              : 'Specifications come from the project’s car dataset. Aerodynamic and ground-effect notes are translated from the Vietnamese dataset entries; dimensions and team history are not invented.'}
          </p>
        </section>

        <PortraitCredits lang={lang} driverIds={drivers.map((driver) => driver.driverId)} season={season} />

        <div className="p5-footer-links p5-gallery-links">
          {car && <Link to={`/cars/${car.id}`}>{lang === 'vi' ? 'Chi tiết xe' : 'Car detail'} →</Link>}
          <Link to={`/season/${season}?tab=standings&category=constructors`}>{lang === 'vi' ? 'Bảng xếp hạng đội đua' : 'Constructor standings'} →</Link>
          <Link to={`/season/${season}?tab=results`}>{lang === 'vi' ? 'Kết quả chặng đua' : 'Race results'} →</Link>
          <Link to={`/teams?season=${season}`}>{lang === 'vi' ? 'Tất cả đội đua' : 'All teams'} →</Link>
        </div>
      </div>
    </div>
  );
}
