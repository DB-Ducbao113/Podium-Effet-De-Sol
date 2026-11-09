import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { AdSlot } from "../ui/AdSlot";
import { HomeRaceControl } from "./HomeRaceControl";
import { HomeSeasonOverview } from "./HomeSeasonOverview";
import { HomeStoryLinks } from "./HomeStoryLinks";
import { PodiumBrandHero } from "./PodiumBrandHero";
import { HomeCinematicBackground } from "./HomeCinematicBackground";
import { chapterScrollTarget } from "./journey/homeChapterScroll";
import { HomeEngineeringReveal } from "./engineering/HomeEngineeringReveal";
import { useNextRace } from "./useNextRace";
import "./homepageH1.css";
import "./homeLandingV3.css";
import "./homeV83Interactions.css";
import "./journey/homeJourneyMotion.css";
import "./homeCommandV2.css";

export function HomeView({ worldPreview = false }: { worldPreview?: boolean }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const nextRace = useNextRace();

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
    <div className="r1-primary r1-home h1-home home-v3 min-h-screen bg-studio-100">
      {!worldPreview && <HomeCinematicBackground />}
      <PodiumBrandHero />
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
