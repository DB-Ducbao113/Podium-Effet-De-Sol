import { lazy, Suspense, useCallback, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { type CadSource, readManifest, verifyCadSource } from '../cadFirstScroll/cadSource';
import { checkedPlacement, INITIAL_PLACEMENT, type Placement } from './assemblyPlacement';
import {registerOwnerLandmarks,type RegistrationInput,type RegistrationResult} from './assemblyRegistration';
import './assemblyPreview.css';

const Stage=lazy(()=>import('./AssemblyPreviewStage'));
type SourceManifest=unknown;
const MAX_MANIFEST=5*1024*1024;
const axis=['X','Y','Z'] as const;
function NumericAxis({name,value,onChange,step=.01}:{
  name:string;value:number;onChange:(n:number)=>void;step?:number;
}) {
  return <label>{name}<input type="number" step={step} value={value}
    onChange={event=>{const n=Number(event.target.value);if(event.target.value!==''&&Number.isFinite(n))onChange(n);}}/></label>;
}

export default function AssemblyPreviewPage(){
  const [manifest,setManifest]=useState<SourceManifest>(null);
  const [source,setSource]=useState<CadSource|null>(null);
  const [error,setError]=useState('');
  const [info,setInfo]=useState('MODEL B EXTERIOR · P2.8 SOURCE NOT LOADED');
  const [placement,setPlacement]=useState<Placement>(INITIAL_PLACEMENT);
  const [opacity,setOpacity]=useState(1);
  const [part,setPart]=useState<string|null>(null);
  const [registration,setRegistration]=useState<RegistrationResult|null>(null);
  const [registrationEvidence,setRegistrationEvidence]=useState('');
  const [busy,setBusy]=useState(false);
  const showError=useCallback((message:string)=>setError(message),[]);
  const showInfo=useCallback((message:string)=>setInfo(message),[]);
  const updateAxis=(kind:'translationM'|'rotationDeg',i:number,v:number)=>{
    setPlacement(p=>checkedPlacement({...p,[kind]:p[kind].map((x,j)=>j===i?v:x)} as Placement));
  };
  const importManifest=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setError('');setManifest(null);setSource(null);setPart(null);setRegistration(null);
    try{
      if(file.size>MAX_MANIFEST)throw Error('Source manifest exceeds 5 MB');
      const data=JSON.parse(await file.text()) as unknown;
      const parsed=readManifest(data);
      if(parsed.scope!=='front-corner'||parsed.parts.length!==59)
        throw Error('Select the project-authored P2.8 59-solid manifest, not a whole car or older source');
      setManifest(data);
      setInfo('P2.8 MANIFEST READY · SELECT A MATCHING HIGH / BALANCED / PERFORMANCE GLB');
    }catch(err){setError(String(err));}finally{event.target.value='';}
  };
  const importGLB=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setError('');setSource(null);setPart(null);setRegistration(null);setBusy(true);
    try {
      if(!manifest)throw Error('Load P2.8 manifest first');
      // Reuse the existing byte-length, embedded-resource and cryptographic SHA gate.
      const verified=await verifyCadSource(manifest,file);
      if(verified.scope!=='front-corner'||verified.parts.length!==59)throw Error('Not P2.8');
      setSource(verified);
      setPlacement(INITIAL_PLACEMENT);
      setInfo('SOURCE VERIFIED · STAGING OUTSIDE CAR · NO MECHANICAL MATE');
    }catch(err){setError(String(err));}finally{setBusy(false);event.target.value='';}
  };
  const importLandmarks=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setError('');setRegistration(null);
    try{
      if(!source)throw Error('Load original P2.8 before registration');
      if(file.size>1024*1024)throw Error('Landmark file too large');
      const data=JSON.parse(await file.text()) as RegistrationInput;
      const result=registerOwnerLandmarks(data);
      // Project preview tolerance, NOT a validated manufacturing allowance.
      if(result.lengthMismatchM>.005||result.maxResidualM>.005){
        throw Error('Rigid fit mismatch exceeds 5 mm review threshold; refusing to scale the original CAD');
      }
      setRegistration(result);
      setRegistrationEvidence(data.evidence);
      setPlacement({...INITIAL_PLACEMENT,displayedAtBodyCenter:true});
      setInfo('LANDMARK-ALIGNED GRAPHICS · MECHANICAL FIT STILL HOLD');
    }catch(err){setError(String(err));}finally{event.target.value='';}
  };
  const exportPlacement=()=>{
    if(!source)return;
    const record={
      schema:'podium-eds.assembly-preview.placement.v1',
      release:'DEV_ONLY_NO_RELEASE',
      vehicleShell:'apps/web/public/models/model-b-eds-optimized-v1.glb',
      cornerManifestSchema:source.manifest.schema,
      cornerFile:source.fileName,
      cornerProfile:source.profile,
      cornerSha256:source.manifest.profiles[source.profile]?.sha256,
      p28PartCount:source.parts.length,
      unit:'metres',scale:1,
      placement:checkedPlacement(placement),
      landmarkRegistration:registration,
      landmarkEvidence:registrationEvidence,
      ownerHardpointMeasurements:null,
      coordinateMappingVerified:false,
      staticBrepInterferenceTestedAgainstModelB:false,
      assemblyMateValidated:false,
      qualityGate:'HOLD',
      note:'Graphics-only root transform. No automatic fit, fabrication claim, or acceptance.'
    };
    const file=new Blob([JSON.stringify(record,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(file);
    const a=document.createElement('a');a.href=url;a.download='peds-model-b-p28-placement-review.json';a.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <div className="peds-assembly">
    <header className="peds-assembly-top">
      <Link to="/engineering">PODIUM EDS / ENGINEERING</Link>
      <strong>MODEL B + P2.8 / OWNER SOURCE</strong>
      <span>DEV ONLY · G2 HOLD</span>
    </header>
    <main className="peds-assembly-main">
      <section className="peds-assembly-view" aria-label="Live 3D visual assembly staging">
        <Suspense fallback={<p>Loading Three.js preview…</p>}>
          <Stage source={source} placement={placement} shellOpacity={opacity} selectedPart={part}
            registration={registration}
            onError={showError} onInfo={showInfo}/>
        </Suspense>
        <div className="peds-assembly-caption">
          <strong>ORIGINAL MODEL B EXTERIOR</strong>
          <span>{info}</span>
          {error&&<p role="alert">{error}</p>}
        </div>
      </section>
      <aside className="peds-assembly-controls">
        <h1>Original parts. One car.</h1>
        <p>Keep the existing Showroom Model B as the visual shell. Import only the exact P2.8 CAD-derived GLB with its SHA-verified source manifest. No car-body reconstruction.</p>
        <div className="peds-assembly-controls-section">
          <h2>01 / Original CAD data</h2>
          <label>P2.8 manifest (.json)<input type="file" accept=".json,application/json"
            onChange={e=>{void importManifest(e);}}/></label>
          <label>P2.8 source GLB (.glb)<input type="file" accept=".glb,model/gltf-binary"
            disabled={!manifest||busy} onChange={e=>{void importGLB(e);}}/></label>
          <small>Owner-only P28_remate_manifest.json + P28_integrated_balanced.glb (or another SHA-matching tier). Files stay local in the browser.</small>
        </div>
        <div className="peds-assembly-controls-section">
          <h2>02 / Geometry inspection</h2>
          <label>Original exterior opacity · {Math.round(opacity*100)}%
            <input type="range" min="0" max="1" step=".05" value={opacity}
              onChange={e=>setOpacity(Number(e.target.value))}/></label>
          <label>Source part isolation
            <select value={part??''} disabled={!source} onChange={e=>setPart(e.target.value||null)}>
              <option value="">All 59 original source parts</option>
              {source?.parts.map(p=><option key={p.id} value={p.node}>{p.label}</option>)}
            </select>
          </label>
        </div>
        <div className="peds-assembly-controls-section">
          <h2>03 / Placement (not mechanical mating)</h2>
          <label>Measured source / target landmarks (.json)
            <input type="file" accept=".json,application/json" disabled={!source}
              onChange={e=>{void importLandmarks(e);}}/>
          </label>
          <small>Optional measured rigid placement: 3+ unique 3D point pairs in metres (P2.8 GLB-local → Model B-local). Rejects scale mismatch over 5 mm. No hardpoints are invented.</small>
          {registration&&<p>Visual registration: max residual {(registration.maxResidualM*1000).toFixed(2)} mm; source length mismatch {(registration.lengthMismatchM*1000).toFixed(2)} mm. Mechanical review remains HOLD.</p>}
          <label>Display mode
            <select value={placement.displayedAtBodyCenter?'center':'staging'}
              onChange={e=>{setRegistration(null);setRegistrationEvidence('');setPlacement(p=>({...p,displayedAtBodyCenter:e.target.value==='center'}));}} disabled={!source}>
              <option value="staging">Separate P2.8 beside Model B (safe default)</option>
              <option value="center">Overlay at graphical center — unverified</option>
            </select>
          </label>
          <small>GLB scale = 1. Translation and Euler angles move the original assembly as a single rigid group. Nothing is welded or deformed.</small>
          <div className="peds-assembly-axes">
            {axis.map((a,i)=><NumericAxis key={a} name={a+' · metres'} value={placement.translationM[i]}
              onChange={v=>updateAxis('translationM',i,v)}/>)}
          </div>
          <div className="peds-assembly-axes">
            {axis.map((a,i)=><NumericAxis key={a} name={a+' · degrees'} step={1}
              value={placement.rotationDeg[i]} onChange={v=>updateAxis('rotationDeg',i,v)}/>)}
          </div>
          <div className="peds-assembly-actions">
            <button type="button" onClick={()=>{setPlacement(INITIAL_PLACEMENT);setPart(null);setOpacity(1);setRegistration(null);setRegistrationEvidence('');}}>RESET</button>
            <button type="button" onClick={exportPlacement} disabled={!source}>EXPORT PLACEMENT JSON</button>
          </div>
        </div>
        <p className="peds-assembly-warning"><strong>HOLD:</strong> P2.8 static geometry has a local audit, but its STEP/GLB source binaries are not stored in the public repo. Hardpoints, axle orientation, assembly clearances and load paths against Model B are NOT verified. Shell display is not a complete engineering mate.</p>
      </aside>
    </main>
  </div>;
}
