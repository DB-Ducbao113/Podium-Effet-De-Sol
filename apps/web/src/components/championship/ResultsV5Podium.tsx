import { Link } from 'react-router-dom';
import type { ClassificationRow } from '../../results-engine/availability';
import { UNKNOWN_TEAM_ID, type SeasonYear } from '../../types';

export function ResultsV5Podium({rows,season,lang,sprint}:{
  rows:ClassificationRow[];season:SeasonYear;lang:'vi'|'en';sprint:boolean;
}){
  const top=rows.filter(row=>row.position>=1&&row.position<=3)
    .sort((a,b)=>a.position-b.position);
  if(top.length!==3||top.some((row,i)=>row.position!==i+1))return null;
  return <section className="results-v5__podium" aria-labelledby="results-v5-podium-title">
    <header className="results-v5__podium-title">
      <span>{lang==='vi'?'PHÂN HẠNG CHUNG CUỘC':'FINAL CLASSIFICATION'}</span>
      <h3 id="results-v5-podium-title">{sprint
        ?(lang==='vi'?'Top ba Sprint.':'Sprint front three.')
        :(lang==='vi'?'Ba vị trí dẫn đầu.':'The front three.')}</h3>
    </header>
    <ol className="results-v5__podium-grid">
      {top.map(row=><li key={row.position} className="results-v5__podium-entry">
        <span className="results-v5__podium-rank">{String(row.position).padStart(2,'0')}</span>
        <div className="results-v5__podium-person">
          {row.driverId&&row.driverId!=='unknown'
            ?<Link to={\`/drivers/\${row.driverId}?season=\${season}\`}>{row.driverName}</Link>
            :<strong>{row.driverName}</strong>}
          {row.teamId!==UNKNOWN_TEAM_ID
            ?<Link className="results-v5__podium-team" to={\`/teams/\${row.teamId}?season=\${season}\`}>{row.teamName}</Link>
            :<span className="results-v5__podium-team">{row.teamName}</span>}
        </div>
      </li>)}
    </ol>
  </section>;
}
