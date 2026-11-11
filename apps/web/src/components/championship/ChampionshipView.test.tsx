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

  it("exposes every championship section in one segmented tab rail", () => {
    const html = render("/season/2026?tab=standings");
    for (const tab of ["standings", "calendar", "results", "teams", "drivers"]) {
      expect(html).toContain(`data-championship-tab="${tab}"`);
    }
    expect(html).toContain('aria-label="Championship sections"');
    expect(html).toContain('id="championship-section-tab-standings"');
  });

  it("orders the tab rail like the global navbar: results group first, then standings", () => {
    const html = render("/season/2026?tab=results");
    const order = [...html.matchAll(/data-championship-tab="([a-z]+)"/g)].map((match) => match[1]);
    expect(order).toEqual(["results", "calendar", "standings", "teams", "drivers"]);
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