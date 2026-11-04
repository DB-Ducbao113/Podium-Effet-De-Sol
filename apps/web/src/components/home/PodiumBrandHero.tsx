import { useEffect, useRef, useState } from 'react';
import { animate, createScope } from 'animejs';
import { ArrowDown, ArrowRight, Move3d, Pause, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './podiumHeroR1.css';

export const HERO_VIDEO_SRC = '/media/homepage/hero-h3-2.mp4';
export const HERO_POSTER_SRC = '/media/homepage/hero-h3-2-poster.png';

type NetworkInformation = { saveData?: boolean };

export function PodiumBrandHero() {
  const lang = useNavigationStore((state) => state.lang);
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wasPlayingRef = useRef(false);
  const [visible, setVisible] = useState(true);
  const [introDone, setIntroDone] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const saveData = typeof navigator !== 'undefined'
    && ((navigator as Navigator & { connection?: NetworkInformation }).connection?.saveData ?? false);
  const lowEnd = typeof navigator !== 'undefined'
    && ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
  // The approved Homepage film is the production hero; the poster is the only fallback.
  const renderVideo = !reducedMotion && !saveData && !lowEnd && !videoFailed && !videoEnded;

  useEffect(() => {
    if (!document.querySelector('.podium-intro')) {
      setIntroDone(true);
      return;
    }
    const observer = new MutationObserver(() => {
      if (document.querySelector('.podium-intro')) return;
      observer.disconnect();
      setIntroDone(true);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = heroRef.current;
    if (!root || reducedMotion || !introDone) return;
    const scope = createScope({ root }).add(() => {
      animate(root.querySelectorAll('[data-r1-reveal]'), {
        opacity: [0.55, 1],
        translateY: [24, 0],
        filter: ['blur(9px)', 'blur(0px)'],
        duration: 620,
        ease: 'out(4)',
        delay: (_: unknown, index = 0) => index * 70,
      });
      const rail = root.querySelector('[data-r1-rail]');
      if (rail) {
        animate(rail, {
          scaleX: [0.12, 1],
          duration: 900,
          ease: 'out(5)',
        });
      }
    });
    return () => scope.revert();
  }, [reducedMotion, introDone]);

  useEffect(() => {
    const root = heroRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.08 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!renderVideo || !introDone) return;
    const video = videoRef.current;
    if (!video) return;
    if (!visible) {
      wasPlayingRef.current = !video.paused && !video.ended;
      video.pause();
      return;
    }
    if (!wasPlayingRef.current && video.currentTime > 0 && video.paused) return;
    wasPlayingRef.current = true;
    video.play().catch(() => {
      wasPlayingRef.current = false;
      setVideoFailed(true);
    });
  }, [renderVideo, introDone, visible]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      wasPlayingRef.current = true;
      video.play().catch(() => setVideoFailed(true));
      return;
    }
    wasPlayingRef.current = false;
    video.pause();
  };

  const scrollToContent = () => document.getElementById('r1-first-content')?.scrollIntoView({
    behavior: reducedMotion ? 'instant' : 'smooth',
  });

  return (
    <section
      ref={heroRef}
      className="r1-cinema"
      data-lang={lang}
      data-video-ready={videoReady && renderVideo}
      data-motion-engine={reducedMotion ? 'reduced' : 'animejs'}
      aria-labelledby="podium-hero-title"
    >
      <div className="r1-cinema__aero-field" aria-hidden="true"><span data-r1-rail /></div>
      <div className="r1-cinema__inner page-container">
        <div className="r1-cinema__copy">
          <p className="r1-cinema__eyebrow" data-r1-reveal>
            <span className="r1-cinema__eyebrow-index" aria-hidden="true">01</span>
            <span className="r1-cinema__eyebrow-line" aria-hidden="true" />
            {lang === 'vi' ? 'TRẢI NGHIỆM ĐUA XE TÁI ĐỊNH NGHĨA' : 'THE RACING EXPERIENCE REIMAGINED'}
          </p>
          <div className="r1-cinema__heading">
            <h1 id="podium-hero-title" className="r1-cinema__title" data-r1-reveal>
              <span>{lang === 'vi' ? 'ĐUA' : 'RACE'}</span>
              <span>{lang === 'vi' ? 'VƯỢT' : 'BEYOND'}</span>
              <span className="r1-cinema__title-accent">{lang === 'vi' ? 'GIỚI HẠN' : 'LIMITS'}<b>.</b></span>
            </h1>
            <p className="r1-cinema__description" data-r1-reveal>
              {lang === 'vi'
                ? 'Kỹ thuật 3D nguyên bản, dữ liệu mùa giải và câu chuyện sau từng phần mười giây — một cách trải nghiệm đua xe mới.'
                : 'Original 3D engineering, season data and the stories behind every tenth — a new way to experience racing.'}
            </p>
          </div>
          <div className="r1-cinema__actions" data-r1-reveal>
            <button type="button" className="r1-cinema__primary" onClick={() => navigate('/season/2026?tab=results')}>
              {lang === 'vi' ? 'Khám phá mùa giải' : 'Explore the season'} <ArrowRight size={17} aria-hidden="true" />
            </button>
            <button type="button" className="r1-cinema__secondary" onClick={() => navigate('/showroom')}>
              {lang === 'vi' ? 'Mở Showroom 3D' : 'Open Showroom'} <Move3d size={17} aria-hidden="true" />
            </button>
          </div>
          <ul className="r1-cinema__meta" aria-hidden="true" data-r1-reveal>
            {(lang === 'vi'
              ? ['TỐC ĐỘ', 'KỸ THUẬT', 'TAY ĐUA', 'ĐƯỜNG ĐUA', 'ĐAM MÊ']
              : ['SPEED', 'TECHNOLOGY', 'DRIVERS', 'CIRCUITS', 'PASSION']).map((label, index) => (
                <li key={label}><span>{String(index + 1).padStart(2, '0')}</span>{label}</li>
              ))}
          </ul>
        </div>

        <div className="r1-cinema__visual" data-r1-reveal>
          <img
            src={HERO_POSTER_SRC}
            alt=""
            aria-hidden="true"
            className="r1-cinema__fallback r1-cinema__fallback--cinematic"
            loading="eager"
            decoding="async"
          />
          {renderVideo && (
            <video
              ref={videoRef}
              className="r1-cinema__video"
              src={HERO_VIDEO_SRC}
              poster={HERO_POSTER_SRC}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              onPlaying={() => { setVideoReady(true); setVideoPlaying(true); }}
              onPause={() => setVideoPlaying(false)}
              onEnded={() => { setVideoReady(false); setVideoPlaying(false); setVideoEnded(true); }}
              onError={() => { setVideoReady(false); setVideoPlaying(false); setVideoFailed(true); }}
            />
          )}
          {renderVideo && videoReady && (
            <button
              type="button"
              className="r1-cinema__media-toggle"
              onClick={togglePlayback}
              aria-label={videoPlaying
                ? (lang === 'vi' ? 'Tạm dừng phim' : 'Pause the film')
                : (lang === 'vi' ? 'Phát phim' : 'Play the film')}
            >
              {videoPlaying ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
              <span>{videoPlaying ? (lang === 'vi' ? 'Tạm dừng' : 'Pause') : (lang === 'vi' ? 'Phát' : 'Play')}</span>
            </button>
          )}
          <div className="r1-cinema__hud" aria-hidden="true">
            <span>EDS / FILM</span>
            <span>TOKYO DRIFT</span>
            <i />
          </div>
          <div className="r1-cinema__lifestyle" aria-hidden="true">
            <span>{lang === 'vi' ? 'KHÔNG CHỈ LÀ ĐUA XE' : 'MORE THAN RACING'}</span>
            <strong>{lang === 'vi' ? 'ĐÓ LÀ PHONG CÁCH SỐNG' : "IT'S A LIFESTYLE"}</strong>
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
