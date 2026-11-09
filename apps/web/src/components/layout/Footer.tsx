import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowUpRight, MoveUpRight } from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { t } from '../../i18n/translations';
import { OfficialBrandLogo } from '../common/OfficialBrandLogo';
import './footerCinematic.css';

export const Footer = memo(function Footer() {
  const lang = useNavigationStore((state) => state.lang);
  const strings = t[lang].footer;
  const nav = t[lang].nav;
  const isVi = lang === 'vi';
  const insideMachineTrialEnabled = import.meta.env.DEV;
  const quickLinks = [
    { to: '/season/2026', label: nav.championship },
    { to: '/showroom', label: 'Showroom 3D' },
    {
      to: insideMachineTrialEnabled ? '/engineering' : '/engineering/car-anatomy',
      label: insideMachineTrialEnabled ? 'Inside the Machine' : isVi ? 'Giải phẫu xe' : 'Car anatomy',
    },
    { to: '/teams', label: isVi ? 'Đội đua' : 'Teams' },
    { to: '/drivers', label: isVi ? 'Tay đua' : 'Drivers' },
  ];

  const backToTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
  };

  return (
    <footer id="peds-credits" className="peds-footer scroll-mt-16" data-footer-design="cinematic-v2">
      <div className="peds-footer__topline" aria-hidden="true" />
      <div className="page-container peds-footer__container">
        <div className="peds-footer__main">
          <div className="peds-footer__brand">
            <OfficialBrandLogo size="lg" variant="full" className="footer-brand-logo" />
            <p>{strings.desc}</p>
          </div>

          <nav className="peds-footer__explore" aria-label={strings.colExplore}>
            <div className="peds-footer__column-head">
              <h2>{isVi ? 'KHÁM PHÁ' : 'EXPLORE'}</h2>
            </div>
            <ul className="peds-footer__link-list">
              {quickLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="peds-footer__nav-link">
                    <span>{item.label}</span><ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="peds-footer__about">
            <div className="peds-footer__column-head">
              <h2>{isVi ? 'VỀ PODIUM EDS' : 'ABOUT PODIUM EDS'}</h2>
            </div>
            <p className="peds-footer__about-summary">
              {isVi ? 'Dự án độc lập do BaoBungBu xây dựng cho người yêu đua xe.' : 'An independent project created by BaoBungBu for racing fans.'}
            </p>
            <div className="peds-footer__about-links">
              <Link to="/about" className="peds-footer__nav-link">
                <span>{isVi ? 'Câu chuyện dự án' : 'Project & creator'}</span>
                <MoveUpRight size={16} aria-hidden="true" />
              </Link>
              <a href="#peds-attribution" className="peds-footer__nav-link">
                <span>{isVi ? 'Ghi công & bản quyền' : 'Credits & rights'}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div id="peds-attribution" className="peds-footer__legal scroll-mt-20">
          <span className="peds-footer__legal-label">
            <span className="peds-footer__legal-mark" aria-hidden="true" />
            {strings.colLegal}
          </span>
          <p>{strings.disclaimer}</p>
        </div>

        <div className="peds-footer__bottom">
          <p>{strings.copyright}</p>
          <button type="button" className="peds-footer__backtop" onClick={backToTop}>
            {isVi ? 'LÊN ĐẦU TRANG' : 'BACK TO TOP'}
            <ArrowUp size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
});
