/** P2.50 — genuine source target epoch for scroll/CAD/camera QA.
 *
 * P2.49's frame-2 computed from the CURRENT frame was tautological after
 * frame 2. This tracker stores the real frame when the target/GLB/selection
 * changes. It never treats a previous source's settled camera as evidence
 * for the replacement owner CAD or newly selected original fastener.
 *
 * Object identities are reference identities only, not fabricated mesh IDs.
 */
export type SourceFrameTargetEpoch={
 initialized:boolean;
 targetProgress:number;
 sourceIdentity:object|null;
 selectedIdentity:object|null;
 targetIssuedFrame:number;
};

export function createSourceFrameTargetEpoch():SourceFrameTargetEpoch{
 return {
  initialized:false,targetProgress:0,sourceIdentity:null,
  selectedIdentity:null,targetIssuedFrame:0,
 };
}

export function advanceSourceFrameTargetEpoch(
 epoch:SourceFrameTargetEpoch,
 frame:number,
 targetProgress:number,
 sourceIdentity:object|null,
 selectedIdentity:object|null,
):number{
 if(!Number.isSafeInteger(frame)||frame<1||
    !Number.isFinite(targetProgress)||targetProgress<0||
    targetProgress>1||
    (sourceIdentity!==null&&typeof sourceIdentity!=='object')||
    (selectedIdentity!==null&&typeof selectedIdentity!=='object'))
  throw Error('Invalid original Model B source target frame');
 if(epoch.initialized&&frame<epoch.targetIssuedFrame)
  throw Error('Original Model B source frame went backwards');
 const changed=!epoch.initialized||
   epoch.targetProgress!==targetProgress||
   epoch.sourceIdentity!==sourceIdentity||
   epoch.selectedIdentity!==selectedIdentity;
 if(changed){
  epoch.initialized=true;
  epoch.targetProgress=targetProgress;
  epoch.sourceIdentity=sourceIdentity;
  epoch.selectedIdentity=selectedIdentity;
  epoch.targetIssuedFrame=frame;
 }
 return epoch.targetIssuedFrame;
}
