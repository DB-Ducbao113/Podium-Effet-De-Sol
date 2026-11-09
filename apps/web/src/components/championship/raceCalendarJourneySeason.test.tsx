import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RaceCalendarJourney } from "./RaceCalendarJourney";

function render(tab: "calendar" | "results") {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[`/season/2026?tab=${tab}`]}>
      <RaceCalendarJourney season={2026} />
    </MemoryRouter>,
  );
}

describe("journey season navigation", () => {
  it("leaves Calendar to the page-level sticky selector", () => {
    expect(render("calendar")).not.toContain("rcj-season-controls");
  });

  it("keeps a season selector inside the immersive Results stage", () => {
    const html = render("results");
    expect(html).toContain("rcj-season-controls");
    expect(html).toContain('href="/season/2025?tab=results"');
  });
});
