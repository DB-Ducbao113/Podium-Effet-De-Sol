/** P2.50 — one coherent real Three.js canvas telemetry snapshot.
 * Do not combine a settled scroll frame from one read with render callbacks
 * from another frame or a previously selected source-CAD layer.
 *
 * This is browser QA input validation, NOT proof of visible F1 pixels.
 */
export function assertSourceCadFrameSnapshot(snapshot,{
 targetProgress,previousFrame,requireNewTarget=false,
}={}){
 const {
  frame,targetIssuedFrame,sceneProgress,cameraErrorM,
  settled,scheduledVisible,rendered,drawCalls,evidence,
 }=snapshot??{};
 if(!Number.isSafeInteger(frame)||frame<2||
    !Number.isSafeInteger(targetIssuedFrame)||targetIssuedFrame<1||
    !Number.isSafeInteger(previousFrame)||previousFrame<0||
    !Number.isFinite(targetProgress)||targetProgress<0||targetProgress>1||
    !Number.isFinite(sceneProgress)||sceneProgress<0||sceneProgress>1||
    !Number.isFinite(cameraErrorM)||cameraErrorM<0||
    !Number.isSafeInteger(scheduledVisible)||scheduledVisible<0||
    !Number.isSafeInteger(rendered)||rendered<0||
    !Number.isSafeInteger(drawCalls)||drawCalls<0||
    settled!=='true'||
    frame<previousFrame+2||
    frame<targetIssuedFrame+2||
    (requireNewTarget&&targetIssuedFrame<=previousFrame)||
    Math.abs(sceneProgress-targetProgress)>.004||
    cameraErrorM>.015||
    rendered>scheduledVisible||
    (scheduledVisible>0&&(evidence!=='OBSERVED'||rendered<1))||
    (rendered>0&&drawCalls===0))
  throw Error('Original CAD frame capture was not settled or rendered coherently: '+
    JSON.stringify({snapshot,targetProgress,previousFrame,requireNewTarget}));
 return snapshot;
}
