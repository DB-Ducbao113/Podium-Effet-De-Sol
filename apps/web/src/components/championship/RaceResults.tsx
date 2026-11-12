import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCalendarBySeason, getRaceResults } from '../../data/championship';
import openF1SessionResults from '../../data/championship/openF1SessionResults2026.json';
import { getAvailableSessions, type ResultDataSources } from '../../results-engine/availability';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { getCalendarRaceState } from '../../utils/raceSchedule';
import type { SeasonYear } from '../../types';
import { DestinationGridV6, type DestinationItem } from './DestinationGridV6';
import { WeekendResults } from './WeekendResults';

const OPEN = openF1SessionResults as unknown as {
  practice: ResultDataSources['practice'];
  qualifying: ResultDataSources['qualifying'];
};

// Grid is the default entry point. Deep links and legacy ?view=classic retain
// the original sourced session table without disturbing the F1 result engine.
export const RaceResults: React.FC<{season:SeasonYear}> = React.memo(({season})=>{
  const location=useLocation();
  const lang=useNavigationStore(state=>state.lang);
  const detailed=useChampionshipStore(state=>state.detailedResults[season]);
  const params=new URLSearchParams(location.search);
  const roundParam=Number(params.get('round'));
  const hasRound=params.has('round')&&Number.isInteger(roundParam)&&roundParam>0;
  const detail=hasRound||params.get('view')==='classic';
  const races=getCalendarBySeason(season);
  const sources:ResultDataSources={
    season,calendar:races,detailedResults:detailed,
    raceSummaries:getRaceResults(season),
    practice:season===2026?OPEN.practice:{},
    qualifying:season===2026?OPEN.qualifying:{},
  };
  const items:DestinationItem[]=races.map(race=>{
    const available=getAvailableSessions(sources,race.round);
    const verified=available.length>0;
    const scheduled=getCalendarRaceState(race,Date.now());
    return {...race,destinationState:scheduled==='current'?'current':
      verified?'verified':scheduled==='completed'?'awaiting':'upcoming',
      resultSession:available.includes('race')?'race':(available[0]??'race')};
  });
  return detail?(
    <div className="results-v6-detail">
      <nav className="destination-v6__return" aria-label={lang==='vi'?'Điều hướng kết quả':'Results navigation'}>
        <Link to={'/season/'+season+'?tab=results'}>{lang==='vi'?'← Tất cả chặng':'← All destinations'}</Link>
        <Link to={'/season/'+season+'?tab=calendar&view=world'}>{lang==='vi'?'Địa cầu tương tác':'Interactive globe'} ↗</Link>
      </nav>
      <WeekendResults season={season}/>
    </div>
  ):<DestinationGridV6 season={season} lang={lang} mode="results" items={items}/>;
});
