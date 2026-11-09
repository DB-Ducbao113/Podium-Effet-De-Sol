import { useEffect, useRef } from 'react';
import type { PointerEventHandler } from 'react';
import { animate, createScope } from 'animejs';
import { ArrowDown, ArrowRight, Move3d } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { HomeRacePulseScene } from './HomeRacePulseScene';
import { HomeCommandStrip } from './HomeCommandStrip';
import { useNextRace } from './useNextRace';
import { chapterScrollTarget } from './journey/homeChapterScroll';
import './podiumHeroR1.css';
import './homeHeroV7.css';

export function PodiumBrandHero() {
  const lang = useNavigationStore((state) => state.lang);
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const nextRace = useNextRace();
  const heroRef = useRef<HTMLElement | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const root = heroRef.current;
    if (!root || reducedMotion) return;
    const scope = createScope({ root }).add(() => {
      animate(root.querySelectorAll('[data-launch-reveal]'), {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 660,
        ease: 'out(4)',
        delay: (_: unknown, index = 0) => index * 95,
      });
    });
    return () => scope.revert();
  }, [reducedMotion]);

  useEffect(() => {
    const root = heroRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      root.dataset.visible = String(entry.isIntersecting);
    }, { threshold: 0.03 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  const moveScene: PointerEventHandler<HTMLElement> = (event) => {
    if (reducedMotion || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
    const root = heroRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      root.style.setProperty('--launch-x', `${(x * 13).toFixed(1)}px`);
      root.style.setProperty('--launch-y', `${(y * 10).toFixed(1)}px`);
      root.style.setProperty('--launch-light-x', `${((x + .5) * 100).toFixed(1)}%`);
      root.style.setProperty('--launch-light-y', `${((y + .5) * 100).toFixed(1)}%`);
    });
  };
  const resetScene = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const root = heroRef.current;
    if (!root) return;
    for (const key of ['--launch-x', '--launch-y', '--launch-light-x', '--launch-light-y']) {
      root.style.removeProperty(key);
    }
  };
  const goTo = (id: string) => {
    chapterScrollTarget(id)?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
  };

  return (
    <section
      ref={heroRef}
      id="launch-control"
      className="r1-cinema r1-cinema--v7"
      data-lang={lang}
      data-visible="true"
      data-motion-engine={reducedMotion ? 'reduced' : 'animejs'}
      aria-labelledby="podium-hero-title"
      onPointerMove={moveScene}
      onPointerLeave={resetScene}
    >
      <div className="r1-cinema__inner page-container">
        <div className="r1-cinema__copy">
          <p className="r1-cinema__eyebrow" data-launch-reveal>
            <span aria-hidden="true" className="r1-cinema__slashes">///</span>
            THE F1 EXPERIENCE
          </p>
          <h1 id="podium-hero-title" className="r1-cinema__title" data-launch-reveal>
            <span>RACE</span>
            <span>BEYOND</span>
            <span className="r1-cinema__title-accent">LIMITS.</span>
          </h1>
          <div className="r1-cinema__actions" data-launch-reveal>
            <button type="button" className="r1-cinema__primary" onClick={() => navigate('/season/2026?tab=results')}>
              {lang === 'vi' ? 'Mùa giải 2026' : 'Explore season'} <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button type="button" className="r1-cinema__secondary" onClick={() => navigate('/showroom')}>
              <Move3d size={18} aria-hidden="true" /> Showroom 3D
            </button>
          </div>
        </div>
        <div className="r1-cinema__scene">
          <div className="r1-cinema__scene-heading" aria-hidden="true">
            <span>LAUNCH CONTROL</span>
            <span>EDS / 01</span>
          </div>
          <HomeRacePulseScene />
        </div>
        <HomeCommandStrip race={nextRace} />
      </div>
      <button type="button" className="r1-cinema__scroll" onClick={() => goTo('race-control')}>
        <span>{lang === 'vi' ? 'Khám phá' : 'Scroll to explore'}</span><ArrowDown size={16} aria-hidden="true" />
      </button>
      <div className="r1-cinema__energy-rail" aria-hidden="true" />
    </section>
  );
}
