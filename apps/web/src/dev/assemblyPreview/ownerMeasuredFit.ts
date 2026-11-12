import type { SourceGeometryProbe } from './geometryProbe';

export type MeasuredWheel = {
  station: 'rear' | 'front';
  side: -1 | 1;
  centerSourceUnits: [number,number,number];
  centerM: [number,number,number];
  outerRadiusSourceUnits: number;
  outerRadiusM: number;
  matchingWheelSamples: number;
  hubSamples: number;
};
export type OwnerMeasuredFit = {
  calibration: 'podium-eds.owner-modelb-p28.visual-wheel-envelope.v1';
  source: 'actual decoded original Model B + SHA-matched original P2.8 tyre';
  sourceModelBGeometry: 'Model B showroom scene coordinates, as-authored (NOT metres)';
  p28SourceUnits: 'm';
  normalizedShellScale: number;
  p28Scale: 1;
  bodyBoundsRaw: [[number,number,number],[number,number,number]];
  wheels: MeasuredWheel[];
  frontPositiveZCenterM: [number,number,number];
  originalP28WheelCenterM: [number,number,number];
  /** Authentic P2.8 tyre Z thickness in metres (do not infer wheel mask from radius). */
  originalP28TyreWidthM: number;
  axleSpacingPreviewM: number;
  normalizedShellEnvelopeM: [number,number,number];
  radiusSpreadFraction: number;
  mechanicalFitCertified: false;
  gate: 'VISUAL_REVIEW_ONLY_HARDPOINTS_UNVERIFIED';
};
const median=(x:number[]):number=>{
  if(!x.length)throw new Error('Missing actual wheel vertices');
  const a=[...x].sort((x,y)=>x-y);
  return (a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2;
};
const quantile=(v:number[],q:number):number=>{
  if(!v.length)throw Error('Empty source geometry sample');
  const a=[...v].sort((x,y)=>x-y);
  const f=(a.length-1)*q,lo=Math.floor(f),hi=Math.ceil(f);
  return lo===hi?a[lo]:a[lo]*(hi-f)+a[hi]*(f-lo);
};

/**
 * Calibrates SHOWROOM SOURCE-UNITS -> display metres against the ORIGINAL
 * project CAD P2.8 tyre radius. The CAD is never scaled and the source
 * vertices are never modified. No arbitrary hardpoints are fabricated.
 *
 * All four wheel envelopes must be present. The original source's front
 * axle is X+, lateral +Z is the side with compatible inward P2.8 direction.
 * Source data lineage: original real Chromium geometry export 2026-11-08.
 */
export function fitOwnerShellToOriginalP28(
  modelB: SourceGeometryProbe,p28: SourceGeometryProbe,
): OwnerMeasuredFit {
  if(modelB.source!=='model-b'||p28.source!=='p28'||
     modelB.sampledVerticesM.length<6000||p28.meshCount!==59)
    throw new Error('Original decoded Model B and 59-part P2.8 are required');
  const [min,max]=modelB.sourceBoundsM;
  const dimensions=max.map((value,i)=>value-min[i]);
  if(dimensions.some(v=>!Number.isFinite(v)) ||
     Math.abs(dimensions[0]-27.7926)>.3 ||
     Math.abs(dimensions[1]-5.8703)>.2 ||
     Math.abs(dimensions[2]-11.5277)>.3)
    throw Error('Model B source geometry fingerprint changed; alignment requires a new measurement');
  const tyre=p28.subassemblies.P2_TYRE_SLICK_BODY;
  if(!tyre)throw Error('Original P2.8 tyre body missing');
  const d=tyre.sourceBoundsM[1].map((v,i)=>v-tyre.sourceBoundsM[0][i]);
  const tyreRadius=Math.max(d[0],d[1])/2;
  if(!Number.isFinite(tyreRadius)||Math.abs(tyreRadius-.332)>.004||
     Math.abs(d[2]-.314)>.008)
    throw Error('P2.8 tyre geometry changed; source alignment needs revalidation');
  const points=modelB.sampledVerticesM;
  const raw: Array<Omit<MeasuredWheel,'centerM'|'outerRadiusM'>>=[];
  const stations=[{name:'rear' as const,x:-11.35},{name:'front' as const,x:7.28}];
  for(const station of stations) for(const side of [-1,1] as const){
    const nearby=points.filter(p=>
      Math.abs(p[0]-station.x)<2.25 && p[2]*side>4.25 &&
      p[1]>-3.2 && p[1]<1.1);
    const hub=nearby.filter(p=>Math.abs(p[0]-station.x)<.5&&Math.abs(p[1]+1.1)<.45);
    if(nearby.length<350||hub.length<100)
      throw Error('Wheel landmark not measurable from original Model B vertices');
    const cx=median(hub.map(p=>p[0])),cy=median(hub.map(p=>p[1]));
    const annulus=nearby.map(p=>Math.hypot(p[0]-cx,p[1]-cy))
      .filter(r=>r>1.68&&r<2.12);
    if(annulus.length<100)throw Error('Insufficient real original tyre shoulder samples');
    const radius=quantile(annulus,.8);
    const cz=(quantile(nearby.map(p=>p[2]),.05)+quantile(nearby.map(p=>p[2]),.95))/2;
    raw.push({
      station:station.name,side,
      centerSourceUnits:[cx,cy,cz],
      outerRadiusSourceUnits:radius,
      matchingWheelSamples:nearby.length,hubSamples:hub.length,
    });
  }
  const radii=raw.map(w=>w.outerRadiusSourceUnits);
  const spread=(Math.max(...radii)-Math.min(...radii))/median(radii);
  if(spread>.09)throw Error('Model B wheel radius mismatch >9%; no visual auto-fit');
  const scale=tyreRadius/median(radii);
  if(scale<.14||scale>.21)throw Error('Unknown Model B nonmetric units; no automatic scaling');
  const wheels:MeasuredWheel[]=raw.map(w=>({
    ...w,centerM:w.centerSourceUnits.map(x=>x*scale) as [number,number,number],
    outerRadiusM:w.outerRadiusSourceUnits*scale,
  }));
  const frontPositive=wheels.find(w=>w.station==='front'&&w.side===1);
  if(!frontPositive)throw Error('No front +Z source wheel to mate for review');
  const rear=wheels.filter(w=>w.station==='rear'),front=wheels.filter(w=>w.station==='front');
  const axleSpacing=Math.abs(median(front.map(w=>w.centerM[0]))-median(rear.map(w=>w.centerM[0])));
  if(axleSpacing<2.8||axleSpacing>3.5)throw Error('Wheelbase inconsistent with 2026 visual reference');
  const p28Center=tyre.sourceBoundsM[0].map((v,i)=>
    (v+tyre.sourceBoundsM[1][i])*.5) as [number,number,number];
  return {
    calibration:'podium-eds.owner-modelb-p28.visual-wheel-envelope.v1',
    source:'actual decoded original Model B + SHA-matched original P2.8 tyre',
    sourceModelBGeometry:'Model B showroom scene coordinates, as-authored (NOT metres)',
    p28SourceUnits:'m',normalizedShellScale:scale,p28Scale:1,
    bodyBoundsRaw:modelB.sourceBoundsM,wheels,
    frontPositiveZCenterM:frontPositive.centerM,
    originalP28WheelCenterM:p28Center,
    originalP28TyreWidthM:d[2],
    axleSpacingPreviewM:axleSpacing,
    normalizedShellEnvelopeM:dimensions.map(x=>x*scale) as [number,number,number],
    radiusSpreadFraction:spread,mechanicalFitCertified:false,
    gate:'VISUAL_REVIEW_ONLY_HARDPOINTS_UNVERIFIED',
  };
}
