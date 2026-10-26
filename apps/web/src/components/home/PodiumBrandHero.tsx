import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useMobileHub } from '../../hooks/useMobileHub';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './podiumHeroR1.css';

export function PodiumBrandHero() {
  const lang = useNavigationStore((state) => state.lang);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mobile = useMobileHub();
  const reducedMotion = useReducedMotion();
  const motionRestricted = reducedMotion || (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const heroRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [introClear, setIntroClear] = useState(false);
  const lowEnd = typeof navigator !== 'undefined' &&
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
  const devCinematic = import.meta.env.DEV;
  const shouldPlayVideo = devCinematic && !mobile && !lowEnd && !motionRestricted && !videoError;
  const renderVideo = shouldPlayVideo && introClear;
  const showMotionReview = import.meta.env.DEV && searchParams.get('design-review') === 'motion';

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !renderVideo || videoEnded) return;
    if (!visible) {
      video.pause();
      return;
    }
    void video.play().catch(() => setVideoError(true));
  }, [renderVideo, videoEnded, visible]);

  useEffect(() => {
    if (!heroRef.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!document.querySelector('.podium-intro')) { setIntroClear(true); return; }
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.podium-intro')) {
        setIntroClear(true);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const scrollToContent = () => document.getElementById('r1-first-content')?.scrollIntoView({
    behavior: reducedMotion ? 'instant' : 'smooth',
  });

  return (
    <section ref={heroRef} className="r1-cinema" data-motion-ready={ready && renderVideo && !videoEnded} aria-labelledby="podium-hero-title">
      <div className="r1-cinema__grid" aria-hidden="true" />
      <div className="r1-cinema__inner page-container">
        <div className="r1-cinema__copy">
          <p className="r1-cinema__label">PODIUM / EFFET DE SOL</p>
          <h1 id="podium-hero-title" className="r1-cinema__title">
            {lang === 'vi' ? <>HIỂU<br />TỐC ĐỘ<span>.</span></> : <>ENGINEER<br />SPEED<span>.</span></>}
          </h1>
          <p className="r1-cinema__description">
            {lang === 'vi'
              ? 'Trải nghiệm đua xe độc lập, nơi mô hình 3D, dữ liệu mùa giải và góc nhìn kỹ thuật cùng kể câu chuyện về tốc độ.'
              : 'An independent motorsport experience where interactive 3D, season data and engineering insight tell the story of speed.'}
          </p>
          <div className="r1-cinema__actions">
            <button type="button" className="r1-cinema__primary" onClick={() => navigate('/showroom')}>
              {lang === 'vi' ? 'Vào Showroom 3D' : 'Enter Showroom 3D'} <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button type="button" className="r1-cinema__secondary" onClick={() => navigate('/engineering/car-anatomy')}>
              {lang === 'vi' ? 'Khám phá kỹ thuật' : 'Explore Engineering'} <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          {showMotionReview && <div className="r1-cinema__motion-note">
            {renderVideo && <span>{lang === 'vi' ? 'Phim 3 giây · chỉ phát một lần' : '3-second film · plays once'}</span>}
            {reducedMotion && <span>{lang === 'vi' ? 'Chuyển động đã tắt theo cài đặt thiết bị' : 'Motion is off for your device preference'}</span>}
          </div>}
        </div>
        <div className="r1-cinema__visual" role="img" aria-label={devCinematic ? 'Formula 1 2022 reference car by Luis Adrian V., CC BY 4.0' : 'EDS-G01 original concept car'}>
          <img
            src={devCinematic ? '/__peds-review/tokyo-drift-h3-2-poster.png' : '/images/eds/editorial/eds-g01-hero.svg'}
            alt=""
            aria-hidden="true"
            className={`r1-cinema__image ${renderVideo && ready && !videoEnded ? 'r1-cinema__image--hidden' : ''}`}
            fetchPriority="high"
          />
          {renderVideo && !videoEnded && (
            <video
              ref={videoRef}
              className={`r1-cinema__video ${ready ? 'r1-cinema__video--ready' : ''}`}
              src="/__peds-review/tokyo-drift-h3-2-2x.mp4"
              poster="/__peds-review/tokyo-drift-h3-2-poster.png"
              autoPlay
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              onPlaying={() => setReady(true)}
              onEnded={() => setVideoEnded(true)}
              onError={() => setVideoError(true)}
            />
          )}
          <p className="r1-cinema__model-label">
            {devCinematic ? (
              <span>3D source: Luis Adrian V. · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a></span>
            ) : <span>EDS-G01 · Original Podium EDS concept</span>}
          </p>
        </div>
      </div>
      <button type="button" className="r1-cinema__scroll" onClick={scrollToContent} aria-label={lang === 'vi' ? 'Cuộn đến nội dung chặng đua' : 'Scroll to race feature'}>
        <span aria-hidden="true" />
      </button>
    </section>
  );
}
