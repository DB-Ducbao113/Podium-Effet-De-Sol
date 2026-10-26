import { Link } from 'react-router-dom';
import { getStandings } from '../../data/championship';
import { getSeasonDriverNumber } from '../../data/championship/raceClassificationHelper';
import { DRIVERS_DATA } from '../../data/drivers';
import { getTeamSeasonProfile } from '../../data/teamSeasons';
import { useNavigationStore } from '../../store/useNavigationStore';
import type { SeasonYear } from '../../types';
import { getTeamTextColor } from '../../utils/teamColors';
import './championshipC11.css';

export function ChampionshipDirectory({ season, kind }: { season: SeasonYear; kind: 'teams' | 'drivers' }) {
  const lang = useNavigationStore((state) => state.lang);
  const isDrivers = kind === 'drivers';
  const standings = getStandings(season);
  const teams = [...standings.constructors].sort((a, b) => a.teamName.localeCompare(b.teamName));
  const drivers = [...standings.drivers].sort((a, b) => a.driverName.localeCompare(b.driverName));
  return <section className="c11-directory" aria-label={isDrivers ? (lang === 'vi' ? 'Tay đua' : 'Drivers') : (lang === 'vi' ? 'Đội đua' : 'Teams')}>
    <header className="c1-section-head"><div><h2>{isDrivers ? (lang === 'vi' ? 'Tay đua' : 'Drivers') : (lang === 'vi' ? 'Đội đua' : 'Teams')}</h2><p>{lang === 'vi' ? `Giới thiệu các ${isDrivers ? 'tay đua' : 'đội đua'} trong mùa ${season}. Chọn tên để xem hồ sơ.` : `Meet the ${isDrivers ? 'drivers' : 'constructors'} of the ${season} season. Select a name for the profile.`}</p></div></header>
    <div className="c11-directory-list">{isDrivers ? drivers.map((driver) => {
      const profile = DRIVERS_DATA[driver.driverId];
      const number = getSeasonDriverNumber(season, driver.driverId);
      return <Link className="c11-intro-card" key={driver.driverId} to={`/drivers/${driver.driverId}?season=${season}`} style={{ '--team-color': getTeamTextColor(driver.teamId, true) } as React.CSSProperties}>
        <span>{number ? `#${number} · ` : ''}{profile?.country || driver.countryFlag || driver.driverCode}</span><strong>{driver.driverName}</strong><p>{driver.teamName}</p><small className="c11-card-action">{lang === 'vi' ? 'Hồ sơ tay đua' : 'Driver profile'} →</small>
      </Link>;
    }) : teams.map((team) => {
      const profile = getTeamSeasonProfile(team.teamId, season);
      return <Link className="c11-intro-card" key={team.teamId} to={`/teams/${team.teamId}?season=${season}`} style={{ '--team-color': getTeamTextColor(team.teamId, true) } as React.CSSProperties}>
        <span>{profile?.base || (lang === 'vi' ? 'Chưa có địa điểm được xác minh' : 'Base unavailable')}</span><strong>{profile?.fullName || team.teamName}</strong><p>{profile?.powerUnit ? `${lang === 'vi' ? 'Động cơ' : 'Power unit'}: ${profile.powerUnit}` : (lang === 'vi' ? 'Thông tin đội theo mùa' : 'Season team profile')}</p><small className="c11-card-action">{lang === 'vi' ? 'Hồ sơ đội đua' : 'Team profile'} →</small>
      </Link>;
    })}</div>
  </section>;
}
