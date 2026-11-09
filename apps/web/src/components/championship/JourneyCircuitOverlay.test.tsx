import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { getCalendarBySeason } from "../../data/championship";
import { getSeasonCircuit } from "../../utils/p5SeasonalVisuals";
import { JourneyCircuitOverlay } from "./JourneyCircuitOverlay";
import {
  formatLatitude,
  formatLongitude,
  resolveCircuit,
} from "./journeyCoordinates";

describe("Journey circuit reveal", () => {
  it("uses the selected season circuit vector and existing detail route", () => {
    const race = getCalendarBySeason(2026)[0];
    const circuit = getSeasonCircuit(2026, race.round);
    expect(circuit).toBeDefined();
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <JourneyCircuitOverlay
          season={2026}
          race={race}
          tab="calendar"
          lang="en"
          reveal={1}
        />
      </MemoryRouter>,
    );
    expect(html).toContain(`data-circuit="${circuit?.id}"`);
    expect(html).toContain(`d="${circuit?.svgPath}"`);
    expect(html).toContain("/season/2026?tab=calendar&amp;round=1");
    expect(html).not.toMatch(/<image|satellite|https?:\/\//i);
  });

  it("keeps an unverified circuit honest and hidden links out of the tab order", () => {
    const race = { ...getCalendarBySeason(2026)[0], round: 999 };
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <JourneyCircuitOverlay
          season={2026}
          race={race}
          tab="results"
          lang="en"
          reveal={0}
        />
      </MemoryRouter>,
    );
    expect(html).toContain("Circuit outline is unavailable.");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('tabindex="-1"');
  });
});

describe("Journey inner core: coordinates, venue, schedule, distance", () => {
  const render = (
    round: number,
    lang: "vi" | "en",
    tab: "results" | "calendar" = "results",
  ) => {
    const race = getCalendarBySeason(2026).find(
      (entry) => entry.round === round,
    )!;
    return {
      race,
      html: renderToStaticMarkup(
        <MemoryRouter>
          <JourneyCircuitOverlay
            season={2026}
            race={race}
            tab={tab}
            lang={lang}
            reveal={1}
          />
        </MemoryRouter>,
      ),
    };
  };

  it("formats geographic coordinates with hemisphere suffixes", () => {
    expect(formatLatitude(-37.85)).toBe("37.850°S");
    expect(formatLatitude(31.339)).toBe("31.339°N");
    expect(formatLongitude(144.969)).toBe("144.969°E");
    expect(formatLongitude(-80.239)).toBe("80.239°W");
    expect(formatLatitude(0)).toBe("0.000°N");
  });

  it("shows the venue coordinates, place name and race distance from the calendar", () => {
    const { race, html } = render(1, "en");
    const geo = resolveCircuit(race)!;
    expect(html).toContain(formatLatitude(geo.latitude));
    expect(html).toContain(formatLongitude(geo.longitude));
    expect(html).toContain("COORDINATES");
    expect(html).toContain("Albert Park");
    expect(html).toContain("Melbourne");
    expect(html).toContain("Australia");
    expect(html).toContain("Race distance");
    expect(html).toContain("306.124 km");
    expect(html).toContain("58");
    expect(html).toContain("5.278 km");
    expect(html).toContain("06 – 08 Mar 2026");
  });

  it("lists the weekend session schedule and highlights the race", () => {
    const { html } = render(1, "en");
    expect(html).toContain("Session schedule");
    expect(html).toContain('data-session="fp1"');
    expect(html).toContain('data-session="qualifying"');
    expect(html).toContain('data-session="race"');
    expect(html).toContain("Practice 1");
    expect(html).toContain("Venue local time");
    expect(html).toContain("UTC+11");
  });

  it("derives Sprint sessions and omits absent practice sessions", () => {
    const { html } = render(2, "en");
    expect(html).toContain('data-session="sprintQualifying"');
    expect(html).toContain('data-session="sprint"');
    expect(html).not.toContain('data-session="fp2"');
    expect(html).not.toContain('data-session="fp3"');
  });

  it("centers the detail group and sequences the schedule focus", () => {
    const { race, html } = render(1, "en");
    expect(html).toContain('class="rcj-circuit-inner"');
    expect(html).toContain(`<strong>${race.location}</strong>`);
    const scheduleId = `rcj-schedule-${race.round}`;
    expect(html).toContain(`id="${scheduleId}"`);
    expect(html).toContain(`aria-labelledby="${scheduleId}"`);
    expect(html).toContain("--rcj-sess-order:0");
    expect(html).toContain("--rcj-sess-order:1");
  });

  it("localises the core labels and decimal separator for Vietnamese", () => {
    const { html } = render(1, "vi");
    expect(html).toContain("TỌA ĐỘ");
    expect(html).toContain("Quãng đường đua");
    expect(html).toContain("Lịch các phiên");
    expect(html).toContain("Thử nghiệm 1");
    expect(html).toContain("Đua chính");
    expect(html).toContain("306,124 km");
    expect(html).toContain("Giờ tại địa điểm đua");
  });
});
