import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Eye,
  Gauge,
  Info,
  List,
  Orbit,
  Pause,
  Play,
  RotateCcw,
  Wind,
  X,
} from "lucide-react";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link } from "react-router-dom";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { EngineeringCockpitPanel } from "../engineering/EngineeringCockpitPanel";
import type { EngineeringLiveTimelineBridge } from "../engineering/EngineeringDisassemblyStage";
import { EngineeringPartActions } from "../engineering/EngineeringPartActions";
import { EngineeringPartBrowser } from "../engineering/EngineeringPartBrowser";
import {
  ENGINEERING_CFD_ZONES,
  isAnyCfdZoneValid,
  resolveCfdZoneOpacities,
} from "../engineering/engineeringAeroStreamlines";
import {
  INITIAL_COCKPIT_TELEMETRY_STATE,
  engineeringCockpitTelemetryReducer,
  isCockpitInspectorVisible,
} from "../engineering/engineeringCockpitTelemetry";
import { ENGINEERING_PARTS } from "../engineering/engineeringDisassemblyData";
import {
  INITIAL_ENGINEERING_INSPECTION_STATE,
  engineeringInspectionReducer,
} from "../engineering/engineeringInspectionState";
import {
  resolveLeaderCalloutLayout,
  type EngineeringAnnotationProjection,
  type EngineeringHudMode,
} from "../engineering/engineeringInteractionState";
import { evaluateEngineeringMotionDirector } from "../engineering/engineeringMotionDirector";
import {
  evaluateEngineeringStoryTimeline,
  getEngineeringStoryShot,
} from "../engineering/engineeringStoryTimeline";
import "../engineering/engineeringStudio.css";
import {
  ENGINEERING_SHOW_SCENES,
  ENGINEERING_SHOW_TOTAL_VH,
  SHOW_AUTOPLAY_DWELL_SEC,
  SHOW_AUTOPLAY_TRANSITION_SEC,
  SHOW_TRANSITION_RATIO,
  evaluateEngineeringShowScroll,
  getShowScrollForScene,
  stepShowTimelineProgress,
  type EngineeringShowScrollState,
} from "./engineeringShowScript";
import { prefetchStormRoute } from "./routePrefetch";

const EngineeringDisassemblyStage = lazy(() =>
  import("../engineering/EngineeringDisassemblyStage").then((m) => ({
    default: m.EngineeringDisassemblyStage,
  })),
);

function ShowStageErrorFallback({
  lang,
  onError,
}: {
  lang: "vi" | "en";
  onError: () => void;
}) {
  useEffect(() => onError(), [onError]);
  return (
    <div
      className="peds-eng-static-fallback"
      data-testid="engineering-static-fallback"
    >
      <img
        src="/images/eds/engineering/ground-effect-flow.svg"
        alt={
          lang === "vi"
            ? "Sơ đồ khái niệm luồng khí hiệu ứng mặt đất Podium EDS"
            : "Podium EDS conceptual ground-effect airflow diagram"
        }
        className="peds-eng-static-fallback__img"
      />
      <p className="peds-eng-static-fallback__note" role="status">
        {lang === "vi"
          ? "Chế độ 3D tạm không khả dụng. Bạn vẫn có thể theo dõi 12 hồi cốt truyện qua thanh điều khiển bên dưới."
          : "3D mode is unavailable. You can still step through all 12 story scenes below."}
      </p>
    </div>
  );
}

export interface StormEngineeringShowProps {
  readonly lang: "vi" | "en";
  readonly reducedMotion: boolean;
}

/**
 * Curated 12-Scene 3D Engineering Storytelling Show for `/engineering` & `/engineering/car-anatomy`.
 * Includes direct deep-dive links to `/engineering/:slug` articles and `/about` provenance.
 */
