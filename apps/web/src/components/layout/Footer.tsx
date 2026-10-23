import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import { t } from '../../i18n/translations';
import { OfficialBrandLogo } from '../common/OfficialBrandLogo';

export const Footer: React.FC = React.memo(() => {
  const { lang } = useNavigationStore();
  const strings = t[lang].footer;
  const navStrings = t[lang].nav;
  const navItems = [
    { to: '/', label: navStrings.home },
    { to: '/season/2026', label: navStrings.championship },
    { to: '/showroom', label: navStrings.collection },
    { to: '/engineering', label: 'Engineering Insights' },
    { to: '/teams', label: lang === 'vi' ? 'Danh sách đội đua' : 'Teams' },
    { to: '/drivers', label: lang === 'vi' ? 'Danh sách tay đua' : 'Drivers' },
    { to: '/about', label: lang === 'vi' ? 'Về dự án' : 'About' },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/10 bg-[#070709] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-[7%] top-0 h-px w-40 bg-f1red" />
        <div className="absolute right-[9%] top-24 h-px w-56 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-f1red/[0.04] blur-3xl" />
      </div>

      <div className="page-container relative py-14 md:py-20">
        <div className="mb-12 flex items-center justify-between border-b border-white/10 pb-5 text-[9px] font-semibold uppercase tracking-[0.34em] text-white/65">
          <span>PDM / Archive 026</span>
          <span className="hidden sm:inline">Aerodynamics · Telemetry · Heritage</span>
          <span>43° N / 12° E</span>
        </div>

        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-10">
          <section className="lg:col-span-5 lg:pr-10">
            <OfficialBrandLogo size="lg" variant="full" />
            <p className="mt-9 font-display text-[clamp(2.7rem,4.5vw,5.2rem)] font-semibold uppercase italic leading-[0.82] tracking-[-0.055em] text-white">
              {lang === 'vi' ? (
                <>
                  Chính xác
                  <br />
                  <span className="text-white/65">trong chuyển động.</span>
                </>
              ) : (
                <>
                  Precision
                  <br />
                  <span className="text-white/65">in motion.</span>
                </>
              )}
            </p>
            <div className="mt-8 flex items-start gap-5">
              <span className="mt-2 h-px w-12 shrink-0 bg-f1red" />
              <p className="max-w-md text-[13px] font-light leading-6 text-white/55">
                {strings.desc}
              </p>
            </div>
          </section>

          <nav className="lg:col-span-3" aria-label={strings.colExplore}>
            <div className="mb-5 flex items-center gap-3">
              <span className="font-display text-3xl italic text-f1red">01</span>
              <div>
                <p className="text-[9px] uppercase tracking-[0.34em] text-white/65">Index</p>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                  {strings.colExplore}
                </h3>
              </div>
            </div>
            <ul className="border-t border-white/10">
              {navItems.map((item, index) => (
                <li key={item.to} className="border-b border-white/10">
                  <Link
                    to={item.to}
                    className="group flex items-center justify-between py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55 transition-colors hover:text-white"
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-display text-[10px] italic text-white/65 transition-colors group-hover:text-f1red">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {item.label}
                    </span>
                    <span className="translate-x-0 text-f1red opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">
                      ↗
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section className="lg:col-span-4 lg:pl-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="font-display text-3xl italic text-f1red">02</span>
              <div>
                <p className="text-[9px] uppercase tracking-[0.34em] text-white/65">Provenance</p>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                  {strings.colLegal}
                </h3>
              </div>
            </div>

            <div className="border-l border-f1red/50 pl-5 text-[11px] font-light leading-5 text-white/65">
              <p className="mb-4 uppercase tracking-[0.08em] text-white/65">
                Photography / LAT Images / DPPI / Motorsport Images / Red Bull Media House /
                Official team press kits
              </p>
              <p>{strings.disclaimer}</p>
            </div>

            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/65">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              Independent digital archive
            </div>
          </section>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-white/10 pt-7 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
          <p className="max-w-3xl text-[13px] font-medium normal-case leading-6 tracking-normal text-white/65 sm:text-sm">
            {strings.copyright}
          </p>
          <div className="flex items-center gap-5 whitespace-nowrap">
            <span>© MMXXVI</span>
            <span className="h-px w-8 bg-f1red" />
            <span>Designed by BaoBungBu</span>
          </div>
        </div>
      </div>
    </footer>
  );
});
