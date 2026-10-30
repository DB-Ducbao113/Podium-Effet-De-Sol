import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { animate, createScope } from 'animejs';
import { ArrowDown, ArrowRight, Move3d } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useMobileHub } from '../../hooks/useMobileHub';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './podiumHeroR1.css';

const EDSHomeHeroScene = lazy(() =>
  import('./EDSHomeHeroScene').then((module) => ({ default: module.EDSHomeHeroScene })),
);

export function PodiumBrandHero() {
  const lang = useNavigationStore((state) => state.lang);
  const navigate = useNavigate();
  const mobile = useMobileHub();
  const reducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const devCinematic = import.meta.env.DEV;
  const lowEnd = typeof navigator !== 'undefined'
    && ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
  const renderScene = !devCinematic && !mobile && !lowEnd;
  const renderVideo = devCinematic && !mobile && !lowEnd && !reducedMotion && !videoFailed && !videoEnded;
  const onSceneReady = useCallback(() => setSceneReady(true), []);

  useEffect(() => {
    const root = heroRef.current;
    if (!root || reducedMotion) return;
    const scope = createScope({ root }).add(() => {
      animate(root.querySelectorAll('[data-r1-reveal]'), {
        opacity: [0.72, 1],
        translateY: [18, 0],
        filter: ['blur(7px)', 'blur(0px)'],
        duration: 760,
        ease: 'out(4)',
        delay: (_: unknown, index = 0) => index * 85,
      });
      const rail = root.querySelector('[data-r1-rail]');
      if (rail) {
        animate(rail, {
          scaleX: [0.12, 1],
          duration: 1100,
          ease: 'out(5)',
        });
      }
    });
    return () => scope.revert();
  }, [reducedMotion]);

  useEffect(() => {
    const root = heroRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.08 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!renderVideo) return;
    const video = videoRef.current;
    if (!video) return;
    const observer = new MutationObserver(() => {
      if (document.querySelector('.podium-intro')) return;
      observer.disconnect();
      video.play().catch(() => setVideoFailed(true));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    if (!document.querySelector('.podium-intro')) {
      observer.disconnect();
      video.play().catch(() => setVideoFailed(true));
    }
    return () => observer.disconnect();
  }, [renderVideo]);

  const scrollToContent = () => document.getElementById('r1-first-content')?.scrollIntoView({
    behavior: reducedMotion ? 'instant' : 'smooth',
  });

  return (
    <section
      ref={heroRef}
      className="r1-cinema"
      data-lang={lang}
      data-scene-ready={sceneReady}
      data-video-ready={videoReady && renderVideo}
      data-motion-engine={reducedMotion ? 'reduced' : 'animejs'}
      aria-labelledby="podium-hero-title"
    >
      <div className="r1-cinema__aero-field" aria-hidden="true"><span data-r1-rail /></div>
      <div className="r1-cinema__inner page-container">
        <div className="r1-cinema__copy">
          <h1 id="podium-hero-title" className="r1-cinema__title" data-r1-reveal>
            <span>{lang === 'vi' ? 'KỸ THUẬT' : 'ENGINEER'}</span>
            <span>{lang === 'vi' ? 'TỐC ĐỘ' : 'SPEED'}<b>.</b></span>
          </h1>
          <p className="r1-cinema__description" data-r1-reveal>
            {lang === 'vi'
              ? 'Một trải nghiệm motorsport độc lập, nơi concept 3D tương tác, dữ liệu mùa giải và tư duy khí động học cùng kể câu chuyện về tốc độ.'
              : 'An independent motorsport experience where an interactive original concept, live season intelligence and aero engineering tell the story of speed.'}
          </p>
          <div className="r1-cinema__actions" data-r1-reveal>
            <button type="button" className="r1-cinema__primary" onClick={() => navigate('/showroom')}>
              {lang === 'vi' ? 'Vào Showroom 3D' : 'Enter Showroom 3D'} <ArrowRight size={17} aria-hidden="true" />
            </button>
            <button type="button" className="r1-cinema__secondary" onClick={() => navigate(import.meta.env.DEV ? '/engineering' : '/engineering/car-anatomy')}>
              {lang === 'vi' ? 'Khám phá kỹ thuật' : 'Explore Engineering'} <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="r1-cinema__visual" data-r1-reveal>
          <img
            src={devCinematic ? '/__peds-review/tokyo-drift-h3-2-poster.png' : '/images/eds/editorial/eds-g01-hero.svg'}
            alt=""
            aria-hidden="true"
            className={devCinematic ? 'r1-cinema__fallback r1-cinema__fallback--cinematic' : 'r1-cinema__fallback'}
            loading="eager"
            decoding="async"
          />
          {renderVideo && (
            <video
              ref={videoRef}
              className="r1-cinema__video"
              src="/__peds-review/tokyo-drift-h3-2-2x.mp4"
              poster="/__peds-review/tokyo-drift-h3-2-poster.png"
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              onPlaying={() => setVideoReady(true)}
              onEnded={() => { setVideoReady(false); setVideoEnded(true); }}
              onError={() => { setVideoReady(false); setVideoFailed(true); }}
            />
          )}
          {renderScene && (
            <div className="r1-cinema__scene" aria-label={lang === 'vi' ? 'Mẫu xe EDS-G01 3D tương tác' : 'Interactive EDS-G01 3D concept'}>
              <ErrorBoundary fallback={null}>
                <Suspense fallback={null}>
                  <EDSHomeHeroScene
                    livery="eds-crimson"
                    onReady={onSceneReady}
                    active={visible}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
          )}
          <div className="r1-cinema__model-label">
            <strong>
              {devCinematic
                ? 'H3.2 / TOKYO DRIFT'
                : 'EDS-G01 / ORIGINAL CONCEPT'}
            </strong>
            <span><Move3d size={14} aria-hidden="true" /> {devCinematic ? (lang === 'vi' ? 'Phim ngắn Tokyo Drift' : 'Tokyo Drift cinematic') : renderScene ? (lang === 'vi' ? 'Kéo hoặc dùng phím mũi tên' : 'Drag or use arrow keys') : (lang === 'vi' ? 'Chế độ tĩnh thích ứng' : 'Adaptive static mode')}</span>
          </div>
        </div>
      </div>

      <div className="r1-cinema__telemetry" data-r1-reveal>
        <div className="page-container">
          <span><b>01</b> ORIGINAL 3D</span>
          <span><b>02</b> RACE INTELLIGENCE</span>
          <span><b>03</b> AERO ENGINEERING</span>
          <button type="button" onClick={scrollToContent}>
            {lang === 'vi' ? 'Tiếp tục' : 'Continue'} <ArrowDown size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
