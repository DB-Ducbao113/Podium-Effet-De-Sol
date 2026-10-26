import { Link, useParams, useSearchParams } from 'react-router-dom';
import { TEAMS_DATA } from '../../data/teams';
import { STANDINGS_DATA } from '../../data/championship';
import { getTeamSeasonProfile } from '../../data/teamSeasons';
import { getCarsBySeason } from '../../data/cars';
import { useNavigationStore } from '../../store/useNavigationStore';
import type { SeasonYear, TeamId } from '../../types';
import { getTeamTextColor } from '../../utils/teamColors';
import '../championship/championshipC11.css';

export function TeamDetailPage() {
  const { teamId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = useNavigationStore((state) => state.lang);
  const requested = Number(searchParams.get('season'));
  const season: SeasonYear = requested === 2024 || requested === 2025 || requested === 2026 ? requested : 2026;
  const team = teamId && teamId in TEAMS_DATA ? TEAMS_DATA[teamId as TeamId] : undefined;

  if (!team) return <main className="c11-profile"><div className="c11-profile-inner">
    <h1>{lang === 'vi' ? 'Không tìm thấy đội đua' : 'Team not found'}</h1>
    <div className="c11-profile-links"><Link to="/teams">{lang === 'vi' ? 'Danh sách đội' : 'Team directory'} →</Link></div>
  </div></main>;

  const profile = getTeamSeasonProfile(team.id, season);
  const drivers = STANDINGS_DATA[season].drivers.filter((entry) => entry.teamId === team.id);
  const cars = getCarsBySeason(season).filter((car) => car.teamId === team.id);
  const color = getTeamTextColor(team.id, true);

  return <main className="c11-profile" style={{ '--team-color': color } as React.CSSProperties}>
    <div className="c11-profile-inner">
      <nav className="c11-profile-top" aria-label={lang === 'vi' ? 'Điều hướng hồ sơ' : 'Profile navigation'}>
        <Link to={`/season/${season}?tab=teams`}>← {lang === 'vi' ? 'Đội đua' : 'Teams'}</Link>
        <label>{lang === 'vi' ? 'Mùa giải' : 'Season'} <select value={season} onChange={(event) => setSearchParams({ season: event.target.value })}>{([2026, 2025, 2024] as SeasonYear[]).map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
      </nav>
      <header className="c11-profile-hero">
        <h1>{profile?.fullName || team.fullName}</h1>
        <p>{profile ? `${profile.base} · ${season}` : (lang === 'vi' ? `Đội này không có hồ sơ mùa ${season} trong dữ liệu hiện có.` : `No ${season} profile is available for this team.`)}</p>
      </header>
      {profile && <>
        <dl className="c11-profile-facts">
          <div><dt>{lang === 'vi' ? 'Cơ sở' : 'Base'}</dt><dd>{profile.base}</dd></div>
          <div><dt>{profile.teamLeadTitle}</dt><dd>{profile.teamLead}</dd></div>
          <div><dt>{lang === 'vi' ? 'Động cơ' : 'Power unit'}</dt><dd>{profile.powerUnit}</dd></div>
        </dl>
        <section aria-labelledby="c11-team-drivers">
          <h2 id="c11-team-drivers">{lang === 'vi' ? 'Tay đua của đội' : 'Team drivers'}</h2>
          {drivers.length ? <div className="c11-profile-grid">{drivers.map((driver) =>
            <Link className="c11-intro-card" key={driver.driverId} to={`/drivers/${driver.driverId}?season=${season}`} style={{ '--team-color': color } as React.CSSProperties}>
              <span>{driver.driverCode} · {driver.countryFlag}</span>
              <strong>{driver.driverName}</strong>
              <small className="c11-card-action">{lang === 'vi' ? 'Hồ sơ tay đua' : 'Driver profile'} →</small>
            </Link>)}</div> : <p>{lang === 'vi' ? 'Chưa có đội hình trong dữ liệu mùa này.' : 'No driver line-up is available for this season.'}</p>}
        </section>
      </>}
      <div className="c11-profile-links">
        {cars.map((car) => <Link key={car.id} to={`/cars/${car.id}`}>{car.name} →</Link>)}
        <Link to={`/season/${season}?tab=standings&category=constructors`}>{lang === 'vi' ? 'Bảng xếp hạng đội đua' : 'Constructor standings'} →</Link>
        <Link to={`/season/${season}?tab=results`}>{lang === 'vi' ? 'Kết quả chặng đua' : 'Race results'} →</Link>
      </div>
    </div>
  </main>;
}
