import { Link, useParams, useSearchParams } from 'react-router-dom';
import { DRIVERS_DATA } from '../../data/drivers';
import { TEAMS_DATA } from '../../data/teams';
import { STANDINGS_DATA } from '../../data/championship';
import { getSeasonDriverNumber } from '../../data/championship/raceClassificationHelper';
import { useNavigationStore } from '../../store/useNavigationStore';
import type { SeasonYear } from '../../types';
import { getTeamTextColor } from '../../utils/teamColors';
import '../championship/championshipC11.css';

const SEASONS: SeasonYear[] = [2026, 2025, 2024];

export function DriverDetailPage() {
  const { driverId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = useNavigationStore((state) => state.lang);
  const driver = driverId ? DRIVERS_DATA[driverId] : undefined;
  const entries = driverId ? SEASONS.flatMap((season) => STANDINGS_DATA[season].drivers.filter((row) => row.driverId === driverId).map((row) => ({ ...row, season }))) : [];
  const requested = Number(searchParams.get('season'));
  const entry = entries.find((row) => row.season === requested) ?? entries[0];
  if (!driver && !entry) return <main className="c11-profile"><div className="c11-profile-inner"><h1>{lang === 'vi' ? 'Không tìm thấy tay đua' : 'Driver not found'}</h1><div className="c11-profile-links"><Link to="/drivers">{lang === 'vi' ? 'Danh sách tay đua' : 'Driver directory'} →</Link></div></div></main>;

  const season = entry?.season ?? 2026;
  const teamId = entry?.teamId ?? driver?.teamId;
  const team = teamId ? TEAMS_DATA[teamId] : undefined;
  const color = teamId ? getTeamTextColor(teamId, true) : '#a4adb5';
  const name = entry?.driverName ?? driver?.name ?? '';
  const number = driverId ? getSeasonDriverNumber(season, driverId) : undefined;
  return <main className="c11-profile" style={{ '--team-color': color } as React.CSSProperties}><div className="c11-profile-inner">
    <nav className="c11-profile-top" aria-label={lang === 'vi' ? 'Điều hướng hồ sơ' : 'Profile navigation'}><Link to={`/season/${season}?tab=drivers`}>← {lang === 'vi' ? 'Tay đua' : 'Drivers'}</Link>{entries.length > 0 && <label>{lang === 'vi' ? 'Mùa giải' : 'Season'} <select value={season} onChange={(event) => setSearchParams({ season: event.target.value })}>{entries.map((row) => <option key={row.season} value={row.season}>{row.season}</option>)}</select></label>}</nav>
    <header className="c11-profile-hero"><h1>{name}</h1><p>{number ? `#${number} · ` : ''}{driver?.country || entry?.countryFlag || (lang === 'vi' ? 'Quốc tịch chưa có dữ liệu' : 'Nationality unavailable')}{entry ? ` · ${entry.teamName} · ${season}` : ''}</p></header>
    <dl className="c11-profile-facts"><div><dt>{lang === 'vi' ? 'Số xe' : 'Racing number'}</dt><dd>{number ? `#${number}` : '—'}</dd></div><div><dt>{lang === 'vi' ? 'Quốc tịch' : 'Nationality'}</dt><dd>{driver?.country || '—'}</dd></div><div><dt>{lang === 'vi' ? 'Đội mùa này' : 'Season team'}</dt><dd>{entry?.teamName || (lang === 'vi' ? 'Chưa có dữ liệu' : 'Unavailable')}</dd></div></dl>
    {team && entry && <section aria-labelledby="c11-driver-team"><h2 id="c11-driver-team">{lang === 'vi' ? 'Đội đua' : 'Constructor'}</h2><div className="c11-profile-grid"><Link className="c11-intro-card" to={`/teams/${team.id}?season=${season}`} style={{ '--team-color': color } as React.CSSProperties}><span>{season} · {team.base}</span><strong>{entry.teamName}</strong><small className="c11-card-action">{lang === 'vi' ? 'Hồ sơ đội đua' : 'Team profile'} →</small></Link></div></section>}
    <div className="c11-profile-links"><Link to={`/season/${season}?tab=results`}>{lang === 'vi' ? 'Kết quả chặng đua' : 'Race results'} →</Link><Link to={`/season/${season}?tab=standings&category=drivers`}>{lang === 'vi' ? 'Bảng xếp hạng tay đua' : 'Driver standings'} →</Link></div>
  </div></main>;
}
