import {useMemo,useState} from 'react';
import type {WheelId} from '../assemblyPreview/fourCornerLayout';
import type {InspectedCadPart} from './cadPartInspector';
import {filterOriginalCadCatalog,originalCadPartCatalog} from './cadPartCatalog';
import './cadPartBrowser.css';

const stationOptions:{value:WheelId|'all';label:string}[]=[
 {value:'all',label:'ALL MEASURED WHEEL STATIONS'},
 {value:'front-positive-z',label:'FRONT / +Z'},
 {value:'front-negative-z',label:'FRONT / -Z'},
 {value:'rear-positive-z',label:'REAR / +Z'},
 {value:'rear-negative-z',label:'REAR / -Z'},
];
export type CadBrowserProps={
 p28PartIds:readonly string[];
 p212PartIds:readonly string[]|null;
 p214PartIds:readonly string[]|null;
 onSelect:(part:InspectedCadPart)=>void;
 onClose:()=>void;
};
export default function CadPartBrowser({
 p28PartIds,p212PartIds,p214PartIds,onSelect,onClose,
}:CadBrowserProps){
 const [query,setQuery]=useState('');
 const [station,setStation]=useState<WheelId|'all'>('all');
 const entries=useMemo(()=>originalCadPartCatalog(
   p28PartIds,p212PartIds,p214PartIds
 ),[p28PartIds,p212PartIds,p214PartIds]);
 const available=useMemo(()=>filterOriginalCadCatalog(entries,{
   query,station,
 },36),[entries,query,station]);
 return <aside className="mb-build-catalog" aria-label="Verified original CAD component catalog">
   <header>
     <div><span>ENGINEERING INDEX / MODEL B</span><strong>SOURCE COMPONENTS.</strong></div>
     <button type="button" onClick={onClose} aria-label="Close original CAD catalog">×</button>
   </header>
   <p>Every entry is generated from verified original GLB part IDs.
     Rear P2.8 wheel ends are visual proxies. Source-only mechanical G2 HOLD.</p>
   <div className="mb-build-catalog-fields">
     <label>FIND ORIGINAL CAD PART
       <input aria-label="Search original CAD components"
         value={query} maxLength={180}
         onChange={e=>setQuery(e.target.value)}
         placeholder="BOLT / HUB / RACE / P214..." autoComplete="off"/>
     </label>
     <label>MEASURED WHEEL STATION
       <select aria-label="Filter by measured wheel station"
         value={station}
         onChange={e=>setStation(e.target.value as WheelId|'all')}>
         {stationOptions.map(option=><option key={option.value}
           value={option.value}>{option.label}</option>)}
       </select>
     </label>
   </div>
   <div className="mb-build-catalog-caption">
     <span>{available.length} SHOWN / {entries.length} SOURCE-STATION ENTRIES</span>
     <span>FIRST 36 MATCHES</span>
   </div>
   <div className="mb-build-catalog-list">
     {available.length===0&&<p>No original CAD IDs match this filter.</p>}
     {available.map(({key,inspector})=><button
       type="button" key={key} className="mb-build-catalog-row"
       aria-label={'Inspect CAD '+inspector.partId+' at '+inspector.wheelStation}
       onClick={()=>onSelect(inspector)}>
       <span>{inspector.partId}</span>
       <small>{inspector.wheelStation.toUpperCase()}
         {' / '}{inspector.sourceWheelEndIsRearProxy?'REAR VISUAL PROXY':
            inspector.origin.toUpperCase()}</small>
       <i aria-hidden="true">↗</i>
     </button>)}
   </div>
   <footer>READ ONLY / ORIGINAL PROJECT CAD / UNAPPROVED PHYSICAL FIT</footer>
 </aside>;
}
