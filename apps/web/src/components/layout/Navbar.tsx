import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Box, ChevronDown, Home, Menu, Trophy, X, Info } from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { t } from '../../i18n/translations';
import { OfficialBrandLogo } from '../common/OfficialBrandLogo';
import { isPrimaryPath, useMobileHub } from '../../hooks/useMobileHub';
import './navbarH1.css';

type Control = 'cameras' | 'livery' | 'hotspots';
type SubItem = { label: string; to: string; control?: Control };
type NavItem = { id: string; label: string; to: string; icon: typeof Home; children?: SubItem[] };

export const Navbar = memo(function Navbar() {
  const { lang, setLang } = useNavigationStore();
  const location = useLocation();
  const mobileHub = useMobileHub();
  const onHub = mobileHub && isPrimaryPath(location.pathname);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dismissedDropdown, setDismissedDropdown] = useState<string | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);
  const strings = t[lang].nav;

  const items = useMemo<NavItem[]>(() => [
    { id: 'home', to: '/', label: strings.home, icon: Home },
    { id: 'championship', to: '/season/2026', label: strings.championship, icon: Trophy, children: [
      { label: lang === 'vi' ? 'Tay đua' : 'Driver standings', to: '/season/2026?tab=standings&category=drivers' },
      { label: lang === 'vi' ? 'Đội đua' : 'Constructor standings', to: '/season/2026?tab=standings&category=constructors' },
      { label: lang === 'vi' ? 'Lịch đua' : 'Calendar', to: '/season/2026?tab=calendar' },
      { label: lang === 'vi' ? 'Kết quả' : 'Results', to: '/season/2026?tab=results' },
      { label: lang === 'vi' ? 'Đội đua' : 'Teams', to: '/season/2026?tab=teams' },
      { label: lang === 'vi' ? 'Tay đua' : 'Drivers', to: '/season/2026?tab=drivers' },
    ] },
    { id: 'showroom', to: '/showroom', label: 'Showroom 3D', icon: Box, children: [
      { label: lang === 'vi' ? 'Tổng quan' : 'Overview', to: '/showroom' },
      { label: lang === 'vi' ? 'Góc camera' : 'Cameras', to: '/showroom', control: 'cameras' },
      { label: lang === 'vi' ? 'Màu xe' : 'Livery', to: '/showroom', control: 'livery' },
      { label: lang === 'vi' ? 'Bộ phận' : 'Hotspots', to: '/showroom', control: 'hotspots' },
    ] },
    { id: 'engineering', to: '/engineering/car-anatomy', label: lang === 'vi' ? 'Giải phẫu xe' : 'Engineering', icon: BookOpen, children: [
      { label: lang === 'vi' ? 'Giải phẫu xe' : 'Car anatomy', to: '/engineering/car-anatomy' },
      { label: lang === 'vi' ? 'Cánh trước' : 'Front wing', to: '/engineering/car-anatomy?chapter=front-wing' },
      { label: lang === 'vi' ? 'Sàn xe' : 'Floor', to: '/engineering/car-anatomy?chapter=floor' },
      { label: lang === 'vi' ? 'Bộ khuếch tán' : 'Diffuser', to: '/engineering/car-anatomy?chapter=diffuser' },
      { label: lang === 'vi' ? 'Cánh sau' : 'Rear wing', to: '/engineering/car-anatomy?chapter=rear-wing' },
    ] },
    { id: 'about', to: '/about', label: lang === 'vi' ? 'Giới thiệu' : 'About', icon: Info, children: [
      { label: lang === 'vi' ? 'Dự án' : 'Project', to: '/about' },
      { label: lang === 'vi' ? 'Ghi công' : 'Credits', to: '/about#peds-credits' },
    ] },
  ], [lang, strings]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuToggleRef.current?.focus(); }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [menuOpen]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const focused = document.activeElement?.closest<HTMLElement>('.h1-nav__group');
      const hovered = document.querySelector<HTMLElement>('.h1-nav__group:hover');
      const group = focused ?? hovered;
      if (!group) return;
      setDismissedDropdown(group.dataset.navId ?? null);
      group.querySelector<HTMLElement>('a')?.focus();
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

  useEffect(() => {
    if (location.hash !== '#peds-credits') return;
    const timer = window.setTimeout(() => document.getElementById('peds-credits')?.scrollIntoView({ block: 'start', behavior: 'instant' }), 500);
    return () => window.clearTimeout(timer);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    const control = (location.state as { showroomControl?: Control } | null)?.showroomControl;
    if (!control || location.pathname !== '/showroom') return;
    const labels = {
      cameras: ['Góc camera', 'Camera views'],
      livery: ['Màu thân xe', 'Body finish'],
      hotspots: ['Bộ phận xe', 'Car components'],
    }[control];
    let attempts = 0;
    const timer = window.setInterval(() => {
      const group = [...document.querySelectorAll<HTMLElement>('[role="group"]')]
        .find((element) => labels.includes(element.getAttribute('aria-label') || '')) ||
        (mobileHub ? document.querySelector<HTMLElement>({ cameras: '.r1-quick-hud', livery: '[data-eds-livery]', hotspots: '[data-eds-hotspot]' }[control]) : null);
      if (group) {
        group.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        (group.matches('button') ? group : group.querySelector<HTMLElement>('button'))?.focus({ preventScroll: true });
        window.clearInterval(timer);
      } else if (++attempts >= 40) window.clearInterval(timer);
    }, 100);
    return () => window.clearInterval(timer);
  }, [location.key, location.pathname, location.state, mobileHub]);

  const active = (id: string) => id === 'home' ? location.pathname === '/' :
    id === 'championship' ? location.pathname.startsWith('/season') :
    id === 'showroom' ? location.pathname.startsWith('/showroom') || location.pathname.startsWith('/gallery') :
    id === 'engineering' ? location.pathname.startsWith('/engineering') : location.pathname === '/about';
  const closeMenu = () => { setMenuOpen(false); setExpanded(null); };
  const hubParams = new URLSearchParams(location.search);
  hubParams.delete('hotspot');
  const hubSearch = hubParams.size ? `?${hubParams.toString()}` : '';

  return <>
    <header className={`h1-nav fixed inset-x-0 top-0 z-50 border-b border-white/10 ${scrolled ? 'h1-nav--scrolled' : ''}`}>
      <div className="page-container flex h-16 items-center justify-between gap-3">
        <Link to={onHub ? `${location.pathname}${hubSearch}#home` : '/'} className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-f1red" aria-label="Podium Effet de Sol">
          <OfficialBrandLogo size="md" variant="full" className="hidden sm:block" />
          <OfficialBrandLogo size="md" variant="compact" className="sm:hidden" />
        </Link>
        <nav className="h1-nav__desktop" aria-label={lang === 'vi' ? 'Điều hướng chính' : 'Main navigation'}>
          {items.map((item) => <div className="h1-nav__group" key={item.id} data-nav-id={item.id} data-dismissed={dismissedDropdown === item.id} onPointerLeave={() => setDismissedDropdown(null)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDismissedDropdown(null); }} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); setDismissedDropdown(item.id); (event.currentTarget.querySelector('a') as HTMLElement | null)?.focus(); } }}>
            <Link to={item.to} className={`h1-nav__link ${active(item.id) ? 'h1-nav__link--active' : ''}`} aria-current={active(item.id) ? 'page' : undefined}>
              <item.icon size={15} aria-hidden="true" /><span>{item.label}</span>{item.children && <ChevronDown size={13} aria-hidden="true" />}
            </Link>
            {item.children && <div className="h1-nav__dropdown"><div className="h1-nav__dropdown-inner">
              {item.children.map((child) => <Link key={child.label} to={child.to} state={child.control ? { showroomControl: child.control } : undefined} className="h1-nav__sub" onClick={() => {}}>{child.label}</Link>)}
            </div></div>}
          </div>)}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5">
            {(['vi', 'en'] as const).map((code) => <button key={code} type="button" onClick={() => setLang(code)} aria-label={code === 'vi' ? 'Tiếng Việt' : 'English'} aria-pressed={lang === code} className={`flex min-h-11 min-w-11 items-center justify-center rounded-full text-[10px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${lang === code ? 'bg-f1red text-white' : 'text-studio-300 hover:text-white'}`}>{code.toUpperCase()}</button>)}
          </div>
          <button ref={menuToggleRef} type="button" onClick={() => setMenuOpen(!menuOpen)} className="h1-nav__toggle flex min-h-11 min-w-11 items-center justify-center rounded text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-f1red" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="mobile-nav-menu">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
    </header>
    {menuOpen && <div className="h1-nav__scrim" onClick={closeMenu}><nav id="mobile-nav-menu" className="h1-nav__mobile" aria-label={lang === 'vi' ? 'Điều hướng di động' : 'Mobile navigation'} onClick={(event) => event.stopPropagation()}>
      {items.map((item) => <div key={item.id} className="h1-nav__mobile-group">
        <div className="flex items-center">
          <Link to={item.to} onClick={closeMenu} className="h1-nav__mobile-link"><item.icon size={17} aria-hidden="true" />{item.label}</Link>
          {item.children && <button type="button" onClick={() => setExpanded(expanded === item.id ? null : item.id)} aria-expanded={expanded === item.id} aria-label={`${item.label}: ${lang === 'vi' ? 'mục con' : 'subpages'}`} className="h1-nav__expand"><ChevronDown size={18} aria-hidden="true" /></button>}
        </div>
        {item.children && expanded === item.id && <div className="h1-nav__mobile-sublist">{item.children.map((child) => <Link key={child.label} to={child.to} state={child.control ? { showroomControl: child.control } : undefined} onClick={closeMenu}>{child.label}</Link>)}</div>}
      </div>)}
    </nav></div>}
  </>;
});
