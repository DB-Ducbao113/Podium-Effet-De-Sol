import { useEffect, useRef } from 'react';
import { carPose, damp, normalizePointer } from './carMotion';

const CAR_URL = '/media/homepage/f1-hero/peds-aero01-car.webp';
const CAR_FALLBACK = '/media/homepage/f1-hero/peds-aero01-fallback.svg';

/** No model or WebGL; Hero already captures mouse input and buttons remain clickable. */
export function F1HeroStage() {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const hero = layer?.closest<HTMLElement>('#launch-control');
    if (!layer || !hero) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let visible = true;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let lastTime = 0;

    const apply = (time: number) => {
      raf = 0;
      if (!visible || document.hidden || reduced.matches) return;
      const delta = lastTime ? (time - lastTime) / 1000 : 1 / 60;
      lastTime = time;
      x = damp(x, targetX, delta);
      y = damp(y, targetY, delta);
      const pose = carPose(x, y);
      layer.style.setProperty('--f1-x', pose.translateX.toFixed(2) + 'px');
      layer.style.setProperty('--f1-y', pose.translateY.toFixed(2) + 'px');
      layer.style.setProperty('--f1-yaw', pose.yaw.toFixed(2) + 'deg');
      layer.style.setProperty('--f1-pitch', pose.pitch.toFixed(2) + 'deg');
      layer.style.setProperty('--f1-shine-x', pose.shineX.toFixed(2) + '%');
      layer.style.setProperty('--f1-shine-y', pose.shineY.toFixed(2) + '%');
      const energy = Math.min(1, Math.hypot(x, y) * .65);
      layer.style.setProperty('--f1-reflection-opacity', (0.22 + energy * .12).toFixed(3));
      layer.style.setProperty('--f1-air-back-opacity', (0.35 + energy * .23).toFixed(3));
      layer.style.setProperty('--f1-air-front-opacity', (0.20 + energy * .30).toFixed(3));
      if (Math.abs(x - targetX) > .003 || Math.abs(y - targetY) > .003) raf = requestAnimationFrame(apply);
      else lastTime = 0;
    };
    const schedule = () => {
      if (!raf && visible && !document.hidden && !reduced.matches) raf = requestAnimationFrame(apply);
    };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const rect = hero.getBoundingClientRect();
      const next = normalizePointer(event.clientX, event.clientY, rect);
      targetX = next.x;
      targetY = next.y;
      schedule();
    };
    const reset = () => { targetX = 0; targetY = 0; schedule(); };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; lastTime = 0; }
      else schedule();
    };
    const preference = () => {
      if (reduced.matches) {
        cancelAnimationFrame(raf);
        raf = 0;
        layer.removeAttribute('style');
        x = 0; y = 0; targetX = 0; targetY = 0;
      } else schedule();
    };
    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (!visible) { cancelAnimationFrame(raf); raf = 0; lastTime = 0; }
          else schedule();
        }, { threshold: .01 })
      : null;
    observer?.observe(hero);
    hero.addEventListener('pointermove', pointer, { passive: true });
    hero.addEventListener('pointerleave', reset);
    document.addEventListener('visibilitychange', visibility);
    reduced.addEventListener('change', preference);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      hero.removeEventListener('pointermove', pointer);
      hero.removeEventListener('pointerleave', reset);
      document.removeEventListener('visibilitychange', visibility);
      reduced.removeEventListener('change', preference);
    };
  }, []);

  return (
    <div ref={layerRef} className="f1hero" data-f1-visual="cinematic-2.5d" aria-hidden="true">
      <div className="f1hero__halo" />
      <svg className="f1hero__airflow f1hero__airflow--behind" viewBox="0 0 1200 560" preserveAspectRatio="none" fill="none" role="presentation">
        <defs><linearGradient id="f1hero-air-cold" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#4DA4D3" stopOpacity="0" />
          <stop offset=".42" stopColor="#70CBEF" stopOpacity=".45" />
          <stop offset="1" stopColor="#47BBED" stopOpacity="0" />
        </linearGradient></defs>
        <path d="M-70 401 C280 228 440 245 679 312 S1015 191 1290 98" stroke="url(#f1hero-air-cold)" strokeWidth="2" />
        <path d="M-40 463 C305 346 474 369 724 360 S1017 260 1270 192" stroke="url(#f1hero-air-cold)" strokeWidth="1" />
      </svg>
      <div className="f1hero__contact" />
      <div className="f1hero__vehicle">
        <img className="f1hero__car" src={CAR_URL} alt="" width="1310" height="542" decoding="async" fetchPriority="high" draggable={false}
          onError={(event) => {
            const img = event.currentTarget;
            if (!img.src.endsWith('peds-aero01-fallback.svg')) img.src = CAR_FALLBACK;
          }}
        />
        <div className="f1hero__reflection" />
      </div>
      <svg className="f1hero__airflow f1hero__airflow--front" viewBox="0 0 1200 560" preserveAspectRatio="none" fill="none" role="presentation">
        <defs><linearGradient id="f1hero-air-hot" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#FF4A18" stopOpacity="0" />
          <stop offset=".5" stopColor="#FD7447" stopOpacity=".54" />
          <stop offset="1" stopColor="#FF4A18" stopOpacity="0" />
        </linearGradient></defs>
        <path d="M-80 476 C284 428 520 461 712 465 S1015 483 1290 374" stroke="url(#f1hero-air-hot)" strokeWidth="2.2" />
        <path d="M-30 489 C297 471 487 484 702 484 S978 522 1260 442" stroke="url(#f1hero-air-hot)" strokeWidth=".9" />
      </svg>
      <div className="f1hero__microcopy">
        <span>AERO-01 <i /> CONCEPT STUDY</span>
        <span>MOVE POINTER TO EXPLORE</span>
      </div>
    </div>
  );
}
