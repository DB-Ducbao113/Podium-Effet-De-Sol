import { useEffect, useRef } from 'react';
import {
  HOME_CHAPTER_IDS,
  getCurrentHomeChapter,
  getHomePageProgress,
  getHomeSectionProgress,
} from './homeJourneyMath';
import './homeJourneyMotion.css';

/**
 * One lightweight choreography controller for every Homepage chapter.
 *
 * Decorative field and progress rail use CSS/SVG only. There is one scroll rAF,
 * no perpetual JS render loop, no new WebGL context, and no modifications to
 * race data, Showroom, layout, CTA targets or focus order.
 */
export function HomeJourneyMotion() {
  const field = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = field.current?.closest<HTMLElement>('.home-v3');
    if (!host) return;

    const nodes = HOME_CHAPTER_IDS.map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compact = window.matchMedia('(max-width: 850px)');
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    let raf = 0;

    const motionQuality = () => {
      const mode = reduced.matches
        ? 'off'
        : compact.matches || nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory <= 4)
          ? 'lite'
          : 'full';
      host.dataset.homeMotion = mode;
      if (mode === 'off') nodes.forEach((node) => { node.dataset.homeEntered = 'true'; });
    };

    const update = () => {
      raf = 0;
      if (document.hidden) return;
      const height = Math.max(document.documentElement.scrollHeight, host.scrollHeight);
      const progress = getHomePageProgress(window.scrollY, height, window.innerHeight);
      host.style.setProperty('--home-scroll-progress', progress.toFixed(4));
      host.style.setProperty('--home-vector-offset', ((progress - .5) * 115).toFixed(1) + 'px');
      const rects = nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        const sectionProgress = getHomeSectionProgress(rect.top, rect.height, window.innerHeight);
        node.style.setProperty('--home-chapter-progress', sectionProgress.toFixed(3));
        node.style.setProperty('--home-chapter-offset', ((sectionProgress - .5) * 32).toFixed(1) + 'px');
        return { id: node.id as (typeof HOME_CHAPTER_IDS)[number], top: rect.top, bottom: rect.bottom };
      });
      host.dataset.homeChapter = getCurrentHomeChapter(rects, window.innerHeight);
    };

    const schedule = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(update); };
    const onVisibility = () => {
      host.dataset.homeMotionPlayback = document.hidden ? 'paused' : 'running';
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else schedule();
    };
    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              (entry.target as HTMLElement).dataset.homeEntered = 'true';
              observer.unobserve(entry.target);
            }
          }
        }, { rootMargin: '0px 0px -6% 0px', threshold: .04 })
      : null;

    if (observer) nodes.forEach((node) => observer.observe(node));
    else nodes.forEach((node) => { node.dataset.homeEntered = 'true'; });

    motionQuality();
    update();
    onVisibility();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    reduced.addEventListener('change', motionQuality);
    compact.addEventListener('change', motionQuality);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', onVisibility);
      reduced.removeEventListener('change', motionQuality);
      compact.removeEventListener('change', motionQuality);
      delete host.dataset.homeChapter;
      delete host.dataset.homeMotion;
      delete host.dataset.homeMotionPlayback;
      host.style.removeProperty('--home-scroll-progress');
      host.style.removeProperty('--home-vector-offset');
      nodes.forEach((node) => {
        delete node.dataset.homeEntered;
        node.style.removeProperty('--home-chapter-progress');
        node.style.removeProperty('--home-chapter-offset');
      });
    };
  }, []);

  return (
    <div ref={field} className="home-journey" data-home-storyboard="four-chapters" aria-hidden="true">
      <div className="home-journey__wash home-journey__wash--ignition" />
      <div className="home-journey__wash home-journey__wash--control" />
      <div className="home-journey__wash home-journey__wash--fight" />
      <div className="home-journey__wash home-journey__wash--explore" />
      <div className="home-journey__grid" />
      <svg className="home-journey__stream" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" role="presentation">
        <defs>
          <linearGradient id="journey-vector-blue" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#65C5E6" stopOpacity="0" />
            <stop offset=".45" stopColor="#65C5E6" stopOpacity=".35" />
            <stop offset="1" stopColor="#65C5E6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="journey-vector-orange" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#FF4A18" stopOpacity="0" />
            <stop offset=".5" stopColor="#FF7341" stopOpacity=".32" />
            <stop offset="1" stopColor="#FF4A18" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="home-journey__streamlines">
          <path d="M-180 760 C190 570 420 805 685 530 S1114 367 1620 95" stroke="url(#journey-vector-blue)" strokeWidth="1.1" />
          <path d="M-220 811 C220 654 392 853 750 595 S1120 448 1650 238" stroke="url(#journey-vector-orange)" strokeWidth="1.5" />
          <path d="M-100 681 C261 501 433 627 765 456 S1080 266 1580 175" stroke="url(#journey-vector-blue)" strokeWidth=".7" />
        </g>
      </svg>
      <div className="home-journey__rail">
        <span className="home-journey__rail-label">EDS / JOURNEY</span>
        <div className="home-journey__rail-track">
          <span className="home-journey__rail-fill" />
          <span className="home-journey__rail-dot home-journey__rail-dot--1" />
          <span className="home-journey__rail-dot home-journey__rail-dot--2" />
          <span className="home-journey__rail-dot home-journey__rail-dot--3" />
          <span className="home-journey__rail-dot home-journey__rail-dot--4" />
        </div>
        <div className="home-journey__rail-titles">
          <span>01</span><span>02</span><span>03</span><span>04</span>
        </div>
      </div>
    </div>
  );
}
