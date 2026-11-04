import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowUpRight, ChevronRight, MoveUpRight } from 'lucide-react';
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
        <section className="peds-footer__feature" aria-labelledby="peds-footer-headline">
          <div className="peds-footer__feature-copy">
            <span className="peds-footer__eyebrow">
              <span className="peds-footer__eyebrow-dash" aria-hidden="true" />
              {isVi ? 'DỰ ÁN ĐUA XE ĐỘC LẬP' : 'INDEPENDENT MOTORSPORT PROJECT'}
              <span className="peds-footer__eyebrow-number">/ EDS—26</span>
            </span>
            <h2 id="peds-footer-headline" className="peds-footer__headline">
              <span>{isVi ? 'VƯỢT QUA' : 'BEYOND THE'}</span>
              <span className="peds-footer__headline-accent">{isVi ? 'VẠCH ĐÍCH.' : 'FINISH LINE.'}</span>
            </h2>
            <p className="peds-footer__feature-description">
              {isVi
                ? 'Không chỉ là kết quả cuộc đua. Khám phá những con người, cỗ máy và kỹ thuật phía sau từng khoảnh khắc F1.'
                : 'More than the final classification. Explore the people, the machines and the engineering behind every F1 moment.'}
            </p>
            <div className="peds-footer__feature-actions">
              <Link to="/about" className="peds-footer__cta">
                {isVi ? 'TÌM HIỂU DỰ ÁN' : 'THE STORY BEHIND EDS'}
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/showroom" className="peds-footer__text-link">
                {isVi ? 'Khám phá Showroom' : 'Enter the Showroom'}
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="peds-footer__aero-art" aria-hidden="true">
            <div className="peds-footer__aero-grid" />
            <svg viewBox="0 0 650 380" fill="none" preserveAspectRatio="xMidYMid meet" role="presentation">
              <defs>
                <linearGradient id="footer-aero-flow" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#65CEE9" stopOpacity="0" />
                  <stop offset=".43" stopColor="#80D8F0" stopOpacity=".78" />
                  <stop offset=".72" stopColor="#FF6734" stopOpacity=".85" />
                  <stop offset="1" stopColor="#FF6734" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="footer-aero-panel" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#405B71" stopOpacity=".68" />
                  <stop offset=".5" stopColor="#111F2D" stopOpacity=".18" />
                  <stop offset="1" stopColor="#30445A" stopOpacity=".62" />
                </linearGradient>
              </defs>
              <g className="peds-footer__aero-mesh" stroke="#8FB2C6" strokeWidth=".6" strokeOpacity=".19">
                <path d="M40 50H615M40 95H615M40 140H615M40 185H615M40 230H615M40 275H615M40 320H615" />
                <path d="M85 24V353M160 24V353M235 24V353M310 24V353M385 24V353M460 24V353M535 24V353" />
              </g>
              <path d="M73 258C170 199 222 208 285 159C355 112 400 132 575 68L571 118C431 160 379 173 308 198C217 246 151 269 76 292Z"
                fill="url(#footer-aero-panel)" stroke="#6FA2BC" strokeOpacity=".54" strokeWidth="1.5" />
              <path d="M93 297C209 252 247 257 326 217S481 216 592 260L594 292C462 255 406 255 333 265C233 288 171 330 97 338Z"
                fill="#172638" fillOpacity=".8" stroke="#FF764A" strokeOpacity=".5" strokeWidth="1.5" />
              <g className="peds-footer__aero-traces" stroke="url(#footer-aero-flow)" strokeLinecap="round">
                <path d="M-30 245C118 197 203 217 275 183S420 120 690 59" strokeWidth="2.2" />
                <path d="M-30 269C132 228 199 237 296 211S455 174 680 130" strokeWidth="1.4" />
                <path d="M-30 298C142 272 222 270 319 246S477 254 675 278" strokeWidth="1.9" />
                <path d="M-30 322C135 312 226 301 318 275S477 289 675 327" strokeWidth=".9" />
              </g>
              <g stroke="#FF824B" strokeWidth="1.2" strokeOpacity=".8">
                <path d="M457 64H505M481 40V87" />
                <path d="M108 345H147M127 324V364" />
              </g>
              <circle cx="308" cy="205" r="5" fill="#FF7844" />
              <circle cx="308" cy="205" r="17" stroke="#FF7844" strokeOpacity=".5" />
            </svg>
            <div className="peds-footer__aero-caption">
              <span>AERO / STUDY 01</span>
              <span>GROUND EFFECT · DESIGN LANGUAGE</span>
            </div>
          </div>
        </section>

        <div className="peds-footer__main">
          <div className="peds-footer__brand">
            <OfficialBrandLogo size="lg" variant="full" className="footer-brand-logo" />
            <p>{strings.desc}</p>
            <div className="peds-footer__brand-tags" aria-label={isVi ? 'Lĩnh vực dự án' : 'Project focus'}>
              <span>3D SHOWROOM</span><span>RACE DATA</span><span>ENGINEERING</span>
            </div>
          </div>

          <nav className="peds-footer__explore" aria-label={strings.colExplore}>
            <div className="peds-footer__column-head">
              <span className="peds-footer__column-index">01 /</span>
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
              <span className="peds-footer__column-index">02 /</span>
              <h2>{isVi ? 'VỀ PODIUM EDS' : 'ABOUT PODIUM EDS'}</h2>
            </div>
            <div className="peds-footer__about-spotlight">
              <span className="peds-footer__about-overline">PROJECT / INDEPENDENT</span>
              <strong>{isVi ? 'ĐƯỢC TẠO NÊN TỪ ĐAM MÊ.' : 'BUILT FOR THE LOVE OF RACING.'}</strong>
              <p>
                {isVi
                  ? 'Một dự án sáng tạo kết nối thiết kế 3D, dữ liệu giải đấu và câu chuyện kỹ thuật.'
                  : 'An independent creative project bringing together 3D design, championship data and engineering stories.'}
              </p>
            </div>
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
