import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import {
  DEFAULT_EDS_LIVERY_ID,
  EDS_LIVERIES,
  EDS_LIVERY_IDS,
  EDSLiveryId,
} from '../../data/showroom/edsLiveries';
import { useMobileHub } from '../../hooks/useMobileHub';
import { ErrorBoundary } from '../common/ErrorBoundary';

const EDSHomeHeroScene = lazy(() =>
  import('./EDSHomeHeroScene').then((module) => ({ default: module.EDSHomeHeroScene })),
);

export const PodiumBrandHero: React.FC = () => {
  const lang = useNavigationStore((state) => state.lang);
  const mobile = useMobileHub();
  const location = useLocation();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const [ready, setReady] = useState(false);
  const [livery, setLivery] = useState<EDSLiveryId>(DEFAULT_EDS_LIVERY_ID);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || mobile) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      setHasViewed(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setHasViewed(true);
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [mobile]);

  const scrollToGrid = () => {
    document.getElementById('official-grid')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  };

  return (
    <section
      ref={heroRef}
      className="podium-hero relative isolate min-h-[620px] h-[calc(100svh-64px)] max-h-[920px] overflow-hidden bg-[#050507] text-white"
      aria-labelledby="podium-hero-title"
    >
      <img
        src="/images/eds/editorial/eds-g01-hero.svg"
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover object-[50%_60%] podium-hero-image transition-opacity duration-700 ${ready && !mobile ? 'hero-3d-ready' : ''}`}
        {...{ fetchpriority: 'high' }}
        decoding="async"
      />

      {!mobile && hasViewed && (
        <div className="absolute inset-0 z-[1]">
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <EDSHomeHeroScene livery={livery} onReady={onReady} active={visible} />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,6,0.28)_0%,rgba(4,4,6,0.01)_38%,rgba(4,4,6,0.08)_72%,rgba(4,4,6,0.72)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(2,2,4,0.3)_100%)]" />

      {mobile && (
        <div className="r1-mobile-hero page-container relative z-20 flex h-full flex-col justify-between pb-[calc(88px+env(safe-area-inset-bottom))] pt-12">
          <div className="max-w-[34rem]">
            <p className="mb-5 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.26em] text-[#ff493f]">
              <span className="h-px w-8 bg-f1red" aria-hidden="true" />
              {lang === 'vi' ? 'Podium EDS · kỹ thuật' : 'Podium EDS · engineering'}
            </p>
            <h1
              className={`text-[clamp(2.5rem,11vw,4.4rem)] font-black text-white ${lang === 'vi' ? 'font-sans leading-[1.18] tracking-tight' : 'font-display leading-[1.1] tracking-tight'}`}
            >
              {lang === 'vi' ? (
                <>
                  Cơ khí của tốc độ.
                  <br />
                  <em className="text-f1red">Góc nhìn mới.</em>
                </>
              ) : (
                <>
                  Engineering speed.
                  <br />
                  <em className="text-f1red">A new perspective.</em>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-[28rem] text-sm leading-6 text-white/75">
              {lang === 'vi'
                ? 'Khám phá mẫu xe EDS-G01 nguyên bản và những nguyên lý định hình hiệu năng trên đường đua.'
                : 'Explore the original EDS-G01 concept and the engineering principles behind on-track performance.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate(`${location.pathname}#showroom`)}
                className="min-h-12 rounded-xl bg-f1red px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_12px_32px_rgba(225,6,0,.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {lang === 'vi' ? 'Khám phá Showroom' : 'Explore Showroom'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`${location.pathname}#giai-dau`)}
                className="min-h-12 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {lang === 'vi' ? 'Bảng điểm' : 'Standings'}
              </button>
            </div>
          </div>
          <p className="self-end rounded-md border border-white/15 bg-black/65 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
            EDS-G01 · {lang === 'vi' ? 'nguyên mẫu gốc' : 'original concept'}
          </p>
        </div>
      )}

      <div className="absolute left-6 right-6 top-8 z-10 h-px bg-white/20 md:left-12 md:right-12">
        <span className="absolute left-[8%] top-0 h-px w-32 bg-f1red shadow-[0_0_12px_rgba(225,6,0,0.8)]" />
      </div>
      <div className="absolute bottom-16 left-6 right-6 z-10 h-px bg-white/35 md:left-12 md:right-12">
        <span className="absolute right-[4%] top-0 h-px w-36 bg-f1red shadow-[0_0_12px_rgba(225,6,0,0.8)]" />
      </div>

      <div
        className={`page-container pointer-events-none relative z-20 h-full flex-col justify-between py-16 md:py-20 ${mobile ? 'hidden' : 'flex'}`}
      >
        <div className="flex items-center justify-between gap-6 text-[9px] font-bold uppercase tracking-[0.32em] text-white/70 [text-shadow:0_2px_8px_rgba(0,0,0,0.95)] md:text-[10px]">
          <span>Ground effect archive</span>
          <span className="hidden sm:block">Aerodynamics · Telemetry · Heritage</span>
          <span>MMXXVI</span>
        </div>

        <div className="relative flex flex-1 items-center py-10">
          <h1 id="podium-hero-title" className="sr-only">
            PODIUM — Effet de Sol
          </h1>

          <div className="podium-copy podium-copy-left absolute left-0 top-[17%] md:top-[23%]">
            <span className="mb-3 block text-[9px] font-bold uppercase tracking-[0.42em] text-[#ff3028] [text-shadow:0_2px_8px_rgba(0,0,0,1)] md:text-[10px]">
              {lang === 'vi' ? 'Tốc độ được điêu khắc' : 'Speed, sculpted'}
            </span>
            <p className="podium-metal-text font-display text-[clamp(4.3rem,11.2vw,11.5rem)] font-semibold uppercase leading-[0.73] tracking-[-0.065em]">
              Podium
            </p>
            <span className="mt-6 block h-[2px] w-32 bg-f1red shadow-[0_0_18px_rgba(225,6,0,0.7)] md:w-44" />
          </div>

          <div className="podium-copy podium-copy-right absolute bottom-[15%] right-0 text-right md:bottom-[18%]">
            <span className="mb-3 block text-[9px] font-bold uppercase tracking-[0.42em] text-white/80 [text-shadow:0_2px_8px_rgba(0,0,0,1)] md:text-[10px]">
              {lang === 'vi' ? 'Nghệ thuật của lực ép' : 'The art of downforce'}
            </span>
            <p className="podium-metal-text font-display text-[clamp(3rem,6.4vw,7.2rem)] font-semibold uppercase leading-[0.78] tracking-[-0.055em]">
              Effet
              <br />
              de Sol
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-6">
          <p className="max-w-[28rem] text-[10px] font-semibold uppercase leading-relaxed tracking-[0.25em] text-white/70 [text-shadow:0_2px_8px_rgba(0,0,0,1)] sm:text-xs">
            {lang === 'vi'
              ? 'Khám phá nơi không khí, carbon và tốc độ hội tụ.'
              : 'Where airflow, carbon and speed converge.'}
          </p>
          <button
            type="button"
            onClick={scrollToGrid}
            className="group pointer-events-auto flex shrink-0 items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/90 [text-shadow:0_2px_8px_rgba(0,0,0,1)] transition-colors hover:text-white"
          >
            <span className="hidden sm:inline">{lang === 'vi' ? 'Khám phá' : 'Explore'}</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 transition-all group-hover:border-f1red group-hover:bg-f1red">
              <ChevronDown className="h-4 w-4" />
            </span>
          </button>
        </div>
        {!mobile && (
          <div
            className="pointer-events-auto absolute bottom-24 left-6 z-30 flex flex-wrap gap-2 rounded-xl border border-white/15 bg-black/60 p-2 backdrop-blur-md md:left-12"
            role="group"
            aria-label={lang === 'vi' ? 'Màu xe EDS-G01' : 'EDS-G01 liveries'}
          >
            {EDS_LIVERY_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setLivery(id)}
                aria-label={lang === 'vi' ? EDS_LIVERIES[id].nameVi : EDS_LIVERIES[id].name}
                aria-pressed={livery === id}
                className={`h-8 w-8 rounded-full border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${livery === id ? 'border-white' : 'border-white/30'}`}
                style={{
                  background: `linear-gradient(130deg, ${EDS_LIVERIES[id].primary} 50%, ${EDS_LIVERIES[id].accent} 50%)`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
