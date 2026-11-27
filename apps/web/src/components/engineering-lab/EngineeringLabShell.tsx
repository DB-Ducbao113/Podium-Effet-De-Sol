import "@fontsource-variable/space-grotesk/wght.css";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import { Sparkles } from "lucide-react";
import React, { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { OfficialBrandLogo } from "../common/OfficialBrandLogo";
import { useNavigationStore } from "../../store/useNavigationStore";
import {
  ENG_LAB_BASE_PATH,
  applyEngineeringLabSeoHead,
  buildEngineeringLabHref,
} from "./engineeringLabRoutes";
import "./engineeringLabLuxury.css";

export interface EngineeringLabShellProps {
  readonly title: string;
  readonly description: string;
  readonly introOverlay?: ReactNode;
  readonly backdropStage?: ReactNode;
  readonly children: ReactNode;
}

export const EngineeringLabShell: React.FC<EngineeringLabShellProps> = ({
  title,
  description,
  introOverlay,
  backdropStage,
  children,
}) => {
  const location = useLocation();
  const lang = useNavigationStore((s) => s.lang);
  const setLang = useNavigationStore((s) => s.setLang);
  const isVi = lang === "vi";
  const onMainSandbox = location.pathname === ENG_LAB_BASE_PATH;

  // Enforce non-production noindex, nofollow + strip stale canonical/JSON-LD from canonical routes (REQ-02 / CR-09)
  useEffect(() => {
    applyEngineeringLabSeoHead(document, { lang, title, description });
  }, [description, lang, title]);

  return (
    <div
      className="peds-eng-lux-root"
      lang={lang}
      data-testid="engineering-lab-sandbox-root"
    >
      {/* Full-viewport Cinematic Start-Gantry Intro sits at root stacking context above Header */}
      {introOverlay}

      {/* Persistent Single-WebGL Stage (docks cleanly into Hero or Lab Aperture) */}
      {backdropStage}

      {/* Section 01: Precision Navigation */}
      <header
        className="peds-eng-lux-header"
        data-section="01-navigation"
        data-testid="eng-lab-section-01-nav"
      >
        <div className="peds-eng-lux-container peds-eng-lux-header__inner">
          <Link to={ENG_LAB_BASE_PATH} className="peds-eng-lux-brand">
            <OfficialBrandLogo variant="compact" size="sm" />
            <span className="peds-eng-lux-brand__divider" aria-hidden="true" />
            <span className="peds-eng-lux-brand__division hidden sm:inline">
              {isVi ? "PHÂN KHU KỸ THUẬT" : "ENGINEERING DIVISION"}
            </span>
          </Link>

          <nav
            className="peds-eng-lux-nav"
            aria-label={
              isVi
                ? "Điều hướng Engineering Sandbox"
                : "Engineering Sandbox Navigation"
            }
          >
            <Link
              to={ENG_LAB_BASE_PATH}
              className={`peds-eng-lux-nav__link${onMainSandbox && !location.hash ? " is-active" : ""}`}
            >
              <span>{isVi ? "Tổng quan" : "Engineering"}</span>
            </Link>
            <Link
              to={buildEngineeringLabHref({ hash: "interactive-lab" })}
              className={`peds-eng-lux-nav__link${location.hash === "#interactive-lab" ? " is-active" : ""}`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#00D9F5]" aria-hidden="true" />
              <span>{isVi ? "Phòng Lab" : "Interactive Lab"}</span>
            </Link>
            <Link
              to="/engineering/car-anatomy"
              className="peds-eng-lux-nav__link peds-eng-lux-nav__link--desktop"
            >
              <span>{isVi ? "Bóc tách 47 cụm" : "47-Part Anatomy"}</span>
            </Link>
            <Link
              to="/showroom"
              className="peds-eng-lux-nav__link peds-eng-lux-nav__link--desktop"
            >
              <span>Showroom</span>
            </Link>
          </nav>

          <div className="peds-eng-lux-controls">
            <span className="peds-eng-lux-sandbox-pill hidden sm:inline-flex">
              <span
                className="peds-eng-lux-sandbox-pill__dot"
                aria-hidden="true"
              />
              <span>SANDBOX</span>
            </span>

            <div
              className="peds-eng-lux-lang-switch"
              role="group"
              aria-label={
                isVi ? "Chuyển ngôn ngữ VI / EN" : "Switch language VI / EN"
              }
              data-testid="eng-lab-lang-switcher"
            >
              <button
                type="button"
                onClick={() => setLang("vi")}
                aria-pressed={lang === "vi"}
                data-testid="eng-lab-lang-vi"
                className={`peds-eng-lux-lang-btn${lang === "vi" ? " is-active" : ""}`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
                data-testid="eng-lab-lang-en"
                className={`peds-eng-lux-lang-btn${lang === "en" ? " is-active" : ""}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Sandbox Content Flow (role="main" satisfies accessibility & single-tag contract) */}
      <div
        id="eng-lab-content"
        role="main"
        tabIndex={-1}
        className="peds-eng-lux-content-flow outline-none"
      >
        {children}

        {/* Section 08: Premium Footer */}
        <footer
          className="peds-eng-lux-section border-t border-[#202730] bg-[#080A0D]"
          data-section="08-footer"
          data-testid="eng-lab-section-08-footer"
        >
          <div className="peds-eng-lux-container flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl space-y-4">
              <div className="flex items-center gap-4">
                <OfficialBrandLogo variant="full" size="sm" />
                <span className="peds-eng-lux-mono text-[10px] text-[#00D9F5]">
                  {isVi
                    ? "TRẢI NGHIỆM KỸ THUẬT ĐUA XE KỸ THUẬT SỐ"
                    : "DIGITAL MOTORSPORT ENGINEERING EXPERIENCE"}
                </span>
              </div>
              <p className="text-sm leading-7 text-[#A7B2C2]">
                {isVi
                  ? "Nền tảng biên tập và mô phỏng nguyên lý kỹ thuật xe đua hiệu suất cao. Mô hình nghiên cứu 3D FP-04 RB thuộc tác quyền Peter Kiss (PETERKISSDESIGN) cho mục đích minh họa kỹ thuật phi thương mại."
                  : "High-precision motorsport engineering editorial and interactive study platform. FP-04 RB 3D study mesh credited to Peter Kiss (PETERKISSDESIGN) for non-commercial illustrative analysis."}
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-[#A7B2C2]">
              <Link to={ENG_LAB_BASE_PATH} className="hover:text-[#00D9F5]">
                {isVi ? "Trang tổng Engineering" : "Engineering Hub"}
              </Link>
              <Link to="/showroom" className="hover:text-[#00D9F5]">
                {isVi ? "Garage 3D Showroom" : "3D Pit Garage Showroom"}
              </Link>
              <Link
                to="/engineering/car-anatomy"
                className="hover:text-[#00D9F5]"
              >
                {isVi ? "Show 12 cảnh / 47 cụm" : "12-Scene / 47-Part Show"}
              </Link>
              <Link to="/about" className="hover:text-[#00D9F5]">
                {isVi ? "Nguồn & Bản quyền" : "About & Provenance"}
              </Link>
              <Link to="/" className="hover:text-[#00D9F5]">
                {isVi ? "Về Trang chủ Podium EDS" : "Podium EDS Home"}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
