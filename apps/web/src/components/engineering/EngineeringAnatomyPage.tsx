import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { animate, createScope } from "animejs";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { Link, useNavigationType, useSearchParams } from "react-router-dom";
import { AdSlot } from "../ui/AdSlot";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { useNavigationStore } from "../../store/useNavigationStore";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import {
  AdaptiveQualityController,
  type GraphicsMode,
  type QualityProfile,
} from "../showroom/model-b/adaptiveController";
import {
  persistGraphicsMode,
  readGraphicsMode,
} from "../showroom/model-b/graphicsPreference";
import {
  ANATOMY_CHAPTERS,
  getAnatomyChapter,
  type AnatomyChapter,
} from "./anatomyChapters";
import type { AnatomySceneMetrics } from "../../dev/EngineeringAnatomyScene";
import type { CameraPreset } from "../showroom/CameraController";
import "./engineeringAnatomy.css";

const EngineeringAnatomyScene = import.meta.env.DEV
  ? lazy(() => import("../../dev/EngineeringAnatomyScene"))
  : null;

const MODES: GraphicsMode[] = ["AUTO", "HIGH", "BALANCED", "PERFORMANCE"];
const CAMERA_VIEWS: CameraPreset[] = [
  "overview",
  "front",
  "side",
  "rear",
  "top",
];

function Diagram({
  chapter,
  lang,
}: {
  chapter: AnatomyChapter;
  lang: "vi" | "en";
}) {
  const labels = {
    flow: [
      "Incoming air",
      "Guided flow",
      "Không khí tới",
      "Dòng khí định hướng",
    ],
    cooling: [
      "Cooling inlet",
      "External flow",
      "Cửa hút làm mát",
      "Dòng khí bên ngoài",
    ],
    pressure: [
      "Upper pressure",
      "Underfloor flow",
      "Áp suất phía trên",
      "Dòng khí dưới sàn",
    ],
    recovery: [
      "Underfloor exit",
      "Expansion",
      "Lối thoát dưới sàn",
      "Mở rộng dòng khí",
    ],
    load: ["Downforce", "Drag", "Lực ép xuống", "Lực cản"],
    platform: [
      "Wheel movement",
      "Body control",
      "Chuyển động bánh",
      "Kiểm soát thân xe",
    ],
    safety: [
      "Driver zone",
      "Protective structure",
      "Vùng tay đua",
      "Kết cấu bảo vệ",
    ],
  }[chapter.diagram];
  return (
    <figure
      className="anatomy-diagram"
      aria-label={
        lang === "vi"
          ? `Sơ đồ nguyên lý: ${chapter.principle.vi}`
          : `Principle diagram: ${chapter.principle.en}`
      }
    >
      <div className="anatomy-diagram__flow" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="anatomy-diagram__labels">
        <span>{labels[lang === "vi" ? 2 : 0]}</span>
        <strong>→</strong>
        <span>{labels[lang === "vi" ? 3 : 1]}</span>
      </div>
      <figcaption>
        {lang === "vi"
          ? "Sơ đồ khái niệm, không phải dữ liệu mô phỏng."
          : "Conceptual diagram, not simulation data."}
      </figcaption>
    </figure>
  );
}

function StaticStage({
  lang,
  message,
}: {
  lang: "vi" | "en";
  message: string;
}) {
  return (
    <div className="anatomy-stage__static">
      <img
        src="/images/eds/engineering/ground-effect-flow.svg"
        alt={
          lang === "vi"
            ? "Sơ đồ khái niệm luồng khí dưới sàn, không phải hình học Model B"
            : "Conceptual underfloor airflow diagram, not Model B geometry"
        }
      />
      <p role="status">{message}</p>
      <small>
        {lang === "vi"
          ? "Sơ đồ khái niệm · không phải Model B"
          : "Conceptual diagram · not Model B"}
      </small>
    </div>
  );
}

