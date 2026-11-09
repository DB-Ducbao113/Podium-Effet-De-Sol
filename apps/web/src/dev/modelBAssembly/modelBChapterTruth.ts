import type {AssemblyChapterId} from './modelBAssemblyTimeline';

export type SceneTruth={
 description:string;
 evidence:string;
 kind:'SOURCE_ONLY_CAMERA'|'ORIGINAL_CAD_ASSEMBLY'|'UNVERIFIED_REAR_PROPOSAL';
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
       kind:'SOURCE_ONLY_CAMERA',
     },
     cutaway:{
       description:'Camera explores real Model B exterior details. The 59-part P2.8 CAD has not been loaded; no fake exploded geometry is shown.',
       evidence:'ORIGINAL MODEL B GEOMETRY CAMERA / NO CAD ASSEMBLY',
       kind:'SOURCE_ONLY_CAMERA',
     },
     'wheel-core':{
       description:'A close-up of the original Model B front exterior. Independent bolts, hubs and brakes require the authentic P2.8 source.',
       evidence:'P2.8 NOT LOADED / SOURCE-ONLY SHOWROOM CAMERA',
       kind:'SOURCE_ONLY_CAMERA',
     },
     'four-wheels':{
       description:'The original Model B complete exterior. Four independent wheel-end CAD registrations are pending real P2.8 geometry.',
       evidence:'ORIGINAL MODEL B / FOUR-CORNER CAD NOT YET REGISTERED',
       kind:'SOURCE_ONLY_CAMERA',
     },
     'rear-joints':{
       description:'Camera examines the rear body of the original Model B. Unmeasured suspension hardpoints are not represented as real installation points.',
       evidence:'ORIGINAL REAR EXTERIOR / NO MECHANICAL G2 SIGNOFF',
       kind:'SOURCE_ONLY_CAMERA',
     },
     final:{
       description:'The exact Git-verified Model B full-car exterior. No fabricated suspension or replacement Formula 1 model.',
       evidence:'ORIGINAL MODEL B / FULL EXTERIOR SOURCE ONLY',
       kind:'SOURCE_ONLY_CAMERA',
     },
   };
   return scenes[id];
 }
 if(id==='rear-joints'&&(!hasOriginalRearToe||!hasOriginalSplitRace)){
   return {
     description:'The owner Model B and P2.8 visual wheel-ends are present. Rear P2.12/P2.14 source remains incomplete; no certified physical mating.',
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
