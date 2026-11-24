import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useReducer,
  useState,
} from "react";
import type { CSSProperties } from "react";
import type { EngineeringLiveTimelineBridge } from "./EngineeringDisassemblyStage";
import {
  ENGINEERING_SCROLL_UI_MIN_INTERVAL_MS,
  resolveEngineeringUiCommitKey,
  resolveLeaderCalloutLayout,
  type EngineeringAnnotationProjection,
  type EngineeringHudMode,
} from "./engineeringInteractionState";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clock3,
  Eye,
  Gauge,
  Info,
  List,
  Orbit,
  RotateCcw,
  Wind,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ENGINEERING_ARTICLES } from "../../data/engineeringArticles";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useNavigationStore } from "../../store/useNavigationStore";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { EngineeringCockpitPanel } from "./EngineeringCockpitPanel";
import { EngineeringPartActions } from "./EngineeringPartActions";
import { EngineeringPartBrowser } from "./EngineeringPartBrowser";
import {
  ENGINEERING_CFD_ZONES,
  isAnyCfdZoneValid,
  resolveCfdZoneOpacities,
} from "./engineeringAeroStreamlines";
import {
  INITIAL_COCKPIT_TELEMETRY_STATE,
  engineeringCockpitTelemetryReducer,
  isCockpitInspectorVisible,
} from "./engineeringCockpitTelemetry";
import { ENGINEERING_PARTS } from "./engineeringDisassemblyData";
import {
  ENGINEERING_STORY_CHAPTERS,
  ENGINEERING_STORY_COCKPIT_PROGRESS,
  ENGINEERING_STORY_SCROLL_VH,
  ENGINEERING_STORY_SHOTS,
  evaluateEngineeringStoryTimeline,
  getEngineeringStoryShot,
  resolveEngineeringStoryDeepLinkProgress,
  resolveEngineeringStoryShotProgress,
  stepEngineeringStoryProgress,
} from "./engineeringStoryTimeline";
import {
  engineeringInspectionReducer,
  INITIAL_ENGINEERING_INSPECTION_STATE,
} from "./engineeringInspectionState";
import { evaluateEngineeringMotionDirector } from "./engineeringMotionDirector";
import "./engineeringStudio.css";

const EngineeringDisassemblyStage = lazy(() =>
  import("./EngineeringDisassemblyStage").then((m) => ({
    default: m.EngineeringDisassemblyStage,
  })),
);

function EngineeringStageErrorFallback({
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
          ? "Mô hình 3D không khả dụng. Nội dung tám chương vẫn được giữ bên dưới."
          : "The 3D model is unavailable. The full eight-chapter story remains below."}
      </p>
    </div>
  );
}

