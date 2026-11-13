import {lazy,Suspense,useCallback,useEffect,useMemo,useRef,useState,type ChangeEvent} from 'react';
import {Link} from 'react-router-dom';
import {readManifest,verifyCadSource,type CadSource} from '../cadFirstScroll/cadSource';
import {fitOwnerShellToOriginalP28} from '../assemblyPreview/ownerMeasuredFit';
import type {SourceGeometryProbe} from '../assemblyPreview/geometryProbe';
import {STORY_CHAPTERS,STORY_COUNT,storyAtProgress,chapterReadiness} from './storyChapters';
import './fullCarStory.css';

const Stage=lazy(()=>import('./FullCarStoryStage'));
const clamp=(value:number)=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
const MAX_MANIFEST_BYTES=5*1024*1024;

export default function FullCarStoryReviewPage(){
  const track=useRef<HTMLElement>(null);
  const [progress,setProgress]=useState(0);
  const [manifest,setManifest]=useState<unknown>(null);
  const [source,setSource]=useState<CadSource|null>(null);
  const [bodyProfile,setBodyProfile]=useState<SourceGeometryProbe|null>(null);
  const [cornerProfile,setCornerProfile]=useState<SourceGeometryProbe|null>(null);
  const [modelReady,setModelReady]=useState(false);
  const [error,setError]=useState('');
  const [reducedMotion,setReducedMotion]=useState(false);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const onChange=()=>setReducedMotion(media.matches);
    media.addEventListener('change',onChange);
    return()=>media.removeEventListener('change',onChange);
  },[]);
  useEffect(()=>{
    let frame=0;
    const update=()=>{
      frame=0;
      const node=track.current;
      if(!node)return;
      const rect=node.getBoundingClientRect();
      setProgress(clamp(-rect.top/Math.max(1,rect.height-window.innerHeight)));
    };
    const schedule=()=>{if(!frame)frame=window.requestAnimationFrame(update);};
    schedule();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    return()=>{
      window.removeEventListener('scroll',schedule);
      window.removeEventListener('resize',schedule);
      if(frame)window.cancelAnimationFrame(frame);
    };
  },[]);
  const fit=useMemo(()=>{
    if(!source||!bodyProfile||!cornerProfile)return {value:null as ReturnType<typeof fitOwnerShellToOriginalP28>|null,error:''};
    try{return {value:fitOwnerShellToOriginalP28(bodyProfile,cornerProfile),error:''};}
    catch(cause){return {value:null,error:cause instanceof Error?cause.message:String(cause)};}
  },[source,bodyProfile,cornerProfile]);
  const pose=storyAtProgress(progress);
  const chapter=STORY_CHAPTERS[pose.index];
  const state=chapterReadiness(chapter,Boolean(source&&cornerProfile),Boolean(fit.value));
  const handleBodyProfile=useCallback((p:SourceGeometryProbe)=>setBodyProfile(p),[]);
  const handleCornerProfile=useCallback((p:SourceGeometryProbe)=>setCornerProfile(p),[]);
  const handleReady=useCallback(()=>setModelReady(true),[]);
  const handleError=useCallback((message:string)=>setError(message),[]);
  const jump=useCallback((index:number)=>{
    const section=track.current;
    if(!section)return;
    const top=window.scrollY+section.getBoundingClientRect().top;
    const travel=Math.max(0,section.offsetHeight-window.innerHeight);
    window.scrollTo({
      top:top+travel*(index/(STORY_COUNT-1)),
      behavior:reducedMotion?'instant':'smooth'
    });
  },[reducedMotion]);
  const handleManifest=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];
    if(!file)return;
    setError('');setSource(null);setCornerProfile(null);setManifest(null);
    try{
      if(file.size>MAX_MANIFEST_BYTES)throw Error('P2.8 manifest exceeds 5 MiB');
      const parsed=JSON.parse(await file.text()) as unknown;
      const check=readManifest(parsed);
      if(check.scope!=='front-corner'||check.parts.length!==59)
        throw Error('This story requires the authentic 59-part P2.8 front-corner manifest');
      setManifest(parsed);
    }catch(cause){setError(cause instanceof Error?cause.message:String(cause));}
    finally{event.target.value='';}
  };
  const handleGlb=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];
    if(!file)return;
    setError('');setSource(null);setCornerProfile(null);
    try{
      if(!manifest)throw Error('Select the original P2.8 manifest first');
      const verified=await verifyCadSource(manifest,file);
      if(verified.scope!=='front-corner'||verified.parts.length!==59)
        throw Error('Source is not the original P2.8 front corner');
      setSource(verified);
    }catch(cause){setError(cause instanceof Error?cause.message:String(cause));}
    finally{event.target.value='';}
  };
  const theme=chapter.light?'light':'dark';
  return <div className={'peds-fullstory peds-fullstory--'+theme}>
    <a className="peds-fullstory-skip" href="#peds-fullstory-end">Skip the 3D story</a>
    <section className="peds-fullstory-track" ref={track}
      style={{height:(STORY_COUNT*135)+'svh'}} aria-label="18-chapter F1 engineering story">
      <div className="peds-fullstory-sticky">
        <div className="peds-fullstory-viewport">
          <Suspense fallback={<p className="peds-fullstory-loading">LOADING THREE.JS…</p>}>
            <Stage source={source} measuredFit={fit.value} progress={progress}
              onBodyProbe={handleBodyProfile} onCornerProbe={handleCornerProfile}
              onError={handleError} onBodyReady={handleReady}/>
          </Suspense>
        </div>
        <div className="peds-fullstory-shade" aria-hidden="true"/>
        <header className="peds-fullstory-header">
          <Link to="/engineering" aria-label="Engineering lab">PODIUM <strong>EDS</strong></Link>
          <span>ENGINEERING / FULL CAR VISUAL REVIEW</span>
          <Link to="/engineering/assembly-preview">CAD INSPECTOR</Link>
        </header>
        <div className="peds-fullstory-content">
          <p className="peds-fullstory-eyebrow">CHAPTER {chapter.number} / 17</p>
          <h1 key={chapter.id}>{chapter.title}</h1>
          <p className="peds-fullstory-caption">{chapter.detail}</p>
          <p className="peds-fullstory-source" data-coverage={state}>
            {state==='MODEL_B_EXTERIOR'?'MODEL B EXTERIOR · VISUAL REFERENCE':
             state==='P28_VISUAL_ONLY'?'ORIGINAL P2.8 · FRONT +Z VISUAL FIT':
             'SOURCE CAD NOT AVAILABLE · NO REPLACEMENT GEOMETRY'}
          </p>
        </div>
        <nav className="peds-fullstory-chapters" aria-label="18-chapter navigation">
          {STORY_CHAPTERS.map((item,i)=>
            <button key={item.id} type="button" onClick={()=>jump(i)}
              aria-label={item.number+' '+item.title}
              aria-current={pose.index===i?'step':undefined}
              className={pose.index===i?'active':''} title={item.title}>
              {item.number}
            </button>)}
        </nav>
        <aside className="peds-fullstory-source-panel" aria-label="Original owner CAD sources">
          <strong>ORIGINAL SOURCE / LOCAL ONLY</strong>
          <label>01 · P2.8 MANIFEST
            <input type="file" accept=".json,application/json" onChange={event=>{void handleManifest(event);}}/>
          </label>
          <label>02 · MATCHING CAD GLB
            <input type="file" accept=".glb,model/gltf-binary" disabled={!manifest}
              onChange={event=>{void handleGlb(event);}}/>
          </label>
          <small>{!source?'Model B exterior loads without CAD; internal hardware stays missing.':
            !fit.value?'P2.8 SHA accepted · metric wheel calibration pending or failed.':
            'Original 59-part P2.8 visible at measured front +Z wheel · mechanical G2 HOLD.'}</small>
          {fit.error&&<small className="peds-fullstory-error">{fit.error}</small>}
          {error&&<small className="peds-fullstory-error" role="alert">{error}</small>}
        </aside>
        <footer className="peds-fullstory-footer">
          <span>{modelReady?'MODEL B LOADED':'LOADING MODEL B'}</span>
          <div className="peds-fullstory-progress" aria-hidden="true">
            <i style={{transform:'scaleX('+progress+')'}}/>
          </div>
          <strong>{Math.round(progress*100)}%</strong>
          <span>G2 HOLD · DEV ONLY</span>
        </footer>
      </div>
    </section>
    <section id="peds-fullstory-end" className="peds-fullstory-end">
      <p>END OF VISUAL REVIEW / 18 CHAPTERS</p>
      <h2>ASSEMBLY IS NOT CERTIFIED</h2>
      <p>Model B is an exterior showroom shell. Only the 59 original front-corner
        CAD parts may be inspected when the owner selects a hash-matched P2.8 source.
        Rear mechanisms, power unit and native monocoque hardpoints remain missing.</p>
      <Link to="/engineering/assembly-preview">OPEN SOURCE ASSEMBLY REVIEW</Link>
    </section>
  </div>;
}
