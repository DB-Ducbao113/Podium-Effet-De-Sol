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
import { getV5HeroMotion } from './homeV5Motion';
import { sampleV5Scene } from './homeV5Choreography';
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

  // F10.02: scroll controls the narrative, not the size or visibility of the car.
  // No new scroll container, WebGL context, document listener loop or route state.
  useEffect(() => {
    const root = heroRef.current;
    const wrapper = root?.closest<HTMLElement>('[data-home-v5-scroll]');
    if (!root || !wrapper) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const compact = window.matchMedia('(max-width: 860px)').matches;
      const motion = getV5HeroMotion(
        wrapper.getBoundingClientRect().top,
        wrapper.getBoundingClientRect().height,
        window.innerHeight,
        reducedMotion || compact,
      );
      root.dataset.v5Scene = String(motion.scene);
      root.style.setProperty('--v5-scene-one', motion.first.toFixed(3));
      root.style.setProperty('--v5-scene-two', motion.second.toFixed(3));
      root.style.setProperty('--v5-scene-three', motion.third.toFixed(3));
      root.style.setProperty('--v5-shift', motion.shift.toFixed(1) + 'px');
      root.style.setProperty('--v5-progress', motion.progress.toFixed(3));
      const transition = sampleV5Scene(motion.progress);
      const values: Record<string, string> = {
        '--v5-first-x': transition.firstX.toFixed(1)+'px',
        '--v5-first-mask': transition.firstMask.toFixed(1)+'%',
        '--v5-second-x': transition.secondX.toFixed(1)+'px',
        '--v5-second-mask-left': transition.secondMaskLeft.toFixed(1)+'%',
        '--v5-second-mask-right': transition.secondMaskRight.toFixed(1)+'%',
        '--v5-third-x': transition.thirdX.toFixed(1)+'px',
        '--v5-third-mask': transition.thirdMask.toFixed(1)+'%',
        '--v5-photo2-opacity': transition.photo2Opacity.toFixed(3),
        '--v5-photo2-clip': transition.photo2Clip.toFixed(1)+'%',
        '--v5-photo2-x': transition.photo2X.toFixed(1)+'px',
        '--v5-photo3-opacity': transition.photo3Opacity.toFixed(3),
        '--v5-photo3-clip': transition.photo3Clip.toFixed(1)+'%',
        '--v5-photo3-x': transition.photo3X.toFixed(1)+'px',
      };
      for(const [key,value] of Object.entries(values))root.style.setProperty(key,value);
    };
    const schedule = () => {
      if (raf === 0) raf = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      delete root.dataset.v5Scene;
      for (const property of [
        '--v5-scene-one', '--v5-scene-two', '--v5-scene-three',
        '--v5-shift', '--v5-progress',
        '--v5-first-x','--v5-first-mask','--v5-second-x',
        '--v5-second-mask-left','--v5-second-mask-right',
        '--v5-third-x','--v5-third-mask',
        '--v5-photo2-opacity','--v5-photo2-clip','--v5-photo2-x',
        '--v5-photo3-opacity','--v5-photo3-clip','--v5-photo3-x',
      ]) root.style.removeProperty(property);
    };
  }, [reducedMotion]);

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
