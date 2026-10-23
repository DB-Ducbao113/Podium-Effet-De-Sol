import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Home, Trophy, Box } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import { SeasonYear } from '../../types';

const HomeView = lazy(() => import('../home/HomeView').then((m) => ({ default: m.HomeView })));
const ChampionshipView = lazy(() =>
  import('../championship/ChampionshipView').then((m) => ({ default: m.ChampionshipView })),
);
const ShowroomView = lazy(() =>
  import('../showroom/ShowroomView').then((m) => ({ default: m.ShowroomView })),
);

type SectionId = 'home' | 'giai-dau' | 'showroom';
const ids: SectionId[] = ['home', 'giai-dau', 'showroom'];

function VisibleShowroom() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      setLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '500px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={sectionRef} className="min-h-[75svh]">
      {load ? (
        <Suspense fallback={<div className="min-h-[75svh] bg-[#09090e]" />}>
          <ShowroomView />
        </Suspense>
      ) : (
        <div className="relative min-h-[75svh] overflow-hidden bg-[#09090e]">
          <img
            src="/images/eds/editorial/eds-g01-hero.svg"
            alt="EDS-G01 original concept car"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
          <span className="relative m-6 inline-block rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-xs font-bold text-white">
            EDS-G01 Showroom
          </span>
        </div>
      )}
    </div>
  );
}

export function MobileAllInOne({ season }: { season: SeasonYear }) {
  const location = useLocation();
  const navigate = useNavigate();
  const lang = useNavigationStore((state) => state.lang);
  const defaultSection: SectionId =
    location.pathname === '/showroom'
      ? 'showroom'
      : location.pathname.startsWith('/season/')
        ? 'giai-dau'
        : 'home';
  const [active, setActive] = useState<SectionId>(defaultSection);

  useEffect(() => {
    const section = ids.find((id) => location.hash === `#${id}`) ?? defaultSection;
    setActive(section);
    let retry: number | undefined;
    let observer: ResizeObserver | undefined;
    let frame: number | undefined;
    const scroll = () => {
      const target = document.getElementById(section);
      if (target) {
        const top = window.scrollY + target.getBoundingClientRect().top - 64;
        window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
      }
    };
    // Jump directly between long sections; smooth scrolling can leave the old section visible.
    frame = requestAnimationFrame(scroll);
    if (section !== 'home') {
      observer = new ResizeObserver(() => {
        if (frame !== undefined) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(scroll);
      });
      ids.slice(0, ids.indexOf(section)).forEach((id) => {
        const element = document.getElementById(id);
        if (element) observer?.observe(element);
      });
      retry = window.setTimeout(() => observer?.disconnect(), 5000);
    }
    const stopFollowing = () => observer?.disconnect();
    window.addEventListener('wheel', stopFollowing, { passive: true });
    window.addEventListener('touchstart', stopFollowing, { passive: true });
    window.addEventListener('keydown', stopFollowing);
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      window.clearTimeout(retry);
      observer?.disconnect();
      window.removeEventListener('wheel', stopFollowing);
      window.removeEventListener('touchstart', stopFollowing);
      window.removeEventListener('keydown', stopFollowing);
    };
  }, [location.hash, location.pathname, defaultSection]);

  useEffect(() => {
    let frame: number | undefined;
    const updateActive = () => {
      frame = undefined;
      let current: SectionId = 'home';
      ids.forEach((id) => {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= 88) current = id;
      });
      setActive((previous) => (previous === current ? previous : current));
    };
    const schedule = () => {
      if (frame === undefined) frame = requestAnimationFrame(updateActive);
    };
    const observer = new ResizeObserver(schedule);
    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, []);

  const goTo = (section: SectionId) => {
    const params = new URLSearchParams(location.search);
    if (section !== 'showroom') params.delete('hotspot');
    const search = params.size ? `?${params.toString()}` : '';
    navigate(`${location.pathname}${search}#${section}`);
    setActive(section);
  };

  const items = [
    { id: 'home' as const, label: lang === 'vi' ? 'Trang chủ' : 'Home', icon: Home },
    { id: 'giai-dau' as const, label: lang === 'vi' ? 'Giải đấu' : 'Championship', icon: Trophy },
    { id: 'showroom' as const, label: 'Showroom', icon: Box },
  ];

  return (
    <div
      className="r1-mobile-hub bg-[#09090b] pb-[calc(76px+env(safe-area-inset-bottom))]"
      data-mobile-hub
    >
      <section id="home" className="scroll-mt-16" aria-label={lang === 'vi' ? 'Trang chủ' : 'Home'}>
        <Suspense fallback={<div className="min-h-screen" />}>
          <HomeView />
        </Suspense>
      </section>
      <section
        id="giai-dau"
        className="scroll-mt-16"
        aria-label={lang === 'vi' ? 'Giải đấu' : 'Championship'}
      >
        <Suspense fallback={<div className="min-h-screen" />}>
          <ChampionshipView
            season={season}
            onSeasonChange={(next) => navigate(`/season/${next}#giai-dau`)}
          />
        </Suspense>
      </section>
      <section id="showroom" className="scroll-mt-16" aria-label="EDS-G01 Showroom">
        <VisibleShowroom />
      </section>
      <nav
        aria-label={lang === 'vi' ? 'Điều hướng mục' : 'Section navigation'}
        className="fixed inset-x-0 bottom-0 z-[60] grid grid-cols-3 border-t border-white/15 bg-[#0b0b0f]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_36px_rgba(0,0,0,.45)] backdrop-blur-xl"
      >
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => goTo(id)}
            aria-current={active === id ? 'location' : undefined}
            className={`flex min-h-[64px] flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-f1red ${active === id ? 'text-f1red' : 'text-white/65'}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
