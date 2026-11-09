import { lazy, Suspense, useCallback, useMemo, useEffect, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { type CadSource, readManifest, verifyCadSource } from '../cadFirstScroll/cadSource';
import { checkedPlacement, INITIAL_PLACEMENT, type Placement } from './assemblyPlacement';
import {registerOwnerLandmarks,type Landmark,type RegistrationInput,type RegistrationResult} from './assemblyRegistration';
import type { SourceGeometryProbe } from './geometryProbe';
import {fitOwnerShellToOriginalP28} from './ownerMeasuredFit';
import { layoutFourCorners, wheelLayoutReport, type WheelId } from './fourCornerLayout';
import type { CornerPresentation } from './cadPresentation';
import { readRearUprightManifest, verifyRearUprightSource,
  type RearUprightManifest, type RearUprightSource } from './rearUprightSource';
import { readRearSuspensionManifest, verifyRearSuspensionSource,
  type RearSuspensionManifest, type RearSuspensionSource } from './rearSuspensionSource';
import { readRearToeManifest, verifyRearToeSource,
  type RearToeManifest, type RearToeSource } from './rearToeSource';
import {readToeAdjusterManifest,verifyToeAdjusterSource,
  type ToeAdjusterManifest,type ToeAdjusterSource} from './rearToeAdjusterSource';
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
  const [rearManifest,setRearManifest]=useState<RearUprightManifest|null>(null);
  const [rearUprightSource,setRearUprightSource]=useState<RearUprightSource|null>(null);
  const [rearBusy,setRearBusy]=useState(false);
  const [rearSuspensionManifest,setRearSuspensionManifest]=useState<RearSuspensionManifest|null>(null);
  const [rearSuspensionSource,setRearSuspensionSource]=useState<RearSuspensionSource|null>(null);
  const [rearSuspensionBusy,setRearSuspensionBusy]=useState(false);
  const [rearToeManifest,setRearToeManifest]=useState<RearToeManifest|null>(null);
  const [rearToeSource,setRearToeSource]=useState<RearToeSource|null>(null);
  const [rearToeBusy,setRearToeBusy]=useState(false);
  const [toeAdjusterManifest,setToeAdjusterManifest]=useState<ToeAdjusterManifest|null>(null);
  const [toeAdjusterSource,setToeAdjusterSource]=useState<ToeAdjusterSource|null>(null);
  const [toeAdjusterBusy,setToeAdjusterBusy]=useState(false);
  const [error,setError]=useState('');
  const [info,setInfo]=useState('MODEL B EXTERIOR · P2.8 SOURCE NOT LOADED');
  const [placement,setPlacement]=useState<Placement>(INITIAL_PLACEMENT);
  const [opacity,setOpacity]=useState(1);
  const [part,setPart]=useState<string|null>(null);
  const [cameraFocus,setCameraFocus]=useState<'whole-car'|'wheel-macro'|'fastener-macro'>('whole-car');
  const [cornerPresentation,setCornerPresentation]=useState<CornerPresentation>('assembled');
  const [technicalMaterials,setTechnicalMaterials]=useState(true);
  const [allFourWheelsEnabled,setAllFourWheelsEnabled]=useState(true);
  const [showroomWheelWindowsEnabled,setShowroomWheelWindowsEnabled]=useState(true);
  const [activeWheelId,setActiveWheelId]=useState<WheelId>('front-positive-z');
  const [registration,setRegistration]=useState<RegistrationResult|null>(null);
  const [registrationEvidence,setRegistrationEvidence]=useState('');
  const [busy,setBusy]=useState(false);
  const [bodyPartNames,setBodyPartNames]=useState<string[]>([]);
  const [bodyProbe,setBodyProbe]=useState<SourceGeometryProbe|null>(null);
  const [measuredOverlayEnabled,setMeasuredOverlayEnabled]=useState(true);
  const [cornerProbe,setCornerProbe]=useState<SourceGeometryProbe|null>(null);
  const [hiddenBodyMeshes,setHiddenBodyMeshes]=useState<number[]>([]);
  const [bodyMeshFilter,setBodyMeshFilter]=useState('');
  const [resolvedTransform,setResolvedTransform]=useState<{
    translationM:[number,number,number];
    rotationQuaternion:[number,number,number,number];
    stagingBasis:'separate'|'graphic_center'|'landmarks'|'measured_wheel';
    scale:1;modelBShellUnitScale:number;
  }|null>(null);
  const [pickMode,setPickMode]=useState<'off'|'modelb'|'p28'>('off');
  const [pickedBody,setPickedBody]=useState<[number,number,number]|null>(null);
  const [pickedCorner,setPickedCorner]=useState<[number,number,number]|null>(null);
  const [draftLandmarks,setDraftLandmarks]=useState<Landmark[]>([]);
  const [landmarkEvidence,setLandmarkEvidence]=useState('');
  const calibration=useMemo(()=>{
    if(!bodyProbe||!cornerProbe)return {fit:null,error:''};
    try{return {fit:fitOwnerShellToOriginalP28(bodyProbe,cornerProbe),error:''};}
    catch(err){return {fit:null,error:err instanceof Error?err.message:String(err)};}
  },[bodyProbe,cornerProbe]);
  const wheelMounts=useMemo(()=>calibration.fit?layoutFourCorners(calibration.fit):[],
    [calibration.fit]);
  useEffect(()=>{
    if(calibration.fit && measuredOverlayEnabled){
      setOpacity(.27); // See original P2.8 fasteners underneath the semi-transparent source shell.
    }
  },[calibration.fit,measuredOverlayEnabled]);
  const showError=useCallback((message:string)=>setError(message),[]);
  const showInfo=useCallback((message:string)=>setInfo(message),[]);
  const recordBodyParts=useCallback((names:string[])=>setBodyPartNames(names),[]);
  const onGeometryProbe=useCallback((profile:SourceGeometryProbe)=>{
    if(profile.source==='model-b')setBodyProbe(profile);else setCornerProbe(profile);
  },[]);
  const onResolvedTransform=useCallback((transform:{
    translationM:[number,number,number];
    rotationQuaternion:[number,number,number,number];
    stagingBasis:'separate'|'graphic_center'|'landmarks'|'measured_wheel';
    scale:1;modelBShellUnitScale:number;
  })=>setResolvedTransform(transform),[]);
  const onPointPick=useCallback((target:'modelb'|'p28',point:[number,number,number],mesh:string)=>{
    if(target==='modelb')setPickedBody(point);
    else setPickedCorner(point);
    setPickMode('off');
    setInfo(`SELECTED ${target.toUpperCase()} / ${mesh} · local metres`);
  },[]);
  const updateAxis=(kind:'translationM'|'rotationDeg',i:number,v:number)=>{
    setPlacement(p=>checkedPlacement({...p,[kind]:p[kind].map((x,j)=>j===i?v:x)} as Placement));
  };
  const exportGeometryProbe=()=>{
    if(!bodyProbe||!cornerProbe)return;
    const bytes=JSON.stringify({
      schema:'podium-eds.owner-source.geometry-dual-profile.v1',
      modelB:bodyProbe,p28:cornerProbe,
      physicalMateCertified:false,
      diagnostic:'Decoded original vertices, NOT an engineering mating certificate',
    });
    const url=URL.createObjectURL(new Blob([bytes+'\n'],{type:'application/json'}));
    const a=document.createElement('a');a.download='peds-modelb-p28-real-geometry.json';
    a.href=url;a.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const importManifest=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setError('');setManifest(null);setSource(null);setRearUprightSource(null);setRearSuspensionSource(null);setRearToeSource(null);setToeAdjusterSource(null);setPart(null);setCornerProbe(null);setRegistration(null);setResolvedTransform(null);setDraftLandmarks([]);setPickedBody(null);setPickedCorner(null);setPickMode('off');
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
    setError('');setSource(null);setRearUprightSource(null);setRearSuspensionSource(null);setRearToeSource(null);setToeAdjusterSource(null);setPart(null);setCornerProbe(null);setRegistration(null);setDraftLandmarks([]);setPickedBody(null);setPickedCorner(null);setPickMode('off');setBusy(true);
    try {
      if(!manifest)throw Error('Load P2.8 manifest first');
      // Reuse the existing byte-length, embedded-resource and cryptographic SHA gate.
      const verified=await verifyCadSource(manifest,file);
      if(verified.scope!=='front-corner'||verified.parts.length!==59)throw Error('Not P2.8');
      setSource(verified);
      setPlacement(INITIAL_PLACEMENT);
      setInfo('GLB HASH MATCHES OWNER MANIFEST · NO INDEPENDENT CAD MATE');
    }catch(err){setError(String(err));}finally{setBusy(false);event.target.value='';}
  };
  const importRearManifest=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setError('');setRearManifest(null);setRearUprightSource(null);
    try{
      if(file.size>MAX_MANIFEST)throw Error('P2.9 manifest too large');
      const parsed=readRearUprightManifest(JSON.parse(await file.text()) as unknown);
      setRearManifest(parsed);
      setInfo('P2.9 ORIGINAL REAR UPRIGHT SOURCE MANIFEST READY · MECHANICAL G2 HOLD');
    }catch(err){setError(String(err));}finally{event.target.value='';}
  };
  const importRearGLB=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setError('');setRearUprightSource(null);setRearBusy(true);
    try {
      if(!source||!calibration.fit||!rearManifest)
        throw Error('Load the original P2.8 source and P2.9 manifest first');
      const verified=await verifyRearUprightSource(rearManifest,file);
      setRearUprightSource(verified);
      setAllFourWheelsEnabled(true);
      setMeasuredOverlayEnabled(true);
      setInfo('P2.9 REAR UPRIGHT SOURCE VERIFIED · TWO REAR GRAPHIC PLACEMENTS · G2 HOLD');
    }catch(err){setError(String(err));}finally{setRearBusy(false);event.target.value='';}
  };
  const importRearSuspensionManifest=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setError('');setRearSuspensionManifest(null);setRearSuspensionSource(null);
    try{
      if(file.size>MAX_MANIFEST)throw Error('P2.10 manifest too large');
      const sourceManifest=readRearSuspensionManifest(JSON.parse(await file.text()) as unknown);
      setRearSuspensionManifest(sourceManifest);
      setInfo('P210 REAR DOUBLE WISHBONE SOURCE MANIFEST VERIFIED / G2 HOLD');
    }catch(err){setError(String(err));}finally{event.target.value='';}
  };
  const importRearSuspensionGLB=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setError('');setRearSuspensionSource(null);setRearSuspensionBusy(true);
    try{
      if(!source||!calibration.fit||!rearSuspensionManifest)
        throw Error('P2.8 owner source + P2.10 original manifest required before import');
      const verified=await verifyRearSuspensionSource(rearSuspensionManifest,file);
      setRearSuspensionSource(verified);
      setAllFourWheelsEnabled(true);
      setMeasuredOverlayEnabled(true);
      setInfo('P210 REAR DOUBLE WISHBONE HASH VERIFIED / WAITING FOR 11 MESHES / G2 HOLD');
    }catch(err){setError(String(err));}finally{setRearSuspensionBusy(false);event.target.value='';}
  };
  const importRearToeManifest=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setError('');setRearToeManifest(null);setRearToeSource(null);
    try{
      if(file.size>MAX_MANIFEST)throw Error('P2.11 manifest too large');
      const parsed=readRearToeManifest(JSON.parse(await file.text()) as unknown);
      setRearToeManifest(parsed);
      setInfo('P211 ORIGINAL REAR TOE STATIC MANIFEST READY / G2 HOLD');
    }catch(err){setError(String(err));}finally{event.target.value='';}
  };
  const importRearToeGLB=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setError('');setRearToeSource(null);setRearToeBusy(true);
    try{
      if(!source||!calibration.fit||!rearToeManifest)
        throw Error('Original P2.8 wheel source + verified P2.11 manifest required');
      const verified=await verifyRearToeSource(rearToeManifest,file);
      setRearToeSource(verified);
      setAllFourWheelsEnabled(true);
      setMeasuredOverlayEnabled(true);
      setInfo('P211 SOURCE SHA VERIFIED / WAITING TO PARSE 15 MESHES / G2 HOLD');
    }catch(err){setError(String(err));}finally{setRearToeBusy(false);event.target.value='';}
  };
  const importToeAdjusterManifest=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setError('');setToeAdjusterManifest(null);setToeAdjusterSource(null);
    try{
      if(file.size>MAX_MANIFEST)throw Error('P2.12 manifest exceeds 5 MB');
      const checked=readToeAdjusterManifest(JSON.parse(await file.text()) as unknown);
      setToeAdjusterManifest(checked);
      setInfo('P212 ORIGINAL REAR TOE ADJUSTER SOURCE MANIFEST VERIFIED / G2 HOLD');
    }catch(err){setError(String(err));}finally{event.target.value='';}
  };
  const importToeAdjusterGLB=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    setError('');setToeAdjusterSource(null);setToeAdjusterBusy(true);
    try{
      if(!source||!calibration.fit||!toeAdjusterManifest)
        throw Error('P2.8 wheel source and P2.12 verified manifest required');
      const verified=await verifyToeAdjusterSource(toeAdjusterManifest,file);
      setToeAdjusterSource(verified);
      setAllFourWheelsEnabled(true);
      setMeasuredOverlayEnabled(true);
      setInfo('P212 REAR ADJUSTER SHA VERIFIED / 19 MESHES LOADING / G2 HOLD');
    }catch(err){setError(String(err));}finally{setToeAdjusterBusy(false);event.target.value='';}
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
  const addLandmarkPair=()=>{
    if(!pickedBody||!pickedCorner)return;
    const id='OWNER_PAIR_'+String(draftLandmarks.length+1).padStart(2,'0');
    setDraftLandmarks(items=>[...items,{id,modelBM:pickedBody,p28M:pickedCorner}]);
    setPickedBody(null);setPickedCorner(null);setRegistration(null);
    setInfo('OWNER PICKED PAIR RECORDED · PHYSICAL CORRESPONDENCE NOT CERTIFIED');
  };
  const registerPickedPairs=()=>{
    setError('');
    try{
      if(!source)throw Error('P2.8 source is missing');
      const data:RegistrationInput={
        schema:'podium-eds.modelb-p28.landmarks.v1',
        sourceUnits:'m',targetUnits:'m',sourceScale:1,
        landmarks:draftLandmarks,evidence:landmarkEvidence.trim()
      };
      const result=registerOwnerLandmarks(data);
      if(result.maxResidualM>.005||result.lengthMismatchM>.005)
        throw Error('Picked points differ by >5mm; correct the physical correspondences, never scale CAD');
      setRegistration(result);
      setRegistrationEvidence(data.evidence);
      setPlacement({...INITIAL_PLACEMENT,displayedAtBodyCenter:true});
      setInfo('PICKED LANDMARK REGISTRATION · VISUAL FIT ONLY · MECHANICAL G2 HOLD');
    }catch(e){setError(e instanceof Error?e.message:String(e));}
  };
  const exportPickedPairs=()=>{
    if(draftLandmarks.length===0)return;
    const data:RegistrationInput={schema:'podium-eds.modelb-p28.landmarks.v1',
      sourceUnits:'m',targetUnits:'m',sourceScale:1,
      landmarks:draftLandmarks,evidence:landmarkEvidence||'UNVERIFIED_SURFACE_PICK'};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='peds-owner-measured-landmarks.json';a.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
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
      resolvedOriginalRootTransform:resolvedTransform,
      ownerSourceWheelCalibration:calibration.fit,
      originalModelBGeometryModified:false,
      p28OriginalCadScale:1,
      fourWheelPreviewEnabled:allFourWheelsEnabled,
      rearToeAdjusterProposal:toeAdjusterSource?{
        schema:toeAdjusterSource.manifest.schema,
        fileName:toeAdjusterSource.fileName,
        profile:toeAdjusterSource.profile,
        sourceSha256:toeAdjusterSource.manifest.profiles[toeAdjusterSource.profile].sha256,
        totalCadSolids:19,newParts:5,
        nativeStaticPairCount:toeAdjusterSource.manifest.nativeStaticAudit.pairCount,
        replacedPriorPartId:toeAdjusterSource.manifest.replacedPriorPartId,
        actualChassisToeHardpointMeasured:false,
        fullFemaleThreadProfileModelled:true,
        mechanicalThreadEngagementCertified:false,
        mechanicalMateCertified:false,
        dynamicToeKinematicsCertified:false,
      }:null,
      rearToeLinkProposal:rearToeSource?{
        schema:rearToeSource.manifest.schema,
        fileName:rearToeSource.fileName,
        profile:rearToeSource.profile,
        sourceSha256:rearToeSource.manifest.profiles[rearToeSource.profile].sha256,
        originalNativeStaticPairs:rearToeSource.manifest.nativeStaticAudit.pairCount,
        totalCadSolids:15,newSolids:4,
        actualChassisToeHardpointMeasured:false,
        mechanicalMateCertified:false,dynamicToeKinematicsCertified:false,
      }:null,
      rearSuspensionProposal:rearSuspensionSource?{
        schema:rearSuspensionSource.manifest.schema,
        parentP29SourcePartId:rearSuspensionSource.manifest.parentP29SourcePartId,
        fileName:rearSuspensionSource.fileName,
        profile:rearSuspensionSource.profile,
        sourceSha256:rearSuspensionSource.manifest.profiles[rearSuspensionSource.profile].sha256,
        nativeStaticPairCount:rearSuspensionSource.manifest.nativeStaticAudit.pairCount,
        totalCadSolids:11,
        rearChassisHardpointsMeasured:false,
        mechanicalMatingCertified:false,
        dynamicSuspensionCertified:false,
      }:null,
      rearUprightProposal:rearUprightSource?{
        schema:rearUprightSource.manifest.schema,
        partId:rearUprightSource.manifest.partId,
        fileName:rearUprightSource.fileName,
        profile:rearUprightSource.profile,
        sourceSha256:rearUprightSource.manifest.profiles[rearUprightSource.profile].sha256,
        rearChassisHardpointsMeasured:false,
        structuralRearAssemblyCertified:false,
        mechanicalMatingCertified:false,
      }:null,
      selectedWheelId:activeWheelId,
      fourWheelLayout:calibration.fit?wheelLayoutReport(calibration.fit):null,
      currentCameraFocus:cameraFocus,
      reviewPresentation:cornerPresentation,
      technicalLookdev:technicalMaterials,
      landmarkRegistration:registration,
      landmarkEvidence:registrationEvidence,
      measuredPointPairs:draftLandmarks,
      hiddenBodyMeshIndices: hiddenBodyMeshes,
      bodyMeshIdentityNames: hiddenBodyMeshes.map(i=>bodyPartNames[i]??'UNKNOWN'),
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
          <Stage source={source} rearUprightSource={rearUprightSource}
            rearSuspensionSource={rearSuspensionSource}
            rearToeSource={rearToeSource}
            rearToeAdjusterSource={toeAdjusterSource} placement={placement} shellOpacity={opacity} selectedPart={part}
            cameraFocus={cameraFocus} cornerPresentation={cornerPresentation}
            technicalMaterials={technicalMaterials}
            allFourWheelsEnabled={allFourWheelsEnabled} activeWheelId={activeWheelId}
            showroomWheelWindowsEnabled={showroomWheelWindowsEnabled && measuredOverlayEnabled}
            registration={registration} measuredFit={calibration.fit} measuredOverlayEnabled={measuredOverlayEnabled}
            pickMode={pickMode} onPointPick={onPointPick}
            onError={showError} onInfo={showInfo}
            onBodyPartNames={recordBodyParts} hiddenBodyMeshes={hiddenBodyMeshes}
            onGeometryProbe={onGeometryProbe} p28GeometryProfile={cornerProbe}
            onResolvedTransform={onResolvedTransform}/>
        </Suspense>
        <div className="peds-assembly-caption">
          <strong>ORIGINAL MODEL B EXTERIOR</strong>
          <span>{info}</span>
          {error&&<p role="alert">{error}</p>}
        </div>
      </section>
      <aside className="peds-assembly-controls">
        <h1>Original parts. Assembly review.</h1>
        <p>Keep the existing Showroom Model B as the visual shell. Import only the exact P2.8 CAD-derived GLB with its SHA-verified source manifest. No car-body reconstruction.</p>
        <div className="peds-assembly-controls-section">
          <h2>01 / Original CAD data</h2>
          <label>P2.8 manifest (.json)<input type="file" accept=".json,application/json"
            onChange={e=>{void importManifest(e);}}/></label>
          <label>P2.8 source GLB (.glb)<input type="file" accept=".glb,model/gltf-binary"
            disabled={!manifest||busy} onChange={e=>{void importGLB(e);}}/></label>
          <small>Owner-only P28_remate_manifest.json + P28_integrated_balanced.glb (or another SHA-matching tier). Files stay local in the browser. SHA-matching an owner-supplied manifest does not independently certify CAD authenticity.</small>
        </div>
        <div className="peds-assembly-controls-section" aria-label="P2.9 proposed rear upright source">
          <h2>01B / Original P2.9 rear upright CAD proposal</h2>
          <p>Independent rear bearing carrier and bored upper/lower/toe lugs.
            Generated by the project CAD source, never a reflected front upright.
            Import the generated manifest and SHA-matched GLB to show the carrier
            at both measured rear wheel stations.</p>
          <label>P2.9 rear upright manifest (.json)
            <input type="file" accept=".json,application/json"
              onChange={e=>{void importRearManifest(e);}}/>
          </label>
          <label>P2.9 rear upright GLB (.glb)
            <input type="file" accept=".glb,model/gltf-binary"
              disabled={!rearManifest||!source||!calibration.fit||rearBusy}
              onChange={e=>{void importRearGLB(e);}}/>
          </label>
          <small>{rearUprightSource?
            'P2.9 REAR UPRIGHT LOADED / '+rearUprightSource.profile+
            ' / '+rearUprightSource.manifest.partId:
            'P2.9 source not loaded — existing rear wheel-end visual proxy unchanged.'}</small>
          <small><strong>ENGINEERING HOLD:</strong> Rear chassis pickup coordinates are
            unmeasured; wishbones, driveshaft/CV and structural joints are not
            independently designed or certified. This is a STEP-derived proposal.</small>
        </div>
        <div className="peds-assembly-controls-section" aria-label="P2.10 original rear double wishbone source">
          <h2>01C / P2.10 original rear upper + lower A-arms</h2>
          <p>Real original CAD, not the front P2.7 suspension reflected to the rear.
            Source includes the P2.9 upright and 10 new separate solids:
            forged upper/lower A-arms, four pivot bushings, two outer bearings
            and two joint pins. Replaces P2.9-only visual when loaded.</p>
          <label>P2.10 rear suspension manifest (.json)
            <input type="file" accept=".json,application/json"
              onChange={e=>{void importRearSuspensionManifest(e);}}/>
          </label>
          <label>P2.10 rear suspension GLB (.glb)
            <input type="file" accept=".glb,model/gltf-binary"
              disabled={!rearSuspensionManifest||!source||!calibration.fit||rearSuspensionBusy}
              onChange={e=>{void importRearSuspensionGLB(e);}}/>
          </label>
          <small>{rearSuspensionSource?
            'P2.10 SOURCE VERIFIED / '+rearSuspensionSource.profile+
            ' / 11 ORIGINAL CAD NODES · TWO REAR STATIONS':
            'P2.10 not loaded — only the existing rear stage is shown.'}</small>
          <small><strong>STATIC CAD ONLY:</strong> The 55 pair native B-Rep audit
            covers this authored 11-solid rear subassembly. Owner chassis
            hardpoints, live kinematics, joint retention, tyre/brake mating and
            gearbox/driveshaft interfaces remain unverified. G2 HOLD.</small>
        </div>
        <div className="peds-assembly-controls-section" aria-label="P2.11 rear toe link native CAD source">
          <h2>01D / P2.11 original rear toe-control link</h2>
          <p>Original static rear toe link with two annular eye bearings and a
            real upright clevis pin. P2.11 contains P2.9 and P2.10, so the
            renderer replaces earlier rear CAD instances instead of duplicating them.
            Imports remain entirely in this browser.</p>
          <label>P2.11 rear toe manifest (.json)
            <input type="file" accept=".json,application/json"
              onChange={e=>{void importRearToeManifest(e);}}/>
          </label>
          <label>P2.11 rear toe GLB (.glb)
            <input type="file" accept=".glb,model/gltf-binary"
              disabled={!rearToeManifest||!source||!calibration.fit||rearToeBusy}
              onChange={e=>{void importRearToeGLB(e);}}/>
          </label>
          <small>{rearToeSource?
            'P2.11 SOURCE VERIFIED / '+rearToeSource.profile+
            ' / 15 ORIGINAL CAD PARTS / 2 REAR STATIONS':
            'P2.11 not loaded — earlier rear source remains visible.'}</small>
          <small><strong>ENGINEERING G2 HOLD:</strong> Exact 105-pair static B-Rep
            test does not prove a chassis hardpoint, toe-angle adjustment,
            dynamic bump/toe solution, rear driveshaft clearance or structural strength.</small>
        </div>
        <div className="peds-assembly-controls-section" aria-label="P2.12 original rear toe adjuster source">
          <h2>01E / P2.12 RH/LH threaded rear toe adjuster v2</h2>
          <p>The original P2.11 fixed rod is removed and replaced with two
            project-authored left/right-hand helical rod ends, a hollow sleeve
            and two separate locknuts. P2.9–P2.11 previous instances are
            suppressed when this source is active, preventing double geometry.</p>
          <label>P2.12 rear toe adjuster manifest (.json)
            <input type="file" accept=".json,application/json"
              onChange={e=>{void importToeAdjusterManifest(e);}}/>
          </label>
          <label>P2.12 rear toe adjuster GLB (.glb)
            <input type="file" accept=".glb,model/gltf-binary"
              disabled={!toeAdjusterManifest||!source||!calibration.fit||toeAdjusterBusy}
              onChange={e=>{void importToeAdjusterGLB(e);}}/>
          </label>
          <small>{toeAdjusterSource?
            'P2.12 SOURCE VERIFIED / '+toeAdjusterSource.profile+
            ' / 19 ORIGINAL CAD PARTS / TWO REAR STATIONS':
            'P2.12 not loaded — the previous rear source remains active.'}</small>
          <small><strong>THREADED V2 / G2 HOLD:</strong> Native RH/LH
            female helical grooves are now present in both the sleeve and
            locknuts and pass the nominal source static audit. Load transfer,
            thread wear, preload, adjustment travel and verified chassis
            hardpoints are still unapproved.</small>
        </div>
        <div className="peds-assembly-controls-section">
          <h2>02 / Geometry inspection</h2>
          <div className="peds-assembly-picker" aria-label="Four actual Model B wheel positions">
            <strong>ALL FOUR WHEEL POSITIONS / OWNER CAD SOURCE</strong>
            <label>
              <input type="checkbox" checked={allFourWheelsEnabled}
                disabled={!calibration.fit||!source}
                onChange={e=>{
                  setAllFourWheelsEnabled(e.target.checked);
                  setMeasuredOverlayEnabled(true);
                  setRegistration(null);
                  setPlacement(INITIAL_PLACEMENT);
                  setActiveWheelId('front-positive-z');
                }}/>
              Show four original-source wheel-end placements
            </label>
            <label>Inspect wheel
              <select aria-label="Inspect wheel" disabled={!source||!calibration.fit||!allFourWheelsEnabled}
                value={activeWheelId}
                onChange={e=>{
                  setActiveWheelId(e.target.value as WheelId);
                  setCameraFocus('wheel-macro');
                  setPart(null);
                }}>
                <option value="front-positive-z">Front / +Z — P2.8 original</option>
                <option value="front-negative-z">Front / −Z — rotated P2.8</option>
                <option value="rear-positive-z">Rear / +Z — wheel-end preview only</option>
                <option value="rear-negative-z">Rear / −Z — wheel-end preview only</option>
              </select>
            </label>
            {wheelMounts.map(w=><small key={w.id}>
              {w.id}: {w.centerM.map(v=>v.toFixed(3)).join(' / ')} m
              · {w.sourceStatus.replaceAll('_',' ')}
            </small>)}
            <label>
              <input type="checkbox" checked={showroomWheelWindowsEnabled}
                disabled={!source||!calibration.fit||!allFourWheelsEnabled||!measuredOverlayEnabled}
                onChange={e=>setShowroomWheelWindowsEnabled(e.target.checked)}/>
              Mask original Model B wheel volumes (reversible shader-only view)
            </label>
            <small>The mask is restricted to the four measured wheel envelopes. It does not
              delete source geometry or prove a mechanical clearance. Disable to compare
              the existing Model B wheels with the source-derived CAD wheel ends.</small>
            <small><strong>G2 HOLD:</strong> 59 original P2.8 CAD parts are preserved.
              Opposite side uses a rigid rotation (not a mirror that reverses threads).
              Rear uses original front-source wheel-end components as a visual reference
              only. Genuine rear upright, wishbones, driveshaft interfaces and chassis
              mates have not been authored or validated.</small>
          </div>
          <div className="peds-assembly-picker" aria-label="Measured source wheel placement">
            <strong>OWNER SOURCE WHEEL MATCH / NO SCALE TO CAD</strong>
            <p>Model B is in nonmetric showroom units. Normalize only the showroom shell
              using its four measured tyre circles; original P2.8 remains 1:1 metres.</p>
            {calibration.fit?<>
              <small>Showroom uniform display scale: {calibration.fit.normalizedShellScale.toFixed(6)} m/source-unit</small>
              <small>Wheelbase (visual estimate): {calibration.fit.axleSpacingPreviewM.toFixed(3)} m</small>
              <small>Front +Z axle center: {calibration.fit.frontPositiveZCenterM.map(x=>x.toFixed(3)).join(', ')} m</small>
              <small>Four source wheel radius spread: {(calibration.fit.radiusSpreadFraction*100).toFixed(2)}%</small>
              <label><input type="checkbox" checked={measuredOverlayEnabled}
                onChange={e=>setMeasuredOverlayEnabled(e.target.checked)}/>
                Use measured P2.8 wheel position (visual only)</label>
            </>:<small role="status">WHEEL MATCH NOT AVAILABLE: {calibration.error||'Original source profiles still loading'}</small>}
            <small><strong>G2 HOLD.</strong> A wheel circle is NOT a chassis hardpoint, side-specific
              suspension interface, 2026 homologation, or physical collision clearance.</small>
          </div>
          <p>Verified decoded geometry, before any placement:</p>
          <small>Model B: {bodyProbe?.vertexCount.toLocaleString()??'loading'} vertices,
            {bodyProbe?.meshCount??'—'} mesh; raw bounds {bodyProbe?.sourceBoundsM.map(a=>a.map(v=>v.toFixed(3)).join(',')).join(' → ')??'—'} m</small>
          <small>P2.8: {cornerProbe?.vertexCount.toLocaleString()??'not imported'} vertices,
            {cornerProbe?.meshCount??'—'} mesh; tyre bounds {
              cornerProbe?.subassemblies['P2_TYRE_SLICK_BODY']?.sourceBoundsM.map(a=>a.map(v=>v.toFixed(3)).join(',')).join(' → ')??'—'
            } m</small>
          <button type="button" disabled={!bodyProbe||!cornerProbe}
            onClick={exportGeometryProbe}>EXPORT DECODED SOURCE MEASUREMENTS</button>
          <small>Diagnostic only. No geometry is altered, no automatic source scale is applied.</small>

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
        <div className="peds-assembly-controls-section" aria-label="Original P2.8 macro inspection">
          <h2>02A / Source CAD macro inspection</h2>
          <p>Camera zoom and cutaway affect the review renderer only. Original CAD
            surfaces, source file, dimensions and part identities stay unchanged.</p>
          <label>Review camera
            <select aria-label="Review camera" value={cameraFocus}
              disabled={!source} onChange={e=>setCameraFocus(e.target.value as typeof cameraFocus)}>
              <option value="whole-car">Whole car</option>
              <option value="wheel-macro">Selected wheel close-up</option>
              <option value="fastener-macro">Fasteners / bearing close-up</option>
            </select>
          </label>
          <label>CAD assembly presentation
            <select aria-label="CAD assembly presentation" value={cornerPresentation}
              disabled={!source} onChange={e=>setCornerPresentation(e.target.value as typeof cornerPresentation)}>
              <option value="assembled">Original assembled source pose</option>
              <option value="tyre-hidden">Remove tyre from VIEW only</option>
              <option value="mechanism-core">Brake + hub core (hide tyre and rim visually)</option>
              <option value="exploded">Temporary exploded review offsets</option>
            </select>
          </label>
          <label>
            <input type="checkbox" checked={technicalMaterials}
              onChange={e=>setTechnicalMaterials(e.target.checked)}/>
            Engineering PBR lookdev (rubber tyre, forged rim, carbon rotor)
          </label>
          <small>Lookdev is shader-only and reversible. Original GLB materials, CAD
            B-Rep geometry and mesh part IDs are not overwritten.</small>
          <small>Exploded offsets are for visualization only, not manufacturing mating transforms.
            Returning to assembled fully restores every original source part position.</small>
        </div>
        <div className="peds-assembly-controls-section">
          <h2>02B / Model B original wheel-mesh duplication mask</h2>
          <p>Only hide the exact owner-selected exterior mesh nodes that visually duplicate
            original P2.8 parts. No geometry is destroyed; no automatic wheel guessing.</p>
          <label>Filter original Model B nodes
            <input type="search" placeholder="wheel / tire / tyre / rim"
              value={bodyMeshFilter} onChange={e=>setBodyMeshFilter(e.target.value)}/>
          </label>
          <small>{bodyPartNames.length} original exterior mesh nodes; {hiddenBodyMeshes.length} temporarily hidden.</small>
          <div className="peds-assembly-body-meshes">
            {bodyPartNames.map((name,i)=>({name,i}))
              .filter(({name,i})=>name.toLowerCase().includes(bodyMeshFilter.toLowerCase()) ||
                String(i).includes(bodyMeshFilter))
              .slice(0,100).map(({name,i})=><label key={i}>
                <input type="checkbox" checked={hiddenBodyMeshes.includes(i)}
                  onChange={e=>setHiddenBodyMeshes(old=>e.target.checked?
                    [...old,i]:old.filter(index=>index!==i))}/>
                <span>{i}: {name}</span>
              </label>)}
          </div>
          <button type="button" onClick={()=>setHiddenBodyMeshes([])}
            disabled={!hiddenBodyMeshes.length}>RESTORE ALL ORIGINAL BODY MESHES</button>
        </div>
        <div className="peds-assembly-controls-section">
          <h2>03 / Placement (not mechanical mating)</h2>
          <div className="peds-assembly-picker" aria-label="Measure source points on original geometries">
            <p>Pick corresponding points on the REAL mesh surfaces. These are manual
              graphics annotations, not automatically identified mechanical hardpoints.</p>
            <div className="peds-assembly-actions">
              <button type="button" disabled={!source}
                aria-pressed={pickMode==='p28'}
                onClick={()=>setPickMode('p28')}>PICK P2.8 POINT</button>
              <button type="button" disabled={!source}
                aria-pressed={pickMode==='modelb'}
                onClick={()=>setPickMode('modelb')}>PICK MODEL B POINT</button>
            </div>
            <small>{pickMode==='off'?'Selection idle':`CLICK ON ${pickMode.toUpperCase()} MESH IN THE 3D VIEW`}</small>
            <small>P2.8 local: {pickedCorner?.map(v=>v.toFixed(4)).join(', ')??'not picked'} m</small>
            <small>Model B local: {pickedBody?.map(v=>v.toFixed(4)).join(', ')??'not picked'} m</small>
            <button type="button" disabled={!pickedBody||!pickedCorner} onClick={addLandmarkPair}>ADD CORRESPONDING PAIR</button>
            <small>{draftLandmarks.length} point pairs (minimum 3 non-collinear)</small>
            <label>Measurement provenance / feature identification
              <input type="text" value={landmarkEvidence} onChange={e=>setLandmarkEvidence(e.target.value)}
                placeholder="Identify each corresponding mechanical landmark"/>
            </label>
            <div className="peds-assembly-actions">
              <button type="button" disabled={draftLandmarks.length<3||!landmarkEvidence.trim()}
                onClick={registerPickedPairs}>RIGID FIT / NO SCALE</button>
              <button type="button" disabled={!draftLandmarks.length}
                onClick={exportPickedPairs}>EXPORT POINT PAIRS</button>
            </div>
            <button type="button" disabled={!draftLandmarks.length}
              onClick={()=>{setDraftLandmarks([]);setPickedBody(null);setPickedCorner(null);setRegistration(null);}}>
              CLEAR MEASURED PAIRS</button>
          </div>
          <label>Measured source / target landmarks (.json)
            <input type="file" accept=".json,application/json" disabled={!source}
              onChange={e=>{void importLandmarks(e);}}/>
          </label>
          <small>Optional measured rigid placement: 3+ unique 3D point pairs in metres (P2.8 GLB-local → Model B-local). Rejects scale mismatch over 5 mm. No hardpoints are invented.</small>
          {registration&&<p>Visual registration: max residual {(registration.maxResidualM*1000).toFixed(2)} mm; source length mismatch {(registration.lengthMismatchM*1000).toFixed(2)} mm. Mechanical review remains HOLD.</p>}
          <label>Display mode
            <select value={placement.displayedAtBodyCenter?'center':'staging'}
              onChange={e=>{setRegistration(null);setRegistrationEvidence('');setMeasuredOverlayEnabled(false);setPlacement(p=>({...p,displayedAtBodyCenter:e.target.value==='center'}));}} disabled={!source}>
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
            <button type="button" onClick={()=>{setPlacement(INITIAL_PLACEMENT);setPart(null);setOpacity(1);setMeasuredOverlayEnabled(false);setHiddenBodyMeshes([]);setRegistration(null);setRegistrationEvidence('');}}>RESET</button>
            <button type="button" onClick={exportPlacement} disabled={!source}>EXPORT PLACEMENT JSON</button>
          </div>
        </div>
        <p className="peds-assembly-warning"><strong>HOLD:</strong> P2.8 static geometry has a local audit, but its STEP/GLB source binaries are not stored in the public repo. Hardpoints, axle orientation, assembly clearances and load paths against Model B are NOT verified. Shell display is not a complete engineering mate.</p>
      </aside>
    </main>
  </div>;
}
