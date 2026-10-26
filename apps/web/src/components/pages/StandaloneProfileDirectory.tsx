import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { STANDINGS_DATA } from '../../data/championship';
import { getSeasonDriverNumber } from '../../data/championship/raceClassificationHelper';
import { DRIVERS_DATA } from '../../data/drivers';
import { getTeamSeasonProfile } from '../../data/teamSeasons';
import { useNavigationStore } from '../../store/useNavigationStore';
import type { SeasonYear } from '../../types';
import { getTeamTextColor } from '../../utils/teamColors';
import '../championship/championshipC11.css';

export function StandaloneProfileDirectory({ kind, initialSeason = 2026, hideHeader = false }: { kind: 'teams' | 'drivers'; initialSeason?: SeasonYear; hideHeader?: boolean }) {
  const lang = useNavigationStore((state) => state.lang);
  const [season, setSeason] = useState<SeasonYear>(initialSeason);
  const [query, setQuery] = useState('');
  useEffect(() => setSeason(initialSeason), [initialSeason]);
  const isDrivers = kind === 'drivers';
  const normalized = query.trim().toLocaleLowerCase();
  const teams = [...STANDINGS_DATA[season].constructors].sort((a, b) => a.teamName.localeCompare(b.teamName)).filter((team) => {
    const profile = getTeamSeasonProfile(team.teamId, season);
    return !normalized || [team.teamName, profile?.fullName, profile?.base, profile?.powerUnit].some((value) => value?.toLocaleLowerCase().includes(normalized));
  });
  const drivers = [...STANDINGS_DATA[season].drivers].sort((a, b) => a.driverName.localeCompare(b.driverName)).filter((driver) => !normalized || [driver.driverName, driver.teamName, DRIVERS_DATA[driver.driverId]?.country].some((value) => value?.toLocaleLowerCase().includes(normalized)));
  return <main className="c11-standalone-directory"><div className="c11-standalone-inner">
    {!hideHeader && <header><h1>{isDrivers ? (lang === 'vi' ? 'Tay đua' : 'Drivers') : (lang === 'vi' ? 'Đội đua' : 'Teams')}</h1><p>{lang === 'vi' ? `Hồ sơ ${isDrivers ? 'tay đua' : 'đội đua'} mùa ${season}.` : `${season} ${isDrivers ? 'driver' : 'constructor'} profiles.`}</p></header>}
    <div className="c11-directory-controls"><label>{lang === 'vi' ? 'Tìm kiếm' : 'Search'}<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lang === 'vi' ? 'Tên, đội hoặc địa điểm' : 'Name, team or base'} /></label>{!hideHeader && <label>{lang === 'vi' ? 'Mùa giải' : 'Season'}<select value={season} onChange={(event) => setSeason(Number(event.target.value) as SeasonYear)}>{([2026, 2025, 2024] as SeasonYear[]).map((year) => <option key={year} value={year}>{year}</option>)}</select></label>}</div>
    {isDrivers ? drivers.length ? <div className="c11-profile-grid">{drivers.map((driver) => {
      const profile = DRIVERS_DATA[driver.driverId];
      const number = getSeasonDriverNumber(season, driver.driverId);
      return <Link className="c11-intro-card" key={driver.driverId} to={`/drivers/${driver.driverId}?season=${season}`} style={{ '--team-color': getTeamTextColor(driver.teamId, true) } as React.CSSProperties}><span>{number ? `#${number} · ` : ''}{profile?.country || driver.countryFlag}</span><strong>{driver.driverName}</strong><p>{driver.teamName}</p><small className="c11-card-action">{lang === 'vi' ? 'Hồ sơ tay đua' : 'Driver profile'} →</small></Link>;
    })}</div> : <p className="c11-empty">{lang === 'vi' ? 'Không tìm thấy tay đua phù hợp.' : 'No matching drivers found.'}</p>
      : teams.length ? <div className="c11-profile-grid">{teams.map((team) => {
        const profile = getTeamSeasonProfile(team.teamId, season);
        return <Link className="c11-intro-card" key={team.teamId} to={`/teams/${team.teamId}?season=${season}`} style={{ '--team-color': getTeamTextColor(team.teamId, true) } as React.CSSProperties}><span>{profile?.base || (lang === 'vi' ? 'Địa điểm chưa có dữ liệu' : 'Base unavailable')}</span><strong>{profile?.fullName || team.teamName}</strong><p>{profile?.powerUnit ? `${lang === 'vi' ? 'Động cơ' : 'Power unit'}: ${profile.powerUnit}` : ''}</p><small className="c11-card-action">{lang === 'vi' ? 'Hồ sơ đội đua' : 'Team profile'} →</small></Link>;
      })}</div> : <p className="c11-empty">{lang === 'vi' ? 'Không tìm thấy đội đua phù hợp.' : 'No matching teams found.'}</p>}
    <div className="c11-profile-links"><Link to={`/season/${season}?tab=${isDrivers ? 'teams' : 'drivers'}`}>{isDrivers ? (lang === 'vi' ? 'Xem đội đua' : 'Explore teams') : (lang === 'vi' ? 'Xem tay đua' : 'Explore drivers')} →</Link></div>
  </div></main>;
}
