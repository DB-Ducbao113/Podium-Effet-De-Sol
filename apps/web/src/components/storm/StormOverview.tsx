import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import type {
  ConstructorStanding,
  DriverStanding,
  GrandPrixRound,
  RaceResult,
  SeasonYear,
} from "../../types";
import { LiveF1PulseDock } from "./LiveF1PulseDock";
import { StormHeroBackdrop } from "./StormHeroBackdrop";
import type { StormInspectionTarget } from "./types";
import { useLiquidPointerGlow } from "./useLiquidGlassMotion";

export interface StormOverviewProps {
  readonly lang: "vi" | "en";
  readonly season: SeasonYear;
  readonly reducedMotion: boolean;
  readonly nextRace?: GrandPrixRound;
  readonly latestResult?: RaceResult;
  readonly standings: {
    readonly drivers: readonly DriverStanding[];
    readonly constructors: readonly ConstructorStanding[];
  };
  readonly onNavigate?: (path: string) => void;
  readonly onInspect: (target: StormInspectionTarget) => void;
  readonly onPrefetchRoute?: (
    routeKey: "results" | "engineering" | "showroom" | "calendar" | "standings",
  ) => void;
}

/**
 * Production Storm Midnight Home (`/` Overview — `REQ-01`, `REQ-03`).
 * Pairs the responsive AVIF/WebP Living-Photo Storm Hero with the 3-card Live F1 Pulse Dock.
 */
export function StormOverview({
  lang,
  season,
  reducedMotion,
  nextRace,
  latestResult,
  standings,
  onInspect,
  onPrefetchRoute,
}: StormOverviewProps) {
  const isVi = lang === "vi";
  const wrapRef = useRef<HTMLDivElement>(null);
  useLiquidPointerGlow(wrapRef, reducedMotion);

  return (
    <div
      ref={wrapRef}
      className="sp-storm-overview"
      data-prototype-tab="overview"
    >
      <section className="sp-storm-hero" aria-labelledby="sp-storm-hero-title">
        <StormHeroBackdrop reducedMotion={reducedMotion} variant="hero" />

        <div className="sp-storm-hero-layout">
          <div className="sp-storm-hero-inner">
            <div className="sp-storm-hero-upper">
              <div className="sp-storm-eyebrow">
                <span className="sp-storm-eyebrow-label">
                  {isVi
                    ? "KỸ THUẬT ĐUA / CHIẾN THUẬT / KHÍ ĐỘNG HỌC"
                    : "RACECRAFT / STRATEGY / ENGINEERING"}
                </span>
              </div>

              <h1 id="sp-storm-hero-title" className="sp-storm-display">
                <span className="sp-storm-line sp-storm-line--first">
                  <span>{isVi ? "GIẢI MÃ" : "DECODING"}</span>
                </span>
                <span className="sp-storm-line sp-storm-line--second">
                  <span>{isVi ? "BIÊN ĐỘ" : "THE MARGINS"}</span>
                </span>
                <span className="sp-storm-line sp-storm-line--third">
                  <span>
                    <em>{isVi ? "CHIẾN THẮNG." : "OF VICTORY."}</em>
                  </span>
                </span>
              </h1>
            </div>

            <div className="sp-storm-hero-lower">
              <div className="sp-storm-context">
                <p className="sp-storm-context-copy">
                  {isVi
                    ? "Từ khí động học hiệu ứng mặt đất đến chiến thuật từng phần nghìn giây: bản lĩnh và kỹ thuật sau mỗi kết quả đường đua."
                    : "From underfloor aerodynamics to split-second strategy: the engineering and racecraft behind every result, decoded."}
                </p>
              </div>

              <div className="sp-storm-cta-cluster">
                <div className="sp-storm-actions">
                  <Link
                    to={`/season/${season}?tab=results`}
                    className="sp-storm-btn sp-storm-btn--primary"
                    onMouseEnter={() => onPrefetchRoute?.("results")}
                    onFocus={() => onPrefetchRoute?.("results")}
                  >
                    <span>{isVi ? "XEM KẾT QUẢ" : "SEE THE RESULTS"}</span>
                    <ArrowUpRight
                      size={15}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </Link>
                  <Link
                    to="/engineering"
                    className="sp-storm-btn sp-storm-btn--secondary"
                    onMouseEnter={() => onPrefetchRoute?.("engineering")}
                    onFocus={() => onPrefetchRoute?.("engineering")}
                  >
                    <span>
                      {isVi ? "KHÁM PHÁ KỸ THUẬT" : "EXPLORE ENGINEERING"}
                    </span>
                    <ArrowRight
                      size={16}
                      strokeWidth={1.6}
                      aria-hidden="true"
                    />
                  </Link>
                </div>

                <div className="sp-storm-microline" aria-hidden="true">
                  <span>
                    {isVi
                      ? "LỰC ÉP MẶT ĐẤT / CHIẾN THUẬT / ĐƯỜNG ĐUA"
                      : "DOWNFORCE / RACECRAFT / STRATEGY"}
                  </span>
                  <span className="sp-storm-microline-star">✦</span>
                </div>
              </div>
            </div>
          </div>

          <LiveF1PulseDock
            lang={lang}
            season={season}
            reducedMotion={reducedMotion}
            nextRace={nextRace}
            latestResult={latestResult}
            standings={standings}
            onInspect={onInspect}
            onPrefetchRoute={onPrefetchRoute}
          />
        </div>
      </section>
    </div>
  );
}
