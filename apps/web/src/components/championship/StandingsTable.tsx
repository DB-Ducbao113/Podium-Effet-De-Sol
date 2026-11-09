import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { getStandings } from '../../data/championship';
import { DRIVERS_DATA } from '../../data/drivers';
import { SeasonYear } from '../../types';
import { t } from '../../i18n/translations';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useChampionshipStore } from '../../store/useChampionshipStore';

interface StandingsTableProps { season: SeasonYear }

export const StandingsTable: React.FC<StandingsTableProps> = React.memo(({ season }) => {
  const { lang } = useNavigationStore();
  const { standingsCategory, calculatedStandings, syncMeta } = useChampionshipStore();
  const strings = t[lang].championship;
  const fallback = getStandings(season);
  const drivers = calculatedStandings[season]?.drivers || fallback.drivers;
  const constructors = calculatedStandings[season]?.constructors || fallback.constructors;
  const isDrivers = standingsCategory === 'drivers';
  const label = isDrivers ? strings.driversTab : strings.constructorsTab;
  const sourceUrl = `https://www.formula1.com/en/results/${season}/${isDrivers ? 'drivers' : 'team'}`;

  return (
    <section className="f4-standings" aria-label={label}>
      <div className="f4-standings-head">
        <div>
          <p className="f4-kicker">{season} / {isDrivers ? 'DRIVERS' : 'CONSTRUCTORS'}</p>
          <h2>{label}</h2>
          <p className="f4-standings-note">
            {fallback.status === 'ongoing'
              ? lang === 'vi' ? 'Mùa giải đang diễn ra · thứ hạng có thể thay đổi' : 'Season in progress · positions may change'
              : lang === 'vi' ? 'Dữ liệu mùa giải đã kết thúc' : 'Completed season data'}
            {fallback.lastUpdated ? ` · ${lang === 'vi' ? 'Cập nhật' : 'Updated'} ${fallback.lastUpdated}` : ''}
          </p>
        </div>
        <a className="f4-source-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">
          {lang === 'vi' ? 'Đối chiếu F1.com' : 'Check F1.com'} <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
      {syncMeta.syncStatus === 'error' && (
        <div className="f4-data-warning" role="status">
          {lang === 'vi'
            ? 'Không thể cập nhật dữ liệu lúc này. Đang hiển thị bản đã lưu hoặc dữ liệu nền; vui lòng thử lại sau.'
            : 'Live update unavailable. Showing saved or baseline data; please try again later.'}
        </div>
      )}
      <div className="f4-table-scroll" tabIndex={0} role="region" aria-label={label}>
        <table className="f4-table">
          <thead><tr>
            <th scope="col" className="f4-rank">{strings.pos}</th>
            <th scope="col">{isDrivers ? strings.driver : strings.team}</th>
            <th scope="col">{isDrivers ? strings.team : strings.engine}</th>
            <th scope="col" className="f4-number">{strings.wins}</th>
            <th scope="col" className="f4-number">{strings.podiums}</th>
            <th scope="col" className="f4-number">{strings.points}</th>
          </tr></thead>
          <tbody>
            {isDrivers ? drivers.map((driver) => (
              <tr key={`${driver.driverId}-${driver.teamId}`}>
                <td className="f4-rank">{String(driver.rank).padStart(2, '0')}</td>
                <th scope="row"><div className="f4-identity"><span className="f4-team-mark" aria-hidden="true" /><span>
                  {DRIVERS_DATA[driver.driverId] ? <Link to={`/drivers/${driver.driverId}?season=${season}`}>{driver.driverName}</Link> : driver.driverName}
                  <small>{driver.driverCode}{DRIVERS_DATA[driver.driverId]?.number ? ` · #${DRIVERS_DATA[driver.driverId].number}` : ''} · {driver.countryFlag}</small>
                </span></div></th>
                <td><Link to={`/teams/${driver.teamId}`}>{driver.teamName}</Link></td>
                <td className="f4-number">{driver.wins}</td>
                <td className="f4-number">{driver.podiums}</td>
                <td className="f4-number f4-points">{driver.points}</td>
              </tr>
            )) : constructors.map((team) => (
              <tr key={`${team.teamId}-${team.rank}`}>
                <td className="f4-rank">{String(team.rank).padStart(2, '0')}</td>
                <th scope="row"><div className="f4-identity"><span className="f4-team-mark" aria-hidden="true" /><Link to={`/teams/${team.teamId}`}>{team.teamName}</Link></div></th>
                <td>{team.engine}</td>
                <td className="f4-number">{team.wins}</td>
                <td className="f4-number">{team.podiums}</td>
                <td className="f4-number f4-points">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="f4-mobile-standings">
        {isDrivers ? drivers.map((driver) => (
          <article key={`${driver.driverId}-${driver.teamId}`} className="f4-mobile-row">
            <span className="f4-mobile-rank">{String(driver.rank).padStart(2, '0')}</span>
            <div className="f4-mobile-main">
              <strong>{DRIVERS_DATA[driver.driverId] ? <Link to={`/drivers/${driver.driverId}?season=${season}`}>{driver.driverName}</Link> : driver.driverName}</strong>
              <span>{driver.driverCode}{DRIVERS_DATA[driver.driverId]?.number ? ` · #${DRIVERS_DATA[driver.driverId].number}` : ''} · <Link to={`/teams/${driver.teamId}`}>{driver.teamName}</Link></span>
              <small>{driver.wins} {strings.wins} · {driver.podiums} {strings.podiums}</small>
            </div>
            <span className="f4-mobile-points">{driver.points}<small>{strings.points}</small></span>
          </article>
        )) : constructors.map((team) => (
          <article key={`${team.teamId}-${team.rank}`} className="f4-mobile-row">
            <span className="f4-mobile-rank">{String(team.rank).padStart(2, '0')}</span>
            <div className="f4-mobile-main">
              <strong><Link to={`/teams/${team.teamId}`}>{team.teamName}</Link></strong>
              <span>{team.engine}</span>
              <small>{team.wins} {strings.wins} · {team.podiums} {strings.podiums}</small>
            </div>
            <span className="f4-mobile-points">{team.points}<small>{strings.points}</small></span>
          </article>
        ))}
      </div>
      {(isDrivers ? drivers : constructors).length === 0 && <p className="f4-empty">{lang === 'vi' ? 'Chưa có dữ liệu xếp hạng cho mùa giải này.' : 'No standings data for this season.'}</p>}
    </section>
  );
});