const EngineeringIndexPageImpl: React.FC = () => {
  const lang = useNavigationStore((state) => state.lang);
  const reducedMotion = useReducedMotion();
  const { search } = useLocation();
  const chapterParam = useMemo(
    () => new URLSearchParams(search).get("chapter"),
    [search],
  );

  const initialProgress = useMemo(
    () => resolveEngineeringStoryDeepLinkProgress(chapterParam) ?? 0,
    [chapterParam],
  );

  const runwayRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const editorialRef = useRef<HTMLElement>(null);
  const annotationRef = useRef<HTMLDivElement>(null);
  const annotationCardRef = useRef<HTMLSpanElement>(null);
  const annotationPolylineRef = useRef<SVGPolylineElement>(null);
  const annotationRingRef = useRef<SVGCircleElement>(null);
  const annotationDotRef = useRef<SVGCircleElement>(null);
  const annotationIndexRef = useRef<HTMLSpanElement>(null);
  const annotationLabelRef = useRef<HTMLSpanElement>(null);
  const annotationPhaseRef = useRef<HTMLSpanElement>(null);
  const partsButtonRef = useRef<HTMLButtonElement>(null);
  const actionsRailRef = useRef<HTMLDivElement>(null);
  const scrubberFillRef = useRef<HTMLDivElement>(null);
  const scrubberInputRef = useRef<HTMLInputElement>(null);
  const scrubberReadoutRef = useRef<HTMLSpanElement>(null);
  const targetProgressRef = useRef<number>(initialProgress);
  const smoothedProgressRef = useRef<number>(initialProgress);
  const previousChapterIdRef = useRef<string | null>(null);
  const isolatedPartIdRef = useRef<string | null>(null);
  const orbitModeRef = useRef<boolean>(false);
  const previousScrollYRef = useRef<number | null>(null);
  const lastUiKeyRef = useRef<string>("");
  const lastUiCommitAtRef = useRef<number>(0);
  const lastReadoutCommitAtRef = useRef<number>(0);
  const pendingUiEvalRef = useRef<ReturnType<
    typeof evaluateEngineeringStoryTimeline
  > | null>(null);
  const pendingUiTimerRef = useRef<number | null>(null);
  const lastReadoutTextRef = useRef<string>("");
  const scrollMetricsRef = useRef<{
    runwayTopDoc: number;
    stickyTopOffset: number;
    maxTravel: number;
  }>({ runwayTopDoc: 0, stickyTopOffset: 64, maxTravel: 0 });
  const kickDampingRef = useRef<(() => void) | null>(null);
  const liveBridgeRef = useRef<EngineeringLiveTimelineBridge>({
    targetProgress: initialProgress,
    smoothedProgress: initialProgress,
    controlMode: "timeline",
    handoffRequested: false,
    handoffClearSelection: false,
    stageActive: true,
    latestEvaluation: undefined,
  });

  const [evaluation, setEvaluation] = useState(() =>
    evaluateEngineeringStoryTimeline(initialProgress),
  );
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const [hudMode, setHudMode] = useState<EngineeringHudMode>("contextual");
  const [xray, setXray] = useState(false);
  const [cfdFlow, setCfdFlow] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [cockpitTelemetry, dispatchCockpitTelemetry] = useReducer(
    engineeringCockpitTelemetryReducer,
    INITIAL_COCKPIT_TELEMETRY_STATE,
  );
  const [inspection, dispatchInspection] = useReducer(
    engineeringInspectionReducer,
    INITIAL_ENGINEERING_INSPECTION_STATE,
  );
  const { selectedPartId, isolatedPartId, orbitMode } = inspection;
  const [partBrowserOpen, setPartBrowserOpen] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [stageUnavailable, setStageUnavailable] = useState(false);
  const [actionsScrollHint, setActionsScrollHint] = useState<
    "none" | "right" | "left" | "both"
  >("none");

  const selectedPart = useMemo(
    () => ENGINEERING_PARTS.find((p) => p.id === selectedPartId) ?? null,
    [selectedPartId],
  );

  useEffect(() => {
    const rail = actionsRailRef.current;
    if (!rail) return;
    const syncHint = () => {
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      if (maxScroll <= 6) {
        setActionsScrollHint("none");
        return;
      }
      const canLeft = rail.scrollLeft > 6;
      const canRight = rail.scrollLeft < maxScroll - 6;
      setActionsScrollHint(
        canLeft && canRight
          ? "both"
          : canRight
            ? "right"
            : canLeft
              ? "left"
              : "none",
      );
    };
    syncHint();
    rail.addEventListener("scroll", syncHint, { passive: true });
    window.addEventListener("resize", syncHint, { passive: true });
    const ro =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(syncHint);
    ro?.observe(rail);
    return () => {
      rail.removeEventListener("scroll", syncHint);
      window.removeEventListener("resize", syncHint);
      ro?.disconnect();
    };
  }, [evaluation.chapter.id, stageUnavailable, lang]);

  useEffect(() => {
    isolatedPartIdRef.current = isolatedPartId;
    orbitModeRef.current = orbitMode;
  }, [isolatedPartId, orbitMode]);

  const syncScrubberDom = useCallback(
    (progress: number, chapterShortLabel?: string, forceText = false) => {
      const clamped = Math.max(0, Math.min(1, progress));
      if (scrubberFillRef.current) {
        scrubberFillRef.current.style.transform = `scaleX(${Math.max(0.02, clamped)})`;
      }
      const nextReadout = `${(clamped * 100).toFixed(1)}%`;
      const now = performance.now();
      if (
        nextReadout !== lastReadoutTextRef.current &&
        (forceText || now - lastReadoutCommitAtRef.current >= 120)
      ) {
        lastReadoutTextRef.current = nextReadout;
        lastReadoutCommitAtRef.current = now;
        if (scrubberReadoutRef.current) {
          scrubberReadoutRef.current.textContent = nextReadout;
        }
        if (scrubberInputRef.current) {
          scrubberInputRef.current.value = String(Math.round(clamped * 1000));
          if (chapterShortLabel) {
            scrubberInputRef.current.setAttribute(
              "aria-valuetext",
              `${nextReadout} · ${chapterShortLabel}`,
            );
          }
        }
      }
    },
    [],
  );

  const flushPendingEvaluation = useCallback(() => {
    if (pendingUiTimerRef.current !== null) {
      window.clearTimeout(pendingUiTimerRef.current);
      pendingUiTimerRef.current = null;
    }
    const pending = pendingUiEvalRef.current;
    if (!pending) return;
    pendingUiEvalRef.current = null;
    const returningSystemChapterId = pending.storyBeat.partId
      ? (getEngineeringStoryShot(pending.storyBeat.partId)?.chapterId ?? null)
      : null;
    const motionPhaseId =
      evaluateEngineeringMotionDirector({
        effectiveProgress: pending.progress,
        precomputedStory: pending,
      }).activePhaseCue?.phaseId ?? null;
    const key = resolveEngineeringUiCommitKey({
      chapterId: pending.chapter.id,
      storyBeatId: pending.storyBeat.id,
      showChapterTitle: pending.showChapterTitle,
      progress: pending.progress,
      returningSystemChapterId,
      motionPhaseId,
    });
    if (key !== lastUiKeyRef.current) {
      lastUiKeyRef.current = key;
      lastUiCommitAtRef.current = performance.now();
      setEvaluation(pending);
    }
  }, []);

  const commitDiscreteEvaluation = useCallback(
    (
      nextEval: ReturnType<typeof evaluateEngineeringStoryTimeline>,
      force = false,
    ) => {
      liveBridgeRef.current.latestEvaluation = nextEval;
      syncScrubberDom(
        nextEval.progress,
        nextEval.chapter.shortLabel[lang],
        force,
      );
      const returningSystemChapterId = nextEval.storyBeat.partId
        ? (getEngineeringStoryShot(nextEval.storyBeat.partId)?.chapterId ??
          null)
        : null;
      const motionPhaseId =
        evaluateEngineeringMotionDirector({
          effectiveProgress: nextEval.progress,
          precomputedStory: nextEval,
        }).activePhaseCue?.phaseId ?? null;
      const key = resolveEngineeringUiCommitKey({
        chapterId: nextEval.chapter.id,
        storyBeatId: nextEval.storyBeat.id,
        showChapterTitle: nextEval.showChapterTitle,
        progress: nextEval.progress,
        returningSystemChapterId,
        motionPhaseId,
      });

      if (force) {
        if (pendingUiTimerRef.current !== null) {
          window.clearTimeout(pendingUiTimerRef.current);
          pendingUiTimerRef.current = null;
        }
        pendingUiEvalRef.current = null;
        lastUiKeyRef.current = key;
        lastUiCommitAtRef.current = performance.now();
        setEvaluation(nextEval);
        return;
      }

      if (key === lastUiKeyRef.current) {
        pendingUiEvalRef.current = null;
        return;
      }

      const now = performance.now();
      const elapsed = now - lastUiCommitAtRef.current;
      if (elapsed >= ENGINEERING_SCROLL_UI_MIN_INTERVAL_MS) {
        if (pendingUiTimerRef.current !== null) {
          window.clearTimeout(pendingUiTimerRef.current);
          pendingUiTimerRef.current = null;
        }
        pendingUiEvalRef.current = null;
        lastUiKeyRef.current = key;
        lastUiCommitAtRef.current = now;
        setEvaluation(nextEval);
      } else {
        pendingUiEvalRef.current = nextEval;
        if (pendingUiTimerRef.current === null) {
          pendingUiTimerRef.current = window.setTimeout(
            flushPendingEvaluation,
            Math.max(16, ENGINEERING_SCROLL_UI_MIN_INTERVAL_MS - elapsed),
          );
        }
      }
    },
    [flushPendingEvaluation, lang, syncScrubberDom],
  );

  useEffect(
    () => () => {
      if (pendingUiTimerRef.current !== null) {
        window.clearTimeout(pendingUiTimerRef.current);
        pendingUiTimerRef.current = null;
      }
    },
    [],
  );

  // Track real React commits in DEV/localhost production-preview probes
  // (React.Profiler onRender is stripped in production builds).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as Window & {
      __PEDS_ENG_METRICS__?: { reactCommits: number };
    };
    if (w.__PEDS_ENG_METRICS__) {
      w.__PEDS_ENG_METRICS__.reactCommits += 1;
    }
  });

  const handleUnavailable = useCallback(() => {
    setStageUnavailable(true);
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
      dispatchInspection({
        type: "select",
        partId: partId === selectedPartId ? null : partId,
      });
    },
    [selectedPartId],
  );

  const handleBrowserSelectPart = useCallback((partId: string) => {
    dispatchInspection({ type: "select", partId });
  }, []);

  const handleEnterOrbit = useCallback(() => {
    dispatchInspection({ type: "enter-orbit" });
  }, []);

  const handleClosePartBrowser = useCallback(() => {
    setPartBrowserOpen(false);
  }, []);

  const handlePartBrowserClosed = useCallback(() => {
    partsButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (previousChapterIdRef.current === null) {
      previousChapterIdRef.current = evaluation.chapter.id;
      return;
    }
    if (previousChapterIdRef.current !== evaluation.chapter.id) {
      previousChapterIdRef.current = evaluation.chapter.id;
      dispatchInspection({ type: "reset" });
      const timer = window.setTimeout(() => {
        setLiveAnnouncement(
          `${evaluation.chapter.index} / 08 · ${evaluation.chapter.title[lang]}`,
        );
      }, 450);
      return () => window.clearTimeout(timer);
    }
  }, [
    evaluation.chapter.id,
    evaluation.chapter.index,
    evaluation.chapter.title,
    lang,
  ]);

  const jumpToProgress = useCallback(
    (nextProgress: number, immediate = false) => {
      const clamped = Math.max(0, Math.min(1, nextProgress));
      if (orbitModeRef.current || isolatedPartIdRef.current) {
        liveBridgeRef.current.handoffRequested = true;
        liveBridgeRef.current.handoffClearSelection = true;
      }
      dispatchInspection({ type: "reset" });
      targetProgressRef.current = clamped;
      liveBridgeRef.current.targetProgress = clamped;

      const runway = runwayRef.current;
      const sticky = stickyRef.current;
      if (runway && sticky && !reducedMotion && !stageUnavailable) {
        const runwayRect = runway.getBoundingClientRect();
        const stickyRect = sticky.getBoundingClientRect();
        const maxTravel = runwayRect.height - stickyRect.height;
        if (maxTravel > 4) {
          const currentTraveled = stickyRect.top - runwayRect.top;
          const deltaViewportPx = clamped * maxTravel - currentTraveled;
          if (Math.abs(deltaViewportPx) > 1) {
            window.scrollBy({
              top: deltaViewportPx,
              behavior: "instant" as ScrollBehavior,
            });
          }
          if (immediate) {
            smoothedProgressRef.current = clamped;
            liveBridgeRef.current.smoothedProgress = clamped;
            commitDiscreteEvaluation(
              evaluateEngineeringStoryTimeline(clamped),
              true,
            );
          } else {
            kickDampingRef.current?.();
          }
          return;
        }
      }

      smoothedProgressRef.current = clamped;
      liveBridgeRef.current.smoothedProgress = clamped;
      commitDiscreteEvaluation(evaluateEngineeringStoryTimeline(clamped), true);
    },
    [commitDiscreteEvaluation, reducedMotion, stageUnavailable],
  );

  // Sync deep-link ?chapter=... parameter when URL query changes
  useEffect(() => {
    const deep = resolveEngineeringStoryDeepLinkProgress(chapterParam);
    if (deep !== null) {
      jumpToProgress(deep, true);
    }
  }, [chapterParam, jumpToProgress]);

  // Zero-reflow cached sticky scroll metrics + single passive scroll listener
  useEffect(() => {
    const runway = runwayRef.current;
    const sticky = stickyRef.current;
    if (!runway || !sticky || reducedMotion || stageUnavailable) return;

    const measureRunwayMetrics = () => {
      const runwayRect = runway.getBoundingClientRect();
      const stickyRect = sticky.getBoundingClientRect();
      const maxTravel = runwayRect.height - stickyRect.height;
      const computedTop = Number.parseFloat(
        window.getComputedStyle(sticky).top,
      );
      scrollMetricsRef.current = {
        runwayTopDoc: runwayRect.top + window.scrollY,
        stickyTopOffset: Number.isFinite(computedTop) ? computedTop : 64,
        maxTravel: maxTravel > 4 ? maxTravel : 0,
      };
    };

    const computeScrollRatio = () => {
      const currentScrollY = window.scrollY;
      const previousScrollY = previousScrollYRef.current;
      previousScrollYRef.current = currentScrollY;
      const { runwayTopDoc, stickyTopOffset, maxTravel } =
        scrollMetricsRef.current;
      if (maxTravel <= 4) return;
      const traveled = currentScrollY + stickyTopOffset - runwayTopDoc;
      const ratio = Math.max(0, Math.min(1, traveled / maxTravel));
      targetProgressRef.current = ratio;
      liveBridgeRef.current.targetProgress = ratio;
      kickDampingRef.current?.();

      // Atomic exit from Orbit / Isolation on first deliberate external page scroll
      if (
        previousScrollY !== null &&
        Math.abs(currentScrollY - previousScrollY) > 0.5 &&
        (isolatedPartIdRef.current || orbitModeRef.current)
      ) {
        liveBridgeRef.current.handoffRequested = true;
        liveBridgeRef.current.handoffClearSelection = false;
        dispatchInspection({ type: "reassemble" });
      }
    };

    const handleResize = () => {
      measureRunwayMetrics();
      computeScrollRatio();
    };

    measureRunwayMetrics();
    const ro =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(handleResize);
    ro?.observe(runway);
    ro?.observe(sticky);

    window.addEventListener("scroll", computeScrollRatio, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    if (initialProgress > 0) {
      jumpToProgress(initialProgress, true);
    } else {
      computeScrollRatio();
    }
    return () => {
      ro?.disconnect();
      window.removeEventListener("scroll", computeScrollRatio);
      window.removeEventListener("resize", handleResize);
    };
  }, [initialProgress, jumpToProgress, reducedMotion, stageUnavailable]);

  // On-demand smooth RAF damping loop (zero idle RAF callbacks; updates DOM refs directly)
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
      const target = targetProgressRef.current;
      const current = smoothedProgressRef.current;
      if (Math.abs(target - current) > 0.0001) {
        const next = stepEngineeringStoryProgress(current, target, dt, false);
        smoothedProgressRef.current = next;
        bridge.smoothedProgress = next;
        commitDiscreteEvaluation(evaluateEngineeringStoryTimeline(next));
        rafId = window.requestAnimationFrame(tick);
      } else {
        smoothedProgressRef.current = target;
        bridge.smoothedProgress = target;
        const settledEval = evaluateEngineeringStoryTimeline(target);
        bridge.latestEvaluation = settledEval;
        syncScrubberDom(target, settledEval.chapter.shortLabel[lang], true);
        if (pendingUiEvalRef.current) {
          pendingUiEvalRef.current = settledEval;
          flushPendingEvaluation();
        } else {
          commitDiscreteEvaluation(settledEval);
        }
        running = false;
        rafId = 0;
      }
    };

    const ensureDampingRaf = () => {
      if (running || document.hidden || !bridge.stageActive) return;
      if (
        Math.abs(targetProgressRef.current - smoothedProgressRef.current) <=
        0.0001
      ) {
        return;
      }
      running = true;
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(tick);
    };

    kickDampingRef.current = ensureDampingRaf;

    bridge.onEffectiveProgressSync = (effectiveProgress) => {
      smoothedProgressRef.current = effectiveProgress;
      commitDiscreteEvaluation(
        evaluateEngineeringStoryTimeline(effectiveProgress),
      );
    };
    bridge.onStageActiveChange = (active) => {
      if (active) ensureDampingRaf();
    };
    bridge.onAnnotationProject = (proj: EngineeringAnnotationProjection) => {
      const el = annotationRef.current;
      const sticky = stickyRef.current;
      if (!el || !sticky) return;
      const isWheelMacro =
        proj.partId === "STEERING_WHEEL_LCD" ||
        proj.partId === "STEERING_ENCODERS_LEDS";
      if (
        !proj.visible ||
        !proj.partId ||
        reducedMotion ||
        stageUnavailable ||
        isWheelMacro
      ) {
        el.dataset.visible = "false";
        el.style.opacity = "0";
        if (proj.motionPhaseId) {
          el.dataset.motionPhase = proj.motionPhaseId;
        } else {
          delete el.dataset.motionPhase;
        }
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
      if (annotationPolylineRef.current) {
        annotationPolylineRef.current.setAttribute(
          "points",
          `${layout.anchorPxX},${layout.anchorPxY} ${layout.elbowPxX},${layout.elbowPxY} ${layout.cardConnectPxX},${layout.cardConnectPxY}`,
        );
        const seg1 = Math.hypot(
          layout.elbowPxX - layout.anchorPxX,
          layout.elbowPxY - layout.anchorPxY,
        );
        const seg2 = Math.hypot(
          layout.cardConnectPxX - layout.elbowPxX,
          layout.cardConnectPxY - layout.elbowPxY,
        );
        const totalLen = Math.max(1, seg1 + seg2);
        const revealScale = Math.max(0.05, Math.min(1, proj.leaderScale ?? 1));
        annotationPolylineRef.current.style.strokeDasharray = `${totalLen}`;
        annotationPolylineRef.current.style.strokeDashoffset = `${totalLen * (1 - revealScale)}`;
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

      el.dataset.visible = "true";
      el.dataset.partId = proj.partId;
      if (proj.motionPhaseId) {
        el.dataset.motionPhase = proj.motionPhaseId;
      } else {
        delete el.dataset.motionPhase;
      }
      const shot = getEngineeringStoryShot(proj.partId);
      if (annotationIndexRef.current && shot) {
        annotationIndexRef.current.textContent = `${String(shot.index).padStart(2, "0")} / 47`;
      }
      if (annotationLabelRef.current && shot) {
        annotationLabelRef.current.textContent = shot.title[lang];
      }
      if (annotationPhaseRef.current) {
        if (proj.motionPhaseId === "explain") {
          annotationPhaseRef.current.textContent =
            lang === "vi" ? "GIẢI THÍCH" : "EXPLAIN";
        } else if (proj.motionPhaseId === "inspect") {
          annotationPhaseRef.current.textContent =
            lang === "vi" ? "QUAN SÁT" : "INSPECT";
        } else if (proj.motionPhaseId === "transition") {
          annotationPhaseRef.current.textContent =
            lang === "vi" ? "CHUYỂN CẢNH" : "TRANSITION";
        } else {
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
      }
    };

    ensureDampingRaf();
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      running = false;
      kickDampingRef.current = null;
      bridge.onEffectiveProgressSync = undefined;
      bridge.onStageActiveChange = undefined;
      bridge.onAnnotationProject = undefined;
    };
  }, [
    commitDiscreteEvaluation,
    flushPendingEvaluation,
    lang,
    reducedMotion,
    stageUnavailable,
    syncScrubberDom,
  ]);

  // Lightweight DOM/CSS IntersectionObserver scroll reveals for the 4 editorial sections
  // below the 3D stage (keeps offscreen WebGL paused with 0 draw calls).
  useEffect(() => {
    const section = editorialRef.current;
    if (!section) return;
    const targets = Array.from(
      section.querySelectorAll<HTMLElement>(
        ".peds-eng-editorial__head, .peds-eng-card",
      ),
    );
    if (targets.length === 0) return;

    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      for (const el of targets) {
        el.dataset.editorialReveal = "visible";
      }
      return;
    }

    const syncEditorialVisibility = () => {
      const vh = window.innerHeight || 800;
      for (const el of targets) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= vh * 0.96) {
          el.dataset.editorialReveal = "visible";
        } else if (rect.top > vh * 2.2) {
          el.dataset.editorialReveal = "hidden";
        }
      }
    };

    syncEditorialVisibility();

    const observer = new IntersectionObserver(
      (entries) => {
        const vh = window.innerHeight || 800;
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (
            entry.isIntersecting ||
            entry.boundingClientRect.top <= vh * 0.96
          ) {
            el.dataset.editorialReveal = "visible";
          } else if (entry.boundingClientRect.top > vh * 2.2) {
            // Re-arm cleanly when user scrolls well back up into the 3D stage
            el.dataset.editorialReveal = "hidden";
          }
        }
      },
      { threshold: [0.05, 0.25], rootMargin: "0px 0px -4% 0px" },
    );

    for (const el of targets) observer.observe(el);

    let syncRaf = 0;
    const scheduleSync = () => {
      if (syncRaf) return;
      syncRaf = window.requestAnimationFrame(() => {
        syncRaf = 0;
        syncEditorialVisibility();
      });
    };
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync, { passive: true });
    window.addEventListener("hashchange", scheduleSync, { passive: true });

    return () => {
      if (syncRaf) window.cancelAnimationFrame(syncRaf);
      observer.disconnect();
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("hashchange", scheduleSync);
    };
  }, [reducedMotion]);

  // The native component dialog handles Escape while it is open.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if ((event.target as HTMLElement | null)?.closest("dialog")) return;
        if (isolatedPartId) {
          dispatchInspection({ type: "reassemble" });
        } else if (orbitMode) {
          dispatchInspection({ type: "exit-orbit" });
        } else if (selectedPartId) {
          dispatchInspection({ type: "reset" });
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isolatedPartId, orbitMode, selectedPartId]);

  const motionCueSheet = useMemo(
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
  const editorialCue = motionCueSheet.editorialCue;

  const inCockpitChapter = evaluation.chapter.id === "cockpit";
  const cfdZoneValid = isAnyCfdZoneValid(
    resolveCfdZoneOpacities(motionCueSheet.parts),
  );
  const showCockpitInspector = isCockpitInspectorVisible(
    evaluation.chapter.id,
    selectedPartId,
  );
  const selectedShot = selectedPart
    ? getEngineeringStoryShot(selectedPart.id)
    : null;
  const currentComponentIndex =
    selectedShot?.index ?? editorialCue.componentIndex;
  const showChapterTitle = editorialCue.showChapterTitle && !selectedPart;
  const currentStoryTitle = selectedPart?.label ?? editorialCue.title;
  const currentStoryLocation = selectedShot?.location ?? editorialCue.location;
  const currentStoryCaption = selectedPart?.summary ?? editorialCue.caption;
  const activePhaseBadge = !selectedPart ? editorialCue.phaseLabel : null;
  const activePhaseIndex = !selectedPart ? editorialCue.phaseIndex : null;
  const activePhaseCount = !selectedPart ? editorialCue.phaseCount : null;
  const activePhaseId = !selectedPart ? editorialCue.phaseId : null;
  const environmentCue = motionCueSheet.environmentCue;
  const isHudMinimized =
    hudMode === "minimized" && !selectedPart && !showCockpitInspector;
  const isCameraTransitQuiet =
    hudMode === "contextual" &&
    editorialCue.isCameraTransit &&
    !selectedPart &&
    !partBrowserOpen;
  const isExteriorCockpitBeat =
    !selectedPart && editorialCue.partId === "COCKPIT_HALO";
  const editorialStaggerKey = `${evaluation.chapter.id}:${showChapterTitle ? "ch" : (selectedPart?.id ?? editorialCue.partId ?? "beat")}`;

  const cycleHudMode = useCallback(() => {
    setHudMode((prev) =>
      prev === "contextual"
        ? "minimized"
        : prev === "minimized"
          ? "pinned"
          : "contextual",
    );
  }, []);

  const stepStoryComponent = useCallback(
    (direction: -1 | 1) => {
      const currentIndex = currentComponentIndex ?? 0;
      const nextIndex = currentIndex + direction;
      const target = resolveEngineeringStoryShotProgress(nextIndex);
      if (target !== null) jumpToProgress(target);
    },
    [currentComponentIndex, jumpToProgress],
  );

  const handleResetView = useCallback(() => {
    dispatchInspection({ type: "reset" });
    dispatchCockpitTelemetry({ type: "reset" });
    setCfdFlow(false);
    if (orbitMode) {
      return;
    }
    if (evaluation.progress > 0.02) {
      jumpToProgress(0);
    }
  }, [evaluation.progress, jumpToProgress, orbitMode]);

  return (
    <div className="peds-eng-page">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>
      {/* ── 1. Interactive 3D Disassembly & F1 Cockpit Stage ─────────────── */}
      <section
        ref={runwayRef}
        style={
          {
            "--peds-eng-scroll-length": `calc(${ENGINEERING_STORY_SCROLL_VH}svh / var(--peds-visual-zoom))`,
          } as CSSProperties
        }
        aria-label={
          lang === "vi"
            ? "Sân khấu giải phẫu 3D xe đua và buồng lái F1"
            : "Interactive 3D race car disassembly and F1 cockpit stage"
        }
        className={`peds-eng-runway ${reducedMotion ? "peds-eng-runway--reduced" : ""} ${stageUnavailable ? "peds-eng-runway--static" : ""}`}
      >
        <div ref={stickyRef} className="peds-eng-sticky">
          <div
            className="peds-eng-studio-backdrop"
            data-studio-mode={environmentCue.studioMode}
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
                  lang === "vi"
                    ? "Sơ đồ khái niệm luồng khí hiệu ứng mặt đất Podium EDS"
                    : "Podium EDS conceptual ground-effect airflow diagram"
                }
                className="peds-eng-static-fallback__img"
              />
              <p className="peds-eng-static-fallback__note" role="status">
                {lang === "vi"
                  ? "Chế độ sơ đồ tĩnh đang bật trên thiết bị không hỗ trợ WebGL."
                  : "Static conceptual view active where WebGL 3D is unavailable."}
              </p>
            </div>
          ) : (
            <ErrorBoundary
              fallback={
                <EngineeringStageErrorFallback
                  lang={lang}
                  onError={handleUnavailable}
                />
              }
            >
              <Suspense fallback={null}>
                <EngineeringDisassemblyStage
                  evaluation={evaluation}
                  liveBridgeRef={liveBridgeRef}
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
                  {lang === "vi"
                    ? "Đang tải mô hình 47 cụm..."
                    : "Loading 47-part 3D assembly..."}
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

          {/* Two-Point 3D SVG Leader-Line Callout Overlay (direct DOM projection, 0 React commits) */}
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

          {/* Exhibition HUD: Swiss-motorsport editorial plaque at top-left, dock at bottom */}
          <div
            className="peds-eng-hud"
            data-hud-mode={hudMode}
            data-camera-transit={isCameraTransitQuiet ? "true" : undefined}
          >
            <header
              className={`peds-eng-copy ${showChapterTitle ? "peds-eng-copy--chapter" : "peds-eng-copy--component"} ${isHudMinimized ? "peds-eng-copy--minimized" : ""}`}
              data-motion-phase={activePhaseId ?? undefined}
            >
              <div className="peds-eng-copy__meta-bar">
                <p className="peds-eng-overline">
                  <span
                    className="peds-eng-overline__rule"
                    aria-hidden="true"
                  />
                  <span>
                    {showChapterTitle
                      ? evaluation.chapter.overline[lang]
                      : `${evaluation.chapter.index} / 08 · ${evaluation.chapter.shortLabel[lang]}`}
                  </span>
                  <span
                    className="peds-eng-overline__rule"
                    aria-hidden="true"
                  />
                </p>
                {activePhaseBadge &&
                  activePhaseIndex !== null &&
                  activePhaseCount !== null && (
                    <div
                      className="peds-eng-phase-rail"
                      data-testid="engineering-shot-phase"
                      data-phase-id={activePhaseId ?? undefined}
                    >
                      <span className="peds-eng-phase-pill">
                        {String(activePhaseIndex).padStart(2, "0")} /{" "}
                        {String(activePhaseCount).padStart(2, "0")} ·{" "}
                        {activePhaseBadge[lang]}
                      </span>
                      <span className="peds-eng-phase-pips" aria-hidden="true">
                        {Array.from({ length: activePhaseCount }, (_, idx) => (
                          <span
                            key={idx}
                            className={`peds-eng-phase-pip ${idx + 1 === activePhaseIndex ? "peds-eng-phase-pip--active" : idx + 1 < activePhaseIndex ? "peds-eng-phase-pip--done" : ""}`}
                          />
                        ))}
                      </span>
                    </div>
                  )}
              </div>
              <div key={editorialStaggerKey} className="peds-eng-copy__stagger">
                <h1
                  className="peds-eng-title"
                  data-testid="engineering-story-title"
                >
                  {showChapterTitle
                    ? evaluation.chapter.title[lang]
                    : currentStoryTitle[lang]}
                </h1>
                {showChapterTitle ? (
                  <p className="peds-eng-summary">
                    {activePhaseId === "establish"
                      ? currentStoryCaption[lang]
                      : evaluation.chapter.summary[lang]}
                  </p>
                ) : (
                  <>
                    <div className="peds-eng-shot-meta">
                      <span className="peds-eng-shot-location">
                        {currentStoryLocation[lang]}
                      </span>
                      {currentComponentIndex !== null && (
                        <span
                          className="peds-eng-shot-count"
                          data-testid="engineering-story-component"
                        >
                          {String(currentComponentIndex).padStart(2, "0")} / 47
                        </span>
                      )}
                    </div>
                    <p
                      className="peds-eng-story-beat"
                      data-testid="engineering-story-beat"
                    >
                      {currentStoryCaption[lang]}
                    </p>
                  </>
                )}
              </div>

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
                      lang === "vi"
                        ? "Đóng thông tin linh kiện"
                        : "Clear selected component"
                    }
                    title={lang === "vi" ? "Bỏ chọn" : "Clear selection"}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}

              {showCockpitInspector && (
                <div
                  className="peds-eng-cockpit-host"
                  data-cockpit-exterior={
                    isExteriorCockpitBeat ? "true" : undefined
                  }
                >
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
            </header>

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
                      {lang === "vi"
                        ? "Minh họa luồng khí chỉ áp dụng khi các cụm khí động đang lắp ráp."
                        : "Illustrative airflow applies to assembled aerodynamic geometry."}
                    </span>
                    <button
                      type="button"
                      className="peds-eng-cfd-notice__btn"
                      onClick={() => jumpToProgress(0)}
                    >
                      {lang === "vi" ? "Xem nguyên khối" : "View Assembled"}
                    </button>
                  </div>
                )}

              <div
                className="peds-eng-dock"
                role="toolbar"
                aria-label={
                  lang === "vi"
                    ? "Điều khiển giai đoạn giải phẫu 3D"
                    : "3D disassembly stage controls"
                }
              >
                <div className="peds-eng-progress-group">
                  <div className="peds-eng-steps">
                    {ENGINEERING_STORY_CHAPTERS.map((ch) => {
                      const active = evaluation.chapter.id === ch.id;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          className="peds-eng-step"
                          aria-current={active ? "step" : undefined}
                          aria-label={`${ch.index} · ${ch.shortLabel[lang]}`}
                          title={ch.shortLabel[lang]}
                          onClick={() => jumpToProgress(ch.focusProgress)}
                        >
                          {ch.index}
                        </button>
                      );
                    })}
                  </div>
                  <div className="peds-eng-scrubber">
                    <div className="peds-eng-bar">
                      <div
                        ref={scrubberFillRef}
                        className="peds-eng-bar__fill"
                        style={{
                          transform: `scaleX(${Math.max(0.02, evaluation.progress)})`,
                        }}
                      />
                      <input
                        ref={scrubberInputRef}
                        type="range"
                        min={0}
                        max={1000}
                        step={1}
                        defaultValue={Math.round(evaluation.progress * 1000)}
                        className="peds-eng-scrubber__input"
                        data-testid="engineering-timeline-scrubber"
                        aria-label={
                          lang === "vi"
                            ? "Thanh kéo tiến trình bóc tách 3D"
                            : "3D disassembly timeline scrubber"
                        }
                        aria-valuetext={`${(evaluation.progress * 100).toFixed(1)}% · ${evaluation.chapter.shortLabel[lang]}`}
                        onChange={(event) =>
                          jumpToProgress(Number(event.target.value) / 1000)
                        }
                      />
                    </div>
                    <span
                      ref={scrubberReadoutRef}
                      className="peds-eng-scrubber__readout"
                      data-testid="engineering-scrubber-readout"
                    >
                      {(evaluation.progress * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <span className="peds-eng-divider" aria-hidden="true" />

                <div
                  className="peds-eng-actions-wrap"
                  data-scroll-more={actionsScrollHint}
                >
                  <div ref={actionsRailRef} className="peds-eng-actions">
                    <button
                      type="button"
                      className="peds-eng-stepper"
                      aria-label={
                        lang === "vi" ? "Linh kiện trước" : "Previous component"
                      }
                      title={
                        lang === "vi" ? "Linh kiện trước" : "Previous component"
                      }
                      disabled={
                        currentComponentIndex === null ||
                        currentComponentIndex <= 1
                      }
                      onClick={() => stepStoryComponent(-1)}
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="peds-eng-stepper"
                      aria-label={
                        lang === "vi" ? "Linh kiện sau" : "Next component"
                      }
                      title={lang === "vi" ? "Linh kiện sau" : "Next component"}
                      disabled={
                        currentComponentIndex !== null &&
                        currentComponentIndex >= 47
                      }
                      onClick={() => stepStoryComponent(1)}
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      ref={partsButtonRef}
                      id="engineering-parts-trigger"
                      type="button"
                      className="peds-eng-pill"
                      aria-expanded={partBrowserOpen}
                      aria-controls="engineering-parts-dialog"
                      onClick={() => setPartBrowserOpen(true)}
                    >
                      <List className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {lang === "vi"
                          ? `Linh kiện ${ENGINEERING_PARTS.length}`
                          : `${ENGINEERING_PARTS.length} parts`}
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`peds-eng-pill ${inCockpitChapter ? "peds-eng-pill--cockpit-active" : ""}`}
                      aria-pressed={inCockpitChapter}
                      onClick={() =>
                        jumpToProgress(ENGINEERING_STORY_COCKPIT_PROGRESS)
                      }
                    >
                      <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {lang === "vi" ? "Buồng Lái F1" : "F1 Cockpit"}
                      </span>
                    </button>

                    {evaluation.chapter.id === "matrix" && (
                      <button
                        type="button"
                        className={`peds-eng-pill ${orbitMode ? "peds-eng-pill--orbit-active" : ""}`}
                        aria-label={
                          lang === "vi"
                            ? orbitMode
                              ? "Thoát Orbit"
                              : "Khám phá Orbit"
                            : orbitMode
                              ? "Exit Orbit"
                              : "Explore Orbit"
                        }
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
                          {lang === "vi"
                            ? orbitMode
                              ? "Thoát Orbit"
                              : "Khám phá Orbit"
                            : orbitMode
                              ? "Exit Orbit"
                              : "Explore Orbit"}
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
                        <span>
                          {lang === "vi" ? "Luồng Khí CFD" : "CFD Flow"}
                        </span>
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
                        <span>{lang === "vi" ? "Xuyên Vỏ" : "X-Ray"}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className={`peds-eng-pill ${hudMode !== "contextual" ? "peds-eng-pill--hud-active" : ""}`}
                      data-testid="engineering-hud-toggle"
                      aria-pressed={hudMode === "pinned"}
                      title={
                        lang === "vi"
                          ? "Chuyển chế độ hiển thị HUD (Tự động / Thu gọn / Ghim)"
                          : "Cycle HUD visibility (Contextual / Minimized / Pinned)"
                      }
                      onClick={cycleHudMode}
                    >
                      <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {hudMode === "minimized"
                          ? lang === "vi"
                            ? "Hiện chữ"
                            : "Show HUD"
                          : hudMode === "pinned"
                            ? lang === "vi"
                              ? "Đang ghim"
                              : "Pinned"
                            : "HUD"}
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`peds-eng-pill ${orbitMode ? "peds-eng-pill--orbit-active" : ""}`}
                      onClick={handleResetView}
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {lang === "vi" ? "Đặt lại góc nhìn" : "Reset View"}
                      </span>
                    </button>
                  </div>
                  <button
                    type="button"
                    className="peds-eng-actions-hint"
                    data-testid="engineering-dock-scroll-hint"
                    aria-label={
                      lang === "vi"
                        ? "Xem thêm nút điều khiển"
                        : "More controls"
                    }
                    title={
                      lang === "vi"
                        ? "Xem thêm nút điều khiển"
                        : "More controls"
                    }
                    tabIndex={
                      actionsScrollHint === "right" ||
                        actionsScrollHint === "both"
                        ? 0
                        : -1
                    }
                    onClick={() => {
                      actionsRailRef.current?.scrollBy({
                        left: 168,
                        behavior: reducedMotion ? "auto" : "smooth",
                      });
                    }}
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <p className="peds-eng-credit">
                {lang === "vi"
                  ? "3D Concept: Peter Kiss · FP-04 RB · Mô hình minh họa kỹ thuật phi thương mại, không đại diện thông số đội đua chính thức"
                  : "3D Concept: Peter Kiss · FP-04 RB · Non-commercial illustrative engineering study, not official team CAD"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {(stageUnavailable || reducedMotion) && (
        <section
          className="peds-eng-readable-story"
          aria-label={
            lang === "vi"
              ? "Nội dung đầy đủ của câu chuyện kỹ thuật"
              : "Full engineering story transcript"
          }
          data-testid="engineering-readable-story"
        >
          <div className="page-container">
            <p className="peds-eng-readable-story__eyebrow">
              {stageUnavailable
                ? lang === "vi"
                  ? "NỘI DUNG ĐỌC ĐƯỢC · 3D TẠM KHÔNG KHẢ DỤNG"
                  : "READABLE CONTENT · 3D UNAVAILABLE"
                : lang === "vi"
                  ? "BẢN ĐỌC TĨNH · CHUYỂN CẢNH TẮT"
                  : "STATIC TRANSCRIPT · MOTION REDUCED"}
            </p>
            <div className="peds-eng-readable-story__chapters">
              {ENGINEERING_STORY_CHAPTERS.map((chapter) => {
                const shots = ENGINEERING_STORY_SHOTS.filter(
                  (shot) => shot.chapterId === chapter.id,
                );
                return (
                  <article
                    key={chapter.id}
                    className="peds-eng-readable-story__chapter"
                  >
                    <p className="peds-eng-readable-story__index">
                      {chapter.index} / 08 · {chapter.shortLabel[lang]}
                    </p>
                    <h2>{chapter.title[lang]}</h2>
                    <p>{chapter.summary[lang]}</p>
                    {shots.length > 0 && (
                      <ol>
                        {shots.map((shot) => (
                          <li key={shot.partId}>
                            <strong>{shot.title[lang]}</strong>
                            <span>{shot.location[lang]}</span>
                            <p>{shot.caption[lang]}</p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 2. Deep-Dive Bilingual Engineering Insights ──────────────────── */}
      <section
        ref={editorialRef}
        id="engineering-features"
        aria-labelledby="engineering-features-heading"
        className="peds-eng-editorial"
      >
        <div className="page-container">
          <div
            className="peds-eng-editorial__head"
            data-editorial-reveal="visible"
          >
            <div>
              <p className="peds-eng-editorial__eyebrow">
                {lang === "vi"
                  ? "CHUYÊN ĐỀ KỸ THUẬT SONG NGỮ"
                  : "BILINGUAL TECHNICAL FEATURES"}
              </p>
              <h2
                id="engineering-features-heading"
                className="peds-eng-editorial__heading"
              >
                {lang === "vi"
                  ? "Nguyên lý cốt lõi phía sau cỗ máy"
                  : "First principles beneath the bodywork"}
              </h2>
            </div>
            <p className="peds-eng-editorial__lead">
              {lang === "vi"
                ? "Bốn bài phân tích nối liền khí động học hiệu ứng mặt đất, thu hồi năng lượng hybrid và động lực học lốp thành một hệ thống thống nhất."
                : "Four editorial features connecting ground-effect aerodynamics, hybrid energy deployment and tire dynamics as one system."}
            </p>
          </div>

          <div className="peds-eng-grid">
            {ENGINEERING_ARTICLES.map((article, index) => (
              <article
                key={article.slug}
                className="peds-eng-card"
                data-editorial-reveal="visible"
                data-testid={`engineering-editorial-card-${index + 1}`}
              >
                <Link
                  to={`/engineering/${article.slug}`}
                  className="peds-eng-card__link"
                >
                  <div className="peds-eng-card__media">
                    <img
                      src={article.heroImage}
                      alt={article.imageAlt[lang]}
                      loading="lazy"
                      className="peds-eng-card__img"
                    />
                  </div>
                  <div className="peds-eng-card__body">
                    <div className="peds-eng-card__meta">
                      <span>
                        0{index + 1} · {article.topic[lang]}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        {article.readingMinutes}{" "}
                        {lang === "vi" ? "phút đọc" : "min read"}
                      </span>
                    </div>
                    <h3 className="peds-eng-card__title">
                      {article.title[lang]}
                    </h3>
                    <p className="peds-eng-card__desc">
                      {article.description[lang]}
                    </p>
                    <span className="peds-eng-card__cta">
                      <span>
                        {lang === "vi" ? "Đọc chuyên đề" : "Read feature"}
                      </span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {import.meta.env.DEV && (
            <div className="peds-eng-dev-strip">
              <span>DEV LABS:</span>
              {import.meta.env.DEV && (
                <Link
                  to="/engineering/media-first-lab"
                  className="peds-eng-dev-link"
                >
                  FP-04 RB Lab HUD (DEV)
                </Link>
              )}
              <Link
                to="/engineering/inside-the-machine"
                className="peds-eng-dev-link"
              >
                Inside the Machine R5 (DEV)
              </Link>
            </div>
          )}
        </div>
      </section>

      <EngineeringPartBrowser
        open={partBrowserOpen}
        lang={lang}
        parts={ENGINEERING_PARTS}
        selectedPartId={selectedPartId}
        onSelect={handleBrowserSelectPart}
        onClose={handleClosePartBrowser}
        onClosed={handlePartBrowserClosed}
      />
    </div>
  );
};

export const EngineeringIndexPage = React.memo(EngineeringIndexPageImpl);
EngineeringIndexPage.displayName = "EngineeringIndexPage";

export default EngineeringIndexPage;
