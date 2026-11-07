import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { type CadSource, verifyCadSource, FULL_CAR_SYSTEMS } from './cadSource';
import './cadFirstScroll.css';
// The large WebGL implementation is isolated from the route shell.
const Stage = lazy(() => import('./CadFirstScrollStage'));
type Beat = { group: string; id: string | null; label: string };
const FRONT_SYSTEMS = ['WHEEL','BRAKES','SUSPENSION','UPRIGHT + HUB','FASTENERS + STRUCTURE'];
const MAX_MANIFEST = 5 * 1024 * 1024;
const clamp = (x: number) => Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
function beatsFor(source: CadSource): Beat[] {
  const groups = source.scope === 'full-car' ? [...FULL_CAR_SYSTEMS] : FRONT_SYSTEMS;
  const result: Beat[] = [{group:source.scope === 'full-car'?'FULL CAR':'FRONT CORNER',id:null,label:'SOURCE ASSEMBLY'}];
  for (const group of groups) {
    const members = source.parts.filter(p => p.system === group);
    if (!members.length) continue;
    result.push({group,id:null,label:'ASSEMBLY'});
    for (const part of members) result.push({group,id:part.node,label:part.label});
  }
  result.push({group:'REASSEMBLY',id:null,label:'RETURN TO SOURCE POSE'});
  return result;
}
export default function CadFirstFullCarScrollPage() {
  const track = useRef<HTMLElement>(null);
  const [manifest, setManifest] = useState<unknown>(null);
  const [source, setSource] = useState<CadSource | null>(null);
  const [error,setError] = useState('');
  const [progress,setProgress] = useState(0);
  const [quality,setQuality] = useState('SOURCE QUALITY');
  const [glbReady,setGlbReady] = useState(false);
  const [stageError,setStageError] = useState('');
  const [reducedMotion,setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m=matchMedia('(prefers-reduced-motion: reduce)');
    const change=()=>setReducedMotion(m.matches);
    m.addEventListener('change',change);return()=>m.removeEventListener('change',change);
  },[]);
  useEffect(()=>{
    let frame=0;
    const update=()=>{
      frame=0;const el=track.current;if(!el)return;
      const rect=el.getBoundingClientRect();
      setProgress(clamp(-rect.top/Math.max(1,rect.height-innerHeight)));
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    schedule();addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
    return()=>{removeEventListener('scroll',schedule);removeEventListener('resize',schedule);if(frame)cancelAnimationFrame(frame);};
  },[source]);
  const beats=useMemo(()=>source?beatsFor(source):[],[source]);
  const index=beats.length?Math.min(beats.length-1,Math.floor(progress*beats.length)):0;
  const beat=beats[index];
  const onManifest=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setSource(null);setGlbReady(false);setError('');setManifest(null);
    try {
      if(file.size>MAX_MANIFEST)throw Error('Manifest exceeds 5 MB');
      setManifest(JSON.parse(await file.text()) as unknown);
    }catch(e){setError(String(e));}
  };
  const onGlb=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setSource(null);setGlbReady(false);setError('');setStageError('');
    try{
      const validated=await verifyCadSource(manifest,file);
      setQuality(validated.profile);
      setSource(validated);
    }catch(e){setError(String(e));}
  };
  const onAudit=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file||!source)return;
    setError('');
    try {
      const result=await verifyCadSource(source.manifest,new File([source.glbBytes],source.fileName,{type:'model/gltf-binary'}),file);
      setSource(result);
    } catch(e){setError(String(e));}
  };
  const jump=useCallback((n:number)=>{
    const el=track.current;if(!el||!beats.length)return;
    const top=scrollY+el.getBoundingClientRect().top;
    scrollTo({top:top+(n/beats.length)*Math.max(1,el.offsetHeight-innerHeight),behavior:reducedMotion?'instant':'smooth'});
  },[beats.length,reducedMotion]);
  const canView=Boolean(source);
  const subtitle=source?.scope==='full-car'?'VERIFIED WHOLE-CAR CAD-FIRST':'59-SOLID FRONT CORNER · WHOLE CAR NOT BUILT';
  return <div className="cadscroll">
    <a href="#cadscroll-end" className="cadscroll-skip">Skip CAD scroll</a>
    <section className="cadscroll-track" ref={track} style={{height:(canView?Math.max(24,beats.length*0.72):4)*100+'svh'}}>
      <div className="cadscroll-sticky">
        <div className="cadscroll-canvas">
          {source ? <Suspense fallback={<div className="cadscroll-state">LOADING CAD...</div>}>
            <Stage key={source.fileName+quality} source={source} focus={beat?.id??null} onReady={()=>setGlbReady(true)} onError={setStageError} />
          </Suspense> : <div className="cadscroll-state"><strong>CAD-FIRST / P1–P5</strong>
            <span>LOAD SOURCE GLB, NOT MODEL B OR R4.5</span>
          </div>}
        </div>
        <div className="cadscroll-overlay"/>
        <header className="cadscroll-head">
          <Link to="/engineering" aria-label="Engineering home">PODIUM <em>EDS</em></Link>
          <span>ENGINEERING / CAD-FIRST</span><Link to="/engineering">EXIT</Link>
        </header>
        <section className="cadscroll-label">
          <span>{source?subtitle:'SOURCE REQUIRED'}</span>
          <h1>{source?(beat?.group??'CAD-FIRST'):'INSIDE THE MACHINE'}</h1>
          <p>{source?(beat?.label??'SOURCE ASSEMBLY'):'NO FABRICATED FULL-CAR MODEL'}</p>
        </section>
        {!canView && <div className="cadscroll-import" aria-label="CAD-first source input">
          <label>01 · CAD MANIFEST <input type="file" accept=".json,application/json" onChange={event=>{void onManifest(event);}} /></label>
          <label>02 · SOURCE GLB <input type="file" accept=".glb,model/gltf-binary" disabled={!manifest} onChange={event=>{void onGlb(event);}}/></label>
          <small>59 solids = front corner, not a complete vehicle. Full-car walkthrough requires a complete CAD-first manifest.</small>
        </div>}
        {source && <nav className="cadscroll-rail" aria-label="CAD part navigator">
          {beats.filter((b,i)=>i===0||b.group!==beats[i-1].group).map(b=>{
            const n=beats.indexOf(b);
            return <button key={n} type="button" className={beat?.group===b.group?'current':''} onClick={()=>jump(n)}
              aria-label={b.group} aria-current={beat?.group===b.group?'step':undefined}/>;
          })}
        </nav>}
        <footer className="cadscroll-foot">
          <span>{source?String(Math.round(progress*100)).padStart(3,'0')+'%':'P1 → P5'}</span>
          <div className="cadscroll-bar"><i style={{width:Math.round(progress*100)+'%'}} /></div>
          <span>{source?quality:'CAD SOURCE'}</span>
          {source && <label className="cadscroll-audit">STATIC AUDIT <input type="file" accept=".json" onChange={event=>{void onAudit(event);}}/> {source.auditVerified?'SHA PASS':'NOT VERIFIED'}</label>}
        </footer>
        {(error||stageError)&&<p className="cadscroll-error" role="alert">{error||stageError}</p>}
        {source&&!glbReady&&!stageError&&<div className="cadscroll-loading">DECODING VERIFIED CAD...</div>}
      </div>
    </section>
    <section id="cadscroll-end" className="cadscroll-end"><span>CAD-FIRST / SOURCE-TRUTH</span>
      <h2>{source?.scope==='full-car'?'WHOLE CAR. EVERY SYSTEM.':'FRONT CORNER VERIFIED. FULL CAR PENDING.'}</h2>
      <p>CAD geometry provenance and browser rendering are separate acceptance gates.</p>
      <Link to="/engineering">BACK TO CAD LAB</Link>
    </section>
  </div>;
}
