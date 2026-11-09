import type {WheelId} from '../assemblyPreview/fourCornerLayout';
import {visibleInFourCornerPreview} from '../assemblyPreview/fourCornerLayout';
import {rearVisualPartIds} from './rearVisualComposite';
import {inspectOriginalCadMesh,type InspectedCadPart} from './cadPartInspector';
import type {CadPartOrigin} from './cadPartInspector';

export type CadCatalogItem={
  key:string;
  inspector:InspectedCadPart;
};
export type CadCatalogFilter={station:WheelId|'all';query:string};

const stations:readonly WheelId[]=[
 'front-positive-z','front-negative-z','rear-positive-z','rear-negative-z',
];
/** The searchable catalog is built solely from previously SHA-verified
 * source GLBs and manifest part IDs. It is NOT a replacement geometry loader.
 *
 * P2.8 is authoritatively a FRONT corner; a rear preview includes only
 * rear-visible wheel-end source IDs and always marks them as proxies.
 */
export function originalCadPartCatalog(
  p28PartIds:readonly string[],
  p212PartIds:readonly string[]|null,
  p214PartIds:readonly string[]|null,
):CadCatalogItem[]{
 if(p28PartIds.length!==59||new Set(p28PartIds).size!==59)
   throw Error('Original 59-part P2.8 CAD catalog source is incomplete');
 if(p214PartIds&&!p212PartIds)
   throw Error('P2.14 split races require the exact P2.12 source');
 const rear=p212PartIds?rearVisualPartIds(p212PartIds,p214PartIds):null;
 const entries:CadCatalogItem[]=[];
 const add=(name:string,station:WheelId,origin:CadPartOrigin)=>{
   const inspector=inspectOriginalCadMesh(name,station,origin,p28PartIds);
   entries.push({key:station+'/'+origin+'/'+name,inspector});
 };
 for(const station of stations){
   for(const name of p28PartIds){
     if(station.startsWith('rear-')&&!visibleInFourCornerPreview(name,'rear'))
       continue;
     add(name,station,'p28');
   }
   if(station.startsWith('rear-')&&rear){
     const validP214=new Set<string>(p214PartIds??[]);
     for(const name of rear.visiblePartNames)
       add(name,station,validP214.has(name)?'joint':'rear-toe');
   }
 }
 if(new Set(entries.map(x=>x.key)).size!==entries.length)
   throw Error('Duplicate CAD source catalog entry');
 return entries;
}
export function filterOriginalCadCatalog(
 catalog:readonly CadCatalogItem[],filter:CadCatalogFilter,
 limit=80,
):CadCatalogItem[]{
 if(!Number.isSafeInteger(limit)||limit<1||limit>500)
   throw Error('Invalid CAD catalog pagination limit');
 const query=filter.query.trim().toUpperCase();
 if(query.length>180)throw Error('Original CAD part lookup too long');
 return catalog.filter(row=>
   (filter.station==='all'||filter.station===row.inspector.wheelStation)&&
   (!query||row.inspector.partId.toUpperCase().includes(query)||
    row.inspector.subsystem.toUpperCase().includes(query))
 ).slice(0,limit);
}
