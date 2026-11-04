import { useEffect, useRef } from 'react';
import type { CSSProperties, PointerEventHandler } from 'react';
import { animate, createScope } from 'animejs';
import { ArrowDown, ArrowRight, Move3d } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './podiumHeroR1.css';

const HERO_PLATE = '/images/p4/template/rc-hero';

export function PodiumBrandHero() {
  const lang = useNavigationStore((state) => state.lang);
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const pointerFrame = useRef<number | null>(null);

  useEffect(() => {
    const root = heroRef.current;
    if (!root || reducedMotion) return;
    const scope = createScope({ root }).add(() => {
      animate(root.querySelectorAll('[data-launch-reveal]'), {
        opacity: [0, 1],
        translateY: [32, 0],
        duration: 850,
        ease: 'out(4)',
        delay: (_: unknown, index = 0) => index * 95,
      });
      const rail = root.querySelector('[data-launch-rail]');
      if (rail) animate(rail, { scaleX: [0, 1], duration: 1100, ease: 'out(5)' });
    });
    return () => scope.revert();
  }, [reducedMotion]);

  useEffect(() => () => {
    if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
  }, []);

  const moveScene: PointerEventHandler<HTMLElement> = (event) => {
    if (reducedMotion || event.pointerType === 'touch') return;
    const root = heroRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = requestAnimationFrame(() => {
      root.style.setProperty('--launch-x', `${(x * 18).toFixed(1)}px`);
      root.style.setProperty('--launch-y', `${(y * 13).toFixed(1)}px`);
      root.style.setProperty('--launch-light-x', `${((x + 0.5) * 100).toFixed(1)}%`);
      root.style.setProperty('--launch-light-y', `${((y + 0.5) * 100).toFixed(1)}%`);
    });
  };

  const resetScene = () => {
    if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = null;
    const root = heroRef.current;
    if (!root) return;
    root.style.removeProperty('--launch-x');
    root.style.removeProperty('--launch-y');
    root.style.removeProperty('--launch-light-x');
    root.style.removeProperty('--launch-light-y');
  };

  const goToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: reducedMotion ? 'instant' : 'smooth',
      block: 'start',
    });
  };

  return (
    <section
      ref={heroRef}
      id="launch-control"
      className="r1-cinema"
      data-lang={lang}
      data-motion-engine={reducedMotion ? 'reduced' : 'animejs'}
      aria-labelledby="podium-hero-title"
      onPointerMove={moveScene}
      onPointerLeave={resetScene}
    >
      <div className="r1-cinema__ambient" aria-hidden="true">
        <span className="r1-cinema__horizon" />
        <span className="r1-cinema__velocity" />
        <span className="r1-cinema__beacon" data-launch-rail />
      </div>

      <div className="r1-cinema__scene" aria-hidden="true">
        <picture className="r1-cinema__picture">
          <source media="(max-width: 700px)" type="image/avif" srcSet={`${HERO_PLATE}-896.avif`} />
          <source type="image/avif" srcSet={`${HERO_PLATE}-1344.avif 1344w, ${HERO_PLATE}-1792.avif 1792w`} sizes="100vw" />
          <source type="image/webp" srcSet={`${HERO_PLATE}-896.webp 896w, ${HERO_PLATE}-1344.webp 1344w, ${HERO_PLATE}-1792.webp 1792w`} sizes="100vw" />
          <img src={`${HERO_PLATE}-1344.webp`} alt="" fetchPriority="high" decoding="async" />
        </picture>
        <div className="r1-cinema__glass" />
        <svg className="r1-cinema__flow" viewBox="0 0 1000 500" fill="none" preserveAspectRatio="none">
          <path d="M-25 320 C235 85 330 365 590 212 S880 200 1040 10" />
          <path d="M-20 380 C240 145 388 420 650 252 S875 260 1030 90" />
          <path d="M-20 435 C280 245 390 468 680 340 S920 315 1050 145" />
        </svg>
        <span className="r1-cinema__target r1-cinema__target--left" />
        <span className="r1-cinema__target r1-cinema__target--right" />
        <span className="r1-cinema__radar" />
        <span className="r1-cinema__micro-label r1-cinema__micro-label--top">EDS / AERO FIELD</span>
        <span className="r1-cinema__micro-label r1-cinema__micro-label--bottom">DIGITAL RACING EXPERIENCE · 2026</span>
      </div>

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
              {lang === 'vi' ? 'Khám phá mùa giải' : 'Explore season'}
              <ArrowRight size={19} aria-hidden="true" />
            </button>
            <button type="button" className="r1-cinema__secondary" onClick={() => navigate('/showroom')}>
              <Move3d size={19} aria-hidden="true" />
              Showroom 3D
            </button>
          </div>
        </div>
        <div className="r1-cinema__launch" aria-hidden="true" data-launch-reveal>
          <span className="r1-cinema__launch-name">LAUNCH CONTROL</span>
          <div className="r1-cinema__lights">
            {Array.from({ length: 5 }, (_, index) => <span key={index} style={{ '--light-index': index } as CSSProperties} />)}
          </div>
          <span className="r1-cinema__launch-caption">FIVE LIGHTS / ONE START</span>
        </div>
      </div>

      <nav className="r1-cinema__chapters" aria-label={lang === 'vi' ? 'Đi tới khu vực trang chủ' : 'Jump to homepage section'}>
        {[
          ['01', 'launch-control'],
          ['02', 'race-control'],
          ['03', 'championship-overview'],
          ['04', 'eds-explore'],
        ].map(([number, id], index) => (
          <button
            key={id}
            type="button"
            className={index === 0 ? 'is-active' : undefined}
            onClick={() => goToSection(id)}
            aria-label={`${lang === 'vi' ? 'Khu vực' : 'Section'} ${number}`}
            aria-current={index === 0 ? 'step' : undefined}
          >{number}</button>
        ))}
      </nav>

      <button type="button" className="r1-cinema__scroll" onClick={() => goToSection('race-control')}>
        <span>{lang === 'vi' ? 'Cuộn khám phá' : 'Scroll to explore'}</span>
        <ArrowDown size={18} aria-hidden="true" />
      </button>
      <div className="r1-cinema__energy-rail" aria-hidden="true" />
    </section>
  );
}
