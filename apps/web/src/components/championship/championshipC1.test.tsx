import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ChampionshipCalendar } from "./ChampionshipCalendar";
import { resolveCalendarEntry } from "./calendarNavigation";
import { relevantRound } from "../../utils/relevantRace";
import { ChampionshipStandings } from "./ChampionshipStandings";
import { ChampionshipDirectory } from "./ChampionshipDirectory";
import { WeekendResults } from "./WeekendResults";
import { CALENDAR_2026 } from "../../data/championship/calendar";
import { getCalendarRaceState } from "../../utils/raceSchedule";
import { useNavigationStore } from "../../store/useNavigationStore";

const render = (node: React.ReactNode, path = "/season/2026") =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>{node}</MemoryRouter>,
  );

describe("C1 championship presentation", () => {
  beforeEach(() => useNavigationStore.setState({ lang: "en" }));
  it("selects current, upcoming, then final round from schedule", () => {
    expect(
      relevantRound(CALENDAR_2026, new Date("2026-03-07T03:00:00Z").getTime()),
    ).toBe(1);
    expect(
      relevantRound(CALENDAR_2026, new Date("2026-12-31T00:00:00Z").getTime()),
    ).toBe(23);
  });
  it("keeps normal calendar entry at the tabs and only auto-scrolls explicit round links", () => {
    expect(resolveCalendarEntry(null)).toEqual({
      expandedRound: null,
      autoScrollRound: null,
    });
    expect(resolveCalendarEntry(17)).toEqual({
      expandedRound: 17,
      autoScrollRound: 17,
    });
  });
  it("keeps the calendar to schedule and excludes map/classification UI", () => {
    const html = render(<ChampionshipCalendar season={2026} />, '/season/2026?tab=calendar&view=classic');
    expect(html).toContain("calendar-round-");
    expect(
      html.includes("Go to relevant round") || html.includes("Đến chặng liên quan"),
    ).toBe(true);
    expect(html).not.toContain("CircuitTrackMap");
    expect(html).not.toContain("View Qualifying Table");
  });
  it("makes the world tour the primary calendar while preserving a classic mode", () => {
    const html = render(<ChampionshipCalendar season={2026} />, '/season/2026?tab=calendar');
    expect(html).toContain('THE GRAND PRIX WORLD TOUR');
    expect(html).toContain('rcj-map-pin');
    expect(html).toContain('data-experience="world-tour-v5"');
    expect(html).toContain('data-view-details');
    expect(html).toContain('href="/season/2026?tab=calendar&amp;round=1"');
    expect(html).not.toContain('class="rcj-chapter"');
  });
  it("opens the full calendar for the selected round via View Details", () => {
    const html = render(<ChampionshipCalendar season={2026} />, '/season/2026?tab=calendar&round=1');
    expect(html).toContain('calendar-round-1');
    expect(html).not.toContain('data-experience="world-tour-v5"');
  });
    it("filters rounds by schedule state and exposes the next race", () => {
    const now = Date.now();
    const completedRounds = CALENDAR_2026.filter(
      (race) => getCalendarRaceState(race, now) === "completed",
    ).length;
    const nextRace =
      CALENDAR_2026.find((race) => getCalendarRaceState(race, now) === "current") ??
      CALENDAR_2026.find((race) => getCalendarRaceState(race, now) === "upcoming") ??
      null;
    const completed = render(
      <ChampionshipCalendar season={2026} />,
      "/season/2026?tab=calendar&view=completed",
    );
    const upcoming = render(
      <ChampionshipCalendar season={2026} />,
      "/season/2026?tab=calendar&view=upcoming",
    );
    expect(
      completed.match(/class="c1-round"/g),
    ).toHaveLength(completedRounds);
    expect(upcoming.match(/class="c1-round"/g)).toHaveLength(
      CALENDAR_2026.length - completedRounds,
    );
    expect(completed).toContain(
      'data-filter="completed" aria-pressed="true"',
    );
    expect(completed).not.toContain("CircuitTrackMap");
    expect(completed).not.toContain('href="/circuits"');
    if (nextRace) {
      expect(upcoming).toContain(`data-next-round="${nextRace.round}"`);
      expect(upcoming).toContain(nextRace.name);
      expect(upcoming).toContain("Open Race Center");
      expect(
        upcoming.includes("Lights out in") ||
          upcoming.includes("Race in progress"),
      ).toBe(true);
    } else {
      expect(upcoming).toContain("Season complete");
    }
  });
  it("never renders an isolated session separator when date or time is missing", () => {
    const source = readFileSync(
      "src/components/championship/ChampionshipCalendar.tsx",
      "utf8",
    );
    expect(source).toContain("const partialLabel = [");
    expect(source).toContain("const fallbackTime = [session.dateStr, session.timeStr]");
    expect(source).toMatch(/\.map\(\(part\) => part\?\.trim\(\)\)/);
    expect(source).toContain(".filter(Boolean)");
    expect(source).toContain(".join(' · ')");
    expect(source).toContain("'Time to be confirmed'");
    expect(source).toContain("'Chưa có giờ xác nhận'");
    expect(source).not.toMatch(
      /\{nextRace\.sessions\[key\]\?\.dateStr\}\s*·/,
    );
    expect(source).not.toMatch(/\$\{session\.dateStr\} · \$\{session\.timeStr\}/);
  });
  it("keeps P5 standings movement and form honest", () => {
    const html = render(<ChampionshipStandings season={2026} />);
    expect(html).toContain("p5-table-row");
    expect(html).toContain("No verified prior rank");
    expect(html).toContain("not a full-grid result");
    expect(html).not.toContain("c1-points-track");
  });
  it("renders directory portraits with accessible labels", () => {
    const teams = render(<ChampionshipDirectory season={2026} kind="teams" />);
    expect(teams).toContain("<picture");
    expect(teams).toContain('alt=""');
    expect(teams).toContain('aria-label="P1 ');
    const drivers = render(<ChampionshipDirectory season={2026} kind="drivers" />);
    expect(drivers).toContain("<picture");
    expect(drivers).toContain("Portrait of ");
    expect(drivers).toContain('aria-label="P1 ');
  });
  it("derives Sprint and normal weekend sessions from the calendar", () => {
    const sprint = render(
      <WeekendResults season={2026} />,
      "/season/2026?tab=results&round=17",
    );
    expect(
      sprint.includes("Sprint Qualifying") ||
        sprint.includes("Phân hạng Sprint"),
    ).toBe(true);
    expect(
      sprint.includes("Practice 2</button>") ||
        sprint.includes("Thử nghiệm 2 (FP2)</button>"),
    ).toBe(false);
  });
});
