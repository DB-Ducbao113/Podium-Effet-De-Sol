import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { animate } from 'animejs';
import { beatAt, beatProgressAt, CHAPTERS, evaluateExplanationTimeline, explanationProgressAt, poseAt, progressForBeat, progressForChapter, reassemblyWaveAt, SCROLL_BEATS, type StoryPose } from './storyboard';
import { CAD_RENDER_MODES, computeAutoTourPlan, nextCadRenderMode } from './cadPresentation';
import type { AssemblyManifest, CadRenderMode, Lang, QualityProfile, RuntimeMetrics, StageEvidence } from './types';
import { componentProvenance } from './provenance';
import { narrationById, sourceById, type EngineeringSource } from './engineeringContent';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { buildDesktopNavItems, buildNavItems, type NavItem, type NavItemChild } from '../../components/layout/navItems';
import { ASSET_URLS, MANIFEST_URL, POSTER_URL } from './assetPaths';

const ThreeStage=lazy(()=>import('./ThreeStage'));
const ZERO:RuntimeMetrics={loadMs:0,fps:0,onePercentLowFps:0,p95FrameMs:0,drawCalls:0,triangles:0,geometries:0,textures:0,samples:0};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const QUALITY_KEY='itm-f2-applied-quality';
const RESTART_KEY='itm-f2-restarting';
const DIAGNOSTIC_MODE=import.meta.env.DEV?new URLSearchParams(location.search).get('f3Mode'):null;
const FROZEN_POSE=poseAt(0);
function initialRestarting(){try{return sessionStorage.getItem(RESTART_KEY)==='1';}catch{return false;}}
function graphicsProbe(){try{const canvas=document.createElement('canvas');const gl=canvas.getContext('webgl2');if(!gl)return {available:false,profile:'PERFORMANCE' as QualityProfile,renderer:'unavailable',policy:'webgl-unavailable'};const debug=gl.getExtension('WEBGL_debug_renderer_info');const renderer=debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'';const testedIntel=/Intel\(R\) UHD Graphics \(0x00009BC4\)/i.test(renderer);const testedNvidia=/GeForce GTX 1650 with Max-Q Design \(0x00001F9D\)/i.test(renderer);const profile:QualityProfile=testedNvidia?'BALANCED':'PERFORMANCE';gl.getExtension('WEBGL_lose_context')?.loseContext();return {available:true,profile,renderer,policy:testedIntel?'tested-intel-uhd':testedNvidia?'tested-gtx-1650-max-q':'unknown-conservative'};}catch{return {available:false,profile:'PERFORMANCE' as QualityProfile,renderer:'unavailable',policy:'probe-failed'};}}
const probe=graphicsProbe();
function initialQuality():QualityProfile{try{const saved=sessionStorage.getItem(QUALITY_KEY);if(saved==='HIGH'||saved==='BALANCED'||saved==='PERFORMANCE')return saved;}catch{/* Session storage may be unavailable; use the probed tier. */}return probe.profile;}

declare global {interface Window {__ITM_L1_MARK__?:(name:string,detail?:Record<string,unknown>)=>void;__ITM_R44__?: {getState:()=>Record<string,unknown>;setStoryProgress:(n:number)=>void;jumpToChapter:(n:number)=>void;jumpToBeat:(id:string)=>void;pause:()=>void;resume:()=>void;setAssembly:(id:string)=>void;setComponent:(id:string)=>void;setIsolation:(enabled:boolean,scope?:'assembly'|'component')=>void;setManual:(patch:Partial<StoryPose>)=>void;setRenderMode:(mode:CadRenderMode)=>void;setCutaway:(enabled:boolean|null)=>void;startAutoPlay:(dir?:1|-1)=>void;stopAutoPlay:()=>void;setProfile:(profile:QualityProfile)=>void;restartExperience:()=>void;getQuality:()=>{active:QualityProfile|null;requested:QualityProfile;pending:boolean;locked:QualityProfile;renderer:string;policy:string};getTransforms:StageEvidence['getTransforms'];getStageState:StageEvidence['getStageState'];getRuntimeDetails:StageEvidence['getRuntimeDetails'];getRenderSamples:()=>{time:number;ms:number}[];getRendererInfo:StageEvidence['getRendererInfo'];getLifecycle:StageEvidence['getLifecycle'];getScreenBounds:StageEvidence['getScreenBounds'];getSemanticBounds:(id:string)=>ReturnType<NonNullable<StageEvidence['getSemanticBounds']>>|null;getCamera:()=>{position:number[];target:number[]}|null;getMetrics:()=>RuntimeMetrics;};}}

const l1Mark=(name:string,detail?:Record<string,unknown>)=>{if(import.meta.env.DEV)window.__ITM_L1_MARK__?.(name,detail);};

const R5_PREVIEW_URL='http://127.0.0.1:5174/engineering/inside-the-machine';

