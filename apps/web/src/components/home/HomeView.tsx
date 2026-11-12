import { useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { AdSlot } from "../ui/AdSlot";
import { HomeRaceControl } from "./HomeRaceControl";
import { HomeSeasonOverview } from "./HomeSeasonOverview";
import { HomeStoryLinks } from "./HomeStoryLinks";
import { PodiumBrandHero } from "./PodiumBrandHero";
import { HomeCinematicBackground } from "./HomeCinematicBackground";
import { chapterScrollTarget } from "./journey/homeChapterScroll";
import { HomeEngineeringReveal } from "./engineering/HomeEngineeringReveal";
import { useNextRace } from "./useNextRace";
import { useNavigationStore } from "../../store/useNavigationStore";
import "./homepageH1.css";
import "./homeLandingV3.css";
import "./homeV83Interactions.css";
import "./journey/homeJourneyMotion.css";
import "./homeCommandV2.css";
import "./homeCinematicV5.css";

export function HomeView({ worldPreview = false }: { worldPreview?: boolean }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const nextRace = useNextRace();
  const lang = useNavigationStore((state) => state.lang);
  const isVi = lang === "vi";

  useEffect(() => {
    if (location.hash !== "#championship-overview") return;
    const frame = requestAnimationFrame(() =>
      chapterScrollTarget("championship-overview")?.scrollIntoView({
        block: "start",
        behavior: "instant",
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [location.hash]);

  const showAdReview =
    import.meta.env.DEV && searchParams.get("design-review") === "ads";

  return (
    <div className="r1-primary r1-home h1-home home-v3 home-v5 min-h-screen bg-studio-100">
      {!worldPreview && <HomeCinematicBackground />}
      <div className="home-v5__scrolly" data-home-v5-scroll>
        <PodiumBrandHero />
      </div>
      <div className="home-v3__content">
        <div id="r1-first-content" className="scroll-mt-20">
          <HomeRaceControl race={nextRace} />
        </div>
        {showAdReview && (
          <section
            className="page-container h1-ad-band"
            aria-label="Advertising placement review"
          >
            <AdSlot
              variant="leaderboard"
              reviewMode
              placement="homepage-after-race-countdown"
            />
          </section>
        )}
        <HomeSeasonOverview />
        <section className="home-v5__editorial page-container" aria-labelledby="home-v5-engineering-title">
          <div className="home-v5__editorial-copy">
            <span className="home-v5__eyebrow">03 / {isVi ? "KỸ THUẬT" : "ENGINEERING"}</span>
            <h2 id="home-v5-engineering-title">
              {isVi ? "Đằng sau" : "Beyond the"} <em>{isVi ? "tốc độ." : "surface."}</em>
            </h2>
            <p>
              {isVi
                ? "Khám phá các ý tưởng khí động học và cấu trúc bên trong một chiếc xe đua Formula 1."
                : "Explore the ideas behind Formula 1 aerodynamics and the machinery beneath the bodywork."}
            </p>
            <Link to="/engineering/car-anatomy" className="home-v5__editorial-link">
              {isVi ? "Khám phá kỹ thuật" : "Explore engineering"} <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="home-v5__editorial-art">
            <img
              src="/images/home/explore/engineering.webp"
              alt={isVi ? "Minh họa khái niệm dòng khí quanh xe đua" : "Concept illustration of airflow around a racing car"}
              width="1600"
              height="900"
              loading="lazy"
              decoding="async"
              onError={(event) => {
                if (!event.currentTarget.src.endsWith("engineering-flow.svg")) {
                  event.currentTarget.src = "/images/home/explore/engineering-flow.svg";
                }
              }}
            />
          </div>
        </section>
        {worldPreview && <HomeEngineeringReveal />}
        <HomeStoryLinks />
        {showAdReview && (
          <section
            className="page-container h1-ad-band h1-ad-band--lower"
            aria-label="Advertising placement review"
          >
            <AdSlot
              variant="in-content"
              reviewMode
              placement="homepage-after-editorial"
            />
          </section>
        )}
      </div>
    </div>
  );
}
