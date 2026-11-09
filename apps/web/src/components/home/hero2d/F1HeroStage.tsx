import { useEffect, useRef } from 'react';
import { carPose, clamp, damp, heroScrollProgress, movementImpulse, normalizePointer } from './carMotion';

const CAR_URL = '/media/homepage/f1-hero/peds-aero01-car.webp';
const CAR_FALLBACK = '/media/homepage/f1-hero/peds-aero01-fallback.svg';

/**
 * Original AERO-01 F1 cinematic illustration, not a 3D model.
 * Hero owns the pointer; all layers stay decorative, so the V7 CTAs remain interactive.
 */
export function F1HeroStage() {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const hero = layer?.closest<HTMLElement>('#launch-control');
    if (!layer || !hero) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktopPointer = window.matchMedia('(min-width: 861px) and (hover: hover) and (pointer: fine)');
    const scene = layer.closest<HTMLElement>('.r1-cinema__scene');
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    const lite = Boolean(nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory <= 4));
    layer.dataset.fx = lite ? 'lite' : 'full';

    let raf = 0;
    let visible = true;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let impulse = 0;
    let scrollValue = 0;
    let targetScroll = 0;
    let lastTime = 0;
    let revTarget = 0;
    let rev = 0;
    let launch = 0;
    let revHeld = false;
    let autoReleaseTimer = 0;
    let introTimer = 0;
    let introCheckTimer = 0;
    let introPulseQueued = false;
    let lastPulse = 0;

    const clearRev = () => {
      revHeld = false;
      revTarget = rev = launch = 0;
      layer.style.setProperty('--f1-rev-x', '0px');
      layer.style.setProperty('--f1-rev-y', '0px');
      layer.style.setProperty('--f1-rev-scale', '1');
      layer.style.setProperty('--f1-rev-wake', '0');
    };

    const apply = (time: number) => {
      raf = 0;
      if (!visible || document.hidden || reduced.matches) return;
      const delta = lastTime ? (time - lastTime) / 1000 : 1 / 60;
      lastTime = time;

      x = damp(x, targetX, delta, 6.2);
      y = damp(y, targetY, delta, 6.2);
      impulse = damp(impulse, 0, delta, 2.7);
      scrollValue = damp(scrollValue, targetScroll, delta, 4.2);
      rev = damp(rev, revTarget, delta, revTarget ? 9 : 6);
      launch = damp(launch, 0, delta, 5.5);
      const pose = carPose(x, y);
      const energy = clamp(impulse * .76 + Math.hypot(x, y) * .13 + rev * .35 + launch * .55, 0, 1);
      const rumble = revHeld ? Math.sin(time * .055) * rev * 1.3 : 0;

      layer.style.setProperty('--f1-x', pose.translateX.toFixed(2) + 'px');
      layer.style.setProperty('--f1-y', pose.translateY.toFixed(2) + 'px');
      layer.style.setProperty('--f1-yaw', pose.yaw.toFixed(2) + 'deg');
      layer.style.setProperty('--f1-pitch', pose.pitch.toFixed(2) + 'deg');
      layer.style.setProperty('--f1-shine-x', pose.shineX.toFixed(1) + '%');
      layer.style.setProperty('--f1-shine-y', pose.shineY.toFixed(1) + '%');
      layer.style.setProperty('--f1-light-opacity', (.14 + energy * .47).toFixed(3));
      layer.style.setProperty('--f1-aero-energy', (.48 + energy * .52).toFixed(3));
      layer.style.setProperty('--f1-readout-energy', (.3 + energy * .7).toFixed(3));
      layer.style.setProperty('--f1-scroll-offset', (scrollValue * 38).toFixed(2) + 'px');
      layer.style.setProperty('--f1-scroll-scale', (1 - scrollValue * .055).toFixed(3));
      layer.style.setProperty('--f1-rev-x', (rev * 8 - launch * 38 + rumble).toFixed(2) + 'px');
      layer.style.setProperty('--f1-rev-y', (rev * 3 - launch * 2).toFixed(2) + 'px');
      layer.style.setProperty('--f1-rev-scale', (1 + launch * .025 - rev * .006).toFixed(4));
      layer.style.setProperty('--f1-rev-wake', clamp(rev * .48 + launch * .75, 0, 1).toFixed(3));

      if (
        Math.abs(x - targetX) > .002 ||
        Math.abs(y - targetY) > .002 ||
        Math.abs(scrollValue - targetScroll) > .002 ||
        impulse > .012 || revHeld || rev > .004 || launch > .004
      ) {
        raf = requestAnimationFrame(apply);
      } else {
        lastTime = 0;
      }
    };

    const schedule = () => {
      if (!raf && visible && !document.hidden && !reduced.matches) raf = requestAnimationFrame(apply);
    };

    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const next = normalizePointer(event.clientX, event.clientY, hero.getBoundingClientRect());
      impulse = Math.max(impulse, movementImpulse(Math.hypot(next.x - targetX, next.y - targetY)));
      targetX = next.x;
      targetY = next.y;
      schedule();
    };

    const reset = () => {
      targetX = 0;
      targetY = 0;
      revHeld = false;
      revTarget = 0;
      schedule();
    };

    const beginRev = (event: PointerEvent) => {
      if (event.button !== 0 || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
      if (!desktopPointer.matches || reduced.matches || lite || !visible || document.hidden) return;
      window.clearTimeout(autoReleaseTimer);
      revHeld = true;
      revTarget = 1;
      schedule();
    };

    const pulseRev = () => {
      if (!desktopPointer.matches || reduced.matches || lite || !visible || document.hidden || revHeld) return;
      if (Date.now() - lastPulse < 2400) return;
      lastPulse = Date.now();
      revHeld = true;
      revTarget = 1;
      schedule();
      autoReleaseTimer = window.setTimeout(endRev, 420);
    };

    const introComplete = () => {
      if (introPulseQueued) return;
      introPulseQueued = true;
      introTimer = window.setTimeout(pulseRev, 1050);
    };

    const endRev = () => {
      if (!revHeld) return;
      revHeld = false;
      revTarget = 0;
      launch = Math.max(launch, rev * .95);
      schedule();
    };

    const syncScroll = () => {
      targetScroll = heroScrollProgress(hero.getBoundingClientRect().top, hero.offsetHeight);
      schedule();
    };

    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
        lastTime = 0;
        clearRev();
      } else schedule();
    };

    const preference = () => {
      if (reduced.matches) {
        cancelAnimationFrame(raf);
        raf = 0;
        layer.removeAttribute('style');
        x = 0;
        y = 0;
        targetX = 0;
        targetY = 0;
        impulse = 0;
        scrollValue = 0;
        clearRev();
        lastTime = 0;
      } else {
        syncScroll();
      }
    };

    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (!visible) {
            cancelAnimationFrame(raf);
            raf = 0;
            lastTime = 0;
            clearRev();
          } else {
            syncScroll();
          }
        }, { threshold: .01 })
      : null;

    observer?.observe(hero);
    hero.addEventListener('pointermove', pointer, { passive: true });
    hero.addEventListener('pointerleave', reset);
    scene?.addEventListener('pointerdown', beginRev);
    scene?.addEventListener('pointerenter', pulseRev);
    window.addEventListener('pointerup', endRev);
    window.addEventListener('pointercancel', endRev);
    window.addEventListener('peds:intro-complete', introComplete);
    introCheckTimer = window.setTimeout(() => {
      if (document.documentElement.dataset.introActive !== 'true') introComplete();
    }, 1200);
    window.addEventListener('scroll', syncScroll, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    reduced.addEventListener('change', preference);
    syncScroll();

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      hero.removeEventListener('pointermove', pointer);
      hero.removeEventListener('pointerleave', reset);
      scene?.removeEventListener('pointerdown', beginRev);
      scene?.removeEventListener('pointerenter', pulseRev);
      window.removeEventListener('pointerup', endRev);
      window.removeEventListener('pointercancel', endRev);
      window.removeEventListener('peds:intro-complete', introComplete);
      window.clearTimeout(autoReleaseTimer);
      window.clearTimeout(introTimer);
      window.clearTimeout(introCheckTimer);
      window.removeEventListener('scroll', syncScroll);
      document.removeEventListener('visibilitychange', visibility);
      reduced.removeEventListener('change', preference);
    };
  }, []);

  return (
    <div ref={layerRef} className="f1hero" data-f1-visual="cinematic-2.5d" data-f1-effects="ignition-v83" data-f1-asset="webp" aria-hidden="true">
      <div className="f1hero__atmosphere" />
      <div className="f1hero__launch-streak" />
      <div className="f1hero__shock" />

      <svg className="f1hero__aero f1hero__aero--behind" viewBox="0 0 1200 560" preserveAspectRatio="none" fill="none" role="presentation">
        <defs>
          <linearGradient id="f1hero-cold" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#56B5E8" stopOpacity="0" />
            <stop offset=".30" stopColor="#83DBF8" stopOpacity=".16" />
            <stop offset=".70" stopColor="#86DFFF" stopOpacity=".75" />
            <stop offset="1" stopColor="#61BDFA" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="f1hero-warm" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#FF4A18" stopOpacity="0" />
            <stop offset=".55" stopColor="#FF895A" stopOpacity=".7" />
            <stop offset="1" stopColor="#FF4A18" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="f1hero__flow-group">
          <path className="f1hero__flow f1hero__flow--a" d="M-90 390 C125 332 274 308 422 294 S690 204 844 170 S1060 91 1290 85" stroke="url(#f1hero-cold)" strokeWidth="2.5" />
          <path className="f1hero__flow f1hero__flow--b" d="M-90 427 C173 343 336 340 486 311 S784 265 986 185 S1150 162 1310 159" stroke="url(#f1hero-cold)" strokeWidth="1.4" />
          <path className="f1hero__flow f1hero__flow--c" d="M-60 471 C171 425 338 425 501 411 S829 352 987 294 S1169 253 1320 270" stroke="url(#f1hero-cold)" strokeWidth=".9" />
          <path className="f1hero__flow f1hero__flow--d" d="M780 450 C896 440 1017 453 1122 425 S1270 385 1390 370" stroke="url(#f1hero-warm)" strokeWidth="1.8" />
        </g>
      </svg>

      <div className="f1hero__ground-shadow" />
      <div className="f1hero__rev-wake" />
      <div className="f1hero__vehicle">
        <div className="f1hero__floating">
          <img
            className="f1hero__car"
            src={CAR_URL}
            alt=""
            width="1983"
            height="793"
            decoding="async"
            {...{ fetchpriority: 'high' }}
            draggable={false}
            onError={(event) => {
              const image = event.currentTarget;
              if (!image.src.endsWith('peds-aero01-fallback.svg')) {
                image.src = CAR_FALLBACK;
                image.closest<HTMLElement>('.f1hero')?.style.setProperty('--f1-image-mask', `url("${CAR_FALLBACK}")`);
                const stage = image.closest<HTMLElement>('.f1hero');
                if (stage) stage.dataset.f1Asset = 'fallback';
              }
            }}
          />
          <div className="f1hero__paint-light" />
          <div className="f1hero__metal-sweep" />
        </div>
      </div>

      <svg className="f1hero__aero f1hero__aero--front" viewBox="0 0 1200 560" preserveAspectRatio="none" fill="none" role="presentation">
        <path className="f1hero__flow f1hero__flow--e" d="M-120 445 C131 403 245 429 358 454 S617 492 760 480 S973 444 1320 481" stroke="url(#f1hero-warm)" strokeWidth="2" />
        <path className="f1hero__flow f1hero__flow--f" d="M-100 489 C120 468 227 489 385 505 S740 513 893 504 S1169 473 1320 519" stroke="url(#f1hero-cold)" strokeWidth="1.2" />
      </svg>

      <div className="f1hero__hud f1hero__hud--inlet">
        <span className="f1hero__hud-index">01 / FLOW ENTRY</span>
        <span className="f1hero__hud-line" />
      </div>
      <div className="f1hero__hud f1hero__hud--wake">
        <span className="f1hero__hud-index">02 / AERO WAKE</span>
        <span className="f1hero__hud-line" />
      </div>
      <div className="f1hero__telemetry">
        <span>VECTOR FIELD</span>
        <span className="f1hero__telemetry-bars"><i /><i /><i /><i /><i /></span>
        <span className="f1hero__telemetry-state">ACTIVE</span>
      </div>
      <div className="f1hero__microcopy">
        <span>AERO-01 <i /> CINEMATIC STUDY</span>
        <span>MOVE POINTER / HOLD TO REV</span>
      </div>
    </div>
  );
}
