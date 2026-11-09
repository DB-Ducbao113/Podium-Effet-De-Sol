/** Local-only, original owner CAD route index for the DEV scroll playback.
 * Only points to seven fixed Vite loopback endpoints. No arbitrary URL/path,
 * no production source distribution and no assumed rear mechanical fit.
 */
export const AUTO_CAD_INDEX_SCHEMA='podium-eds.model-b-assembly.local-owner-cad.v1';
export type AutoCadKind='p28'|'p212'|'p214';
export type AutoCadQuality='HIGH'|'BALANCED'|'PERFORMANCE';
export type AutoCadRow={
  manifestFile:'manifest.json';glbFile:'source.glb';
  originalGlbFileName:string;sha256:string;meshCount:number;profile:AutoCadQuality;
};
export type AutoCadIndex={
  schema:typeof AUTO_CAD_INDEX_SCHEMA;
  quality:AutoCadQuality;
  sources:Partial<Record<AutoCadKind,AutoCadRow>>;
  localOnlyNotDeployed:true;
  mechanicalG2:'HOLD';
  noFabricatedGeometry:true;
};
const knownCounts:{[K in AutoCadKind]:number}={p28:59,p212:19,p214:16};
const hashes=(input:unknown):input is string=>
  typeof input==='string'&&/^[a-f0-9]{64}$/i.test(input);
export function readLocalAutoCadIndex(input:unknown):AutoCadIndex{
  if(!input||typeof input!=='object')
    throw Error('Original local CAD review index missing');
  const index=input as Partial<AutoCadIndex>;
  if(index.schema!==AUTO_CAD_INDEX_SCHEMA ||
     !['HIGH','BALANCED','PERFORMANCE'].includes(index.quality??'') ||
     index.localOnlyNotDeployed!==true ||
     index.noFabricatedGeometry!==true ||
     index.mechanicalG2!=='HOLD' ||
     !index.sources || typeof index.sources!=='object' ||
     !index.sources.p28 ||
     Object.keys(index.sources).some(name=>!Object.keys(knownCounts).includes(name)) ||
     (!!index.sources.p214&&!index.sources.p212))
    throw Error('Invalid DEV-only source bundle or mechanical G2 signoff');
  for(const key of Object.keys(index.sources) as AutoCadKind[]){
    const row=index.sources[key];
    if(!row ||
       row.manifestFile!=='manifest.json'||row.glbFile!=='source.glb'||
       row.meshCount!==knownCounts[key] ||
       row.profile!==index.quality ||
       typeof row.originalGlbFileName!=='string' ||
       row.originalGlbFileName.length>200 ||
       !/^[A-Za-z0-9_-]+\.glb$/.test(row.originalGlbFileName) ||
       !hashes(row.sha256))
      throw Error('Untrusted local source index part identity: '+key);
  }
  return index as AutoCadIndex;
}