export function StormEngineeringShow({
  lang,
  reducedMotion,
}: StormEngineeringShowProps) {
  const isVi = lang === "vi";

  const runwayRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const annotationRef = useRef<HTMLDivElement>(null);
  const annotationCardRef = useRef<HTMLSpanElement>(null);
  const annotationPolylineRef = useRef<SVGPolylineElement>(null);
  const annotationRingRef = useRef<SVGCircleElement>(null);
  const annotationDotRef = useRef<SVGCircleElement>(null);
  const annotationIndexRef = useRef<HTMLSpanElement>(null);
  const annotationLabelRef = useRef<HTMLSpanElement>(null);
  const annotationPhaseRef = useRef<HTMLSpanElement>(null);
  const partsButtonRef = useRef<HTMLButtonElement>(null);
  const dwellBarFillRef = useRef<HTMLDivElement>(null);
  const scrubberFillRef = useRef<HTMLDivElement>(null);
  const scrubberInputRef = useRef<HTMLInputElement>(null);
  const scrubberReadoutRef = useRef<HTMLSpanElement>(null);

  const rawScrollRef = useRef<number>(0);
  const targetTimelineRef = useRef<number>(0);
  const smoothedTimelineRef = useRef<number>(0);
  const isolatedPartIdRef = useRef<string | null>(null);
  const selectedPartIdRef = useRef<string | null>(null);
  const hudModeRef = useRef<EngineeringHudMode>("contextual");
  const orbitModeRef = useRef<boolean>(false);
  const previousScrollYRef = useRef<number | null>(null);
  const lastSceneCommitKeyRef = useRef<string>("0:resting:visible");
  const kickDampingRef = useRef<(() => void) | null>(null);
  const scrollMetricsRef = useRef<{
    runwayTopDoc: number;
    maxTravel: number;
  }>({ runwayTopDoc: 0, maxTravel: 0 });

  const liveBridgeRef = useRef<EngineeringLiveTimelineBridge>({
    targetProgress: 0,
    smoothedProgress: 0,
    controlMode: "timeline",
    handoffRequested: false,
    handoffClearSelection: false,
    stageActive: true,
    latestEvaluation: undefined,
    cameraArc: null,
  });

  const [showState, setShowState] = useState<EngineeringShowScrollState>(() =>
    evaluateEngineeringShowScroll(0),
  );
  const [evaluation, setEvaluation] = useState(() =>
    evaluateEngineeringStoryTimeline(0),
  );
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isCameraSettled, setIsCameraSettled] = useState(true);
  const isCameraSettledRef = useRef(true);
  const [isProgrammaticJump, setIsProgrammaticJump] = useState(false);
  const isProgrammaticJumpRef = useRef(false);
  const [hudMode, setHudMode] = useState<EngineeringHudMode>("contextual");
  const [xray, setXray] = useState(false);
  const [cfdFlow, setCfdFlow] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [partBrowserOpen, setPartBrowserOpen] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [stageUnavailable, setStageUnavailable] = useState(false);

  const [cockpitTelemetry, dispatchCockpitTelemetry] = useReducer(
    engineeringCockpitTelemetryReducer,
    INITIAL_COCKPIT_TELEMETRY_STATE,
  );
  const [inspection, dispatchInspection] = useReducer(
    engineeringInspectionReducer,
    INITIAL_ENGINEERING_INSPECTION_STATE,
  );
  const { selectedPartId, isolatedPartId, orbitMode } = inspection;

  const selectedPart = useMemo(
    () => ENGINEERING_PARTS.find((p) => p.id === selectedPartId) ?? null,
    [selectedPartId],
  );

  useEffect(() => {
    isolatedPartIdRef.current = isolatedPartId;
    selectedPartIdRef.current = selectedPartId;
    hudModeRef.current = hudMode;
    orbitModeRef.current = orbitMode;
  }, [hudMode, isolatedPartId, orbitMode, selectedPartId]);

  const syncVisualBarsDom = useCallback((state: EngineeringShowScrollState) => {
    if (dwellBarFillRef.current) {
      const fill = state.isResting
        ? Math.max(0.06, state.dwellProgress)
        : Math.max(0.04, state.transitionProgress * 0.25);
      dwellBarFillRef.current.style.transform = `scaleX(${fill})`;
    }
    if (scrubberFillRef.current) {
      scrubberFillRef.current.style.transform = `scaleX(${Math.max(0.02, state.rawScroll)})`;
    }
    if (scrubberInputRef.current) {
      scrubberInputRef.current.value = String(
        Math.round(state.rawScroll * 1000),
      );
    }
    if (scrubberReadoutRef.current) {
      scrubberReadoutRef.current.textContent = `${state.scene.indexLabel} / ${String(ENGINEERING_SHOW_SCENES.length).padStart(2, "0")}`;
    }
  }, []);

  const commitShowState = useCallback(
    (nextShow: EngineeringShowScrollState, force = false) => {
      syncVisualBarsDom(nextShow);
      const nextEval = evaluateEngineeringStoryTimeline(
        nextShow.timelineProgress,
      );
      liveBridgeRef.current.latestEvaluation = nextEval;

      const commitKey = `${nextShow.sceneIndex}:${nextShow.displayScene.id}:${nextShow.phase}:${nextShow.storyStage}`;
      if (force || commitKey !== lastSceneCommitKeyRef.current) {
        lastSceneCommitKeyRef.current = commitKey;
        setShowState(nextShow);
        setEvaluation(nextEval);
      }
    },
    [syncVisualBarsDom],
  );

  const jumpToRawScroll = useCallback(
    (nextRawScroll: number, immediate = false) => {
      const clamped = Math.max(0, Math.min(1, nextRawScroll));
      const mapped = evaluateEngineeringShowScroll(clamped);

      if (orbitModeRef.current || isolatedPartIdRef.current) {
        liveBridgeRef.current.handoffRequested = true;
        liveBridgeRef.current.handoffClearSelection = true;
      }
      dispatchInspection({ type: "reset" });

      rawScrollRef.current = clamped;
      targetTimelineRef.current = mapped.timelineProgress;
      liveBridgeRef.current.targetProgress = mapped.timelineProgress;
      liveBridgeRef.current.cameraArc = mapped.cameraArc;

      const runway = runwayRef.current;
      const sticky = stickyRef.current;
      if (runway && sticky && !reducedMotion && !stageUnavailable) {
        const runwayRect = runway.getBoundingClientRect();
        const stickyRect = sticky.getBoundingClientRect();
        const maxTravel = runwayRect.height - stickyRect.height;
        if (maxTravel > 4) {
          const targetY = window.scrollY + runwayRect.top + clamped * maxTravel;
          window.scrollTo({
            top: Math.max(0, targetY),
            behavior: "instant" as ScrollBehavior,
          });
        }
      }

      if (immediate || reducedMotion || stageUnavailable) {
        isProgrammaticJumpRef.current = false;
        setIsProgrammaticJump(false);
        smoothedTimelineRef.current = mapped.timelineProgress;
        liveBridgeRef.current.smoothedProgress = mapped.timelineProgress;
        isCameraSettledRef.current = true;
        setIsCameraSettled(true);
        commitShowState(mapped, true);
        liveBridgeRef.current.requestRender?.();
      } else {
        const needsGlide =
          Math.abs(mapped.timelineProgress - smoothedTimelineRef.current) >
          0.008;
        isProgrammaticJumpRef.current = needsGlide;
        setIsProgrammaticJump(needsGlide);
        if (needsGlide && isCameraSettledRef.current) {
          isCameraSettledRef.current = false;
          setIsCameraSettled(false);
        }
        commitShowState(mapped, true);
        liveBridgeRef.current.requestRender?.();
        kickDampingRef.current?.();
      }
    },
    [commitShowState, reducedMotion, stageUnavailable],
  );

  const jumpToScene = useCallback(
    (sceneIndex: number) => {
      setIsAutoPlaying(false);
      jumpToRawScroll(getShowScrollForScene(sceneIndex), false);
    },
    [jumpToRawScroll],
  );

  const stepScene = useCallback(
    (delta: -1 | 1) => {
      setIsAutoPlaying(false);
      const nextIndex = Math.max(
        0,
        Math.min(
          ENGINEERING_SHOW_SCENES.length - 1,
          showState.sceneIndex + delta,
        ),
      );
      jumpToRawScroll(getShowScrollForScene(nextIndex), false);
    },
    [jumpToRawScroll, showState.sceneIndex],
  );

  const handleUnavailable = useCallback(() => {
    setStageUnavailable(true);
    setIsAutoPlaying(false);
    dispatchInspection({ type: "chapter-change" });
  }, []);

  const handleLoaded = useCallback(() => {
    setLoadProgress(100);
    setModelLoaded(true);
  }, []);

  const handleLoadProgress = useCallback((percent: number) => {
    setLoadProgress((prev) =>
      Math.max(prev, Math.min(100, Math.round(percent))),
    );
  }, []);

  const handleStageSelectPart = useCallback(
    (partId: string | null) => {
      setIsAutoPlaying(false);
      dispatchInspection({
        type: "select",
        partId: partId === selectedPartId ? null : partId,
      });
    },
    [selectedPartId],
  );

  const handleBrowserSelectPart = useCallback((partId: string) => {
    setIsAutoPlaying(false);
    dispatchInspection({ type: "select", partId });
  }, []);

  const handleEnterOrbit = useCallback(() => {
    setIsAutoPlaying(false);
    dispatchInspection({ type: "enter-orbit" });
  }, []);

  const handleResetView = useCallback(() => {
    setIsAutoPlaying(false);
    setXray(false);
    setCfdFlow(false);
    setHudMode("contextual");
    jumpToRawScroll(0, true);
  }, [jumpToRawScroll]);

  const cycleHudMode = useCallback(() => {
    setHudMode((prev) =>
      prev === "contextual"
        ? "minimized"
        : prev === "minimized"
          ? "pinned"
          : "contextual",
    );
  }, []);

  useEffect(() => {
    const runway = runwayRef.current;
    const sticky = stickyRef.current;
    if (!runway || !sticky || reducedMotion || stageUnavailable) return;

    const measure = () => {
      const runwayRect = runway.getBoundingClientRect();
      const stickyRect = sticky.getBoundingClientRect();
      const maxTravel = runwayRect.height - stickyRect.height;
      scrollMetricsRef.current = {
        runwayTopDoc: runwayRect.top + window.scrollY,
        maxTravel: maxTravel > 4 ? maxTravel : 0,
      };
    };

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const prevScrollY = previousScrollYRef.current;
      previousScrollYRef.current = currentScrollY;

      const { runwayTopDoc, maxTravel } = scrollMetricsRef.current;
      if (maxTravel <= 4) return;

      const traveled = currentScrollY - runwayTopDoc;
      const rawScroll = Math.max(0, Math.min(1, traveled / maxTravel));
      rawScrollRef.current = rawScroll;

      const mapped = evaluateEngineeringShowScroll(rawScroll);
      if (isProgrammaticJumpRef.current) {
        isProgrammaticJumpRef.current = false;
        setIsProgrammaticJump(false);
      }
      targetTimelineRef.current = mapped.timelineProgress;
      liveBridgeRef.current.targetProgress = mapped.timelineProgress;
      liveBridgeRef.current.cameraArc = mapped.cameraArc;

      commitShowState(mapped, false);
      liveBridgeRef.current.requestRender?.();
      kickDampingRef.current?.();

      if (
        prevScrollY !== null &&
        Math.abs(currentScrollY - prevScrollY) > 0.5 &&
        (isolatedPartIdRef.current || orbitModeRef.current)
      ) {
        liveBridgeRef.current.handoffRequested = true;
        liveBridgeRef.current.handoffClearSelection = false;
        liveBridgeRef.current.requestRender?.();
        dispatchInspection({ type: "reassemble" });
      }
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    const ro =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(onResize);
    ro?.observe(runway);
    ro?.observe(sticky);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    onScroll();

    return () => {
      ro?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [commitShowState, reducedMotion, stageUnavailable]);

  useEffect(() => {
    if (reducedMotion || stageUnavailable) return;
    let rafId = 0;
    let running = false;
    let lastTime = performance.now();
    const bridge = liveBridgeRef.current;

    const tick = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      if (document.hidden || !bridge.stageActive) {
        running = false;
        rafId = 0;
        return;
      }
      const target = targetTimelineRef.current;
      const current = smoothedTimelineRef.current;
      const gap = Math.abs(target - current);
      if (gap > 0.0001) {
        const next = stepShowTimelineProgress(current, target, dt, false);
        smoothedTimelineRef.current = next;
        bridge.smoothedProgress = next;
        bridge.latestEvaluation = evaluateEngineeringStoryTimeline(next);
        bridge.requestRender?.();
        const nowSettled = Math.abs(target - next) <= 0.008;
        if (nowSettled && isProgrammaticJumpRef.current) {
          isProgrammaticJumpRef.current = false;
          setIsProgrammaticJump(false);
        }
        if (nowSettled !== isCameraSettledRef.current) {
          isCameraSettledRef.current = nowSettled;
          setIsCameraSettled(nowSettled);
        }
        rafId = window.requestAnimationFrame(tick);
      } else {
        smoothedTimelineRef.current = target;
        bridge.smoothedProgress = target;
        bridge.latestEvaluation = evaluateEngineeringStoryTimeline(target);
        bridge.requestRender?.();
        if (isProgrammaticJumpRef.current) {
          isProgrammaticJumpRef.current = false;
          setIsProgrammaticJump(false);
        }
        if (!isCameraSettledRef.current) {
          isCameraSettledRef.current = true;
          setIsCameraSettled(true);
        }
        running = false;
        rafId = 0;
      }
    };

    const ensureRaf = () => {
      if (running || document.hidden || !bridge.stageActive) return;
      if (
        Math.abs(targetTimelineRef.current - smoothedTimelineRef.current) <=
        0.0001
      ) {
        return;
      }
      running = true;
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(tick);
    };

    kickDampingRef.current = ensureRaf;

    bridge.onEffectiveProgressSync = (effectiveProgress) => {
      smoothedTimelineRef.current = effectiveProgress;
      bridge.latestEvaluation =
        evaluateEngineeringStoryTimeline(effectiveProgress);
    };
    bridge.onStageActiveChange = (active) => {
      if (active) ensureRaf();
    };
    bridge.onAnnotationProject = (proj: EngineeringAnnotationProjection) => {
      const el = annotationRef.current;
      const sticky = stickyRef.current;
      if (!el || !sticky) return;
      const isWheelMacro =
        proj.partId === "STEERING_WHEEL_LCD" ||
        proj.partId === "STEERING_ENCODERS_LEDS";
      const showLeaderCard =
        selectedPartIdRef.current !== null ||
        hudModeRef.current === "minimized";
      if (
        !showLeaderCard ||
        !proj.visible ||
        !proj.partId ||
        reducedMotion ||
        stageUnavailable ||
        isWheelMacro
      ) {
        el.dataset.visible = "false";
        el.style.opacity = "0";
        return;
      }
      const isMobile = window.matchMedia("(max-width: 860px)").matches;
      const cardW =
        annotationCardRef.current?.offsetWidth || (isMobile ? 280 : 284);
      const layout = resolveLeaderCalloutLayout({
        stageWidth: sticky.clientWidth,
        stageHeight: sticky.clientHeight,
        anchorX: proj.x,
        anchorY: proj.y,
        boundsMinX: proj.boundsMinX,
        boundsMaxX: proj.boundsMaxX,
        boundsMinY: proj.boundsMinY,
        boundsMaxY: proj.boundsMaxY,
        isMobile,
        cardWidth: cardW,
      });

      el.style.opacity = String(Math.max(0, Math.min(1, proj.opacity ?? 1)));
      el.dataset.visible = "true";
      el.dataset.partId = proj.partId;
      if (proj.motionPhaseId) {
        el.dataset.motionPhase = proj.motionPhaseId;
      } else {
        delete el.dataset.motionPhase;
      }
      if (annotationPolylineRef.current) {
        annotationPolylineRef.current.setAttribute(
          "points",
          `${layout.anchorPxX},${layout.anchorPxY} ${layout.elbowPxX},${layout.elbowPxY} ${layout.cardConnectPxX},${layout.cardConnectPxY}`,
        );
      }
      if (annotationRingRef.current) {
        annotationRingRef.current.setAttribute("cx", String(layout.anchorPxX));
        annotationRingRef.current.setAttribute("cy", String(layout.anchorPxY));
      }
      if (annotationDotRef.current) {
        annotationDotRef.current.setAttribute("cx", String(layout.anchorPxX));
        annotationDotRef.current.setAttribute("cy", String(layout.anchorPxY));
      }
      if (annotationCardRef.current) {
        const txOffset =
          layout.align === "right"
            ? "-100%"
            : layout.align === "center"
              ? "-50%"
              : "0%";
        annotationCardRef.current.style.transform = `translate3d(${layout.cardLeftPx}px, ${layout.cardTopPx}px, 0) translate(${txOffset}, -50%)`;
        annotationCardRef.current.dataset.align = layout.align;
      }
      const shot = getEngineeringStoryShot(proj.partId);
      if (annotationIndexRef.current && shot) {
        annotationIndexRef.current.textContent = `${String(shot.index).padStart(2, "0")} / 47`;
      }
      if (annotationLabelRef.current && shot) {
        annotationLabelRef.current.textContent = shot.title[lang];
      }
      if (annotationPhaseRef.current) {
        annotationPhaseRef.current.textContent =
          proj.phase >= 0.95
            ? lang === "vi"
              ? "TÁCH RỜI"
              : "DETACHED"
            : proj.phase > 0.05
              ? `${Math.round(proj.phase * 100)}%`
              : lang === "vi"
                ? "NGUYÊN VỊ"
                : "LOCKED";
      }
    };
    bridge.requestRender?.();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      kickDampingRef.current = null;
      bridge.onEffectiveProgressSync = undefined;
      bridge.onStageActiveChange = undefined;
      bridge.onAnnotationProject = undefined;
    };
  }, [lang, reducedMotion, stageUnavailable]);

  useEffect(() => {
    if (!isAutoPlaying || reducedMotion || stageUnavailable) return;
    let rafId = 0;
    let lastTs = performance.now();

    const pauseOnUserInput = () => setIsAutoPlaying(false);
    window.addEventListener("wheel", pauseOnUserInput, { passive: true });
    window.addEventListener("touchmove", pauseOnUserInput, { passive: true });

    const onVisibility = () => {
      if (!document.hidden && isAutoPlaying) {
        lastTs = performance.now();
        rafId = window.requestAnimationFrame(tickAuto);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const tickAuto = (now: number) => {
      if (document.hidden) {
        rafId = 0;
        return;
      }
      const dtSec = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      const currentState = evaluateEngineeringShowScroll(rawScrollRef.current);
      const sceneSeg = 1 / ENGINEERING_SHOW_SCENES.length;
      const ratePerSec = currentState.isResting
        ? (sceneSeg * (1 - SHOW_TRANSITION_RATIO)) / SHOW_AUTOPLAY_DWELL_SEC
        : (sceneSeg * SHOW_TRANSITION_RATIO) / SHOW_AUTOPLAY_TRANSITION_SEC;

      const nextRaw = Math.min(1, rawScrollRef.current + ratePerSec * dtSec);
      const { runwayTopDoc, maxTravel } = scrollMetricsRef.current;
      if (maxTravel > 4) {
        window.scrollTo({
          top: Math.max(0, runwayTopDoc + nextRaw * maxTravel),
          behavior: "instant" as ScrollBehavior,
        });
      }

      if (nextRaw >= 0.999) {
        setIsAutoPlaying(false);
        return;
      }
      rafId = window.requestAnimationFrame(tickAuto);
    };

    rafId = window.requestAnimationFrame(tickAuto);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("wheel", pauseOnUserInput);
      window.removeEventListener("touchmove", pauseOnUserInput);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAutoPlaying, reducedMotion, stageUnavailable]);

  const motionCue = useMemo(
    () =>
      evaluateEngineeringMotionDirector({
        effectiveProgress: evaluation.progress,
        selectedPartId,
        isolatedPartId,
        reducedMotion,
        xray,
        precomputedStory: evaluation,
      }),
    [evaluation, isolatedPartId, reducedMotion, selectedPartId, xray],
  );

  const { environmentCue } = motionCue;
  const cfdZoneValid = useMemo(
    () => isAnyCfdZoneValid(resolveCfdZoneOpacities(evaluation.parts)),
    [evaluation.parts],
  );
  const inCockpitScene = showState.scene.id === "cockpit-wheel";
  const inMatrixScene = showState.scene.id === "matrix-climax";
  const showCockpitInspector =
    !stageUnavailable &&
    !isolatedPartId &&
    (inCockpitScene ||
      isCockpitInspectorVisible(evaluation.chapter.id, selectedPartId));
  const isHudMinimized = hudMode === "minimized" && !selectedPart;

  const activeScene = showState.displayScene;
  const effectiveStorySide = showCockpitInspector
    ? "right"
    : activeScene.storySide;
  const displayTitle = selectedPart
    ? selectedPart.label[lang]
    : activeScene.title[lang];
  const displayNarrative = selectedPart
    ? selectedPart.summary[lang]
    : activeScene.narrative[lang];

  const effectiveResting = showState.isResting && isCameraSettled;
  const effectivePhase = effectiveResting ? "resting" : "transition";
  const effectiveStoryStage =
    selectedPart !== null
      ? "visible"
      : isProgrammaticJump && !isCameraSettled
        ? "hidden"
        : showState.storyStage;

  return (
    <div
      className="peds-eng-page sp-eng-show"
      data-testid="engineering-show-root"
      data-show-scene={activeScene.id}
      data-show-scene-index={String(showState.sceneIndex)}
      data-show-mood={activeScene.mood}
      data-show-phase={effectivePhase}
      data-show-resting={effectiveResting ? "true" : "false"}
      data-show-settled={isCameraSettled ? "true" : "false"}
      data-story-stage={effectiveStoryStage}
      data-story-side={effectiveStorySide}
      data-timeline-progress={showState.timelineProgress.toFixed(4)}
    >
      <section
        ref={runwayRef}
        style={
          {
            "--peds-eng-scroll-length": `calc(${ENGINEERING_SHOW_TOTAL_VH}svh / var(--peds-visual-zoom))`,
          } as CSSProperties
        }
        aria-label={
          isVi
            ? "Màn trình diễn giải phẫu 3D xe đua F1 theo cốt truyện 12 cảnh"
            : "Interactive 12-scene 3D Formula 1 engineering story show"
        }
        className={`peds-eng-runway ${reducedMotion ? "peds-eng-runway--reduced" : ""} ${stageUnavailable ? "peds-eng-runway--static" : ""}`}
      >
        <div ref={stickyRef} className="peds-eng-sticky">
          <div
            className="peds-eng-studio-backdrop sp-eng-windtunnel-bg"
            data-studio-mode={environmentCue.studioMode}
            data-show-mood={activeScene.mood}
            style={
              {
                "--peds-eng-grid-alpha":
                  environmentCue.datumGridOpacity.toFixed(2),
                "--peds-eng-crimson-glow":
                  environmentCue.crimsonHorizon.toFixed(2),
              } as CSSProperties
            }
            aria-hidden="true"
          >
            <div className="sp-eng-bg-storm" />
            <div className="sp-eng-bg-beams" />
            <div className="sp-eng-bg-lightbar" />
            <div className="sp-eng-bg-aura" />
            <div className="sp-eng-bg-floor" />
            <div className="peds-eng-studio-backdrop__horizon" />
            <div className="peds-eng-studio-backdrop__grid" />
          </div>

          {stageUnavailable ? (
            <div
              className="peds-eng-static-fallback"
              data-testid="engineering-static-fallback"
            >
              <img
                src="/images/eds/engineering/ground-effect-flow.svg"
                alt={
                  isVi
                    ? "Sơ đồ khái niệm luồng khí hiệu ứng mặt đất Podium EDS"
                    : "Podium EDS conceptual ground-effect airflow diagram"
                }
                className="peds-eng-static-fallback__img"
              />
              <p className="peds-eng-static-fallback__note" role="status">
                {isVi
                  ? "Chế độ sơ đồ tĩnh đang bật trên thiết bị không hỗ trợ WebGL."
                  : "Static conceptual view active where WebGL 3D is unavailable."}
              </p>
            </div>
          ) : (
            <ErrorBoundary
              fallback={
                <ShowStageErrorFallback
                  lang={lang}
                  onError={handleUnavailable}
                />
              }
            >
              <Suspense fallback={null}>
                <EngineeringDisassemblyStage
                  evaluation={evaluation}
                  liveBridgeRef={liveBridgeRef}
                  storySide={effectiveStorySide}
                  hasLeftPanel={showCockpitInspector}
                  xray={xray}
                  cfdFlow={cfdFlow}
                  reducedMotion={reducedMotion}
                  orbitMode={orbitMode}
                  selectedPartId={selectedPartId}
                  isolatedPartId={isolatedPartId}
                  onSelectPart={handleStageSelectPart}
                  onEnterOrbit={handleEnterOrbit}
                  onLoadProgress={handleLoadProgress}
                  onLoaded={handleLoaded}
                  onUnavailable={handleUnavailable}
                />
              </Suspense>
            </ErrorBoundary>
          )}

          {!stageUnavailable && !modelLoaded && (
            <div
              className="peds-eng-loading"
              data-testid="engineering-loading-indicator"
              role="status"
              aria-live="polite"
            >
              <div className="peds-eng-loading__row">
                <span className="peds-eng-loading__dot" aria-hidden="true" />
                <span>
                  {isVi
                    ? "Đang chuẩn bị sân khấu 47 cụm..."
                    : "Preparing 47-part 3D show..."}
                </span>
                <strong
                  className="peds-eng-loading__pct"
                  data-testid="engineering-loading-percent"
                >
                  {loadProgress}%
                </strong>
              </div>
              <div className="peds-eng-loading__bar" aria-hidden="true">
                <div
                  className="peds-eng-loading__bar-fill"
                  style={{
                    transform: `scaleX(${Math.max(0.04, loadProgress / 100)})`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="peds-eng-vignette" aria-hidden="true" />

          <div
            ref={annotationRef}
            className="peds-eng-3d-annotation"
            data-testid="engineering-3d-annotation"
            data-visible="false"
            aria-hidden="true"
          >
            <svg className="peds-eng-callout-svg" aria-hidden="true">
              <polyline
                ref={annotationPolylineRef}
                className="peds-eng-callout-line"
                fill="none"
              />
              <circle
                ref={annotationRingRef}
                className="peds-eng-callout-ring"
                r="6.5"
              />
              <circle
                ref={annotationDotRef}
                className="peds-eng-callout-dot"
                r="2.6"
              />
            </svg>
            <span
              ref={annotationCardRef}
              className="peds-eng-3d-annotation__card"
            >
              <span
                ref={annotationIndexRef}
                className="peds-eng-3d-annotation__index"
              />
              <span
                ref={annotationLabelRef}
                className="peds-eng-3d-annotation__label"
              />
              <span
                ref={annotationPhaseRef}
                className="peds-eng-3d-annotation__phase"
              />
            </span>
          </div>

          <nav
            className="sp-eng-spine"
            aria-label={
              isVi
                ? "12 cảnh cốt truyện Kỹ thuật"
                : "12 Engineering Show Scenes"
            }
            data-testid="engineering-story-spine"
          >
            {ENGINEERING_SHOW_SCENES.map((scene) => {
              const active = scene.index === showState.sceneIndex;
              const visited = scene.index < showState.sceneIndex;
              return (
                <button
                  key={scene.id}
                  type="button"
                  className={`sp-eng-spine__item ${active ? "is-active" : ""} ${visited ? "is-visited" : ""}`}
                  aria-current={active ? "step" : undefined}
                  aria-label={`${scene.indexLabel} · ${scene.title[lang]}`}
                  data-scene-btn={scene.id}
                  onClick={() => jumpToScene(scene.index)}
                >
                  <span className="sp-eng-spine__tip">
                    <b>{scene.indexLabel}</b> · {scene.title[lang]}
                  </span>
                  <span className="sp-eng-spine__dot" aria-hidden="true" />
                </button>
              );
            })}
          </nav>

          <div
            className="peds-eng-hud sp-eng-show-hud"
            data-hud-mode={hudMode}
            data-story-side={effectiveStorySide}
            data-camera-transit={
              !showState.isResting && hudMode === "contextual"
                ? "true"
                : undefined
            }
          >
            <header
              className={`peds-eng-copy sp-eng-story-stage ${isHudMinimized ? "peds-eng-copy--minimized" : ""}`}
              data-story-stage={effectiveStoryStage}
              data-story-side={effectiveStorySide}
            >
              <div
                key={`meta-${activeScene.id}`}
                className="peds-eng-copy__meta-bar sp-eng-anim-meta"
              >
                <p className="peds-eng-overline">
                  <span className="sp-eng-overline-step">
                    {activeScene.indexLabel} /{" "}
                    {String(ENGINEERING_SHOW_SCENES.length).padStart(2, "0")}
                  </span>
                  <span className="sp-eng-overline-dot" aria-hidden="true">
                    ·
                  </span>
                  <span className="sp-eng-overline-act">
                    {activeScene.actLabel[lang]}
                  </span>
                </p>

                <span
                  className={`sp-eng-beat-pill ${effectiveResting ? "is-resting" : "is-gliding"}`}
                  data-testid="engineering-dwell-badge"
                >
                  <span className="sp-eng-beat-pill__dot" aria-hidden="true" />
                  <span>
                    {effectiveResting
                      ? isVi
                        ? "KHOẢNG NGHỈ · ĐANG KỂ CHUYỆN"
                        : "RESTING BEAT · IN FOCUS"
                      : isVi
                        ? "CHUYỂN CẢNH"
                        : "GLIDING TO SCENE"}
                  </span>
                </span>
              </div>

              <div
                key={`${activeScene.id}-${selectedPart?.id ?? "story"}-${effectiveStoryStage === "hidden" ? "wait" : "show"}`}
                className="peds-eng-copy__stagger sp-eng-story-choreo"
              >
                <div className="sp-eng-title-mask">
                  <h1
                    className="peds-eng-title sp-eng-anim-title"
                    data-testid="engineering-story-title"
                  >
                    {displayTitle}
                  </h1>
                </div>

                {!isHudMinimized && (
                  <>
                    <p
                      className="peds-eng-summary sp-eng-narrative sp-eng-anim-body"
                      data-testid="engineering-story-narrative"
                    >
                      {displayNarrative}
                    </p>

                    <div className="sp-eng-story-foot sp-eng-anim-foot">
                      <span className="sp-eng-tech-cue">
                        {activeScene.techCue[lang]}
                      </span>
                      <div
                        className="sp-eng-dwell-track"
                        aria-hidden="true"
                        title={
                          isVi
                            ? "Tiến trình khoảng nghỉ của cảnh hiện tại"
                            : "Current scene resting beat progress"
                        }
                      >
                        <div
                          ref={dwellBarFillRef}
                          className="sp-eng-dwell-fill"
                          style={{
                            transform: `scaleX(${Math.max(0.06, showState.dwellProgress)})`,
                          }}
                        />
                      </div>
                      <span className="sp-eng-next-hint">
                        {activeScene.transitionHint[lang]}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {showState.isFinale && !selectedPart && (
                <div
                  className="sp-eng-finale-actions"
                  data-testid="engineering-finale-cta"
                >
                  <button
                    type="button"
                    className="peds-eng-pill peds-eng-pill--cockpit-active"
                    onClick={() => jumpToScene(0)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isVi ? "Xem lại Show" : "Replay Show"}</span>
                  </button>
                  <Link
                    to="/showroom"
                    className="peds-eng-pill"
                    onMouseEnter={() => prefetchStormRoute("showroom")}
                    onFocus={() => prefetchStormRoute("showroom")}
                  >
                    <span>
                      {isVi
                        ? "Sang Garage Showroom"
                        : "Enter Pit Garage Showroom"}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              )}

              {selectedPart && (
                <div
                  className="peds-eng-selected-actions"
                  data-testid="engineering-selected-part"
                >
                  <EngineeringPartActions
                    lang={lang}
                    isolated={isolatedPartId === selectedPart.id}
                    disabled={!modelLoaded || stageUnavailable}
                    onIsolate={() => dispatchInspection({ type: "isolate" })}
                    onReassemble={() =>
                      dispatchInspection({ type: "reassemble" })
                    }
                  />
                  <button
                    type="button"
                    className="peds-eng-part-toast__close"
                    onClick={() =>
                      dispatchInspection({ type: "select", partId: null })
                    }
                    aria-label={
                      isVi ? "Đóng thông tin linh kiện" : "Clear selected part"
                    }
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </header>

            {showCockpitInspector && (
              <div className="peds-eng-cockpit-host">
                <EngineeringCockpitPanel
                  lang={lang}
                  state={cockpitTelemetry}
                  onDispatch={dispatchCockpitTelemetry}
                  onFocusControlPart={(partId) =>
                    dispatchInspection({ type: "select", partId })
                  }
                />
              </div>
            )}

            <div className="peds-eng-bottom">
              {cfdFlow &&
                !stageUnavailable &&
                !isolatedPartId &&
                cfdZoneValid && (
                  <div
                    className="peds-eng-cfd-legend"
                    data-testid="engineering-cfd-legend"
                    role="status"
                  >
                    {ENGINEERING_CFD_ZONES.map((zone) => (
                      <span key={zone.id} className="peds-eng-cfd-legend__item">
                        <span
                          className="peds-eng-cfd-legend__dot"
                          style={{ backgroundColor: zone.colorHex }}
                          aria-hidden="true"
                        />
                        <span>{zone.label[lang]}</span>
                      </span>
                    ))}
                  </div>
                )}

              {cfdFlow &&
                !stageUnavailable &&
                !isolatedPartId &&
                !cfdZoneValid && (
                  <div
                    className="peds-eng-cfd-notice"
                    data-testid="engineering-cfd-notice"
                    role="status"
                  >
                    <span>
                      {isVi
                        ? "Luồng khí CFD hiển thị chuẩn nhất khi các cụm khí động đang lắp ráp."
                        : "Illustrative CFD flow applies to assembled aerodynamic geometry."}
                    </span>
                    <button
                      type="button"
                      className="peds-eng-cfd-notice__btn"
                      onClick={() => jumpToScene(0)}
                    >
                      {isVi ? "Về Mở Màn" : "Return to Prologue"}
                    </button>
                  </div>
                )}

              <div
                className="peds-eng-dock sp-eng-show-dock"
                role="toolbar"
                aria-label={
                  isVi
                    ? "Điều khiển màn trình diễn 3D Engineering"
                    : "3D Engineering story show controls"
                }
              >
                <div className="sp-eng-show-transport">
                  {!reducedMotion && !stageUnavailable && (
                    <button
                      type="button"
                      className={`peds-eng-pill sp-eng-play-btn ${isAutoPlaying ? "peds-eng-pill--cockpit-active" : ""}`}
                      data-testid="engineering-autoplay-toggle"
                      aria-pressed={isAutoPlaying}
                      onClick={() => {
                        if (!isAutoPlaying && rawScrollRef.current >= 0.99) {
                          jumpToRawScroll(0, true);
                        }
                        setIsAutoPlaying((prev) => !prev);
                      }}
                    >
                      {isAutoPlaying ? (
                        <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>
                        {isAutoPlaying
                          ? isVi
                            ? "Tạm dừng"
                            : "Pause"
                          : isVi
                            ? "Phát Show"
                            : "Play Show"}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="peds-eng-stepper"
                    data-testid="engineering-prev-scene"
                    aria-label={isVi ? "Cảnh trước" : "Previous scene"}
                    disabled={showState.sceneIndex <= 0}
                    onClick={() => stepScene(-1)}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="peds-eng-stepper"
                    data-testid="engineering-next-scene"
                    aria-label={isVi ? "Cảnh tiếp theo" : "Next scene"}
                    disabled={
                      showState.sceneIndex >= ENGINEERING_SHOW_SCENES.length - 1
                    }
                    onClick={() => stepScene(1)}
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="peds-eng-progress-group sp-eng-show-scrubber-group">
                  <div className="peds-eng-scrubber">
                    <div className="peds-eng-bar">
                      <div
                        ref={scrubberFillRef}
                        className="peds-eng-bar__fill"
                        style={{
                          transform: `scaleX(${Math.max(0.02, showState.rawScroll)})`,
                        }}
                      />
                      <input
                        ref={scrubberInputRef}
                        type="range"
                        min={0}
                        max={1000}
                        step={1}
                        defaultValue={Math.round(showState.rawScroll * 1000)}
                        className="peds-eng-scrubber__input"
                        data-testid="engineering-timeline-scrubber"
                        aria-label={
                          isVi
                            ? "Thanh kéo tiến trình 12 cảnh Show"
                            : "12-scene show timeline scrubber"
                        }
                        onChange={(event) => {
                          setIsAutoPlaying(false);
                          jumpToRawScroll(Number(event.target.value) / 1000);
                        }}
                      />
                    </div>
                    <span
                      ref={scrubberReadoutRef}
                      className="peds-eng-scrubber__readout sp-eng-scene-readout"
                      data-testid="engineering-scrubber-readout"
                    >
                      {activeScene.indexLabel} /{" "}
                      {String(ENGINEERING_SHOW_SCENES.length).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                <span className="peds-eng-divider" aria-hidden="true" />

                <div className="peds-eng-actions">
                  <button
                    ref={partsButtonRef}
                    id="engineering-parts-trigger"
                    type="button"
                    className="peds-eng-pill"
                    aria-expanded={partBrowserOpen}
                    aria-controls="engineering-parts-dialog"
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setPartBrowserOpen(true);
                    }}
                  >
                    <List className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {isVi
                        ? `${ENGINEERING_PARTS.length} linh kiện`
                        : `${ENGINEERING_PARTS.length} parts`}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`peds-eng-pill ${inCockpitScene ? "peds-eng-pill--cockpit-active" : ""}`}
                    aria-pressed={inCockpitScene}
                    onClick={() => jumpToScene(5)}
                  >
                    <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isVi ? "Buồng Lái" : "Cockpit"}</span>
                  </button>

                  {inMatrixScene && (
                    <button
                      type="button"
                      className={`peds-eng-pill ${orbitMode ? "peds-eng-pill--orbit-active" : ""}`}
                      aria-pressed={orbitMode}
                      disabled={
                        !modelLoaded || stageUnavailable || reducedMotion
                      }
                      onClick={() =>
                        dispatchInspection({
                          type: orbitMode ? "exit-orbit" : "enter-orbit",
                        })
                      }
                    >
                      <Orbit className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {orbitMode
                          ? isVi
                            ? "Thoát Orbit"
                            : "Exit Orbit"
                          : isVi
                            ? "Xoay 360°"
                            : "360° Orbit"}
                      </span>
                    </button>
                  )}

                  {!stageUnavailable && (
                    <button
                      type="button"
                      className={`peds-eng-pill ${cfdFlow ? "peds-eng-pill--cfd-active" : ""}`}
                      data-testid="engineering-cfd-toggle"
                      aria-pressed={cfdFlow}
                      onClick={() => setCfdFlow((prev) => !prev)}
                    >
                      <Wind className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>CFD</span>
                    </button>
                  )}

                  {!stageUnavailable && (
                    <button
                      type="button"
                      className={`peds-eng-pill ${xray ? "peds-eng-pill--xray-active" : ""}`}
                      aria-pressed={xray}
                      onClick={() => setXray((prev) => !prev)}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{isVi ? "Xuyên Vỏ" : "X-Ray"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className={`peds-eng-pill ${hudMode !== "contextual" ? "peds-eng-pill--hud-active" : ""}`}
                    data-testid="engineering-hud-toggle"
                    aria-pressed={hudMode === "pinned"}
                    onClick={cycleHudMode}
                  >
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {hudMode === "minimized"
                        ? isVi
                          ? "Hiện lời kể"
                          : "Show Story"
                        : "HUD"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="peds-eng-stepper"
                    aria-label={isVi ? "Đặt lại từ đầu" : "Reset Show"}
                    title={isVi ? "Đặt lại từ đầu" : "Reset Show"}
                    onClick={handleResetView}
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <p className="peds-eng-credit">
                {isVi
                  ? "3D Concept: Peter Kiss · FP-04 RB · Mô hình minh họa kỹ thuật phi thương mại"
                  : "3D Concept: Peter Kiss · FP-04 RB · Non-commercial illustrative engineering study"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <EngineeringPartBrowser
        open={partBrowserOpen}
        lang={lang}
        parts={ENGINEERING_PARTS}
        selectedPartId={selectedPartId}
        onSelect={handleBrowserSelectPart}
        onClose={() => setPartBrowserOpen(false)}
        onClosed={() => partsButtonRef.current?.focus()}
      />
    </div>
  );
}
