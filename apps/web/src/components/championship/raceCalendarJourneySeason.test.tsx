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
  it("keeps a season selector inside the immersive Calendar globe stage", () => {
    const html = render("calendar");
    expect(html).toContain("rcj-season-controls");
    expect(html).toContain('href="/season/2025?tab=calendar"');
  });

  it("leaves the Results table to the page-level season selector", () => {
    expect(render("results")).not.toContain("rcj-season-controls");
  });
});