export default function App(){
  const [manifest,setManifest]=useState<AssemblyManifest|null>(null);
  const [manifestError,setManifestError]=useState('');
  const [runtimeOffline,setRuntimeOffline]=useState(false);
  const [lang,setLang]=useState<Lang>('en');
  const [lockedProfile]=useState<QualityProfile>(initialQuality);
  const [requestedProfile,setRequestedProfile]=useState<QualityProfile>(lockedProfile);
  const [storyProgress,setStoryProgress]=useState(0);
  const [paused,setPaused]=useState(false);
  const [autoPlaying,setAutoPlaying]=useState(false);
  const [autoDir,setAutoDir]=useState<1|-1>(1);
  const [renderMode,setRenderMode]=useState<CadRenderMode>('pbr');
  const [manualCutaway,setManualCutaway]=useState<boolean|null>(null);
  const [hoveredComponent,setHoveredComponent]=useState<string|null>(null);
  const [inspectionProgress,setInspectionProgress]=useState(0);
  const [manual,setManual]=useState<StoryPose>(()=>poseAt(0));
  const [selectedComponent,setSelectedComponent]=useState('LEFT_SIDEPOD.EXTERIOR_SHELL');
  const [isolation,setIsolation]=useState(false);
  const [isolationScope,setIsolationScope]=useState<'assembly'|'component'>('component');
  const [ghost,setGhost]=useState(false);
  const [inspectorOpen,setInspectorOpen]=useState(false);
  const [advancedOpen,setAdvancedOpen]=useState(false);
  const [sectionsOpen,setSectionsOpen]=useState(false);
  const [openGroup,setOpenGroup]=useState<string|null>(null);
  const location=useLocation();
  const [sourceOpen,setSourceOpen]=useState(false);
  const [contextLost,setContextLost]=useState(false);
  const [evidence,setEvidence]=useState<StageEvidence|null>(null);
  const [metrics,setMetrics]=useState<RuntimeMetrics>(ZERO);
  const [loadMs,setLoadMs]=useState(0);
  const [displayedProfile,setDisplayedProfile]=useState<QualityProfile|null>(null);
  const [loadFailed,setLoadFailed]=useState(false);
  const [isRestarting,setIsRestarting]=useState(initialRestarting);
  const qualityPending=requestedProfile!==lockedProfile;
  const restartExperience=useCallback(()=>{if(!qualityPending)return;try{sessionStorage.setItem(QUALITY_KEY,requestedProfile);sessionStorage.setItem(RESTART_KEY,'1');}catch{/* Storage unavailable; the explicit restart may use the probed default. */}history.scrollRestoration='manual';window.scrollTo(0,0);window.location.reload();},[qualityPending,requestedProfile]);
  const handleProfileDisplayed=useCallback((profile:QualityProfile)=>{setDisplayedProfile(profile);setLoadFailed(false);setIsRestarting(false);try{sessionStorage.removeItem(RESTART_KEY);}catch{/* The next entry may still read its previous storage marker. */}},[]);
  const handleLoadError=useCallback(()=>setLoadFailed(true),[]);
  const handleRetryStart=useCallback(()=>setLoadFailed(false),[]);
  const [reducedMotion]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [compactStage,setCompactStage]=useState(()=>matchMedia('(max-width: 1023px)').matches);
  const scrollFrame=useRef(0);
  const chapterNavRef=useRef<HTMLElement>(null);
  const appRenders=useRef(0);
  useEffect(()=>{appRenders.current+=1;});
  useLayoutEffect(()=>{l1Mark('react-commit',{storyProgress});},[storyProgress]);
  const story=useMemo(()=>poseAt(storyProgress),[storyProgress]);
  const beat=useMemo(()=>beatAt(storyProgress),[storyProgress]);
  const beatProgress=beatProgressAt(storyProgress,beat);
  const explanationProgress=explanationProgressAt(storyProgress,beat);
  const explanationVisible=Boolean(narrationById(beat.narrationId))&&explanationProgress>.001;
  const {titleProgress,summaryProgress,functionProgress,sourceProgress,titleBlockProgress}=useMemo(()=>evaluateExplanationTimeline(explanationProgress,reducedMotion),[explanationProgress,reducedMotion]);
  const narration=useMemo(()=>narrationById(beat.narrationId),[beat.narrationId]);
  const technicalSources=useMemo(()=>beat.technicalSourceIds.map(sourceById).filter((source):source is EngineeringSource=>source?.verificationStatus==='verified'),[beat.technicalSourceIds]);
  useEffect(()=>{const nav=chapterNavRef.current;const selected=nav?.querySelector<HTMLElement>('[aria-current="step"]');if(!nav||!selected)return;const navBox=nav.getBoundingClientRect();const selectedBox=selected.getBoundingClientRect();nav.scrollLeft+=selectedBox.left-navBox.left-(navBox.width-selectedBox.width)/2;},[story.chapterIndex,lang]);
  const active=paused?manual:story;
  const frozenPose=FROZEN_POSE;
  const freezeModel=DIAGNOSTIC_MODE==='static3d'||DIAGNOSTIC_MODE==='camera-only';
  const stagePose=freezeModel?frozenPose:active;
  const renderedScrollProgress=freezeModel?0:paused?inspectionProgress:storyProgress;
  const explodePct=(clamp(renderedScrollProgress)*100).toFixed(1);
  const displayBeat=useMemo(()=>beatAt(renderedScrollProgress),[renderedScrollProgress]);
  const beatPositionLabel=`${String(SCROLL_BEATS.indexOf(displayBeat)+1).padStart(2,'0')}/${SCROLL_BEATS.length}`;
  const stageCamera=DIAGNOSTIC_MODE==='static3d'||DIAGNOSTIC_MODE==='assembly-only'?frozenPose.camera:active.camera;
  const effectiveCutaway=manualCutaway??stagePose.cutaway;
  const stageComponent=freezeModel?'LEFT_SIDEPOD.EXTERIOR_SHELL':selectedComponent;
  const stageFocus=DIAGNOSTIC_MODE==='no-focus'||DIAGNOSTIC_MODE==='static3d'||DIAGNOSTIC_MODE==='camera-only'||DIAGNOSTIC_MODE==='assembly-only'||paused?0:beat.phase==='REASSEMBLY'?.12:beat.contextVisibility==='isolated'?1:beat.contextVisibility==='dimmed'?.82:0;
  const reassemblyWave=reassemblyWaveAt(storyProgress);
  const chapter=CHAPTERS[story.chapterIndex];
  const assemblyList=useMemo(()=>manifest?[...manifest.assemblies,...(manifest.internalSystems??[])]:[],[manifest]);
  const activeAssembly=assemblyList.find(x=>x.id===active.assembly);
  const componentIds=activeAssembly?.componentIds??[];
  const activeComponent=manifest?.components.find(x=>x.id===selectedComponent);
  const hoveredCompRecord=useMemo(()=>hoveredComponent?manifest?.components.find(x=>x.id===hoveredComponent)??null:null,[manifest,hoveredComponent]);
  const provenanceLabel=componentProvenance(activeComponent?.provenance,lang);

  const autoTourAnim=useRef<ReturnType<typeof animate>|null>(null);
  const expectedScrollY=useRef(0);
  const autoScrollGraceUntil=useRef(0);
  const autoPlayingRef=useRef(false);
  const storyProgressRef=useRef(storyProgress);
  useEffect(()=>{autoPlayingRef.current=autoPlaying;storyProgressRef.current=storyProgress;},[autoPlaying,storyProgress]);

  const stopAutoPlay=useCallback(()=>{
    autoTourAnim.current?.pause();
    autoTourAnim.current=null;
    autoPlayingRef.current=false;
    setAutoPlaying(false);
  },[]);

  const startAutoPlay=useCallback((dir:1|-1=autoDir)=>{
    autoTourAnim.current?.pause();
    setIsolation(false);
    setInspectorOpen(false);
    setPaused(false);
    setAutoDir(dir);
    const {start,end,duration}=computeAutoTourPlan(storyProgressRef.current,dir,reducedMotion);
    const proxy={p:start};
    autoPlayingRef.current=true;
    autoScrollGraceUntil.current=performance.now()+200;
    setAutoPlaying(true);
    autoTourAnim.current=animate(proxy,{
      p:end,
      duration,
      ease:'linear',
      onUpdate:()=>{
        const v=clamp(proxy.p);
        const length=Math.max(1,document.documentElement.scrollHeight-innerHeight);
        const targetY=v*length;
        expectedScrollY.current=targetY;
        autoScrollGraceUntil.current=performance.now()+140;
        storyProgressRef.current=v;
        setStoryProgress(v);
        window.scrollTo({top:targetY,behavior:'instant'});
      },
      onComplete:()=>{
        autoTourAnim.current=null;
        autoPlayingRef.current=false;
        setAutoPlaying(false);
      },
    });
  },[autoDir,reducedMotion]);

  const toggleAutoPlay=useCallback(()=>{
    if(autoPlaying){stopAutoPlay();return;}
    startAutoPlay(autoDir);
  },[autoPlaying,autoDir,startAutoPlay,stopAutoPlay]);

  const reverseAutoPlay=useCallback(()=>{
    const nextDir:1|-1=autoDir>0?-1:1;
    startAutoPlay(nextDir);
  },[autoDir,startAutoPlay]);

  useEffect(()=>()=>{autoTourAnim.current?.pause();},[]);

  useEffect(()=>{fetch(MANIFEST_URL,{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error(`Manifest HTTP ${r.status}`);const ct=r.headers.get('content-type')??'';if(!ct.includes('json')){setRuntimeOffline(true);setManifestError(`R5 runtime server not active on ${window.location.origin} — open ${R5_PREVIEW_URL}`);return null;}setRuntimeOffline(false);return r.json() as Promise<AssemblyManifest>;}).then(data=>{if(data)setManifest(data);}).catch(e=>{setRuntimeOffline(false);setManifestError(String(e));});},[]);
  useEffect(()=>{
    const onManualScrollIntent=()=>{if(autoPlayingRef.current)stopAutoPlay();};
    const update=(event?:Event)=>{
      l1Mark(event?.type==='scroll'?'scroll-event':'scroll-update',{eventTimeStamp:event?.timeStamp??null,scrollY});
      if(autoPlayingRef.current){
        if(event?.type==='scroll'&&performance.now()>autoScrollGraceUntil.current&&Math.abs(scrollY-expectedScrollY.current)>48){
          stopAutoPlay();
        }
        return;
      }
      if(paused)return;
      if(scrollFrame.current){l1Mark('scroll-raf-coalesced');return;}
      l1Mark('scroll-raf-scheduled');
      scrollFrame.current=requestAnimationFrame(rafAt=>{
        scrollFrame.current=0;
        const length=Math.max(1,document.documentElement.scrollHeight-innerHeight);
        const progress=clamp(scrollY/length);
        l1Mark('scroll-progress-calculated',{rafAt,scrollY,length,progress});
        setStoryProgress(progress);
        l1Mark('react-state-scheduled',{storyProgress:progress});
      });
    };
    window.addEventListener('wheel',onManualScrollIntent,{passive:true});
    window.addEventListener('touchstart',onManualScrollIntent,{passive:true});
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    update();
    return()=>{
      window.removeEventListener('wheel',onManualScrollIntent);
      window.removeEventListener('touchstart',onManualScrollIntent);
      window.removeEventListener('scroll',update);
      window.removeEventListener('resize',update);
      if(scrollFrame.current){cancelAnimationFrame(scrollFrame.current);scrollFrame.current=0;}
    };
  },[paused,stopAutoPlay]);
  useEffect(()=>{document.body.classList.toggle('itm-i1-inspection-locked',paused);return()=>document.body.classList.remove('itm-i1-inspection-locked');},[paused]);
  useEffect(()=>{const media=matchMedia('(max-width: 1023px)');const update=()=>setCompactStage(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  useEffect(()=>{if(!explanationVisible)setSourceOpen(false);},[explanationVisible,beat.narrationId]);

  const pause=useCallback(()=>{stopAutoPlay();if(paused)return;setManual(poseAt(storyProgress));setInspectionProgress(storyProgress);setPaused(true);},[paused,stopAutoPlay,storyProgress]);
  const resume=useCallback(()=>{stopAutoPlay();setIsolation(false);setInspectorOpen(false);const length=Math.max(1,document.documentElement.scrollHeight-innerHeight);window.scrollTo({top:storyProgress*length,behavior:'instant'});setPaused(false);},[stopAutoPlay,storyProgress]);
  const jumpToChapter=useCallback((index:number)=>{stopAutoPlay();const target=progressForChapter(Math.max(0,Math.min(CHAPTERS.length-1,index)));setIsolation(false);setInspectorOpen(false);setPaused(false);setStoryProgress(target);requestAnimationFrame(()=>window.scrollTo({top:target*Math.max(1,document.documentElement.scrollHeight-innerHeight),behavior:reducedMotion?'instant':'smooth'}));},[reducedMotion,stopAutoPlay]);
  const jumpToBeat=useCallback((id:string)=>{stopAutoPlay();const target=progressForBeat(id);setIsolation(false);setInspectorOpen(false);setPaused(false);setStoryProgress(target);requestAnimationFrame(()=>window.scrollTo({top:target*Math.max(1,document.documentElement.scrollHeight-innerHeight),behavior:'instant'}));},[stopAutoPlay]);
  const selectAssembly=useCallback((id:string)=>{stopAutoPlay();if(!manifest)return;if(!paused){setManual(poseAt(storyProgress));setInspectionProgress(storyProgress);}setManual(current=>({...current,assembly:id}));const item=[...manifest.assemblies,...(manifest.internalSystems??[])].find(x=>x.id===id);if(item?.componentIds[0])setSelectedComponent(item.componentIds[0]);setPaused(true);setInspectorOpen(true);},[manifest,paused,stopAutoPlay,storyProgress]);
  const selectComponent=useCallback((id:string)=>{stopAutoPlay();if(!paused){setManual(poseAt(storyProgress));setInspectionProgress(storyProgress);}setSelectedComponent(id);setPaused(true);setInspectorOpen(true);},[paused,stopAutoPlay,storyProgress]);
  const handlePickComponent=useCallback((id:string)=>{stopAutoPlay();const comp=manifest?.components.find(item=>item.id===id);if(!paused){setManual(poseAt(storyProgress));setInspectionProgress(storyProgress);}if(comp)setManual(current=>({...current,assembly:comp.parentAssemblyId}));setSelectedComponent(id);setPaused(true);setInspectorOpen(true);},[manifest,paused,stopAutoPlay,storyProgress]);
  const isolate=useCallback((enabled:boolean,scope:'assembly'|'component'='component')=>{stopAutoPlay();if(!paused){setManual(poseAt(storyProgress));setInspectionProgress(storyProgress);}setPaused(true);setIsolationScope(scope);setIsolation(enabled);setInspectorOpen(true);},[paused,stopAutoPlay,storyProgress]);
  const updateManual=useCallback((patch:Partial<StoryPose>)=>{stopAutoPlay();if(!paused){setManual(poseAt(storyProgress));setInspectionProgress(storyProgress);}setPaused(true);setManual(current=>({...current,...patch}));},[paused,stopAutoPlay,storyProgress]);
  const cycleRenderMode=useCallback(()=>{setRenderMode(nextCadRenderMode);},[]);
  const toggleCutaway=useCallback(()=>{setManualCutaway(current=>!(current??stagePose.cutaway));},[stagePose.cutaway]);
  const inspectionAnim=useRef<ReturnType<typeof animate>|null>(null);
  const animateInspectionTo=useCallback((targetValue:number)=>{stopAutoPlay();const end=clamp(targetValue);if(!paused){setManual(poseAt(storyProgress));setPaused(true);}inspectionAnim.current?.pause();if(reducedMotion){setInspectionProgress(end);return;}const proxy={p:inspectionProgress};inspectionAnim.current=animate(proxy,{p:end,duration:650,ease:'inOutCubic',onUpdate:()=>{setInspectionProgress(clamp(proxy.p));}});},[inspectionProgress,paused,reducedMotion,stopAutoPlay,storyProgress]);
  useEffect(()=>()=>{inspectionAnim.current?.pause();},[]);
  const seek=useCallback((value:number)=>{stopAutoPlay();const v=clamp(value);inspectionAnim.current?.pause();l1Mark('direct-progress-update',{storyProgress:v});setPaused(false);setIsolation(false);setInspectionProgress(v);setStoryProgress(v);window.scrollTo({top:v*Math.max(1,document.documentElement.scrollHeight-innerHeight),behavior:'instant'});},[stopAutoPlay]);
  useEffect(()=>{if(!import.meta.env.DEV)return;window.__ITM_R44__={getState:()=>({storyProgress,renderedScrollProgress,inspectionProgress,chapterIndex:story.chapterIndex,chapterId:chapter.id,beatId:beat.beatId,phase:beat.phase,beatProgress,explanationProgress,textVisible:explanationVisible,paused,autoPlaying,autoDir,renderMode,cutaway:effectiveCutaway,hoveredComponent,manual,active,isolation,isolationScope,ghost,selectedComponent,profile:lockedProfile,displayedProfile,requestedProfile,qualityPending,appRenders:appRenders.current,canvasCount:document.querySelectorAll('canvas').length}),setStoryProgress:seek,jumpToChapter,jumpToBeat,pause,resume,setAssembly:selectAssembly,setComponent:selectComponent,setIsolation:isolate,setManual:updateManual,setRenderMode,setCutaway:setManualCutaway,startAutoPlay,stopAutoPlay,setProfile:setRequestedProfile,restartExperience,getQuality:()=>({active:displayedProfile,requested:requestedProfile,pending:qualityPending,locked:lockedProfile,renderer:probe.renderer,policy:probe.policy}),getTransforms:()=>evidence?.getTransforms()??{},getStageState:()=>evidence?.getStageState()??{displayedProfile:null,requestedProfile:lockedProfile,loading:true,hasVisibleModel:false,stageRenders:0},getRuntimeDetails:()=>evidence?.getRuntimeDetails()??{programs:0,drawCalls:0,triangles:0,geometries:0,textures:0,dpr:1,shadowMapEnabled:false},getRenderSamples:()=>evidence?.getRenderSamples?.()??[],getRendererInfo:()=>evidence?.getRendererInfo()??{vendor:'',renderer:'',unmaskedVendor:'',unmaskedRenderer:'',hardwareAccelerated:false},getLifecycle:()=>evidence?.getLifecycle()??[],getScreenBounds:(scope)=>evidence?.getScreenBounds(scope)??{minX:0,minY:0,maxX:0,maxY:0,width:0,height:0,viewportWidth:0,viewportHeight:0,clipped:true},getSemanticBounds:(id)=>evidence?.getSemanticBounds?.(id)??null,getCamera:()=>evidence?.getCamera?.()??null,getMetrics:()=>({...metrics,loadMs})};},[storyProgress,renderedScrollProgress,inspectionProgress,story,chapter,beat,beatProgress,explanationProgress,explanationVisible,paused,autoPlaying,autoDir,renderMode,effectiveCutaway,hoveredComponent,manual,active,isolation,isolationScope,ghost,selectedComponent,lockedProfile,requestedProfile,qualityPending,displayedProfile,restartExperience,seek,jumpToChapter,jumpToBeat,pause,resume,selectAssembly,selectComponent,isolate,updateManual,startAutoPlay,stopAutoPlay,evidence,metrics,loadMs]);
  useEffect(()=>{if(paused)return;if(beat.highlightTarget?.includes('.')){setSelectedComponent(beat.highlightTarget);return;}const item=assemblyList.find(x=>x.id===story.assembly);if(item?.componentIds[0])setSelectedComponent(item.componentIds[0]);},[beat.highlightTarget,story.assembly,paused,assemblyList]);
  const copy=lang==='vi'?{pause:'Soi 3D',resume:'Theo cuộn',auto:'Phát',stop:'Dừng',reverse:'Đảo chiều',cutaway:'Cắt vỏ',renderMode:'Kiểu hiển thị',pbr:'PBR',hybrid:'PBR+CAD',wireframe:'CAD Wire',replay:'Xem lại',inspect:'Khám phá',advanced:'Nâng cao',home:'Trang chủ',insights:'Bài viết',anatomy:'Giải phẫu xe',showroom:'Showroom 3D',sections:'Mục',close:'Đóng',isolate:'Tách riêng',assembly:'Cụm linh kiện',component:'Chi tiết',ghost:'Hiện bóng tham chiếu',explode:'Bóc tách',assemble:'Lắp lại',scroll:'Tiến trình câu chuyện',chapter:'Chương',profile:'Chất lượng hình ảnh',loading:'Đang nạp Model B…',unavailable:'WebGL không khả dụng. Dùng điều hướng chương để đọc câu chuyện kỹ thuật.',source:'Nguồn gốc',sources:'Nguồn kỹ thuật',function:'Chức năng',provenance:'Nguồn gốc hình học',expand:'Mở giải thích kỹ thuật',collapse:'Đóng giải thích kỹ thuật',motion:'Chuyển động',reduced:'Giảm chuyển động',standard:'Tiêu chuẩn',clickHint:'Bấm trực tiếp lên linh kiện 3D trên màn hình để soi và tách riêng.'}:{pause:'Orbit',resume:'Story',auto:'Auto',stop:'Stop',reverse:'Reverse',cutaway:'Cutaway',renderMode:'Render mode',pbr:'PBR',hybrid:'PBR+CAD',wireframe:'CAD Wire',replay:'Replay',inspect:'Inspect',advanced:'Advanced',home:'Home',insights:'Insights',anatomy:'Car Anatomy',showroom:'Showroom 3D',sections:'Sections',close:'Close',isolate:'Isolate',assembly:'Assembly',component:'Component',ghost:'Show ghost reference',explode:'Explode',assemble:'Assemble',scroll:'Story progress',chapter:'Chapter',profile:'Graphics quality',loading:'Loading Model B…',unavailable:'WebGL is unavailable. Use chapter navigation to read the engineering story.',source:'Provenance',sources:'Technical sources',function:'Function',provenance:'Geometry provenance',expand:'Open technical explanation',collapse:'Close technical explanation',motion:'Motion',reduced:'Reduced',standard:'Standard',clickHint:'Click any 3D part on stage to inspect and highlight its CAD structure.'};
  // The trial page draws its own masthead, so it reads the same navigation
  // source as the site bar: identical destinations, order and wording.
  const sectionItems=useMemo(()=>buildDesktopNavItems(buildNavItems(lang,import.meta.env.DEV,2026),lang),[lang]);
  const sectionChildren=(item:NavItem):NavItemChild[]=>item.id==='engineering'
    ? [...(item.children??[]),{id:'car-anatomy',label:copy.anatomy,to:'/engineering/car-anatomy'},{id:'insights',label:copy.insights,to:'/engineering/insights'}]
    : item.children??[];
  const isSectionActive=(item:NavItem)=>{
    const path=location.pathname;
    const tab=new URLSearchParams(location.search).get('tab');
    if(item.id==='overview')return path==='/';
    if(item.id==='results')return path.startsWith('/season/')&&(tab==='results'||tab==='calendar');
    if(item.id==='standings')return path.startsWith('/season/')&&(tab==='standings'||tab==='drivers'||tab==='teams');
    if(item.id==='showroom')return path.startsWith('/showroom')||path.startsWith('/gallery');
    if(item.id==='teams')return path==='/teams'||path.startsWith('/teams/');
    if(item.id==='drivers')return path==='/drivers'||path.startsWith('/drivers/');
    if(item.id==='engineering')return path.startsWith('/engineering');
    return false;
  };
  useEffect(()=>{const onKey=(event:KeyboardEvent)=>{const target=event.target as HTMLElement|null;const tag=target?.tagName;if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA')return;if(event.key==='Escape'){const group=target?.closest?.('.section-nav__group');if(group){setOpenGroup(null);group.querySelector?.<HTMLElement>('.section-nav__chevron')?.focus();return;}if(paused||inspectorOpen||isolation)resume();return;}if(event.key==='w'||event.key==='W'){cycleRenderMode();return;}if(event.key==='c'||event.key==='C'){toggleCutaway();return;}if(event.code==='Space'&&tag!=='BUTTON'&&tag!=='A'){event.preventDefault();toggleAutoPlay();}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[cycleRenderMode,inspectorOpen,isolation,paused,resume,toggleAutoPlay,toggleCutaway]);
  const closeSections=()=>{setSectionsOpen(false);setOpenGroup(null);};
  const modeLabel=renderMode==='pbr'?copy.pbr:renderMode==='hybrid'?copy.hybrid:copy.wireframe;
  const loadingPoster=<div className="loading-state" role={manifestError?'alert':'status'}>{!runtimeOffline&&<img src={POSTER_URL} alt="Model B preview while the interactive model loads"/>}<div><strong>{runtimeOffline?(lang==='vi'?'Cần mở máy chủ R5 Preview (:5174)':'Open R5 Runtime Preview (:5174)'):manifestError||(isRestarting?(lang==='vi'?`Đang khởi động lại với ${lockedProfile}…`:`Restarting with ${lockedProfile}…`):copy.loading)}</strong><span>{runtimeOffline?(lang==='vi'?`Cổng ${window.location.origin} (npm run dev) không phục vụ tài sản 3D R5. Hãy chạy \`npm run preview:r5\` và mở ${R5_PREVIEW_URL}.`:`Standard dev server (${window.location.origin}) does not serve private R5 assets. Keep \`npm run preview:r5\` running and open ${R5_PREVIEW_URL}.`):manifestError?(lang==='vi'?'Không thể tải manifest R5; kiểm tra lại `npm run preview:r5`.':'Unable to load R5 manifest; verify `npm run preview:r5` is running.'):(lang==='vi'?'Ảnh xem trước · mô hình tương tác đang được giải mã':'Preview image · interactive geometry is still decoding')}</span>{runtimeOffline&&typeof window!=='undefined'&&window.location.port!=='5174'&&<a className="runtime-preview-link" href={R5_PREVIEW_URL}>{lang==='vi'?'Chuyển sang 127.0.0.1:5174':'Open 127.0.0.1:5174'}</a>}</div></div>;
  return <div className="exhibition" data-ui>
    <div className={`cinema${paused&&inspectorOpen?' inspecting':''}${inspectorOpen||advancedOpen?' panel-open':''}`} aria-label="Inside the Machine cinematic 3D experience">
      <div className="model-stage" data-hover-pick={hoveredComponent?'true':undefined}>{!probe.available?<div className="webgl-fallback"><img src={POSTER_URL} alt="Original Model B Formula 1 car, assembled"/><p role="alert">{copy.unavailable}</p></div>:!manifest?loadingPoster:<Suspense fallback={loadingPoster}><ThreeStage modelUrl={ASSET_URLS[lockedProfile]} manifest={manifest} scrollProgress={renderedScrollProgress} cutaway={effectiveCutaway} selectedAssembly={stagePose.assembly} selectedComponent={stageComponent} hoveredComponent={hoveredComponent} isolation={isolation} isolationScope={isolationScope} ghost={ghost} storyFocusStrength={stageFocus} renderMode={renderMode} attachmentCue={!freezeModel&&!paused&&beat.phase==='DETACH'} cameraPose={compactStage?{...stageCamera,screenShift:0}:stageCamera} cameraMode={paused?'inspect':'story'} lightIntensity={stagePose.light} profile={lockedProfile} lang={lang} restarting={isRestarting} onReady={setLoadMs} onMetrics={setMetrics} onEvidence={setEvidence} onContextLost={setContextLost} onProfileDisplayed={handleProfileDisplayed} onLoadError={handleLoadError} onRetryStart={handleRetryStart} onUserOrbit={pause} onHoverComponent={setHoveredComponent} onPickComponent={handlePickComponent}/></Suspense>}{contextLost&&<div className="context-overlay" role="alert">WebGL context lost · waiting for recovery</div>}</div>
      <div className="hud-blueprint-grid" data-peds-watermark="layer-1-grid" aria-hidden="true">
        <svg viewBox="0 0 1200 720" preserveAspectRatio="none">
          <defs>
            <pattern id="peds-cad-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="0.6" />
              <path d="M 36 0 L 44 0 M 0 36 L 0 44" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="1200" height="720" fill="url(#peds-cad-grid)" />
          <g transform="rotate(-18 600 360)" fill="currentColor" fontFamily="monospace" fontSize="13" letterSpacing="4">
            <text x="80" y="210">PODIUM EFFET DE SOL · MODEL B R5 ASSEMBLY</text>
            <text x="420" y="420">PEDS-MB-R5-ASSY · PROPRIETARY CAD BUILD</text>
            <text x="160" y="610">PODIUM EFFET DE SOL · MODEL B R5 ASSEMBLY</text>
          </g>
        </svg>
      </div>
      <header className="masthead"><Link to="/" className="brand" aria-label={lang==='vi'?'Về trang chủ':'Back to homepage'}><span className="brand-mark" aria-hidden="true"><i/><i/></span><span>Podium EDS</span></Link><nav id="section-nav" className={`section-nav${sectionsOpen?' open':''}`} aria-label={lang==='vi'?'Điều hướng website':'Website navigation'}>{sectionItems.map(item=>{const children=sectionChildren(item);const active=isSectionActive(item);return <div className="section-nav__group" key={item.id} data-nav-id={item.id} data-open={openGroup===item.id?true:undefined}><Link to={item.to} onClick={closeSections} aria-current={active?'page':undefined}>{item.label}</Link>{children.length>0&&<><button type="button" className="section-nav__chevron" aria-expanded={openGroup===item.id} aria-controls={`section-nav-sub-${item.id}`} aria-label={`${item.label}: ${lang==='vi'?'mục con':'subpages'}`} onClick={()=>setOpenGroup(current=>current===item.id?null:item.id)}><ChevronDown size={13} aria-hidden="true"/></button><div className="section-nav__sub" id={`section-nav-sub-${item.id}`}>{children.map(child=><Link key={child.id} to={child.to} onClick={closeSections}>{child.label}</Link>)}</div></>}</div>;})}</nav><div className="header-actions"><button className="section-nav-toggle" onClick={()=>{setSectionsOpen(v=>!v);setAdvancedOpen(false);}} aria-expanded={sectionsOpen} aria-controls="section-nav">{copy.sections}</button><button onClick={()=>setLang(lang==='en'?'vi':'en')} aria-label={lang==='en'?'Switch to Vietnamese':'Switch to English'}>{lang==='en'?'VI':'EN'}</button><button onClick={()=>{setAdvancedOpen(v=>!v);setSectionsOpen(false);}} aria-expanded={advancedOpen} aria-controls="advanced-panel">{copy.advanced}</button></div></header>
      {reassemblyWave&&<div className="assembly-wave-label" data-reassembly-wave={reassemblyWave.id} aria-live="polite"><span>{lang==='vi'?'ĐANG LẮP RÁP':'ASSEMBLING'}</span><strong>{reassemblyWave.label[lang]}</strong></div>}
      {hoveredCompRecord&&!autoPlaying&&<div className="hover-component-pill" role="status" aria-live="off"><span>{lang==='vi'?'BẤM ĐỂ SOI':'CLICK TO INSPECT'}</span><strong>{hoveredCompRecord.label[lang]}</strong></div>}
      {explanationVisible&&narration&&<section className="explanation-overlay" data-story-explanation data-phase={beat.phase} aria-label={narration.title[lang]}><h1 style={{opacity:titleProgress,transform:`translate3d(0,${(1-titleProgress)*22}px,0)`,clipPath:titleProgress>=0.999?undefined:`inset(0 ${100-titleProgress*100}% 0 0)`}}>{narration.title[lang]}</h1><p className="explanation-summary" style={{opacity:summaryProgress,transform:`translate3d(0,${(1-summaryProgress)*16}px,0)`}}>{narration.summary[lang]}</p><p className="explanation-function" style={{opacity:functionProgress,transform:`translate3d(0,${(1-functionProgress)*12}px,0)`}}><b>{copy.function}</b>{narration.function[lang]}</p><div className="explanation-sources" style={{opacity:sourceProgress,transform:`translate3d(0,${(1-sourceProgress)*8}px,0)`}}><span>{narration.provenanceLabel[lang]}</span><ul>{technicalSources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher}</a></li>)}</ul><button className="source-toggle" type="button" onClick={()=>setSourceOpen(open=>!open)} aria-expanded={sourceOpen} aria-controls="technical-sources">{sourceOpen?copy.collapse:copy.expand}</button>{sourceOpen&&<div id="technical-sources" className="technical-sources"><p>{narration.detail[lang]}</p><p><b>{copy.provenance}</b>{narration.provenanceLabel[lang]}</p><b>{copy.sources}</b><ul>{technicalSources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher} · {source.title}</a></li>)}</ul></div>}</div></section>}
      <nav ref={chapterNavRef} aria-label={lang==='vi'?'Điều hướng sáu chương':'Six chapter navigation'} className="chapter-nav">{CHAPTERS.map((item,index)=><button key={item.id} className={story.chapterIndex===index?'active':''} onClick={()=>jumpToChapter(index)} aria-current={story.chapterIndex===index?'step':undefined}><span>{String(index+1).padStart(2,'0')}</span><strong>{item.title[lang]}</strong></button>)}</nav>
      <nav className="beat-rail" aria-label={lang==='vi'?'Điều hướng các nhịp kỹ thuật':'Engineering beat navigation'}>{SCROLL_BEATS.map((item,index)=><button key={item.beatId} className={item.beatId===beat.beatId?'active':''} onClick={()=>jumpToBeat(item.beatId)} aria-current={item.beatId===beat.beatId?'step':undefined} aria-label={`${index+1}. ${item.label[lang]}`} title={item.label[lang]}><span>{index+1}</span></button>)}</nav>
      <aside className="hud-title-block" data-peds-watermark="layer-1" style={{opacity:0.78+0.22*titleBlockProgress}} aria-label={lang==='vi'?'Khung tên bản vẽ kỹ thuật PEDS':'PEDS engineering drawing title block'}>
        <div className="hud-title-block__row"><span>PEDS · PODIUM EFFET DE SOL</span><strong>DWG: PEDS-MB-R5-ASSY</strong></div>
        <div className="hud-title-block__row"><span>SYS: {active.assembly}</span><span>EXPLODE: {explodePct}%</span><span>BEAT {beatPositionLabel}</span></div>
        <div className="hud-title-block__row"><span>MODE: {modeLabel}</span><span>CUTAWAY: {effectiveCutaway?'ON':'OFF'}</span><span>MODEL B R5</span></div>
      </aside>
      {paused&&inspectorOpen&&<div className="inspection-caption"><span>{lang==='vi'?'CHI TIẾT ĐANG XEM':'INSPECTION / COMPONENT'}</span><strong>{activeComponent?.label[lang]??activeAssembly?.label[lang]??copy.component}</strong><p>{activeComponent?.description[lang]}</p><small>{provenanceLabel}</small></div>}
      <div className="story-controls">
        <div className="tour-controls">
          <button type="button" className={`tour-btn${autoPlaying?' active':''}`} onClick={toggleAutoPlay} aria-pressed={autoPlaying} aria-label={`${autoPlaying?copy.stop:copy.auto} (Space)`}><span aria-hidden="true">{autoPlaying?'Ⅱ':'▶'}</span><span>{autoPlaying?copy.stop:copy.auto}</span></button>
          <button type="button" className={`tour-rev${autoPlaying&&autoDir<0?' active':''}`} onClick={reverseAutoPlay} aria-label={copy.reverse} title={copy.reverse}>↶</button>
          <button type="button" className="transport" onClick={paused?resume:pause} aria-label={paused?copy.resume:copy.pause}><span aria-hidden="true">{paused?'▶':'◈'}</span><span>{paused?copy.resume:copy.pause}</span></button>
        </div>
        <div className="cad-toolbar" role="group" aria-label={copy.renderMode}>
          <div className="cad-mode-group">
            {CAD_RENDER_MODES.map(mode=><button key={mode} type="button" data-render-mode={mode} className={renderMode===mode?'active':''} aria-pressed={renderMode===mode} onClick={()=>setRenderMode(mode)}>{mode==='pbr'?copy.pbr:mode==='hybrid'?copy.hybrid:copy.wireframe}</button>)}
          </div>
          <button type="button" className="cad-mode-cycle" onClick={cycleRenderMode} aria-label={`${copy.renderMode}: ${modeLabel}`}>{modeLabel}</button>
          <button type="button" className={`cutaway-btn${effectiveCutaway?' active':''}`} onClick={toggleCutaway} aria-pressed={effectiveCutaway} title="Cutaway (C)">{copy.cutaway}</button>
        </div>
        <label className="story-seek"><span>{copy.scroll}</span><input type="range" aria-label={copy.scroll} min="0" max="1" step="0.001" value={renderedScrollProgress} onChange={e=>seek(Number(e.target.value))}/></label>
        <output>{`${String(SCROLL_BEATS.indexOf(displayBeat)+1).padStart(2,'0')} / ${SCROLL_BEATS.length}`}</output>
        <div className="micro-actions"><button type="button" onClick={()=>{pause();setInspectorOpen(true);}} aria-expanded={inspectorOpen} aria-controls="engineering-inspector">{copy.inspect}</button><button type="button" onClick={()=>{setManualCutaway(null);jumpToChapter(0);}}>{copy.replay}</button><span className="motion-status" title={`${copy.motion}: ${reducedMotion?copy.reduced:copy.standard}`}>{reducedMotion?copy.reduced:copy.motion}</span></div>
      </div>
      {advancedOpen&&<aside id="advanced-panel" className="advanced-panel" aria-label={copy.advanced}><div className="panel-head"><h2>{copy.advanced}</h2><button aria-label={copy.close} onClick={()=>setAdvancedOpen(false)}>×</button></div><label>{copy.profile}<select aria-label={lang==='vi'?'Chất lượng cho lần khởi động lại':'Quality for next restart'} value={requestedProfile} onChange={e=>setRequestedProfile(e.target.value as QualityProfile)}><option>HIGH</option><option>BALANCED</option><option>PERFORMANCE</option></select></label><div className="quality-state" role="status" aria-live="polite"><span>{lang==='vi'?'Đang dùng':'Active'} <strong>{displayedProfile??((loadFailed||Boolean(manifestError)||!probe.available)?(lang==='vi'?'Không khả dụng':'Unavailable'):(lang==='vi'?'Đang tải':'Loading'))}</strong></span>{qualityPending&&<><span>{lang==='vi'?'Đã yêu cầu':'Requested'} <strong>{requestedProfile}</strong></span><button type="button" onClick={restartExperience}>{lang==='vi'?'Khởi động lại để áp dụng':'Restart to apply'}</button></>}</div><dl><div><dt>FPS</dt><dd>{metrics.fps.toFixed(0)}</dd></div><div><dt>P95</dt><dd>{metrics.p95FrameMs.toFixed(1)} ms</dd></div><div><dt>Draws</dt><dd>{metrics.drawCalls}</dd></div><div><dt>Triangles</dt><dd>{metrics.triangles.toLocaleString()}</dd></div></dl><p className="panel-attribution">Assembly &amp; CAD PEDS R5 · Base model: &quot;Formula 1 2022 Car&quot; by Luis Adrian V. (CC BY 4.0)</p></aside>}
      {inspectorOpen&&<aside id="engineering-inspector" className="inspection-panel" aria-label={copy.inspect}><div className="panel-head"><h2>{copy.inspect}</h2><button aria-label="Close inspector" onClick={()=>setInspectorOpen(false)}>×</button></div><p>{copy.source}: {provenanceLabel}</p><label>{copy.renderMode}<select value={renderMode} onChange={e=>setRenderMode(e.target.value as CadRenderMode)}><option value="pbr">{copy.pbr}</option><option value="hybrid">{copy.hybrid}</option><option value="wireframe">{copy.wireframe}</option></select></label><label className="ghost-toggle"><input type="checkbox" checked={effectiveCutaway} onChange={e=>setManualCutaway(e.target.checked)}/>{copy.cutaway}</label><label>{copy.assembly}<select value={active.assembly} onChange={e=>selectAssembly(e.target.value)}>{assemblyList.map(item=><option key={item.id} value={item.id}>{item.label[lang]}</option>)}</select></label><label>{copy.component}<select value={componentIds.includes(selectedComponent)?selectedComponent:componentIds[0]??''} onChange={e=>selectComponent(e.target.value)}>{componentIds.map(id=>{const item=manifest?.components.find(x=>x.id===id);return <option key={id} value={id}>{item?.label[lang]??id}</option>;})}</select></label><p className="component-description">{activeComponent?.description[lang]}</p><div className="isolation-buttons"><button className={isolation&&isolationScope==='component'?'active':''} onClick={()=>isolate(!isolation||isolationScope!=='component','component')}>{copy.isolate} {copy.component.toLowerCase()}</button><button className={isolation&&isolationScope==='assembly'?'active':''} onClick={()=>isolate(!isolation||isolationScope!=='assembly','assembly')}>{copy.isolate} {copy.assembly.toLowerCase()}</button></div><label className="ghost-toggle"><input type="checkbox" checked={ghost} onChange={e=>setGhost(e.target.checked)}/>{copy.ghost}</label><div className="manual-controls"><button onClick={()=>animateInspectionTo(0.855)}>{copy.explode}</button><button onClick={()=>animateInspectionTo(0)}>{copy.assemble}</button></div><p className="panel-attribution">{copy.clickHint}</p><p className="panel-attribution">Assembly &amp; CAD PEDS R5 · Base model: &quot;Formula 1 2022 Car&quot; by Luis Adrian V. (CC BY 4.0)</p><details><summary>DEV evidence</summary><p>{metrics.drawCalls} draws · {metrics.triangles.toLocaleString()} triangles · {loadMs.toFixed(0)} ms load · {displayedProfile??'loading'} · {modeLabel}</p></details></aside>}
    </div>
    <div className="story-track" aria-hidden="true">{SCROLL_BEATS.map(item=><section key={item.beatId} data-beat={item.beatId}/>)}</div>
  </div>;
}