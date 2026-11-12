/** P2.35F — Explicit Model B visual-source coverage gate.
 *
 * Only actual decoded Three.js source mesh counts are accepted. Importing
 * a manifest or verifying an upload SHA alone never marks a layer ready.
 * A full 94-source-mesh audit is NOT a mechanical, chassis or G2 approval.
 */
export type ModelBSourceCoverageInput={
 originalMeshCount:number;
 p28MeshCount:number;
 p212MeshCount:number;
 p214MeshCount:number;
};
export type ModelBSourceReviewStage=
 'WAITING_FOR_ORIGINAL'|'OWNER_EXTERIOR_ONLY'|'FRONT_SOURCE_ONLY'|
 'PARTIAL_REAR_SOURCE'|'ALL_AVAILABLE_SOURCES';
export type ModelBSourceCoverage={
 originalVerified:boolean;
 p28Verified:boolean;
 p212Verified:boolean;
 p214Verified:boolean;
 verifiedCadMeshes:number;
 requiredCadMeshes:94;
 stage:ModelBSourceReviewStage;
 summary:string;
 rearWheelEndSourceIsFrontProxy:boolean;
 mechanicalMateCertified:false;
};

const decoded=(value:number):boolean=>Number.isSafeInteger(value)&&value>0;

/**
 * A stage is only upgraded by a fully decoded source layer. Missing dependent
 * layers never give a misleading high coverage count.
 */
export function modelBSourceCoverage(input:ModelBSourceCoverageInput):ModelBSourceCoverage{
 const originalVerified=decoded(input.originalMeshCount);
 const p28Verified=originalVerified&&input.p28MeshCount===59;
 const p212Verified=p28Verified&&input.p212MeshCount===19;
 const p214Verified=p212Verified&&input.p214MeshCount===16;
 const verifiedCadMeshes=(p28Verified?59:0)+(p212Verified?19:0)+(p214Verified?16:0);
 const stage:ModelBSourceReviewStage=!originalVerified?'WAITING_FOR_ORIGINAL':
   !p28Verified?'OWNER_EXTERIOR_ONLY':
   !p212Verified?'FRONT_SOURCE_ONLY':
   !p214Verified?'PARTIAL_REAR_SOURCE':'ALL_AVAILABLE_SOURCES';
 const summary=!originalVerified?
   'MODEL B: VERIFYING ORIGINAL GLB':
   'ORIGINAL MODEL B / CAD '+verifiedCadMeshes+'/94 VERIFIED MESHES / VISUAL ONLY';
 return {
  originalVerified,p28Verified,p212Verified,p214Verified,
  verifiedCadMeshes,requiredCadMeshes:94,stage,summary,
  rearWheelEndSourceIsFrontProxy:p28Verified,
  mechanicalMateCertified:false,
 };
}
