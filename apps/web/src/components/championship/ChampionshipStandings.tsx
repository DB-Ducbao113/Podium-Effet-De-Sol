import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { getStandings } from '../../data/championship';
import { DRIVERS_DATA } from '../../data/drivers';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import type { SeasonYear } from '../../types';
import { getTeamTextColor } from '../../utils/teamColors';
import { verifiedMovement, type Movement } from '../../utils/standingsMovement';

function AnimatedPoints({ points, previous }: { points: number; previous?: number }) {
  const [display, setDisplay] = useState(points);
  useEffect(() => {
    if (previous === undefined || previous === points || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplay(points); return; }
    const start = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / 650);
      setDisplay(Math.round(previous + (points - previous) * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [points, previous]);
  return <span aria-label={`${points} points`}><span aria-hidden="true">{display}</span></span>;
}

function RankChange({ movement, lang }: { movement?: Movement; lang: 'vi' | 'en' }) {
  const change = movement?.change;
  const label = change === undefined ? (lang === 'vi' ? 'Chưa đủ dữ liệu so sánh hạng' : 'No verified prior rank')
    : change > 0 ? (lang === 'vi' ? `Tăng ${change} bậc` : `Up ${change} places`)
    : change < 0 ? (lang === 'vi' ? `Giảm ${-change} bậc` : `Down ${-change} places`)
    : (lang === 'vi' ? 'Không đổi hạng' : 'Rank unchanged');
  return <span className="c1-rank-change" data-direction={change === undefined ? 'unknown' : change > 0 ? 'up' : change < 0 ? 'down' : 'same'} title={label} aria-label={label}>
    {change === undefined ? '—' : change > 0 ? `▲ +${change}` : change < 0 ? `▼ ${change}` : '● 0'}
  </span>;
}

export function ChampionshipStandings({ season }: { season: SeasonYear }) {
  const lang = useNavigationStore((state) => state.lang);
  const { standingsCategory, calculatedStandings, detailedResults, syncMeta } = useChampionshipStore();
  const baseline = getStandings(season);
  const current = calculatedStandings[season] || baseline;
  const movement = useMemo(() => verifiedMovement(season, detailedResults[season] || [], current, baseline), [season, detailedResults, current, baseline]);
  const isDrivers = standingsCategory === 'drivers';
  const rows = isDrivers ? current.drivers : current.constructors;
  const leader = Math.max(0, ...rows.map((row) => Number.isFinite(row.points) ? row.points : 0));
  const title = isDrivers ? (lang === 'vi' ? 'Tay đua' : 'Drivers') : (lang === 'vi' ? 'Đội đua' : 'Constructors');
  return <section className="c1-standings" aria-label={title}>
    <header className="c1-section-head"><div><p className="c1-eyebrow">{season} / {isDrivers ? 'DRIVERS' : 'CONSTRUCTORS'}</p><h2>{title}</h2><p>{lang === 'vi' ? 'Thanh màu biểu thị điểm so với người dẫn đầu, không phải xác suất vô địch.' : 'Team-color bars show points relative to the leader, not title probability.'}</p></div>
      <a href={`https://www.formula1.com/en/results/${season}/${isDrivers ? 'drivers' : 'team'}`} target="_blank" rel="noopener noreferrer">{lang === 'vi' ? 'Đối chiếu F1.com' : 'Check F1.com'} <ExternalLink size={14} aria-hidden="true" /></a>
    </header>
    {syncMeta.syncStatus === 'error' && <p className="c1-data-warning" role="status">{lang === 'vi' ? 'Không thể cập nhật. Đang hiển thị dữ liệu đã lưu hoặc dữ liệu nền.' : 'Update unavailable. Showing saved or baseline data.'}</p>}
    <p className="c1-provenance">{movement.cutoff ? (lang === 'vi' ? `So sánh với trước vòng ${movement.cutoff} · cùng mùa và hạng mục` : `Movement versus before round ${movement.cutoff} · same season and category`) : (lang === 'vi' ? 'Chưa có hai mốc tính điểm hợp lệ để so sánh hạng.' : 'No comparable verified scoring cutoffs for rank movement.')}</p>
    <div className="c1-standings-list" role="list">
      {rows.map((row, index) => {
        const driver = isDrivers ? current.drivers[index] : null;
        const team = isDrivers ? null : current.constructors[index];
        const teamId = row.teamId;
        const color = getTeamTextColor(teamId, true);
        const pct = leader > 0 && Number.isFinite(row.points) ? Math.max(0, Math.min(100, row.points / leader * 100)) : 0;
        const delta = driver ? movement.drivers.get(driver.driverId) : movement.constructors.get(teamId);
        const name = driver?.driverName || team?.teamName || '';
        const href = driver ? `/drivers/${driver.driverId}?season=${season}` : `/teams/${teamId}?season=${season}`;
        return <article role="listitem" key={driver?.driverId || teamId} className="c1-standing-row" style={{ '--team-color': color, '--row-index': index } as React.CSSProperties} data-updated={delta && delta.previousPoints !== row.points}>
          <span className="c1-standing-rank">{String(row.rank).padStart(2, '0')}</span>
          <div className="c1-standing-main"><div className="c1-standing-name"><Link to={href}>{name}</Link><RankChange movement={delta} lang={lang} /></div>
            <p>{driver ? <><span>{driver.driverCode}{DRIVERS_DATA[driver.driverId]?.number ? ` · #${DRIVERS_DATA[driver.driverId].number}` : ''}</span> · <Link to={`/teams/${teamId}?season=${season}`}>{driver.teamName}</Link></> : team?.engine}</p>
            <div className="c1-points-track" role="img" aria-label={`${name}: ${row.points} / ${leader} ${lang === 'vi' ? 'điểm của người dẫn đầu' : 'leader points'}`}><span style={{ '--bar-width': `${pct}%` } as React.CSSProperties} /></div>
          </div>
          <div className="c1-standing-stats"><strong><AnimatedPoints points={row.points} previous={delta?.previousPoints} /></strong><small>{lang === 'vi' ? 'điểm' : 'points'}</small><span>{row.wins} {lang === 'vi' ? 'thắng' : 'wins'} · {row.podiums} podiums</span></div>
        </article>;
      })}
      {!rows.length && <p className="c1-empty">{lang === 'vi' ? 'Chưa có bảng xếp hạng.' : 'Standings unavailable.'}</p>}
    </div>
  </section>;
}