function AnimationLayer({
  chapterId,
  reducedMotion,
}: {
  chapterId: string;
  reducedMotion: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current?.parentElement;
    if (!root || reducedMotion) return;
    const scope = createScope({ root }).add(() => {
      animate(root.querySelectorAll("[data-anatomy-intro]"), {
        opacity: [0.45, 1],
        translateY: [12, 0],
        duration: 650,
        ease: "out(4)",
        delay: (_: unknown, index = 0) => index * 85,
      });
    });
    return () => scope.revert();
  }, [reducedMotion]);
  useEffect(() => {
    const root = rootRef.current?.parentElement;
    const panel = root?.querySelector("[data-anatomy-selected]");
    if (!root || !panel || reducedMotion) return;
    const scope = createScope({ root }).add(() => {
      animate(panel, {
        opacity: [0.6, 1],
        translateY: [8, 0],
        duration: 360,
        ease: "out(4)",
      });
    });
    return () => scope.revert();
  }, [chapterId, reducedMotion]);
  useEffect(() => {
    const root = rootRef.current?.parentElement;
    if (!root || reducedMotion || typeof IntersectionObserver === "undefined")
      return;
    const scope = createScope({ root });
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          scope.add(() => {
            animate(entry.target, {
              opacity: [0.65, 1],
              translateY: [14, 0],
              duration: 540,
              ease: "out(4)",
            });
          });
        }
      },
      { threshold: 0.12 },
    );
    root
      .querySelectorAll("[data-anatomy-reveal]")
      .forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      scope.revert();
    };
  }, [reducedMotion]);
  return <div ref={rootRef} hidden />;
}

