import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { RefreshCw } from "lucide-react";
import "./showroomRoute.css";
import { useNavigationStore } from "../../store/useNavigationStore";
import { ErrorBoundary } from "../common/ErrorBoundary";
import {
  SHOWROOM_INTRO_COPY,
  SHOWROOM_INTRO_FOCUS_MS,
  detectShowroomIntroCapability,
  getShowroomIntroTier,
  type ShowroomIntroTier,
} from "./showroomIntroState";

const ShowroomPage = React.lazy(() => import('./fp04rb-garage/ShowroomPage'));
const ShowroomReview = import.meta.env.DEV
  ? React.lazy(() => import('../../dev/ShowroomReview'))
  : null;
// Showroom opens directly into the live 3D Pit Garage without the intro overlay.
const SHOWROOM_INTRO_ENABLED: boolean = false;
const ShowroomIntroV3 = SHOWROOM_INTRO_ENABLED
  ? React.lazy(() => import('./ShowroomIntroV3'))
  : null;

export const ShowroomLoadFallback: React.FC<{ lang: "vi" | "en" }> = ({
  lang,
}) => (
  <div
    role="alert"
    className="min-h-screen bg-studio-950 text-white flex items-center justify-center px-6 py-16"
  >
    <div className="max-w-lg text-center space-y-4">
      <span className="inline-block text-xs font-black uppercase tracking-widest text-f1red bg-f1red/10 px-3 py-1 rounded-full">
        Showroom 3D
      </span>
      <h2 className="font-display text-2xl font-black uppercase text-white">
        {lang === "vi"
          ? "Không tải được mô hình 3D"
          : "3D model could not load"}
      </h2>
      <p className="text-sm text-studio-300 leading-relaxed">
        {lang === "vi"
          ? "Khối mô hình 3D không tải được. Bạn có thể tải lại trang; nội dung chặng đua và bảng xếp hạng vẫn truy cập bình thường."
          : "The 3D model chunk could not be loaded. Reload the page; race results and standings stay available."}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-peds-ignition hover:bg-peds-accent-strong text-peds-carbon text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
      >
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
        {lang === "vi" ? "Tải lại" : "Reload"}
      </button>
    </div>
  </div>
);

export const ShowroomView: React.FC<{ headingLevel?: "h1" | "h2" }> = ({
  headingLevel = "h1",
}) => {
  const review = new URLSearchParams(window.location.search).get("review");
  const showP6Review = import.meta.env.DEV && review === "p6";
  const lang = useNavigationStore((state) => state.lang);
  const introEnabled = SHOWROOM_INTRO_ENABLED && ShowroomIntroV3 !== null;
  const [tier] = useState<ShowroomIntroTier>(() =>
    introEnabled ? getShowroomIntroTier(detectShowroomIntroCapability()) : "T0",
  );
  const [entered, setEntered] = useState(!introEnabled || tier === "T0");
  const [revealed, setRevealed] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [introKey, setIntroKey] = useState(0);
  const replayRef = useRef<HTMLButtonElement>(null);

  const handleEntered = useCallback(() => {
    setEntered(true);
    setRevealed(true);
  }, []);
  const handleDismissed = useCallback(() => setIntroDismissed(true), []);
  const replay = useCallback(() => {
    setIntroKey((key) => key + 1);
    setEntered(false);
    setRevealed(false);
    setIntroDismissed(false);
  }, []);

  useEffect(() => {
    if (!entered) return;
    if (!revealed) {
      replayRef.current?.focus({ preventScroll: true });
      return;
    }
    const timer = setTimeout(
      () => replayRef.current?.focus({ preventScroll: true }),
      SHOWROOM_INTRO_FOCUS_MS,
    );
    return () => clearTimeout(timer);
  }, [entered, revealed, introKey]);

  const copy = SHOWROOM_INTRO_COPY[lang];

  return (
    <div
      className="sr-view"
      data-variant={showP6Review ? 'p6' : 'fp04rb-garage'}
      data-intro={introEnabled ? (entered ? 'entered' : 'active') : undefined}
      data-reveal={revealed ? 'true' : 'false'}
    >
      {introEnabled && tier !== "T0" && !introDismissed && ShowroomIntroV3 && (
        <Suspense fallback={null}>
          <ShowroomIntroV3
            key={introKey}
            lang={lang}
            tier={tier}
            onEnter={handleEntered}
            onDismissed={handleDismissed}
          />
        </Suspense>
      )}
      <div
        className="sr-stage"
        data-intro-hidden={introEnabled && !entered ? "true" : "false"}
      >
        <ErrorBoundary fallback={<ShowroomLoadFallback lang={lang} />}>
          <Suspense
            fallback={
              <div
                role="status"
                className="min-h-screen bg-studio-950 text-white flex items-center justify-center"
              >
                {lang === "vi" ? "Đang tải Showroom…" : "Loading Showroom…"}
              </div>
            }
          >
            {showP6Review && ShowroomReview ? (
              <ShowroomReview />
            ) : (
              <ShowroomPage headingLevel={headingLevel} />
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
      {introEnabled && entered && (
        <button
          ref={replayRef}
          type="button"
          className="sr-replay"
          onClick={replay}
        >
          <span aria-hidden="true">↺</span>
          {copy.replay}
        </button>
      )}
    </div>
  );
};
