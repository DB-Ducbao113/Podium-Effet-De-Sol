import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import { t } from '../../i18n/translations';
import { OfficialBrandLogo } from '../common/OfficialBrandLogo';

export const Footer = memo(function Footer() {
  const { lang } = useNavigationStore();
  const strings = t[lang].footer;
  const nav = t[lang].nav;
  const insideMachineTrialEnabled = import.meta.env.DEV;
  const quickLinks = [
    { to: '/season/2026', label: nav.championship },
    { to: '/showroom', label: 'Showroom 3D' },
    { to: insideMachineTrialEnabled ? '/engineering' : '/engineering/car-anatomy', label: insideMachineTrialEnabled ? 'Inside the Machine' : lang === 'vi' ? 'Giải phẫu xe' : 'Car anatomy' },
    { to: '/teams', label: lang === 'vi' ? 'Đội đua' : 'Teams' },
    { to: '/drivers', label: lang === 'vi' ? 'Tay đua' : 'Drivers' },
  ];

  return <footer id="peds-credits" className="mt-auto border-t border-white/15 bg-[#080a0e] text-white scroll-mt-16">
    <div className="page-container grid gap-10 py-12 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-12 md:py-16">
      <div>
        <OfficialBrandLogo size="md" variant="full" className="footer-brand-logo" />
        <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">{strings.desc}</p>
      </div>
      <nav aria-label={strings.colExplore}>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-white">{lang === 'vi' ? 'Khám phá' : 'Explore'}</h2>
        <ul className="grid gap-2">{quickLinks.map((item) => <li key={item.to}><Link className="inline-block min-h-8 text-sm text-white/65 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-f1red" to={item.to}>{item.label}</Link></li>)}</ul>
      </nav>
      <nav aria-label={lang === 'vi' ? 'Về dự án' : 'About'}>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-white">{lang === 'vi' ? 'Giới thiệu' : 'About'}</h2>
        <ul className="grid gap-2">
          <li><Link to="/about" className="inline-block min-h-8 text-sm text-white/65 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-f1red">{lang === 'vi' ? 'Dự án' : 'Project'}</Link></li>
          <li><a href="#peds-credits" className="inline-block min-h-8 text-sm text-white/65 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-f1red">{lang === 'vi' ? 'Ghi công' : 'Credits'}</a></li>
        </ul>
        <p className="mt-4 text-xs leading-5 text-white/55">{strings.disclaimer}</p>
      </nav>
    </div>
    <div className="page-container border-t border-white/10 py-5 text-xs leading-5 text-white/55">
      <p>{strings.copyright}</p>
    </div>
  </footer>;
});
