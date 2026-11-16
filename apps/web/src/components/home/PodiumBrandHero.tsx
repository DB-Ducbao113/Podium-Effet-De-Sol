import { useEffect, useRef } from 'react';
import type { PointerEventHandler } from 'react';
import { ArrowDown, ArrowRight, Move3d } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { HomeRacePulseScene } from './HomeRacePulseScene';
import { HomeCommandStrip } from './HomeCommandStrip';
import { useNextRace } from './useNextRace';
import { chapterScrollTarget } from './journey/homeChapterScroll';
import { useHomeHeroMotion } from './useHomeHeroMotion';
import './podiumHeroR1.css';
import './homeHeroV7.css';

export function PodiumBrandHero() {
  const lang = useNavigationStore((state) => state.lang);
  const isVi = lang === 'vi';
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const nextRace = useNextRace();
  const heroRef = useRef<HTMLElement | null>(null);
  const frame = useRef<number | null>(null);
  useHomeHeroMotion(heroRef, reducedMotion);

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
            {isVi ? 'TRẢI NGHIỆM F1' : 'THE F1 EXPERIENCE'}
          </p>
          <h1 id="podium-hero-title" className="r1-cinema__title" data-launch-reveal>
            <span>{isVi ? 'Đua' : 'Race'}</span>{' '}
            <span>{isVi ? 'vượt' : 'beyond'}</span>{' '}
            <span className="r1-cinema__title-accent">{isVi ? 'Giới hạn.' : 'Limits.'}</span>
          </h1>
          <p className="home-v5__intro" data-launch-reveal>
            {isVi
              ? 'Một góc nhìn mới về tốc độ, con người và công nghệ của Formula 1.'
              : 'A different perspective on the speed, people and engineering of Formula 1.'}
          </p>
          <div className="r1-cinema__actions" data-launch-reveal>
            <button type="button" className="r1-cinema__primary" onClick={() => navigate('/season/2026?tab=results')}>
              {isVi ? 'Mùa giải 2026' : 'Explore season'} <ArrowRight size={18} aria-hidden="true" />
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
          <div className="home-v5__transition-plates" aria-hidden="true">
            <div className="home-v5__transition-plate home-v5__transition-plate--engineering">
              <img src="/images/home/explore/engineering.webp" alt="" width="1600" height="900" decoding="async"
                onError={(event) => {
                  if (!event.currentTarget.src.endsWith("engineering-flow.svg"))
                    event.currentTarget.src="/images/home/explore/engineering-flow.svg";
                }} />
            </div>
            <div className="home-v5__transition-plate home-v5__transition-plate--drivers">
              <img src="/images/home/explore/drivers.webp" alt="" width="1600" height="900" decoding="async"
                onError={(event) => {
                  if (!event.currentTarget.src.endsWith("driver-helmet.svg"))
                    event.currentTarget.src="/images/home/explore/driver-helmet.svg";
                }} />
            </div>
          </div>
          <HomeRacePulseScene />
          <div className="home-v5__narrative" aria-hidden="true">
            <p className="home-v5__narrative-line home-v5__narrative-line--one">
              <span>01 / FORM</span>
              {isVi ? 'Hình hài của tốc độ' : 'The shape of speed'}
            </p>
            <p className="home-v5__narrative-line home-v5__narrative-line--two">
              <span>02 / ENGINEERING</span>
              {isVi ? 'Thiết kế để chuyển động' : 'Made to move'}
            </p>
            <p className="home-v5__narrative-line home-v5__narrative-line--three">
              <span>03 / DISCOVER</span>
              {isVi ? 'Phía sau mỗi cuộc đua' : 'Beyond every race'}
            </p>
          </div>
        </div>
        <HomeCommandStrip race={nextRace} />
      </div>
      <button type="button" className="r1-cinema__scroll" onClick={() => goTo('race-control')}>
        <span>{isVi ? 'Khám phá' : 'Scroll to explore'}</span><ArrowDown size={16} aria-hidden="true" />
      </button>
      <div className="r1-cinema__energy-rail" aria-hidden="true" />
    </section>
  );
}
