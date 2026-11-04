import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { OfficialBrandLogo } from '../common/OfficialBrandLogo';
import { isPrimaryPath, useMobileHub } from '../../hooks/useMobileHub';
import { buttonClassName } from '../ui/buttonStyles';
import { buildNavItems, type NavItem } from './navItems';
import './navbarH1.css';
import './navbarV4.css';

export const Navbar = memo(function Navbar() {
  const { lang, setLang } = useNavigationStore();
  const location = useLocation();
  const mobileHub = useMobileHub();
  const onHub = mobileHub && isPrimaryPath(location.pathname);
  const isVi = lang === 'vi';
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [focusedGroup, setFocusedGroup] = useState<string | null>(null);
  const [dismissedDropdown, setDismissedDropdown] = useState<string | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const insideMachineTrialEnabled = import.meta.env.DEV;
  const season = Number(location.pathname.match(/^\/season\/(2024|2025|2026)(?:\/|$)/)?.[1] ?? 2026) as 2024 | 2025 | 2026;

  const items = useMemo<NavItem[]>(
    () => buildNavItems(lang, insideMachineTrialEnabled, season),
    [lang, insideMachineTrialEnabled, season],
  );

  const tab = new URLSearchParams(location.search).get('tab');
  const onRaceRoute = /^\/season\/[^/]+\/race\//.test(location.pathname);
  const seasonSection = !location.pathname.startsWith('/season/')
    ? null
    : onRaceRoute || tab === 'results' || tab === 'calendar'
      ? 'results'
      : tab === 'drivers'
        ? 'drivers'
        : tab === 'teams'
          ? 'teams'
          : 'standings';
  const hubHash = location.hash;
  const currentUrl = `${location.pathname}${location.search}`;

  const isActive = (id: string): boolean => {
    switch (id) {
      case 'overview':
        return location.pathname === '/'
          ? hubHash !== '#showroom' && hubHash !== '#giai-dau'
          : onHub && hubHash === '#home';
      case 'championship':
        return seasonSection === 'results' || seasonSection === 'standings' || (onHub && hubHash === '#giai-dau');
      case 'grid':
        return isActive('drivers') || isActive('teams');
      case 'results':
        return seasonSection === 'results';
      case 'standings':
        return seasonSection === 'standings' || (onHub && hubHash === '#giai-dau');
      case 'drivers':
        return location.pathname === '/drivers' || location.pathname.startsWith('/drivers/') || seasonSection === 'drivers';
      case 'teams':
        return location.pathname === '/teams' || location.pathname.startsWith('/teams/') || seasonSection === 'teams';
      case 'engineering':
        return location.pathname.startsWith('/engineering');
      case 'showroom':
        return location.pathname.startsWith('/showroom') || location.pathname.startsWith('/gallery') || hubHash === '#showroom';
      default:
        return false;
    }
  };
  const isChildActive = (to: string) => to === currentUrl;
  // Desktop V5 deliberately shows four well-spaced categories instead of
  // squeezing six destinations together. Mobile keeps every original item.
  const resultsItem = items.find((item) => item.id === 'results')!;
  const standingsItem = items.find((item) => item.id === 'standings')!;
  const driversItem = items.find((item) => item.id === 'drivers')!;
  const teamsItem = items.find((item) => item.id === 'teams')!;
  const engineeringItem = items.find((item) => item.id === 'engineering')!;
  const overviewItem = items.find((item) => item.id === 'overview')!;
  const desktopItems: NavItem[] = [
    overviewItem,
    {
      id: 'championship',
      label: isVi ? 'Giải đấu' : 'Championship',
      to: isActive('standings') ? standingsItem.to : resultsItem.to,
      icon: resultsItem.icon,
      children: [
        { id: 'champ-results', label: resultsItem.label, to: resultsItem.to },
        ...resultsItem.children!,
        { id: 'champ-standings', label: standingsItem.label, to: standingsItem.to },
        ...standingsItem.children!,
      ],
    },
    {
      id: 'grid',
      label: isVi ? 'Đội hình' : 'The Grid',
      to: isActive('teams') ? teamsItem.to : driversItem.to,
      icon: driversItem.icon,
      children: [
        { id: 'grid-drivers', label: driversItem.label, to: driversItem.to },
        { id: 'grid-teams', label: teamsItem.label, to: teamsItem.to },
      ],
    },
    engineeringItem,
  ];

  const showroomActive = isActive('showroom');

  const hubParams = new URLSearchParams(location.search);
  hubParams.delete('hotspot');
  const hubSearch = hubParams.size ? `?${hubParams.toString()}` : '';
  const homeHref = onHub ? `${location.pathname}${hubSearch}#home` : '/';
  const showroomHref = onHub ? `${location.pathname}${hubSearch}#showroom` : '/showroom';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setExpanded(null);
    setOpenDropdown(null);
    setFocusedGroup(null);
    setDismissedDropdown(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const activeDropdown = openDropdown ?? focusedGroup;
    if (!activeDropdown) return;
    const onPointerDown = (event: PointerEvent) => {
      const group = (event.target as Element | null)?.closest?.('.h1-nav__group');
      if (group?.getAttribute('data-nav-id') === activeDropdown) return;
      setOpenDropdown(null);
      setFocusedGroup(null);
      setDismissedDropdown(activeDropdown);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [openDropdown, focusedGroup]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || menuOpen) return;
      const focused = document.activeElement?.closest<HTMLElement>('.h1-nav__group');
      const hovered = document.querySelector<HTMLElement>('.h1-nav__group:hover');
      const group = focused ?? hovered;
      if (!group) return;
      setDismissedDropdown(group.dataset.navId ?? null);
      setOpenDropdown(null);
      setFocusedGroup(null);
      (group.querySelector<HTMLElement>('.h1-nav__chevron') ?? group.querySelector<HTMLElement>('.h1-nav__link'))?.focus();
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [menuOpen]);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1180px)');
    const onChange = () => {
      if (!query.matches) return;
      setMenuOpen(false);
      setExpanded(null);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const panel = menuRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusables = () => Array.from(
      panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [],
    ).filter((element) => element.offsetParent !== null);
    focusables()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        setExpanded(null);
        menuToggleRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first || !panel?.contains(document.activeElement)) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last || !panel?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (location.hash !== '#peds-credits') return;
    const timer = window.setTimeout(() => document.getElementById('peds-credits')?.scrollIntoView({ block: 'start', behavior: 'instant' }), 500);
    return () => window.clearTimeout(timer);
  }, [location.hash, location.pathname]);

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false);
    setExpanded(null);
    setOpenDropdown(null);
    if (restoreFocus) window.requestAnimationFrame(() => menuToggleRef.current?.focus());
  };

  const mobileTarget = (item: NavItem) => item.id === 'overview' ? homeHref : item.to;

  return <>
    <header aria-hidden={menuOpen || undefined} className={`h1-nav h1-nav--v4 fixed inset-x-0 top-0 z-50 ${scrolled ? 'h1-nav--scrolled' : ''}`}>
      <div className="page-container h1-nav__bar flex items-center justify-between gap-3">
        <Link
          to={homeHref}
          className="h1-nav__brand"
          aria-label={isVi ? 'PODIUM EDS — Trang chủ' : 'PODIUM EDS — Home'}
        >
          <OfficialBrandLogo size="sm" variant="full" className="h1-nav__brand-logo" />
        </Link>
        <nav className="h1-nav__desktop" aria-label={isVi ? 'Điều hướng chính' : 'Main navigation'}>
          {desktopItems.map((item) => {
            const active = isActive(item.id);
            const dismissed = dismissedDropdown === item.id;
            const dropdownOpen = (openDropdown === item.id || focusedGroup === item.id) && !dismissed;
            return <div
              className={`h1-nav__group${active ? ' h1-nav__group--active' : ''}`}
              key={item.id}
              data-nav-id={item.id}
              data-open={dropdownOpen}
              data-dismissed={dismissed}
              onFocusCapture={() => {
                if (dismissedDropdown === item.id) return;
                setFocusedGroup(item.id);
              }}
              onPointerEnter={() => {
                setDismissedDropdown(null);
                if (openDropdown && openDropdown !== item.id) setOpenDropdown(null);
              }}
              onPointerLeave={(event) => {
                if (!event.currentTarget.contains(document.activeElement)) setDismissedDropdown(null);
              }}
              onBlur={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                setDismissedDropdown(null);
                setFocusedGroup(null);
                setOpenDropdown((current) => current === item.id ? null : current);
              }}
            >
              <Link
                to={item.to}
                className="h1-nav__link"
                aria-current={active ? 'page' : undefined}
                onClick={() => { setOpenDropdown(null); setDismissedDropdown(null); }}
              >
                <span>{item.label}</span>
              </Link>
              {item.children && <>
                <button
                  type="button"
                  className="h1-nav__chevron"
                  aria-label={`${item.label} — ${isVi ? 'mục con' : 'submenu'}`}
                  aria-expanded={dropdownOpen}
                  aria-controls={`h1-nav-dropdown-${item.id}`}
                  onClick={() => {
                    if (openDropdown === item.id) {
                      setOpenDropdown(null);
                      setFocusedGroup(null);
                      setDismissedDropdown(item.id);
                      return;
                    }
                    setDismissedDropdown(null);
                    setOpenDropdown(item.id);
                  }}
                >
                  <ChevronDown size={13} aria-hidden="true" />
                </button>
                <div className="h1-nav__dropdown" id={`h1-nav-dropdown-${item.id}`}>
                  <div className="h1-nav__dropdown-inner">
                    {item.children.map((child) => <Link
                      key={child.id}
                      to={child.to}
                      className="h1-nav__sub"
                      aria-current={isChildActive(child.to) ? 'true' : undefined}
                      onClick={() => { setOpenDropdown(null); setDismissedDropdown(null); }}
                    >{child.label}</Link>)}
                  </div>
                </div>
              </>}
            </div>;
          })}
          <Link
            to={showroomHref}
            className={buttonClassName({ size: 'sm', className: `h1-nav__cta${showroomActive ? ' h1-nav__cta--active' : ''}` })}
            aria-current={showroomActive ? 'page' : undefined}
            onClick={() => setOpenDropdown(null)}
          >
            <span>Showroom 3D</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </nav>
        <div className="h1-nav__actions flex shrink-0 items-center gap-2">
          <div className="h1-nav__lang flex items-center rounded-full border border-white/10 bg-white/5 p-0.5">
            {(['vi', 'en'] as const).map((code) => <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              aria-label={code === 'vi' ? 'Tiếng Việt' : 'English'}
              aria-pressed={lang === code}
              className={`h1-nav__lang-option${lang === code ? ' is-active' : ''}`}
            >{code.toUpperCase()}</button>)}
          </div>
          <button
            ref={menuToggleRef}
            type="button"
            onClick={() => menuOpen ? closeMenu(true) : setMenuOpen(true)}
            className="h1-nav__toggle flex min-h-11 min-w-11 items-center justify-center rounded text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-f1red"
            aria-label={menuOpen ? (isVi ? 'Đóng menu' : 'Close navigation menu') : (isVi ? 'Mở menu' : 'Open navigation menu')}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
          >{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
    </header>
    {menuOpen && <div className="h1-nav__scrim" onClick={() => closeMenu(true)}>
      <div
        ref={menuRef}
        className="h1-nav__panel"
        role="dialog"
        aria-modal="true"
        aria-label={isVi ? 'Điều hướng' : 'Navigation'}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h1-nav__panel-top">
          <OfficialBrandLogo size="sm" variant="full" />
          <button type="button" className="h1-nav__panel-close" onClick={() => closeMenu(true)} aria-label={isVi ? 'Đóng menu' : 'Close navigation menu'}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="h1-nav__mobile-eyebrow"><span>{isVi ? 'Điều hướng' : 'Navigation'}</span><span>2026</span></p>
        <nav id="mobile-nav-menu" className="h1-nav__mobile" aria-label={isVi ? 'Điều hướng di động' : 'Mobile navigation'}>
          {items.map((item) => <div className={`h1-nav__mobile-group${isActive(item.id) ? ' is-active' : ''}`} key={item.id}>
            <div className="h1-nav__mobile-row">
              <Link
                to={mobileTarget(item)}
                onClick={() => closeMenu()}
                className="h1-nav__mobile-link"
                aria-current={isActive(item.id) ? 'page' : undefined}
              >
                <item.icon size={17} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
              {item.children && <button
                type="button"
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                aria-expanded={expanded === item.id}
                aria-controls={`h1-nav-mobile-${item.id}`}
                aria-label={`${item.label}: ${isVi ? 'mục con' : 'subpages'}`}
                className="h1-nav__expand"
              ><ChevronDown size={18} aria-hidden="true" /></button>}
            </div>
            {item.children && expanded === item.id && <div id={`h1-nav-mobile-${item.id}`} className="h1-nav__mobile-sublist">
              {item.children.map((child) => <Link
                key={child.id}
                to={child.to}
                onClick={() => closeMenu()}
                aria-current={isChildActive(child.to) ? 'true' : undefined}
              >{child.label}</Link>)}
            </div>}
          </div>)}
          <Link
            to={showroomHref}
            onClick={() => closeMenu()}
            className="h1-nav__mobile-cta"
            aria-current={showroomActive ? 'page' : undefined}
          >
            <span>Showroom 3D</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <div className="h1-nav__mobile-secondary">
            <Link to="/about" onClick={() => closeMenu()}>{isVi ? 'Giới thiệu' : 'About'}</Link>
            <Link to="/about#peds-credits" onClick={() => closeMenu()}>{isVi ? 'Ghi công' : 'Credits'}</Link>
          </div>
        </nav>
      </div>
    </div>}
  </>;
});
