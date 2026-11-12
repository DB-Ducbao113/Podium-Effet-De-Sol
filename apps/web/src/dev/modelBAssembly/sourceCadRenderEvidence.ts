/** P2.47 — truthful CAD vertex-dot draw evidence.
 *
 * A BufferGeometry.drawRange describes REQUESTED points. It cannot by
 * itself prove that Three.js issued a draw for the original GLB overlay.
 * Only count points when THREE.Points.onAfterRender fires for that mesh.
 *
 * These counters are strictly frontend render-callback evidence; a WebGL
 * pixel audit is still required for visual acceptance.
 */
export type SourceCadRenderKind='build'|'inspection';
export type SourceCadRenderEvidence={
 frame:number;
 buildPoints:number;
 inspectionPoints:number;
 drawCalls:number;
};
export type SourceCadRenderGeometry={
 drawRange:{start:number;count:number};
 getAttribute:(name:'position')=>{count:number}|undefined;
};

/** Never claim points outside the actual sampled source position buffer. */
export function sourceCadRenderedPointCount(
 geometry:SourceCadRenderGeometry,
 opacity:number,
):number{
 const {start,count}=geometry.drawRange;
 const buffer=geometry.getAttribute('position');
 if(!buffer||
    !Number.isSafeInteger(buffer.count)||buffer.count<1||
    !Number.isSafeInteger(start)||start<0||
    !Number.isSafeInteger(count)||count<0||
    !Number.isFinite(opacity)||opacity<0||opacity>1)
  throw Error('Invalid original CAD post-render vertex evidence');
 if(opacity<=.005||start>=buffer.count)return 0;
 return Math.min(count,buffer.count-start);
}

/** A new R3F frame always begins with *zero observed draws*. */
export function beginSourceCadRenderEvidence(
 evidence:SourceCadRenderEvidence,
):void{
 evidence.frame++;
 evidence.buildPoints=0;
 evidence.inspectionPoints=0;
 evidence.drawCalls=0;
}

/** Called ONLY from the source point object's Three.js onAfterRender. */
export function recordSourceCadAfterRender(
 evidence:SourceCadRenderEvidence,
 kind:SourceCadRenderKind,
 geometry:SourceCadRenderGeometry,
 opacity:number,
):number{
 if(kind!=='build'&&kind!=='inspection')
  throw Error('Invalid original CAD render source kind');
 const count=sourceCadRenderedPointCount(geometry,opacity);
 if(count===0)return 0;
 if(kind==='build')evidence.buildPoints+=count;
 else evidence.inspectionPoints+=count;
 evidence.drawCalls++;
 return count;
}

export function createSourceCadRenderEvidence():SourceCadRenderEvidence{
 return {frame:0,buildPoints:0,inspectionPoints:0,drawCalls:0};
}

/** P2.48 — accept exactly one callback per *currently mounted* source
 * THREE.Points object in one R3F render frame. This avoids double-counting
 * multiple passes and drops callbacks from already-unmounted source GLBs.
 *
 * The caller holds one seen set per Canvas; clear it BEFORE each new useFrame.
 * A skipped callback is not evidence of a GPU draw and never changes totals.
 */
export function recordUniqueSourceCadAfterRender(
 evidence:SourceCadRenderEvidence,
 seenThisFrame:Set<object>,
 pointObject:object,
 isCurrentlyMounted:boolean,
 kind:SourceCadRenderKind,
 geometry:SourceCadRenderGeometry,
 opacity:number,
):number{
 if(!pointObject||typeof pointObject!=='object')
  throw Error('Invalid original CAD native render object');
 if(!isCurrentlyMounted||seenThisFrame.has(pointObject))return 0;
 const count=recordSourceCadAfterRender(evidence,kind,geometry,opacity);
 if(count>0)seenThisFrame.add(pointObject);
 return count;
}
