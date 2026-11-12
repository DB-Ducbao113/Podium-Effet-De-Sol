import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { GrandPrixRound, SeasonYear } from '../../types';
import './destinationGridV6.css';

type Mode = 'results'|'calendar';
export type DestinationState = 'verified'|'awaiting'|'current'|'upcoming';
export type DestinationItem = GrandPrixRound & { destinationState?: DestinationState };
type Props = {
  season: SeasonYear;
  lang: 'vi'|'en';
  mode: Mode;
  items: readonly DestinationItem[];
};

const labelState: Record<DestinationState,{vi:string;en:string}>={
  verified:{vi:'Đã có kết quả',en:'Results available'},
  awaiting:{vi:'Chờ kết quả',en:'Awaiting results'},
  current:{vi:'Đang diễn ra',en:'Current weekend'},
  upcoming:{vi:'Sắp tới',en:'Upcoming'},
};

/** Shared, data-driven editorial directory. Every card links to the actual
 * season/round in Results or Calendar, never to a fabricated preview. */
export function DestinationGridV6({season,lang,mode,items}:Props){
  const vi=lang==='vi';
  const isResults=mode==='results';
  return (
    <section className="destination-v6" data-destination-mode={mode}
      aria-label={isResults
        ?(vi?'Các chặng và kết quả':'Grand Prix results archive')
        :(vi?'Tất cả chặng đua':'Season race destinations')}>
      <header className="destination-v6__head">
        <div>
          <span className="destination-v6__overline">
            {vi?'MÙA GIẢI':'SEASON'} / {season} &nbsp;·&nbsp; {String(items.length).padStart(2,'0')} {vi?'CHẶNG':'DESTINATIONS'}
          </span>
          <h2>{isResults
            ?(vi?<>Chọn <em>chặng đua.</em></>:<>Race <em>results.</em></>)
            :(vi?<>Lịch <em>đường đua.</em></>:<>Race <em>destinations.</em></>)}</h2>
          <p>{isResults
            ?(vi?'Mở một chặng để xem kết quả và các phiên đua đã xác minh.':'Choose a destination to see sourced classifications and race sessions.')
            :(vi?'Khám phá từng chặng hoặc chuyển sang bản đồ hành trình.':'Explore every weekend, or switch to the interactive world tour.')}</p>
        </div>
        {!isResults && (
          <Link className="destination-v6__mode" to={'/season/'+season+'?tab=calendar&view=world'}>
            {vi?'Xem địa cầu 3D':'World tour'} <ArrowUpRight size={18} aria-hidden="true"/>
          </Link>
        )}
      </header>
      {items.length===0
        ? <p className="destination-v6__empty" role="status">{vi?'Mùa này chưa có chặng đua.':'No scheduled destinations for this season.'}</p>
        : <ol className="destination-v6__grid">
            {items.map((race,index)=>{
              const state=race.destinationState;
              const status=state?labelState[state][lang]:null;
              const href='/season/'+season+'?tab='+mode+'&round='+race.round+
                (isResults?'&session=race':'&view=classic');
              return (
                <li key={race.round} className="destination-v6__item">
                  <Link className="destination-v6__card" to={href}
                    aria-label={(vi?'Chặng ':'Round ')+race.round+': '+race.name+
                      (status?' · '+status:'')}>
                    <span className="destination-v6__number">
                      {vi?'CHẶNG':'DESTINATION'} / {String(race.round).padStart(2,'0')}
                    </span>
                    <span className="destination-v6__names">
                      <strong>{race.country}</strong>
                      <em>{race.location}</em>
                    </span>
                    <span className="destination-v6__lower">
                      <span>{race.dates}</span>
                      <ArrowUpRight size={24} strokeWidth={1.6} aria-hidden="true"/>
                    </span>
                    <span className="sr-only">{race.circuit}{status?' · '+status:''}</span>
                  </Link>
                </li>
              );
            })}
          </ol>}
    </section>
  );
}
