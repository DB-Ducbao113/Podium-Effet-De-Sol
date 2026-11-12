import { beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ChampionshipView } from "./ChampionshipView";
import { useChampionshipStore } from "../../store/useChampionshipStore";
import { useNavigationStore } from "../../store/useNavigationStore";

const render = (path: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <ChampionshipView season={2026} onSeasonChange={() => {}} />
    </MemoryRouter>,
  );

describe("Championship in-page navigation", () => {
  beforeEach(() => {
    useNavigationStore.setState({ lang: "en" });
    useChampionshipStore.setState({
      activeSubTab: "standings",
      standingsCategory: "drivers",
    });
  });

  it("does not duplicate the global navbar in Standings", () => {
    const html = render("/season/2026?tab=standings");
    expect(html).not.toContain('data-championship-tab="standings"');
    expect(html).not.toContain('aria-label="Championship sections"');
    expect(html).toContain('f4-category-toggle');
    expect(html).toContain('data-season-option="2026"');
    expect(html).toContain('p5-standings-v5');
  });

  it("does not repeat the global navbar on Results, but preserves season controls", () => {
    useChampionshipStore.setState({ activeSubTab: "results" });
    const html = render("/season/2026?tab=results");
    expect(html).not.toContain('data-championship-tab="results"');
    expect(html).not.toContain('aria-label="Championship sections"');
    expect(html).toContain('data-season-option="2026"');
    expect(html).toContain('data-championship-refresh');
  });

  it("leaves calendar to global navigation and preserves the immersive route", () => {
    useChampionshipStore.setState({activeSubTab:"calendar"});
    const html = render("/season/2026?tab=calendar");
    expect(html).not.toContain('data-championship-tab="calendar"');
    expect(html).not.toContain('aria-label="Championship sections"');
    expect(html).toContain('destination-v6');
    expect(html).toContain('Race destinations.');
    expect(html).toContain('World tour');
    expect(html).toContain('href="/season/2026?tab=calendar&amp;view=world"');
    expect(html).not.toContain('cal-v5__world');
  });

  it("offers a drivers/constructors toggle on standings", () => {
    const html = render("/season/2026?tab=standings&category=drivers");
    expect(html).toContain("f4-category-toggle");
    expect(html).toMatch(/aria-pressed="true"[^>]*>Drivers</);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Constructors</);
  });

  it("keeps the standings hero a section heading, not a second page h1", () => {
    const html = render("/season/2026?tab=standings");
    expect(html).toContain('<h2 class="p5-mega"');
    expect(html).not.toContain('<h1 class="p5-mega"');
  });
});