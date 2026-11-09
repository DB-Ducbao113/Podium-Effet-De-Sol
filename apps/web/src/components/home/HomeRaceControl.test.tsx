import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CALENDAR_2026 } from "../../data/championship";
import { getSessionTimeRange } from "../../utils/raceSchedule";
import { HomeRaceControl } from "./HomeRaceControl";

const render = (race?: (typeof CALENDAR_2026)[number]) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <HomeRaceControl race={race} />
    </MemoryRouter>,
  );

afterEach(() => vi.useRealTimers());

describe("HomeRaceControl", () => {
  it("shows the scheduled race start as an explicit UTC time before the decorative map", () => {
    const race = CALENDAR_2026[0];
    const start = getSessionTimeRange(race, "race")?.start;
    expect(start).toBeDefined();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const html = render(race);
    expect(html).toContain(`dateTime="${start?.toISOString()}"`);
    expect(html).toContain("UTC</time>");
    expect(html.indexOf("home-rc__identity")).toBeLessThan(
      html.indexOf("home-rc__map"),
    );
    expect(html).toContain('role="timer"');
    expect(html).toContain("SEC</small>");
    expect(html).toMatch(/seconds remaining/);
  });

  it("states when no upcoming race exists without inventing a countdown", () => {
    const html = render();
    expect(html).toContain("No upcoming race");
    expect(html).toContain("No upcoming race start to count down");
    expect(html).not.toContain('role="timer"');
    expect(html).toContain('href="/season/2026?tab=calendar"');
  });

  it("replaces the abstract signal field with the real circuit trace and weekend schedule", () => {
    const html = render(CALENDAR_2026[0]);
    expect(html).toContain('class="home-rc__track"');
    expect(html).toContain("CIRCUIT / VECTOR");
    expect(html).not.toContain("home-rc__signal");
    expect(html).not.toContain("SIGNAL / FIELD");
    expect(html).toContain("home-rc__sessions");
    expect((html.match(/data-session-row/g) ?? []).length).toBe(5);
  });

  it("distinguishes elapsed scheduled rounds from the latest verified result", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
    const html = render(CALENDAR_2026[19]);
    expect(html).toContain("LATEST VERIFIED RESULT");
    expect(html).toContain("Newer rounds await verified results.");
    expect(html).toContain('href="/season/2026/race/15"');
  });
});
