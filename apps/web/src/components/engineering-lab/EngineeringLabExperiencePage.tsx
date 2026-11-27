import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Clock3,
  Compass,
  Cpu,
} from "lucide-react";
import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ENGINEERING_ARTICLES } from "../../data/engineeringArticles";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useNavigationStore } from "../../store/useNavigationStore";
import { CinematicStartGantryIntro } from "./CinematicStartGantryIntro";
import {
  ENGINEERING_DISCIPLINE_CHAPTERS,
  ENGINEERING_PHILOSOPHY_PILLARS,
  HERO_CAMERA_STAGE_LABELS,
} from "./engineeringLabContent";
import { EngineeringLabInteractiveSection } from "./EngineeringLabInteractiveSection";
import {
  buildEngineeringLabArticleHref,
  markSandboxIntroConsumed,
  shouldAutoPlaySandboxIntro,
} from "./engineeringLabRoutes";
import { EngineeringLabSchematic2D } from "./EngineeringLabSchematic2D";
import { EngineeringLabShell } from "./EngineeringLabShell";
import type { SandboxStageZone } from "./EngineeringLuxuryStage3D";
import {
  INITIAL_LAB_SIMULATOR_STATE,
  evaluateLabTelemetry,
  labSimulatorReducer,
  parseLabModeParam,
} from "./labSimulatorEngine";

const EngineeringLuxuryStage3D = lazy(() =>
  import("./EngineeringLuxuryStage3D").then((m) => ({
    default: m.EngineeringLuxuryStage3D,
  })),
);

function createPersistentStageHost(): HTMLDivElement | null {
  if (typeof document === "undefined") return null;
  const host = document.createElement("div");
  host.className = "h-full w-full relative";
  host.setAttribute("data-testid", "eng-lab-persistent-stage-host");
  return host;
}

