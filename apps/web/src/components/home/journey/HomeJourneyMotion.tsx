import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigationStore } from '../../../store/useNavigationStore';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import {
  HOME_CHAPTER_IDS,
  type HomeChapter,
  dampProgress,
  getCurrentHomeChapter,
  getHomePageProgress,
  getHomePinnedProgress,
  getHomeSectionProgress,
} from './homeJourneyMath';
import { dispatchHomeScrub } from './homeScrubRegistry';
import { chapterScrollTarget } from './homeChapterScroll';
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
  const lang = useNavigationStore((state) => state.lang);
  const reducedMotion = useReducedMotion();
  const [chapter, setChapter] = useState<HomeChapter>('launch-control');
  const [inFooter, setInFooter] = useState(false);

  useEffect(() => {
    const host = field.current?.closest<HTMLElement>('.home-v3');
    if (!host) return;

    const nodes = HOME_CHAPTER_IDS.map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    const frames = nodes.map((node) => node.closest<HTMLElement>('[data-home-chapter-frame]') ?? node);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compact = window.matchMedia('(max-width: 850px)');
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    let raf = 0;
    let lastTime = 0;
    let zoom = document.documentElement.dataset.textZoom;
    let mode = 'full';
    const pinned = new Map<HomeChapter, number>();

    const motionQuality = () => {
      const textZoom = document.documentElement.dataset.textZoom;
      mode = reduced.matches
        ? 'off'
        : compact.matches || nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) || textZoom === '200' || textZoom === '400'
          ? 'lite'
          : 'full';
      host.dataset.homeMotion = mode;
      if (mode === 'off') nodes.forEach((node) => { node.dataset.homeEntered = 'true'; });
      if (mode !== 'full') {
        pinned.clear();
        frames.forEach((frame) => frame.style.removeProperty('--home-pin-progress'));
        HOME_CHAPTER_IDS.forEach((id) => dispatchHomeScrub(id, 1));
      }
      schedule();
    };

    const update = (time?: number) => {
      raf = 0;
      if (document.hidden) return;
      const now = time ?? performance.now();
      const dt = lastTime ? Math.min(Math.max(now - lastTime, 0), 80) : 16.667;
      lastTime = now;
      const currentZoom = document.documentElement.dataset.textZoom;
      if (currentZoom !== zoom) {
        zoom = currentZoom;
        motionQuality();
      }
      const height = Math.max(document.documentElement.scrollHeight, host.scrollHeight);
      const progress = getHomePageProgress(window.scrollY, height, window.innerHeight);
      host.style.setProperty('--home-scroll-progress', progress.toFixed(4));
      host.style.setProperty('--home-vector-offset', ((progress - .5) * 115).toFixed(1) + 'px');
      let settling = false;
      const rects = nodes.map((node, index) => {
        const frame = frames[index];
        const rect = frame.getBoundingClientRect();
        const sectionProgress = getHomeSectionProgress(rect.top, rect.height, window.innerHeight);
        node.style.setProperty('--home-chapter-progress', sectionProgress.toFixed(3));
        node.style.setProperty('--home-chapter-offset', ((sectionProgress - .5) * 32).toFixed(1) + 'px');
        const id = node.id as HomeChapter;
        if (mode === 'full' && frame !== node) {
          // Measure the pin span in rect space (frame minus sticky stage) so the
          // ratio stays correct under the site's root CSS zoom, where innerHeight
          // is layout px but getBoundingClientRect is visual px.
          const stageHeight = node.getBoundingClientRect().height;
          const target = getHomePinnedProgress(rect.top, rect.height, stageHeight);
          const previous = pinned.get(id) ?? target;
          let value = dampProgress(previous, target, dt);
          if (Math.abs(value - target) < .0004) value = target;
          else settling = true;
          if (value !== previous || !pinned.has(id)) {
            pinned.set(id, value);
            frame.style.setProperty('--home-pin-progress', value.toFixed(4));
            dispatchHomeScrub(id, value);
          }
        }
        return { id, top: rect.top, bottom: rect.bottom };
      });
      const currentChapter = getCurrentHomeChapter(rects, window.innerHeight);
      host.dataset.homeChapter = currentChapter;
      setChapter((previous) => previous === currentChapter ? previous : currentChapter);
      const footerTop = document.getElementById('peds-credits')?.getBoundingClientRect().top;
      const footerReached = footerTop !== undefined && footerTop < window.innerHeight * .65;
      setInFooter((previous) => previous === footerReached ? previous : footerReached);
      if (settling) schedule();
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
              observer?.unobserve(entry.target);
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
      frames.forEach((frame) => frame.style.removeProperty('--home-pin-progress'));
    };
  }, []);

  const sectionNav = <nav className="home-section-nav" data-footer-visible={inFooter} aria-label={lang === 'vi' ? 'Đi tới khu vực trang chủ' : 'Homepage sections'}>
    {HOME_CHAPTER_IDS.map((id, index) => {
      const number = String(index + 1).padStart(2, '0');
      return <button
        key={id}
        type="button"
        data-active={!inFooter && chapter === id}
        aria-label={`${lang === 'vi' ? 'Khu vực' : 'Section'} ${number}`}
        aria-current={!inFooter && chapter === id ? 'step' : undefined}
        onClick={() => {
          chapterScrollTarget(id)?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
          setChapter(id);
        }}
      >{number}</button>;
    })}
  </nav>;

  return <>
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
    {typeof document === 'undefined' ? sectionNav : createPortal(sectionNav, document.body)}
  </>;
}
