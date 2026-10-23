import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import { t } from '../../i18n/translations';
import { Menu, X, Trophy, Home, Box, BookOpen } from 'lucide-react';
import { OfficialBrandLogo } from '../common/OfficialBrandLogo';
import { isPrimaryPath, useMobileHub } from '../../hooks/useMobileHub';

export const Navbar: React.FC = React.memo(() => {
  const { lang, setLang } = useNavigationStore();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileHub = useMobileHub();
  const onHub = mobileHub && isPrimaryPath(location.pathname);
  const hubParams = new URLSearchParams(location.search);
  hubParams.delete('hotspot');
  const hubSearch = hubParams.size ? `?${hubParams.toString()}` : '';

  const strings = t[lang].nav;

  const NAV_ITEMS = useMemo(
    () => [
      { id: 'home', path: '/', label: strings.home, icon: <Home className="w-4 h-4" /> },
      {
        id: 'championship',
        path: '/season/2026',
        label: strings.championship,
        icon: <Trophy className="w-4 h-4" />,
      },
      {
        id: 'collection',
        path: '/showroom',
        label: strings.collection,
        icon: <Box className="w-4 h-4" />,
      },
      {
        id: 'engineering',
        path: '/engineering',
        label: lang === 'vi' ? 'Kỹ thuật' : 'Engineering',
        icon: <BookOpen className="w-4 h-4" />,
      },
    ],
    [lang, strings],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const drawerItems = onHub
    ? [
        NAV_ITEMS[3],
        {
          id: 'teams',
          path: '/teams',
          label: lang === 'vi' ? 'Đội đua' : 'Teams',
          icon: <Trophy className="w-4 h-4" />,
        },
        {
          id: 'drivers',
          path: '/drivers',
          label: lang === 'vi' ? 'Tay đua' : 'Drivers',
          icon: <Home className="w-4 h-4" />,
        },
        {
          id: 'about',
          path: '/about',
          label: lang === 'vi' ? 'Giới thiệu' : 'About',
          icon: <BookOpen className="w-4 h-4" />,
        },
      ]
    : NAV_ITEMS;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#08080b]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.35)]'
            : 'bg-[#08080b]/90 backdrop-blur-md border-b border-white/10'
        }`}
        style={{ height: 64 }}
      >
        <div className="page-container h-full flex items-center justify-between gap-2 sm:gap-6">
          {/* Brand Logo */}
          <Link
            to={onHub ? `${location.pathname}${hubSearch}#home` : '/'}
            className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-f1red rounded"
            aria-label="PODIUM — Effet de Sol"
          >
            <OfficialBrandLogo size="md" variant="full" className="hidden sm:block" />
            <OfficialBrandLogo size="md" variant="compact" className="sm:hidden" />
          </Link>

          {/* Center Navigation Links */}
          <nav
            className="hidden min-[861px]:flex items-center gap-4 lg:gap-6"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.id === 'home'
                  ? location.pathname === '/'
                  : item.id === 'championship'
                    ? location.pathname.startsWith('/season') ||
                      location.pathname.startsWith('/teams') ||
                      location.pathname.startsWith('/drivers')
                    : item.id === 'engineering'
                      ? location.pathname.startsWith('/engineering')
                      : location.pathname.startsWith('/showroom') ||
                        location.pathname.startsWith('/gallery');
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-1.5 lg:gap-2 py-1 text-[11px] lg:text-[13px] font-bold uppercase tracking-wider transition-all duration-200 border-b-2 ${
                    isActive
                      ? 'border-f1red text-f1red'
                      : 'border-transparent text-studio-300 hover:text-white hover:border-white/30'
                  }`}
                >
                  <span className={isActive ? 'text-f1red' : 'text-studio-400'}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right — Language Selector & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center bg-white/5 p-0.5 rounded-full border border-white/10">
              <button
                onClick={() => setLang('vi')}
                aria-label="Tiếng Việt"
                className={`px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  lang === 'vi'
                    ? 'bg-f1red text-white shadow-sm'
                    : 'text-studio-300 hover:text-white'
                }`}
                title="Tiếng Việt"
              >
                VI
              </button>
              <button
                onClick={() => setLang('en')}
                aria-label="English"
                className={`px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  lang === 'en'
                    ? 'bg-f1red text-white shadow-sm'
                    : 'text-studio-300 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="min-[861px]:hidden p-2 text-studio-200 hover:text-white transition-colors focus:ring-2 focus:ring-f1red rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm min-[861px]:hidden animate-fade-in"
          onClick={() => setMenuOpen(false)}
        >
          <div
            id="mobile-nav-menu"
            className="fixed top-16 left-0 right-0 bg-[#0b0b0f]/98 border-b border-white/10 shadow-2xl p-6 flex flex-col gap-4 animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            {drawerItems.map((item) => {
              const isActive =
                item.id === 'home'
                  ? location.pathname === '/'
                  : item.id === 'championship'
                    ? location.pathname.startsWith('/season') ||
                      location.pathname.startsWith('/teams') ||
                      location.pathname.startsWith('/drivers')
                    : item.id === 'engineering'
                      ? location.pathname.startsWith('/engineering')
                      : location.pathname.startsWith('/showroom') ||
                        location.pathname.startsWith('/gallery');
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-md text-sm font-bold uppercase tracking-wider text-left transition-colors ${
                    isActive
                      ? 'bg-f1red/10 text-f1red font-black'
                      : 'text-studio-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
});
