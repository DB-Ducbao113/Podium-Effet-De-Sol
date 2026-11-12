import type {AssemblyChapterId} from './modelBAssemblyTimeline';

export type SceneTruth={
 description:string;
 evidence:string;
 kind:'SOURCE_ONLY_VISUAL_REVEAL'|'ORIGINAL_CAD_ASSEMBLY'|'UNVERIFIED_REAR_PROPOSAL';
};

/** Never display claims that components have assembled if only the original
 * showroom GLB has been loaded and the owner's P2.8 source is absent.
 * Six chapters remain, but the truth label matches actual scene contents.
 */
export function modelBChapterTruth(
 id:AssemblyChapterId,
 hasOriginalP28:boolean,
 hasOriginalRearToe:boolean,
 hasOriginalSplitRace:boolean,
):SceneTruth{
 if(!hasOriginalP28){
   const scenes:Record<AssemblyChapterId,SceneTruth>={
     reveal:{
       description:'The exact original Model B GLB, verified against the GitHub source file.',
       evidence:'OWNER MODEL B / IMMUTABLE GIT OBJECT',
       kind:'SOURCE_ONLY_VISUAL_REVEAL',
     },
     cutaway:{
       description:'A visual exploded view explores actual Model B exterior geometry. The 59-part P2.8 CAD has not been loaded; the existing exterior GLB mesh nodes temporarily separate and converge; no missing CAD fasteners are fabricated.',
       evidence:'SOURCE GLB MESH REVEAL / NO CAD FASTENERS',
       kind:'SOURCE_ONLY_VISUAL_REVEAL',
     },
     'wheel-core':{
       description:'A close-up of original Model B source mesh and source-derived vertex points. Independent bolts, hubs and brakes require the authentic P2.8 source.',
       evidence:'P2.8 NOT LOADED / VISUAL SOURCE-ONLY REVEAL',
       kind:'SOURCE_ONLY_VISUAL_REVEAL',
     },
     'four-wheels':{
       description:'The original exterior returns through scroll-driven source mesh motion. Four wheel-end CAD registrations still require P2.8.',
       evidence:'ORIGINAL MODEL B / FOUR-CORNER CAD NOT YET REGISTERED',
       kind:'SOURCE_ONLY_VISUAL_REVEAL',
     },
     'rear-joints':{
       description:'The real rear exterior receives a source-only close-up and visual reassembly. Unmeasured suspension hardpoints are not represented as real installation points.',
       evidence:'ORIGINAL REAR EXTERIOR / NO MECHANICAL G2 SIGNOFF',
       kind:'SOURCE_ONLY_VISUAL_REVEAL',
     },
     final:{
       description:'The exact Git-verified Model B full-car exterior, returned to its source pose. No fabricated suspension or replacement Formula 1 model.',
       evidence:'ORIGINAL MODEL B / FULL EXTERIOR SOURCE ONLY',
       kind:'SOURCE_ONLY_VISUAL_REVEAL',
     },
   };
   return scenes[id];
 }
 if((id==='rear-joints'||id==='final')&&(!hasOriginalRearToe||!hasOriginalSplitRace)){
   return {
     description:'The owner Model B and P2.8 visual wheel-ends are present. Rear P2.12/P2.14 source is incomplete; the final vehicle is a visual proposal, not a certified physical assembly.',
     evidence:'REAR PROPOSAL SOURCE INCOMPLETE / MECHANICAL G2 HOLD',
     kind:'UNVERIFIED_REAR_PROPOSAL',
   };
 }
 return {
   description:'',
   evidence:'',
   kind:'ORIGINAL_CAD_ASSEMBLY',
 };
}
