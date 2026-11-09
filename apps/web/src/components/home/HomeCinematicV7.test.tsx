import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeCinematicBackground } from "./HomeCinematicBackground";
import { HomeRacePulseScene } from "./HomeRacePulseScene";

const root = "src/components/home";
const home = readFileSync(root + "/HomeView.tsx", "utf8");
const hero = readFileSync(root + "/PodiumBrandHero.tsx", "utf8");
const background = readFileSync(root + "/HomeCinematicBackground.tsx", "utf8");

describe("Homepage V8.2 — V7 DOM contract and model-free F1 Hero", () => {
  it("keeps one full-page environment and all four content sections", () => {
    expect(home).toContain("<HomeCinematicBackground />");
    expect(home).not.toContain("<HomeJourneyMotion />");
    expect(home).toContain("<PodiumBrandHero />");
    expect(home).toContain("<HomeRaceControl race={nextRace} />");
    expect(home).toContain("<HomeSeasonOverview />");
    expect(home).toContain("<HomeStoryLinks />");
    const html = renderToStaticMarkup(<HomeCinematicBackground />);
    expect(html).toContain('data-home-environment="full-page"');
    expect(html).toContain('data-aerocore-mode="fallback"');
    expect(html).not.toMatch(/<canvas|<img|<video|<picture/i);
  });
  it("keeps the homepage in normal document flow without pinned scroll chapters", () => {
    expect(home).not.toContain("<HomeChapterFrame");
    expect(home).not.toContain("homePinnedChapters.css");
    expect(home).toContain("homeJourneyMotion.css");
  });
  it("displays an original 2.5D F1 illustration without road, track or WebGL", () => {
    const html = renderToStaticMarkup(<HomeRacePulseScene />);
    expect(html).toContain('data-home-hero-visual="f1-2.5d"');
    expect(html).toContain("f1hero__vehicle");
    expect(html).not.toMatch(/road|track|trajectory|kerb|<canvas|<video/i);
    expect(html).toContain("peds-aero01-car.webp");
    expect(hero).toContain("<HomeRacePulseScene />");
    expect(hero).toContain("r1-cinema--v7");
    expect(hero).toContain("navigate('/showroom')");
  });
  it("does not mount a WebGL background or import Model B", () => {
    expect(background).not.toContain("import('./aerocore/AeroCanvas')");
    expect(background).toContain("static low-cost atmosphere");
    expect(background).not.toMatch(
      /from ['"](?:three|@react-three\/fiber|@react-three\/drei)['"]/,
    );
    expect(home).not.toContain("ModelBShowroom");
  });
});