export const EngineeringLabExperiencePage: React.FC = () => {
  const lang = useNavigationStore((s) => s.lang);
  const reducedMotion = useReducedMotion();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isVi = lang === "vi";

  const [showIntro, setShowIntro] = useState(() =>
    shouldAutoPlaySandboxIntro(searchParams, location.hash),
  );

  // Mark SPA document session handled after commit so StrictMode/Suspense stay pure,
  // while subsequent internal SPA remounts never re-trigger the intro (CR-12, Q15)
  useEffect(() => {
    markSandboxIntroConsumed();
  }, []);

  const initialMode = parseLabModeParam(searchParams.get("lab"));
  const [labState, dispatchLab] = useReducer(labSimulatorReducer, {
    ...INITIAL_LAB_SIMULATOR_STATE,
    mode: initialMode,
    xrayShells: initialMode === "hybrid-powertrain",
  });
  const labTelemetry = useMemo(
    () => evaluateLabTelemetry(labState),
    [labState],
  );

  const heroSectionRef = useRef<HTMLElement>(null);
  const heroBackdropSlotRef = useRef<HTMLDivElement>(null);
  const labViewportRef = useRef<HTMLDivElement>(null);
  const labCanvasSlotRef = useRef<HTMLDivElement>(null);
  const [stagePortalHost] = useState<HTMLDivElement | null>(
    createPersistentStageHost,
  );
  const [heroScrollProgress, setHeroScrollProgress] = useState(0);
  const [stageZone, setStageZone] = useState<SandboxStageZone>("hero");
  const [modelReady, setModelReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [fallbackCode, setFallbackCode] = useState<string | null>(null);
  const [stageMountKey, setStageMountKey] = useState(0);

  // Sync ?lab= query parameter changes
  useEffect(() => {
    const requested = searchParams.get("lab");
    if (requested) {
      dispatchLab({ type: "set-mode", mode: parseLabModeParam(requested) });
    }
  }, [searchParams]);

  // Honor hash & ?lab= deep-links (#interactive-lab, #disciplines) cleanly after navigation (CR-06)
  useEffect(() => {
    const requestedMode = searchParams.get("lab");
    const targetId = location.hash
      ? location.hash.slice(1)
      : requestedMode
        ? "interactive-lab"
        : "";
    if (!targetId) return;
    const raf = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
      if (requestedMode) {
        const modeId = parseLabModeParam(requestedMode);
        document
          .getElementById(`eng-lab-tab-id-${modeId}`)
          ?.focus({ preventScroll: true });
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [location.hash, reducedMotion, searchParams]);

  // Scroll-driven Hero camera progress + Single-WebGL Lab Zone Switching (CR-01)
  useEffect(() => {
    let rafId = 0;
    const evaluateScrollZones = () => {
      rafId = 0;
      const vh = window.innerHeight || 900;
      const heroEl = heroSectionRef.current;
      const labEl = labViewportRef.current;

      if (labEl) {
        const labRect = labEl.getBoundingClientRect();
        if (labRect.top < vh * 0.85 && labRect.bottom > vh * 0.12) {
          setStageZone("lab");
          return;
        }
      }

      if (heroEl) {
        const heroRect = heroEl.getBoundingClientRect();
        if (heroRect.bottom > vh * 0.16 && heroRect.top < vh) {
          const scrollable = Math.max(1, heroRect.height - vh * 0.85);
          const progress = Math.max(
            0,
            Math.min(1, -heroRect.top / scrollable),
          );
          setHeroScrollProgress(progress);
          setStageZone("hero");
          return;
        }
      }

      setStageZone("parked");
    };

    const onScrollOrResize = () => {
      if (rafId === 0) {
        rafId = window.requestAnimationFrame(evaluateScrollZones);
      }
    };

    evaluateScrollZones();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  // Reparent the single persistent stagePortalHost between Hero backdrop and Lab 3D aperture
  // without unmounting React or losing the single WebGL2 context (CR-01, REQ-16)
  useLayoutEffect(() => {
    if (!stagePortalHost || fallbackCode) return;
    const targetParent =
      stageZone === "lab" && labCanvasSlotRef.current
        ? labCanvasSlotRef.current
        : heroBackdropSlotRef.current;
    if (targetParent && stagePortalHost.parentElement !== targetParent) {
      targetParent.appendChild(stagePortalHost);
      window.dispatchEvent(new Event("resize"));
    }
  }, [fallbackCode, stagePortalHost, stageZone]);

  useEffect(() => {
    return () => {
      stagePortalHost?.remove();
    };
  }, [stagePortalHost]);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    if (searchParams.get("intro") === "replay") {
      const next = new URLSearchParams(searchParams);
      next.delete("intro");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleModelReady = useCallback(() => setModelReady(true), []);
  const handleFallbackActivated = useCallback(
    (code: string) => setFallbackCode(code),
    [],
  );
  const handleSelect3DPart = useCallback(
    (partId: string) => dispatchLab({ type: "select-part", partId }),
    [],
  );

  const handleRetry3D = useCallback(() => {
    setFallbackCode(null);
    setModelReady(false);
    setLoadProgress(0);
    setStageMountKey((k) => k + 1);
  }, []);

  const heroCameraStageIndex = Math.min(
    3,
    Math.floor(heroScrollProgress * 3.99),
  );

  const heroBackdropStyle: React.CSSProperties | undefined =
    stageZone !== "hero" ? { opacity: 0, pointerEvents: "none" } : undefined;

  return (
    <>
      {!fallbackCode &&
        stagePortalHost &&
        createPortal(
          <Suspense fallback={null}>
            <EngineeringLuxuryStage3D
              key={stageMountKey}
              stageZone={stageZone}
              heroScrollProgress={heroScrollProgress}
              labState={labState}
              labTelemetry={labTelemetry}
              reducedMotion={reducedMotion}
              onLoadProgress={setLoadProgress}
              onModelReady={handleModelReady}
              onFallbackActivated={handleFallbackActivated}
              onSelectPart={handleSelect3DPart}
            />
          </Suspense>,
          stagePortalHost,
        )}

      <EngineeringLabShell
        title={
          isVi
            ? "Phân khu Kỹ thuật (Sandbox) | Podium EDS"
            : "Engineering Division (Sandbox) | Podium EDS"
        }
        description={
          isVi
            ? "Không gian trải nghiệm kỹ thuật xe đua kỹ thuật số Podium EDS: Khí động học, Cánh chủ động, Hybrid và Động lực học."
            : "Podium EDS Digital Motorsport Engineering Experience: Ground Effect, Active Aerodynamics, Hybrid Powertrain and Vehicle Dynamics."
        }
        introOverlay={
          showIntro ? (
            <CinematicStartGantryIntro
              lang={lang}
              reducedMotion={reducedMotion}
              onComplete={handleIntroComplete}
            />
          ) : null
        }
        backdropStage={
          <div
            ref={heroBackdropSlotRef}
            className="peds-eng-lux-3d-backdrop"
            style={heroBackdropStyle}
            data-stage-zone={stageZone}
            data-model-ready={modelReady ? "true" : "false"}
            aria-hidden="true"
          >
            {fallbackCode && stageZone === "hero" && (
              <div className="flex h-full w-full items-center justify-end pr-6 opacity-45 lg:pr-20">
                <div className="h-[340px] w-full max-w-[680px]">
                  <EngineeringLabSchematic2D
                    mode="ground-effect"
                    lang={lang}
                    reducedMotion={reducedMotion}
                  />
                </div>
              </div>
            )}
          </div>
        }
      >
        {/* Section 02: Cinematic Hero */}
        <section
          ref={heroSectionRef}
          className="peds-eng-lux-hero"
          data-section="02-cinematic-hero"
          data-testid="eng-lab-section-02-hero"
        >
          <div className="peds-eng-lux-hero__sticky">
            <div className="peds-eng-lux-container my-auto max-w-4xl lg:mx-0 lg:ml-[max(24px,calc((100vw-1320px)/2))]">
              <p className="peds-eng-lux-mono text-xs text-[#00D9F5]">
                {isVi
                  ? "PODIUM EDS / PHÂN KHU KỸ THUẬT"
                  : "PODIUM EDS / ENGINEERING DIVISION"}
              </p>
              <h1 className="peds-eng-lux-display-title mt-5 text-4xl uppercase sm:text-7xl lg:text-[5.1rem]">
                {isVi ? (
                  <>
                    CHẾ TÁC VƯỢT
                    <br />
                    MỌI GIỚI HẠN.
                  </>
                ) : (
                  <>
                    ENGINEERED
                    <br />
                    BEYOND LIMITS.
                  </>
                )}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-[#A7B2C2] sm:text-lg">
                {isVi
                  ? "Khám phá khoa học, sự chính xác cơ khí và tư duy đổi mới đằng sau hiệu suất đua xe đỉnh cao — nơi từng luồng khí, dòng điện và khớp treo được trực quan hóa."
                  : "Exploring the science, precision and innovation behind motorsport performance."}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a href="#disciplines" className="peds-eng-lux-cta-primary">
                  <span>
                    {isVi ? "KHÁM PHÁ CHUYÊN ĐỀ" : "EXPLORE ENGINEERING"}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a href="#interactive-lab" className="peds-eng-lux-cta-secondary">
                  <Cpu className="h-4 w-4 text-[#00D9F5]" aria-hidden="true" />
                  <span>
                    {isVi ? "MỞ INTERACTIVE LAB" : "LAUNCH INTERACTIVE LAB"}
                  </span>
                </a>
              </div>
            </div>

            <div className="peds-eng-lux-container flex flex-wrap items-center justify-between gap-4 border-t border-[#E9EDF2]/12 pt-5">
              <span className="peds-eng-lux-mono text-xs text-[#E9EDF2]">
                {isVi
                  ? "01 / 04 — CHUỖI CHUYÊN ĐỀ KỸ THUẬT"
                  : "01 / 04 — TECHNICAL SERIES"}
              </span>
              <span
                className="peds-eng-lux-mono text-[11px] text-[#00D9F5]"
                data-testid="eng-lab-hero-camera-cue"
              >
                {HERO_CAMERA_STAGE_LABELS[heroCameraStageIndex][lang]}
              </span>
              <span className="peds-eng-lux-mono text-[10px] text-[#7D899B]">
                {isVi
                  ? "CUỘN TRANG ĐỂ TIẾN SÁT CẤU TRÚC KỸ THUẬT"
                  : "SCROLL TO ADVANCE CAMERA ACROSS SUBSYSTEMS"}
              </span>
            </div>
          </div>
        </section>

        {/* Section 03: Engineering Philosophy */}
        <section
          className="peds-eng-lux-section peds-eng-lux-section--graphite"
          data-section="03-engineering-philosophy"
          data-testid="eng-lab-section-03-philosophy"
        >
          <div className="peds-eng-lux-container">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <p className="peds-eng-lux-mono text-xs text-[#00D9F5]">
                  {isVi
                    ? "02 · TRIẾT LÝ KỸ THUẬT"
                    : "02 · ENGINEERING PHILOSOPHY"}
                </p>
                <h2 className="peds-eng-lux-display-title mt-4 text-3xl uppercase sm:text-5xl">
                  {isVi ? (
                    <>
                      KHOA HỌC TỐC ĐỘ.
                      <br />
                      CHÍNH XÁC TỪNG CHI TIẾT.
                    </>
                  ) : (
                    <>
                      THE SCIENCE OF SPEED.
                      <br />
                      PRECISION IN EVERY DETAIL.
                    </>
                  )}
                </h2>
              </div>
              <p className="text-base leading-8 text-[#A7B2C2]">
                {isVi
                  ? "Mỗi chi tiết được định hình bởi khoa học, sự chính xác và khát vọng tối ưu hiệu suất. Không có chi tiết thừa để trang trí: mọi đường cắt sợi carbon đều phục vụ dòng chảy khí động, cân bằng nhiệt hoặc độ cứng vững kết cấu."
                  : "Every surface is shaped by physics, structural tolerance, and relentless lap-time discipline. Nothing exists as ornament: every carbon contour serves aerodynamic flow, thermal rejection, or mechanical compliance."}
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {ENGINEERING_PHILOSOPHY_PILLARS.map((pillar) => (
                <div
                  key={pillar.code}
                  className="rounded-2xl border border-[#202730] bg-[#080A0D] p-7"
                >
                  <p className="peds-eng-lux-mono text-[10px] text-[#00D9F5]">
                    {isVi ? pillar.code.replace("FIG.", "HÌNH") : pillar.code}
                  </p>
                  <h3 className="peds-eng-lux-display-title mt-4 text-xl font-semibold">
                    {pillar.title[lang]}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#A7B2C2]">
                    {pillar.body[lang]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 04: Four Engineering Disciplines */}
        <section
          id="disciplines"
          className="peds-eng-lux-section scroll-mt-20"
          data-section="04-four-disciplines"
          data-testid="eng-lab-section-04-disciplines"
        >
          <div className="peds-eng-lux-container">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="peds-eng-lux-mono text-xs text-[#00D9F5]">
                  {isVi
                    ? "03 · BỐN CHƯƠNG CÔNG NGHỆ"
                    : "03 · FOUR ENGINEERING DISCIPLINES"}
                </p>
                <h2 className="peds-eng-lux-display-title mt-3 text-3xl sm:text-5xl">
                  {isVi
                    ? "Bốn chương công nghệ cốt lõi"
                    : "Four Core Technology Chapters"}
                </h2>
              </div>
              <span className="peds-eng-lux-mono text-xs text-[#7D899B]">
                {isVi
                  ? "01 — 04 · HỆ THỐNG KIẾN TRÚC"
                  : "01 — 04 · ARCHITECTURAL SYSTEMS"}
              </span>
            </div>

            <div className="peds-eng-lux-chapters-grid">
              {ENGINEERING_DISCIPLINE_CHAPTERS.map((chapter) => (
                <article
                  key={chapter.articleSlug}
                  className="peds-eng-lux-chapter-card"
                  data-testid={`eng-lab-chapter-${chapter.labMode}`}
                >
                  <div className="peds-eng-lux-chapter-card__visual">
                    <div className="peds-eng-lux-chapter-card__plate">
                      <EngineeringLabSchematic2D
                        mode={chapter.labMode}
                        lang={lang}
                        reducedMotion={reducedMotion}
                      />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-7">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="peds-eng-lux-mono text-[11px] text-[#00D9F5]">
                          {chapter.overline[lang]}
                        </span>
                        <span className="peds-eng-lux-mono text-[10px] text-[#7D899B]">
                          {isVi
                            ? chapter.figCode.replace("FIG.", "HÌNH")
                            : chapter.figCode}
                        </span>
                      </div>

                      <h3 className="peds-eng-lux-display-title mt-3 text-2xl sm:text-3xl">
                        {chapter.title[lang]}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[#A7B2C2]">
                        {chapter.summary[lang]}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {chapter.effectsTags.map((tag) => (
                          <span
                            key={tag.en}
                            className="peds-eng-lux-mono rounded-full border border-[#202730] bg-[#080A0D] px-3 py-1 text-[10px] text-[#A7B2C2]"
                          >
                            {tag[lang]}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#202730] pt-5">
                      <Link
                        to={buildEngineeringLabArticleHref(chapter.articleSlug)}
                        className="peds-eng-lux-chapter-card__explore min-h-11"
                        data-testid={`eng-lab-explore-${chapter.articleSlug}`}
                      >
                        <span>{isVi ? "Đọc chuyên đề" : "Explore Chapter"}</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>

                      <a
                        href="#interactive-lab"
                        onClick={() =>
                          dispatchLab({
                            type: "set-mode",
                            mode: chapter.labMode,
                          })
                        }
                        className="peds-eng-lux-mono inline-flex min-h-11 items-center text-[10px] text-[#A7B2C2] hover:text-[#00D9F5]"
                      >
                        {isVi ? "MÔ PHỎNG TRONG LAB →" : "OPEN IN LAB →"}
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Section 05: Interactive Engineering Lab */}
        <EngineeringLabInteractiveSection
          lang={lang}
          reducedMotion={reducedMotion}
          state={labState}
          telemetry={labTelemetry}
          modelReady={modelReady}
          loadProgress={loadProgress}
          fallbackCode={fallbackCode}
          onRetry3D={handleRetry3D}
          onDispatch={dispatchLab}
          labViewportRef={labViewportRef}
          labCanvasSlotRef={labCanvasSlotRef}
        />

        {/* Section 06: Technical Insights (4 Peer-Referenced Dossiers) */}
        <section
          className="peds-eng-lux-section peds-eng-lux-section--graphite"
          data-section="06-technical-insights"
          data-testid="eng-lab-section-06-insights"
        >
          <div className="peds-eng-lux-container">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="peds-eng-lux-mono text-xs text-[#00D9F5]">
                  {isVi
                    ? "05 · HỒ SƠ PHÂN TÍCH & NGUỒN ĐỐI CHIẾU"
                    : "05 · TECHNICAL INSIGHTS & SOURCES"}
                </p>
                <h2 className="peds-eng-lux-display-title mt-3 text-3xl sm:text-5xl">
                  {isVi
                    ? "Hồ sơ phân tích chuyên sâu"
                    : "In-Depth Technical Dossiers"}
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#A7B2C2]">
                {isVi
                  ? "Mỗi bài viết được đối chiếu với tài liệu nguyên lý NASA Glenn, Bộ Năng lượng Hoa Kỳ và văn bản quy định kỹ thuật FIA Section C."
                  : "Every dossier is cross-checked against NASA Glenn aerodynamics references, US DOE hybrid literature, and FIA Section C regulations."}
              </p>
            </div>

            <div className="mt-10 divide-y divide-[#202730] rounded-2xl border border-[#202730] bg-[#080A0D]">
              {ENGINEERING_ARTICLES.map((article, idx) => (
                <Link
                  key={article.slug}
                  to={buildEngineeringLabArticleHref(article.slug)}
                  className="group flex flex-col gap-4 p-6 transition hover:bg-[#11151B] md:flex-row md:items-center md:justify-between md:p-8"
                >
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="peds-eng-lux-mono text-xs text-[#FF4938]">
                        0{idx + 1}
                      </span>
                      <span className="peds-eng-lux-mono text-[11px] text-[#00D9F5]">
                        {article.topic[lang]}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#7D899B]">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        {article.readingMinutes} {isVi ? "phút đọc" : "min read"}
                      </span>
                      <span className="peds-eng-lux-mono text-[10px] text-[#7D899B]">
                        {article.sources.length}{" "}
                        {isVi ? "NGUỒN ĐỐI CHIẾU" : "VERIFIED SOURCES"}
                      </span>
                    </div>
                    <h3 className="peds-eng-lux-display-title mt-2.5 text-xl group-hover:text-[#00D9F5] sm:text-2xl">
                      {article.title[lang]}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#A7B2C2]">
                      {article.description[lang]}
                    </p>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#E9EDF2] group-hover:text-[#00D9F5]">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    <span>{isVi ? "Đọc bài viết" : "Read Dossier"}</span>
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Section 07: Explore the Showroom & 47-Part Anatomy */}
        <section
          className="peds-eng-lux-section"
          data-section="07-explore-showroom"
          data-testid="eng-lab-section-07-showroom"
        >
          <div className="peds-eng-lux-container grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col justify-between rounded-2xl border border-[#202730] bg-[#11151B] p-8 sm:p-10">
              <div>
                <p className="peds-eng-lux-mono text-xs text-[#00D9F5]">
                  {isVi
                    ? "06A · GARAGE SHOWROOM 3D"
                    : "06A · 3D PIT GARAGE SHOWROOM"}
                </p>
                <h2 className="peds-eng-lux-display-title mt-4 text-3xl sm:text-4xl">
                  {isVi
                    ? "Khám phá xe đua trong Showroom 3D"
                    : "Explore the 3D Pit Garage Showroom"}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#A7B2C2]">
                  {isVi
                    ? "Bước sang không gian Pit Garage hai khoang với góc quay tự do, điểm chạm kỹ thuật trực quan và đội ngũ kỹ thuật viên 3D."
                    : "Step into the two-bay interactive 3D Pit Garage with free camera inspection, technical hotspots, and full-scale study lighting."}
                </p>
              </div>
              <div className="mt-8">
                <Link to="/showroom" className="peds-eng-lux-cta-primary">
                  <Compass className="h-4 w-4" aria-hidden="true" />
                  <span>{isVi ? "MỞ SHOWROOM 3D" : "ENTER 3D SHOWROOM"}</span>
                </Link>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-[#202730] bg-[#11151B] p-8 sm:p-10">
              <div>
                <p className="peds-eng-lux-mono text-xs text-[#FF4938]">
                  {isVi
                    ? "06B · BÓC TÁCH 12 CẢNH / 47 CỤM"
                    : "06B · 12-SCENE / 47-PART DISASSEMBLY"}
                </p>
                <h2 className="peds-eng-lux-display-title mt-4 text-3xl sm:text-4xl">
                  {isVi
                    ? "Hành trình bóc tách 47 cụm cơ khí"
                    : "12-Scene 47-Part Mechanical Anatomy"}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#A7B2C2]">
                  {isVi
                    ? "Trải nghiệm kịch bản bóc tách toàn diện từng bu-lông khóa tâm, khung Halo titan, buồng lái OLED và cụm truyền động V6."
                    : "Experience the full choreographed 12-scene disassembly across centerlock hubs, Grade-5 titanium Halo, OLED wheel, and V6 hybrid core."}
                </p>
              </div>
              <div className="mt-8">
                <Link
                  to="/engineering/car-anatomy"
                  className="peds-eng-lux-cta-secondary"
                >
                  <span>
                    {isVi ? "XEM MÀN BÓC TÁCH 47 CỤM" : "OPEN 47-PART ANATOMY"}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </EngineeringLabShell>
    </>
  );
};
