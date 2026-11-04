import { useEffect, useRef } from 'react';
import './homeCinematicBackground.css';

/**
 * ONE decorative environment across the entire Homepage, not a Showroom scene.
 * CSS perspective + scalable SVG racing trajectories; no video, image or WebGL.
 * Scroll offset is clamped and updated at most once per animation frame.
 */
export function HomeCinematicBackground() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const background = ref.current;
    const home = background?.parentElement;
    if (!background || !home) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = Math.max(0, -home.getBoundingClientRect().top);
      home.style.setProperty('--home-depth-shift', `${Math.min(175, distance * .065).toFixed(1)}px`);
      home.style.setProperty('--home-stage-progress', `${Math.min(1, distance / 1800).toFixed(3)}`);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const onVisibility = () => {
      home.style.setProperty('--home-motion-state', document.hidden ? 'paused' : 'running');
    };
    update();
    onVisibility();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      home.style.removeProperty('--home-depth-shift');
      home.style.removeProperty('--home-stage-progress');
      home.style.removeProperty('--home-motion-state');
    };
  }, []);

  return (
    <div ref={ref} className="home-cinematic" aria-hidden="true" data-home-environment="full-page">
      <div className="home-cinematic__atmosphere" />
      <div className="home-cinematic__architecture">
        <span /><span /><span /><span /><span /><span />
      </div>
      <div className="home-cinematic__road">
        <span className="home-cinematic__road-edge home-cinematic__road-edge--left" />
        <span className="home-cinematic__road-edge home-cinematic__road-edge--right" />
        <span className="home-cinematic__road-center" />
      </div>
      <svg className="home-cinematic__racing-line" viewBox="0 0 1200 2600" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id="home-track-ignition" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#FF4A18" stopOpacity="0" />
            <stop offset=".26" stopColor="#FF4A18" stopOpacity=".82" />
            <stop offset=".7" stopColor="#FFB16E" stopOpacity=".54" />
            <stop offset="1" stopColor="#FF4A18" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="home-cinematic__track-shadow" d="M1310 -80 C1040 250 490 140 720 570 S1300 930 720 1240 S80 1530 520 1940 S1100 2130 870 2710" />
        <path className="home-cinematic__track-rail" d="M1310 -80 C1040 250 490 140 720 570 S1300 930 720 1240 S80 1530 520 1940 S1100 2130 870 2710" />
        <path className="home-cinematic__track-energy" d="M1310 -80 C1040 250 490 140 720 570 S1300 930 720 1240 S80 1530 520 1940 S1100 2130 870 2710" />
        <path className="home-cinematic__track-secondary" d="M1220 -130 C930 190 570 220 812 552 S1190 890 649 1160 S130 1600 630 1950 S1160 2210 940 2650" />
      </svg>
      <div className="home-cinematic__sector home-cinematic__sector--race" />
      <div className="home-cinematic__sector home-cinematic__sector--fight" />
      <div className="home-cinematic__sector home-cinematic__sector--explore" />
      <div className="home-cinematic__speed-beams"><span /><span /><span /><span /></div>
      <div className="home-cinematic__vignette" />
    </div>
  );
}
