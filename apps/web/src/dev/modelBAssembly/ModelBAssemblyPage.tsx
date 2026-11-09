import {
 lazy,Suspense,useCallback,useEffect,useRef,useState,
 type ChangeEvent,
} from 'react';
import {Link} from 'react-router-dom';
import {animate} from 'animejs';
import {type CadSource,verifyCadSource} from '../cadFirstScroll/cadSource';
import {
 readToeAdjusterManifest,verifyToeAdjusterSource,
 type ToeAdjusterSource,
} from '../assemblyPreview/rearToeAdjusterSource';
import {
 readSplitRaceManifest,verifySplitRaceSource,
 type SplitRaceSource,
} from '../assemblyPreview/splitRaceSource';
import {chapterAt,clamp01,MODEL_B_CHAPTERS} from './modelBAssemblyTimeline';
import {readLocalAutoCadIndex,type AutoCadRow} from './localSourceIndex';
import type {OwnerMeasuredFit} from '../assemblyPreview/ownerMeasuredFit';
import type {RearVisualParts} from './rearVisualComposite';
import type {InspectedCadPart} from './cadPartInspector';
import './modelBAssembly.css';

const Stage=lazy(()=>import('./ModelBAssemblyStage'));
const MAX_JSON_BYTES=5*1024*1024;
type StageId='model-b'|'p28'|'rear-toe'|'p214';
type SourceName='front'|'toe'|'split';