export default function EngineeringAnatomyPage() {
  const lang = useNavigationStore((state) => state.lang);
  const reducedMotion = useReducedMotion();
  const navigationType = useNavigationType();
  const [searchParams, setSearchParams] = useSearchParams();
  const chapter = getAnatomyChapter(searchParams.get("chapter"));
  const activeId = chapter.id;
  const focusedId = ANATOMY_CHAPTERS.some(
    (item) => item.id === searchParams.get("chapter"),
  )
    ? activeId
    : "";
  const chapterIndex = ANATOMY_CHAPTERS.findIndex(
    (item) => item.id === activeId,
  );
  const reviewAds = searchParams.get("design-review") === "ads";
  const stageRef = useRef<HTMLDivElement>(null);
  const manualUntil = useRef(0);
  const [stageVisible, setStageVisible] = useState(false);
  const [everVisible, setEverVisible] = useState(false);
  const [staticMode, setStaticMode] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("overview");
  const [presetTrigger, setPresetTrigger] = useState(0);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState("");
  const [contextLost, setContextLost] = useState(false);
  const [evidence, setEvidence] = useState<{
    fetchMs: number;
    decodeParseMs: number;
    firstFrameMs: number;
    bytes: number;
  } | null>(null);
  const [metrics, setMetrics] = useState<AnatomySceneMetrics | null>(null);
  const initialMode = useMemo(
    () =>
      readGraphicsMode(
        typeof window === "undefined" ? null : window.localStorage,
      ),
    [],
  );
  const [controller] = useState(
    () =>
      new AdaptiveQualityController(
        performance.now(),
        initialMode === "AUTO" ? "HIGH" : initialMode,
      ),
  );
  const [mode, setMode] = useState<GraphicsMode>(initialMode);
  const [profile, setProfile] = useState<QualityProfile>(
    initialMode === "AUTO" ? "HIGH" : initialMode,
  );

  useEffect(() => {
    const node = stageRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setStageVisible(true);
      setEverVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setStageVisible(entry.isIntersecting);
        if (entry.isIntersecting) setEverVisible(true);
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    controller.setPaused(
      !stageVisible || staticMode || contextLost,
      performance.now(),
    );
  }, [controller, stageVisible, staticMode, contextLost]);
  useEffect(() => {
    if (navigationType !== "POP" || !searchParams.has("chapter")) return;
    document.getElementById(`anatomy-${activeId}`)?.scrollIntoView({
      behavior: reducedMotion ? "instant" : "smooth",
      block: "start",
    });
  }, [navigationType, activeId, reducedMotion, searchParams]);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (performance.now() < manualUntil.current) return;
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!mostVisible) return;
        const id = mostVisible.target.getAttribute("data-chapter-id");
        if (id && id !== activeId)
          setSearchParams(
            (current) => {
              const next = new URLSearchParams(current);
              next.set("chapter", id);
              return next;
            },
            { replace: true },
          );
      },
      { rootMargin: "-20% 0px -30% 0px", threshold: [0.25, 0.6] },
    );
    document
      .querySelectorAll("[data-chapter-id]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [activeId, setSearchParams]);

  const selectChapter = useCallback(
    (id: string) => {
      const compact = window.matchMedia("(max-width: 1000px)").matches;
      manualUntil.current =
        performance.now() + (compact ? 2000 : reducedMotion ? 100 : 1000);
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set("chapter", id);
        return next;
      });
      (compact
        ? document.getElementById("anatomy-viewer")
        : document.getElementById(`anatomy-${id}`)
      )?.scrollIntoView({
        behavior: reducedMotion ? "instant" : "smooth",
        block: "start",
      });
    },
    [reducedMotion, setSearchParams],
  );
  const reset = () => {
    manualUntil.current = performance.now() + 2000;
    setCameraPreset("overview");
    setPresetTrigger((value) => value + 1);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("chapter");
      return next;
    });
    stageRef.current?.scrollIntoView({
      behavior: reducedMotion ? "instant" : "smooth",
      block: "center",
    });
  };
  const chooseView = (preset: CameraPreset, atMs: number) => {
    manualUntil.current = atMs + 2000;
    setCameraPreset(preset);
    setPresetTrigger((value) => value + 1);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("chapter");
      return next;
    });
  };
  const setGraphicsMode = (next: GraphicsMode, atMs: number) => {
    controller.setMode(next, atMs);
    setMode(next);
    setProfile(controller.getState().profile);
    persistGraphicsMode(window.localStorage, next);
  };
  const receiveMetrics = useCallback(
    (next: AnatomySceneMetrics) => {
      const event = controller.ingest({
        nowMs: performance.now(),
        averageFps: next.medianFps,
        frameTimeP95Ms: next.frameTimeP95Ms,
        refreshRateHz: 60,
        validFrameCount: next.validFrameCount,
        continuous: stageVisible,
      });
      if (event) setProfile(controller.getState().profile);
      setMetrics(next);
    },
    [controller, stageVisible],
  );
  const onLoaded = useCallback(
    (next: {
      fetchMs: number;
      decodeParseMs: number;
      firstFrameMs: number;
      bytes: number;
    }) => {
      setEvidence(next);
      setLoadState("ready");
    },
    [],
  );
  const onError = useCallback((message: string) => {
    setLoadError(message);
    setLoadState("error");
  }, []);
  useEffect(() => {
    if (
      !everVisible ||
      staticMode ||
      loadState !== "loading" ||
      !import.meta.env.DEV
    )
      return;
    const timer = window.setTimeout(
      () =>
        onError(
          lang === "vi"
            ? "Quá thời gian khởi tạo WebGL/Model B."
            : "WebGL/Model B initialization timed out.",
        ),
      12000,
    );
    return () => window.clearTimeout(timer);
  }, [everVisible, staticMode, loadState, lang, onError]);
  const retry = () => {
    setSceneKey((value) => value + 1);
    setLoadState("loading");
    setLoadError("");
    setContextLost(false);
  };
  const canShowScene =
    import.meta.env.DEV &&
    Boolean(EngineeringAnatomyScene) &&
    everVisible &&
    !staticMode;

  return (
    <div className="anatomy-page" data-testid="engineering-anatomy">
      <AnimationLayer chapterId={activeId} reducedMotion={reducedMotion} />
      <header className="anatomy-hero page-container">
        <div className="anatomy-hero__copy">
          <p className="anatomy-hero__eyebrow" data-anatomy-intro>
            {lang === "vi" ? "Engineering Anatomy · 001—007" : "Engineering Anatomy · 001—007"}
          </p>
          <h1 data-anatomy-intro>
            {lang === "vi" ? <>Bên trong<br /><em>tốc độ.</em></> : <>Inside<br /><em>the speed.</em></>}
          </h1>
          <p data-anatomy-intro>
            {lang === "vi"
              ? "Bảy vùng kỹ thuật, một mẫu xe tham chiếu 2022. Khám phá cấu tạo qua góc nhìn Model B và các sơ đồ nguyên lý có chú thích thận trọng."
              : "Seven engineering regions, one 2022 reference car. Explore Model B camera views and carefully qualified principle diagrams."}
          </p>
          <a
            data-anatomy-intro
            className="anatomy-primary-link"
            href="#anatomy-viewer"
          >
            {lang === "vi" ? "Khám phá cấu tạo" : "Explore the anatomy"}{" "}
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>
        <div className="anatomy-hero__count" aria-label={lang === "vi" ? "Bảy chương kỹ thuật" : "Seven engineering chapters"}>
          <strong>07<span>.</span></strong>
          <span>{lang === "vi" ? "Chương kỹ thuật / xe tham chiếu 2022" : "Engineering chapters / 2022 reference car"}</span>
          <p>{lang === "vi"
            ? "Từ hình dáng tới chức năng. Model B chỉ có một mesh; các sơ đồ không mô tả một cụm chi tiết có thể tách rời thật."
            : "From form to function. Model B has one mesh; the diagrams do not depict independently separable assemblies."}</p>
        </div>
      </header>

      <section
        id="anatomy-viewer"
        className="anatomy-workspace page-container"
        aria-label={
          lang === "vi" ? "Trình khám phá cấu tạo xe" : "Car anatomy explorer"
        }
      >
        <nav
          className="anatomy-chapters"
          aria-label={
            lang === "vi" ? "Chương kỹ thuật" : "Engineering chapters"
          }
        >
          <h2>{lang === "vi" ? "Bảy vùng cấu tạo" : "Seven anatomy zones"}</h2>
          <div className="anatomy-chapters__list">
            {ANATOMY_CHAPTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={focusedId === item.id ? "step" : undefined}
                onClick={() => selectChapter(item.id)}
              >
                {item.name[lang]}
              </button>
            ))}
          </div>
          <label className="anatomy-chapters__select">
            <span>
              {lang === "vi" ? "Chọn vùng cấu tạo" : "Choose an anatomy zone"}
            </span>
            <select
              value={focusedId}
              onChange={(event) =>
                event.target.value ? selectChapter(event.target.value) : reset()
              }
            >
              <option value="">
                {lang === "vi" ? "Toàn cảnh" : "Overview"}
              </option>
              {ANATOMY_CHAPTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name[lang]}
                </option>
              ))}
            </select>
          </label>
          <div className="anatomy-chapters__progress">
            <span>
              {focusedId
                ? lang === "vi"
                  ? `Chương ${chapterIndex + 1} / 7`
                  : `Chapter ${chapterIndex + 1} of 7`
                : lang === "vi"
                  ? "Toàn cảnh"
                  : "Overview"}
            </span>
            <progress
              value={focusedId ? chapterIndex + 1 : 0}
              max={ANATOMY_CHAPTERS.length}
              aria-label={
                lang === "vi" ? "Tiến độ khám phá" : "Exploration progress"
              }
            />
          </div>
        </nav>
        <div className="anatomy-layout">
          <div className="anatomy-stage-column">
            <div className="anatomy-mobile-summary" aria-live="polite">
              <h3>
                {focusedId
                  ? chapter.name[lang]
                  : lang === "vi"
                    ? "Formula 1 2022 Car"
                    : "Formula 1 2022 Car"}
              </h3>
              <p>
                {focusedId
                  ? chapter.principle[lang]
                  : lang === "vi"
                    ? "Chọn một vùng để xem góc camera và nguyên lý kỹ thuật."
                    : "Choose a zone to focus the camera and read its principle."}
              </p>
            </div>
            <div
              ref={stageRef}
              className="anatomy-stage"
              aria-busy={canShowScene && loadState === "loading"}
            >
              {canShowScene &&
                EngineeringAnatomyScene &&
                loadState !== "error" &&
                !contextLost && (
                  <ErrorBoundary
                    fallback={
                      <StaticStage
                        lang={lang}
                        message={
                          lang === "vi"
                            ? "WebGL không khả dụng. Dùng sơ đồ tĩnh."
                            : "WebGL unavailable. Use the static diagram."
                        }
                      />
                    }
                  >
                    <Suspense fallback={null}>
                      <EngineeringAnatomyScene
                        key={sceneKey}
                        chapterId={focusedId}
                        cameraPreset={cameraPreset}
                        presetTrigger={presetTrigger}
                        lang={lang}
                        visible={stageVisible}
                        profile={profile}
                        onSelect={selectChapter}
                        onLoaded={onLoaded}
                        onError={onError}
                        onContextLost={setContextLost}
                        onMetrics={receiveMetrics}
                      />
                    </Suspense>
                  </ErrorBoundary>
                )}
              {(!canShowScene || loadState === "error" || contextLost) && (
                <StaticStage
                  lang={lang}
                  message={
                    !import.meta.env.DEV
                      ? lang === "vi"
                        ? "Bản 3D Model B chỉ dành cho review local; nội dung giáo dục vẫn đọc được."
                        : "The Model B viewer is local-review only; educational content remains available."
                      : loadState === "error" || contextLost
                        ? lang === "vi"
                          ? "Không thể hiển thị 3D. Dùng sơ đồ tĩnh hoặc thử lại."
                          : "3D is unavailable. Use the static diagram or retry."
                        : lang === "vi"
                          ? "Sơ đồ tĩnh, không cần WebGL."
                          : "Static diagram, no WebGL required."
                  }
                />
              )}
              {canShowScene && loadState === "loading" && !contextLost && (
                <div className="anatomy-stage__status" role="status">
                  {lang === "vi" ? "Đang tải Model B…" : "Loading Model B…"}
                </div>
              )}
              <div className="anatomy-stage__controls">
                <span>
                  {canShowScene && loadState !== "error" && !contextLost
                    ? "Model B"
                    : lang === "vi"
                      ? "Sơ đồ khái niệm"
                      : "Conceptual diagram"}{" "}
                  ·{" "}
                  {focusedId
                    ? chapter.name[lang]
                    : lang === "vi"
                      ? "Toàn cảnh"
                      : "Overview"}
                </span>
                <div>
                  {(loadState === "error" || contextLost) && (
                    <button type="button" onClick={retry}>
                      {lang === "vi" ? "Thử lại" : "Retry"}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-pressed={staticMode}
                    onClick={() => setStaticMode((value) => !value)}
                  >
                    {staticMode
                      ? lang === "vi"
                        ? "Bật 3D"
                        : "Enable 3D"
                      : lang === "vi"
                        ? "Sơ đồ tĩnh"
                        : "Static view"}
                  </button>
                </div>
              </div>
            </div>
            <div
              className="anatomy-camera-views"
              role="group"
              aria-label={lang === "vi" ? "Góc camera" : "Camera views"}
            >
              {CAMERA_VIEWS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={!focusedId && cameraPreset === preset}
                  onClick={(event) => chooseView(preset, event.timeStamp)}
                >
                  {preset === "overview"
                    ? lang === "vi"
                      ? "Toàn cảnh"
                      : "Overview"
                    : preset === "front"
                      ? lang === "vi"
                        ? "Trước"
                        : "Front"
                      : preset === "side"
                        ? lang === "vi"
                          ? "Bên"
                          : "Side"
                        : preset === "rear"
                          ? lang === "vi"
                            ? "Sau"
                            : "Rear"
                          : lang === "vi"
                            ? "Trên"
                            : "Top"}
                </button>
              ))}
            </div>
            <div className="anatomy-viewer-options">
              <div
                role="group"
                aria-label={
                  lang === "vi" ? "Chất lượng đồ họa" : "Graphics quality"
                }
              >
                {MODES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={mode === item}
                    onClick={(event) => setGraphicsMode(item, event.timeStamp)}
                  >
                    {item === "AUTO"
                      ? lang === "vi"
                        ? "Tự động"
                        : "Auto"
                      : item === "HIGH"
                        ? lang === "vi"
                          ? "Cao"
                          : "High"
                        : item === "BALANCED"
                          ? lang === "vi"
                            ? "Cân bằng"
                            : "Balanced"
                          : lang === "vi"
                            ? "Hiệu năng"
                            : "Performance"}
                  </button>
                ))}
              </div>
              <p>
                {lang === "vi" ? "Đang dùng" : "Active"}: {profile}
                {metrics && ` · ${metrics.medianFps.toFixed(0)} FPS`}
              </p>
            </div>
            <p className="anatomy-model-note">
              {lang === "vi"
                ? "Các điểm trên xe là vị trí tham chiếu gần đúng. Model có một mesh, không hỗ trợ tách rời cấu kiện. Đây là xe tham chiếu 2022, không phải bản xác nhận quy định 2026."
                : "Markers are approximate reference positions. The model has one mesh and cannot separate assemblies. This is a 2022 reference car, not a verified 2026-regulation representation."}
            </p>
          </div>
          <div className="anatomy-story">
            {ANATOMY_CHAPTERS.map((item, index) => (
              <div key={item.id}>
                <article
                  id={`anatomy-${item.id}`}
                  data-chapter-id={item.id}
                  data-anatomy-reveal
                  className={`anatomy-chapter ${focusedId === item.id ? "is-active" : ""}`}
                >
                  <div className="anatomy-chapter__top">
                    <span>
                      {lang === "vi"
                        ? `Chương ${index + 1} / ${ANATOMY_CHAPTERS.length}`
                        : `Chapter ${index + 1} of ${ANATOMY_CHAPTERS.length}`}
                    </span>
                    <button
                      type="button"
                      onClick={reset}
                      aria-label={
                        lang === "vi"
                          ? "Đóng lựa chọn và đặt lại góc xem"
                          : "Close selection and reset view"
                      }
                    >
                      <RotateCcw size={17} aria-hidden="true" />{" "}
                      {lang === "vi" ? "Đặt lại" : "Reset"}
                    </button>
                  </div>
                  <h2>{item.name[lang]}</h2>
                  <p className="anatomy-chapter__principle">
                    {item.principle[lang]}
                  </p>
                  <p>{item.explanation[lang]}</p>
                  <Diagram chapter={item} lang={lang} />
                  <p className="anatomy-chapter__caveat">{item.caveat[lang]}</p>
                  <button
                    type="button"
                    className="anatomy-chapter__focus"
                    onClick={() => selectChapter(item.id)}
                    aria-pressed={focusedId === item.id}
                  >
                    {lang === "vi" ? "Xem vị trí trên xe" : "Focus on the car"}{" "}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </article>
                {reviewAds && index === 2 && (
                  <div className="anatomy-ad">
                    <AdSlot
                      variant="in-content"
                      reviewMode
                      placement="engineering-between-chapters"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
        aria-label={
          lang === "vi"
            ? "Thông tin model và đường dẫn"
            : "Model information and onward links"
        }
        className="anatomy-close page-container"
      >
        <div data-anatomy-selected>
          <p>
            {focusedId
              ? lang === "vi"
                ? `Đang xem ${chapterIndex + 1} / ${ANATOMY_CHAPTERS.length}: ${chapter.name.vi}`
                : `Viewing ${chapterIndex + 1} of ${ANATOMY_CHAPTERS.length}: ${chapter.name.en}`
              : lang === "vi"
                ? "Toàn cảnh xe tham chiếu"
                : "Reference car overview"}
          </p>
          <div className="anatomy-progress" aria-hidden="true">
            <span
              style={{
                transform: `scaleX(${focusedId ? (chapterIndex + 1) / ANATOMY_CHAPTERS.length : 0})`,
              }}
            />
          </div>
        </div>
        <div className="anatomy-close__links">
          <Link to="/engineering">
            <ArrowLeft size={16} aria-hidden="true" />{" "}
            {lang === "vi" ? "Chuyên đề kỹ thuật" : "Engineering articles"}
          </Link>
          <Link to="/showroom">
            {lang === "vi" ? "Mở Showroom" : "Open Showroom"}{" "}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <p className="anatomy-attribution">
          “Formula 1 2022 Car” by{" "}
          <a
            href="https://sketchfab.com/3d-models/formula-1-2022-car-65dcd974798f4f03be5cdf4f79e228d8"
            target="_blank"
            rel="noreferrer"
          >
            Luis Adrian V.
          </a>{" "}
          ·{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          .{" "}
          {lang === "vi"
            ? "Podium EDS đã thay vật liệu, bỏ texture, gộp scene, lượng tử hóa và nén Meshopt."
            : "Podium EDS replaced materials, removed textures, consolidated the scene, quantized geometry and applied Meshopt compression."}
        </p>
        <p className="anatomy-attribution">
          {lang === "vi" ? "Nguồn kỹ thuật nền tảng:" : "Technical references:"}{" "}
          <a
            href="https://www.formula1.com/en/latest/article/2021-vs-2022-whats-changed-on-formula-1s-all-new-cars-for-this-season.1SrJj7fQgv4Iw2IxCTnb1l"
            target="_blank"
            rel="noreferrer"
          >
            F1 2022 overview
          </a>{" "}
          ·{" "}
          <a
            href="https://www.fia.com/sites/default/files/fia_2022_formula_1_technical_regulations_-_issue_13_-_2022-08-16.pdf"
            target="_blank"
            rel="noreferrer"
          >
            FIA 2022 rules
          </a>{" "}
          ·{" "}
          <a
            href="https://www.formula1.com/en/latest/article/2026-regulations-explained-all-you-need-to-know-about-f1s-new-aerodynamics.7IAt0auc32UkCEFE5ypkTB.7IAt0auc32UkCEFE5ypkTB"
            target="_blank"
            rel="noreferrer"
          >
            F1 2026 differences
          </a>
          .
        </p>
        {import.meta.env.DEV && loadError && (
          <p className="anatomy-dev-metrics" role="alert">
            DEV load: {loadError}
          </p>
        )}
        {import.meta.env.DEV && evidence && (
          <p className="anatomy-dev-metrics">
            DEV: {evidence.bytes.toLocaleString()} bytes · fetch{" "}
            {evidence.fetchMs.toFixed(0)} ms · decode{" "}
            {evidence.decodeParseMs.toFixed(0)} ms · first frame{" "}
            {evidence.firstFrameMs.toFixed(0)} ms · {metrics?.drawCalls ?? "—"}{" "}
            draw calls · {metrics?.triangles ?? "—"} triangles ·{" "}
            {metrics?.geometries ?? "—"} geometries · {metrics?.textures ?? "—"}{" "}
            textures · p95 {metrics?.frameTimeP95Ms.toFixed(1) ?? "—"} ms
          </p>
        )}
      </section>
    </div>
  );
}