export default function ModelBAssemblyPage(){
 const track=useRef<HTMLElement|null>(null);
 const manualChosen=useRef(false);
 const titleRef=useRef<HTMLHeadingElement|null>(null);
 const progressRef=useRef(0);
 const [progress,setProgress]=useState(0);
 const [sourceOpen,setSourceOpen]=useState(false);
 const [sourceManifest,setSourceManifest]=useState<unknown>(null);
 const [corner,setCorner]=useState<CadSource|null>(null);
 const [toeManifest,setToeManifest]=useState<unknown>(null);
 const [rearToe,setRearToe]=useState<ToeAdjusterSource|null>(null);
 const [splitManifest,setSplitManifest]=useState<unknown>(null);
 const [splitRace,setSplitRace]=useState<SplitRaceSource|null>(null);
 const [busy,setBusy]=useState<SourceName|null>(null);
 const [error,setError]=useState('');
 const [ready,setReady]=useState<Partial<Record<StageId,number>>>({});
 const [measuredFit,setMeasuredFit]=useState<OwnerMeasuredFit|null>(null);
 const [rearComposite,setRearComposite]=useState<RearVisualParts|null>(null);
 const [inspectedPart,setInspectedPart]=useState<InspectedCadPart|null>(null);
 const [reducedMotion,setReducedMotion]=useState(()=>{
   return typeof window!=='undefined'&&
     window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 });
 useEffect(()=>{
   const m=window.matchMedia('(prefers-reduced-motion: reduce)');
   const listener=()=>setReducedMotion(m.matches);
   m.addEventListener('change',listener);
   return()=>m.removeEventListener('change',listener);
 },[]);
 // DEV-only local source. When original SHA-checked CAD was staged by the
 // native local runner, show the full owner Model B build without file pickers.
 // No production /public asset, no generated lookalike car, no remote upload.
 useEffect(()=>{
   let active=true;
   const base='/__peds-model-b-cad';
    const checkedFetch=async(relative:string)=>{
     const response=await fetch(base+relative,{cache:'no-store'});
     if(!response.ok)
       throw Error('Original local CAD unavailable: '+relative+' HTTP '+response.status);
     return response;
   };
   const sourceFile=async(kind:'p28'|'p212'|'p214',record:AutoCadRow)=>{
     const bytes=await (await checkedFetch('/'+kind+'/source.glb')).arrayBuffer();
     return new File([bytes],record.originalGlbFileName,{type:'model/gltf-binary'});
   };
   const load=async()=>{
     try{
       const response=await fetch(base+'/index.json',{cache:'no-store'});
       if(response.status===404)return; // manual manifest and GLB import still works
       if(!response.ok)throw Error('Local source index HTTP '+response.status);
       const bundle=readLocalAutoCadIndex(await response.json() as unknown);
       const frontJson=await (await checkedFetch('/p28/manifest.json')).json() as unknown;
       const front=await verifyCadSource(frontJson,
         await sourceFile('p28',bundle.sources.p28));
       if(front.scope!=='front-corner'||front.parts.length!==59||
         bundle.sources.p28.meshCount!==59||
         front.manifest.profiles[front.profile].sha256!==bundle.sources.p28.sha256)
         throw Error('Original 59-part P2.8 index/source mismatch');
       if(!active||manualChosen.current)return;
       setSourceManifest(frontJson);setCorner(front);
       if(bundle.sources.p212){
         const manifest=readToeAdjusterManifest(await
           (await checkedFetch('/p212/manifest.json')).json() as unknown);
         const checked=await verifyToeAdjusterSource(manifest,
           await sourceFile('p212',bundle.sources.p212));
         if(bundle.sources.p212.meshCount!==19||
           manifest.profiles[checked.profile].sha256!==bundle.sources.p212.sha256)
           throw Error('Original 19-part rear toe source index mismatch');
         if(!active||manualChosen.current)return;
         setToeManifest(manifest);setRearToe(checked);
       }
       if(bundle.sources.p214){
         if(!bundle.sources.p212)throw Error('P2.14 requires P2.12');
         const manifest=readSplitRaceManifest(await
           (await checkedFetch('/p214/manifest.json')).json() as unknown);
         const checked=await verifySplitRaceSource(manifest,
           await sourceFile('p214',bundle.sources.p214));
         if(bundle.sources.p214.meshCount!==16||
           manifest.profiles[checked.profile].sha256!==bundle.sources.p214.sha256)
           throw Error('Original 16-part split-race source index mismatch');
         if(!active||manualChosen.current)return;
         setSplitManifest(manifest);setSplitRace(checked);
       }
     }catch(cause){
       if(active&&!manualChosen.current)
         setError('Original local CAD staging rejected: '+String(cause));
     }
   };
   void load();
   return()=>{active=false;};
 },[]);
 useEffect(()=>{
   let frame=0;
   const update=()=>{
     frame=0;
     const node=track.current;
     if(!node)return;
     const rect=node.getBoundingClientRect();
     const max=Math.max(1,rect.height-window.innerHeight);
     const next=clamp01(-rect.top/max);
     progressRef.current=next;
     setProgress(prior=>Math.abs(prior-next)>.002?next:prior);
   };
   const onScroll=()=>{if(!frame)frame=window.requestAnimationFrame(update);};
   update();
   window.addEventListener('scroll',onScroll,{passive:true});
   window.addEventListener('resize',onScroll);
   return()=>{
     window.removeEventListener('scroll',onScroll);
     window.removeEventListener('resize',onScroll);
     if(frame)window.cancelAnimationFrame(frame);
   };
 },[]);
 const chapter=chapterAt(progress);
 useEffect(()=>{
   if(reducedMotion||!titleRef.current)return;
   const animation=animate(titleRef.current,{
     opacity:[0,1],translateY:[24,0],duration:650,ease:'out(3)',
   });
   return()=>{animation.revert();};
 },[chapter.id,reducedMotion]);
 const jumpTo=useCallback((index:number)=>{
   const node=track.current;
   const chapter=MODEL_B_CHAPTERS[index];
   if(!node||!chapter)return;
   const top=window.scrollY+node.getBoundingClientRect().top;
   const length=Math.max(1,node.getBoundingClientRect().height-window.innerHeight);
   window.scrollTo({top:top+length*chapter.start,
      behavior:reducedMotion?'instant':'smooth'});
 },[reducedMotion]);
 const handleReady=useCallback((id:StageId,meshCount:number)=>{
   setReady(old=>old[id]===meshCount?old:{...old,[id]:meshCount});
 },[]);
 const handleError=useCallback((message:string)=>setError(message),[]);
 const handleFit=useCallback((fit:OwnerMeasuredFit|null)=>setMeasuredFit(fit),[]);
 const handleRearComposite=useCallback(
   (info:RearVisualParts|null)=>setRearComposite(info),[]);
 const handlePartInspect=useCallback((part:InspectedCadPart)=>setInspectedPart(part),[]);
 const resetReady=useCallback((kind:SourceName)=>{
   setInspectedPart(null);
   setReady(previous=>{
     const next:Partial<Record<StageId,number>>={};
     if(previous['model-b']!==undefined)next['model-b']=previous['model-b'];
     if(kind!=='front'&&previous.p28!==undefined)next.p28=previous.p28;
     if(kind==='split'&&previous['rear-toe']!==undefined)
       next['rear-toe']=previous['rear-toe'];
     return next;
   });
 },[]);
 const importManifest=async(event:ChangeEvent<HTMLInputElement>,kind:SourceName)=>{
   const file=event.target.files?.[0];
   event.target.value='';
   if(!file)return;
   manualChosen.current=true;
   setError('');
   resetReady(kind);
   if(kind==='front'){
     setCorner(null);setRearToe(null);setSplitRace(null);
   }else if(kind==='toe'){
     setRearToe(null);setSplitRace(null);
   }else setSplitRace(null);
   try{
     if(file.size>MAX_JSON_BYTES)throw Error('Original CAD manifest exceeds 5 MB');
     const input=JSON.parse(await file.text()) as unknown;
     if(kind==='front')setSourceManifest(input);
     else if(kind==='toe')setToeManifest(readToeAdjusterManifest(input));
     else setSplitManifest(readSplitRaceManifest(input));
   }catch(cause){setError('Source manifest rejected: '+String(cause));}
 };
 const importGlb=async(event:ChangeEvent<HTMLInputElement>,kind:SourceName)=>{
   const file=event.target.files?.[0];
   event.target.value='';
   if(!file)return;
   manualChosen.current=true;
   setBusy(kind);setError('');
   resetReady(kind);
   if(kind==='front'){setCorner(null);setRearToe(null);setSplitRace(null);}
   else if(kind==='toe'){setRearToe(null);setSplitRace(null);}
   else setSplitRace(null);
   try{
     if(kind==='front'){
       if(!sourceManifest)throw Error('Load P2.8 original manifest first');
       const verified=await verifyCadSource(sourceManifest,file);
       if(verified.scope!=='front-corner'||verified.parts.length!==59)
         throw Error('Original P2.8 front corner requires 59 named solids');
       setCorner(verified);
     }else if(kind==='toe'){
       if(!corner||!toeManifest)throw Error('P2.8 source and P2.12 manifest are required');
       setRearToe(await verifyToeAdjusterSource(toeManifest,file));
     }else{
       if(!corner||!rearToe||!splitManifest)
         throw Error('P2.8 and P2.12 must be loaded before P2.14');
       setSplitRace(await verifySplitRaceSource(splitManifest,file));
     }
   }catch(cause){setError('Source GLB rejected: '+String(cause));}
   finally{setBusy(null);}
 };
 const sourceCount=(corner?59:0)+(rearToe?19:0)+(splitRace?16:0);
 const cadLoaded=Boolean(corner)&&Boolean(ready.p28);
 const allRear=Boolean(rearToe&&splitRace&&ready['rear-toe']&&ready.p214);
 return <div className="mb-build">
   <a href="#mb-build-end" className="mb-build-skip">SKIP ASSEMBLY SEQUENCE</a>
   <section className="mb-build-track" ref={track} style={{height:'735svh'}}>
     <div className="mb-build-sticky">
       <div className="mb-build-grid" aria-hidden="true"/>
       <div className="mb-build-webgl" aria-label="Real Model B source and imported CAD assembly animation">
         <Suspense fallback={<div className="mb-build-loading">INITIALIZING MODEL B · WEBGL</div>}>
           <Stage progressRef={progressRef} corner={corner}
              rearToe={rearToe} splitRace={splitRace}
              reducedMotion={reducedMotion}
              onReady={handleReady} onFit={handleFit}
              onRearComposite={handleRearComposite}
              onInspect={handlePartInspect} onError={handleError}/>
         </Suspense>
       </div>
       <div className="mb-build-shade" aria-hidden="true"/>
       <header className="mb-build-header">
         <Link className="mb-build-brand" to="/engineering">PODIUM <strong>EDS</strong></Link>
         <div className="mb-build-header-middle">
           <span className="mb-build-led"/><span>MODEL B / ASSEMBLY STUDY</span>
         </div>
         <div className="mb-build-header-right">
           <span>DEV · SOURCE REVIEW</span>
           <Link to="/engineering/assembly-preview">CAD LAB ↗</Link>
         </div>
       </header>
       <div className="mb-build-leftnote" aria-hidden="true">FORM FOLLOWS FUNCTION <span>—</span> 2026</div>
       <section className="mb-build-content" aria-live="polite">
         <div className="mb-build-eyebrow">
           <span className="mb-build-index">{chapter.number} / 05</span>
           <span className="mb-build-rule"/>
           <span>{chapter.eyebrow}</span>
         </div>
         <h1 key={chapter.id} ref={titleRef}>{chapter.title}</h1>
         <p className="mb-build-copy">{chapter.description}</p>
         <div className="mb-build-status">
           <span className={cadLoaded?'mb-build-point ready':'mb-build-point'}/>
           <span>{chapter.evidence}</span>
         </div>
       </section>
       <nav className="mb-build-rail" aria-label="Model B assembly chapters">
         {MODEL_B_CHAPTERS.map((beat,index)=>
           <button type="button" key={beat.id}
             className={beat.id===chapter.id?'current':''}
             onClick={()=>jumpTo(index)}
             aria-label={beat.number+' '+beat.title}
             aria-current={beat.id===chapter.id?'step':undefined}>
              <span>{beat.number}</span><i/>
           </button>
         )}
       </nav>
       {inspectedPart&&<aside className="mb-build-part-inspector"
          aria-label="Selected original CAD component" aria-live="polite"
          data-inspected-cad-part-id={inspectedPart.partId}>
         <div className="mb-build-part-inspector-head">
           <span>SOURCE PART / SELECTED</span>
           <button type="button" onClick={()=>setInspectedPart(null)}
             aria-label="Clear selected CAD part">×</button>
         </div>
         <strong>{inspectedPart.subsystem}</strong>
         <code>{inspectedPart.partId}</code>
         <dl>
           <div><dt>WHEEL</dt><dd>{inspectedPart.wheelStation.toUpperCase()}</dd></div>
           <div><dt>SOURCE</dt><dd>{inspectedPart.sourceLabel}</dd></div>
           <div><dt>MATE</dt><dd>VISUAL ONLY · G2 HOLD</dd></div>
         </dl>
         {inspectedPart.sourceWheelEndIsRearProxy&&
           <p className="mb-build-part-warning">P2.8 FRONT-SOURCE WHEEL-END
             PROXY. NOT AN AUTHENTIC REAR WHEEL/SUSPENSION ASSEMBLY.</p>}
         <p>Source CAD identity verified. The animation is not a
           mechanical assembly or a manufacturing simulation.</p>
       </aside>}
       <div className="mb-build-source-wrap"
         data-original-model-b-wheel-fit={measuredFit?.wheels.length===4&&cadLoaded?'true':'false'}
         data-wheel-station-count={measuredFit?.wheels.length??0}
         data-rear-composite-cad-parts={rearComposite?.count??0}
         data-rear-legacy-bearing-proxies-hidden={
            rearComposite?.hiddenOldAnnularBearingProxies??0}
         data-rear-mechanical-mate-certified="false"
         data-original-p28-scale={measuredFit?.p28Scale??'unknown'}
         data-original-mechanical-mate-certified={measuredFit?.mechanicalFitCertified?'true':'false'}
         data-p28-cad-ready={cadLoaded?'true':'false'}
         data-p212-cad-ready={ready['rear-toe']===19&&!!rearToe?'true':'false'}
         data-p214-cad-ready={ready.p214===16&&!!splitRace?'true':'false'}>
         <button type="button" className="mb-build-source-trigger"
           aria-expanded={sourceOpen} aria-controls="mb-build-source-panel"
           onClick={()=>setSourceOpen(value=>!value)}>
           <span className="mb-build-source-mark">+</span>
           CAD SOURCE
           <span className="mb-build-source-count">{sourceCount} MESHES / UPLOADED</span>
         </button>
         {sourceOpen&&<aside className="mb-build-source-panel" id="mb-build-source-panel">
           <div className="mb-build-source-head">
             <strong>ORIGINAL SOURCE INPUT</strong>
             <button onClick={()=>setSourceOpen(false)} type="button" aria-label="Close CAD source input">×</button>
           </div>
           <p>Model B loads automatically from this repository. CAD parts are not substituted:
             each original manifest and matching GLB must pass its source SHA-256 check.</p>
           <div className="mb-build-input">
             <span>01 / P2.8 ORIGINAL FRONT · 59 MESHES</span>
             <label>MANIFEST (.JSON)<input type="file" accept=".json,application/json"
                onChange={e=>{void importManifest(e,'front');}}/></label>
             <label className={!sourceManifest?'disabled':''}>SOURCE GLB
               <input type="file" accept=".glb,model/gltf-binary"
                 disabled={!sourceManifest||!!busy}
                 onChange={e=>{void importGlb(e,'front');}}/></label>
             <small>{cadLoaded?'59 CAD MESHES DECODED':corner?'SOURCE SHA PASSED · DECODING':'NOT LOADED'}</small>
           </div>
           <div className="mb-build-input">
             <span>02 / P2.12 REAR TOE · 19 MESHES</span>
             <label>MANIFEST (.JSON)<input type="file" accept=".json,application/json"
                onChange={e=>{void importManifest(e,'toe');}}/></label>
             <label className={!corner||!toeManifest?'disabled':''}>SOURCE GLB
               <input type="file" accept=".glb,model/gltf-binary"
                 disabled={!corner||!toeManifest||!!busy}
                 onChange={e=>{void importGlb(e,'toe');}}/></label>
             <small>{ready['rear-toe']===19?'19 CAD MESHES DECODED':rearToe?'SOURCE SHA PASSED · DECODING':'SOURCE REQUIRED / PROPOSAL'}</small>
           </div>
           <div className="mb-build-input">
             <span>03 / P2.14 SPLIT RACES · 16 MESHES</span>
             <label>MANIFEST (.JSON)<input type="file" accept=".json,application/json"
                onChange={e=>{void importManifest(e,'split');}}/></label>
             <label className={!rearToe||!splitManifest?'disabled':''}>SOURCE GLB
               <input type="file" accept=".glb,model/gltf-binary"
                 disabled={!rearToe||!splitManifest||!!busy}
                 onChange={e=>{void importGlb(e,'split');}}/></label>
             <small>{allRear?'16 CAD MESHES DECODED · G2 HOLD':splitRace?'SOURCE SHA PASSED · DECODING':'NOT LOADED'}</small>
           </div>
           <p className="mb-build-disclaimer">Rear wheel ends reuse original P2.8 front-source wheel-end
             meshes for visual positioning. P2.12/P2.14 chassis joints are engineering prototypes.
             No genuine rear mechanical mate, dynamic assembly or manufacturing approval is claimed.</p>
         </aside>}
       </div>
       {(error||!ready['model-b'])&&<div className="mb-build-feedback" role={error?'alert':'status'}>
         {error||'DECODING ORIGINAL MODEL B GLB...'}
       </div>}
       <footer className="mb-build-footer">
         <div className="mb-build-footleft">
           <span className="mb-build-dot"/>{ready['model-b']?'OWNER MODEL B LOADED':'MODEL B LOADING'}
           <span className="mb-build-divider">/</span>
           {cadLoaded?'P2.8 VERIFIED':'CAD INPUT OPTIONAL'}
         </div>
         <div className="mb-build-progress">
           <span>SCROLL TO ASSEMBLE</span>
           <div role="progressbar" aria-label="Model B visual assembly sequence" aria-valuenow={Math.round(progress*100)}
             aria-valuemin={0} aria-valuemax={100}
             className="mb-build-trackbar"><i style={{transform:'scaleX('+progress+')'}}/></div>
           <span>{String(Math.round(progress*100)).padStart(3,'0')}%</span>
         </div>
         <div className="mb-build-footright">
           <span>WEBGL / ANIME.JS</span>
           <span>G2 · HOLD</span>
         </div>
       </footer>
     </div>
   </section>
   <section id="mb-build-end" className="mb-build-end">
     <span>MODEL B / ENGINEERING RECORD</span>
     <h2>NOTHING INVENTED.<br/>NOTHING HIDDEN.</h2>
     <p>Every imported CAD element is checked against its source manifest before it joins
       the original Model B. The scroll choreography is a visual assembly study,
       not proof of a physical installation or a production-ready suspension.</p>
     <div className="mb-build-end-links">
       <Link to="/engineering/assembly-preview">SOURCE INSPECTION / FOUR CORNERS ↗</Link>
       <button type="button" onClick={()=>jumpTo(0)}>REPLAY SEQUENCE ↑</button>
     </div>
   </section>
 </div>;
}
