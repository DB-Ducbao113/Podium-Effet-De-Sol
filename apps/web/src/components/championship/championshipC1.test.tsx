import { beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ChampionshipCalendar } from "./ChampionshipCalendar";
import { resolveCalendarEntry } from "./calendarNavigation";
import { relevantRound } from "../../utils/relevantRace";
import { ChampionshipStandings } from "./ChampionshipStandings";
import { ChampionshipDirectory } from "./ChampionshipDirectory";
import { WeekendResults } from "./WeekendResults";
import { CALENDAR_2026 } from "../../data/championship/calendar";
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
    expect(resolveCalendarEntry(null, 19)).toEqual({
      expandedRound: 19,
      autoScrollRound: null,
    });
    expect(resolveCalendarEntry(17, 19)).toEqual({
      expandedRound: 17,
      autoScrollRound: 17,
    });
  });
  it("keeps the calendar to schedule and excludes map/classification UI", () => {
    const html = render(<ChampionshipCalendar season={2026} />);
    expect(html).toContain("calendar-round-");
    expect(
      html.includes("Relevant round") || html.includes("Về chặng liên quan"),
    ).toBe(true);
    expect(html).not.toContain("CircuitTrackMap");
    expect(html).not.toContain("View Qualifying Table");
  });
  it("shows relative point bars and no fabricated movement", () => {
    const html = render(<ChampionshipStandings season={2026} />);
    expect(
      html.includes("leader points") || html.includes("điểm của người dẫn đầu"),
    ).toBe(true);
    expect(
      html.includes("No comparable verified scoring cutoffs") ||
        html.includes("Chưa có hai mốc tính điểm"),
    ).toBe(true);
    expect(html).toContain("c1-points-track");
  });
  it("keeps directory imagery outside Championship", () => {
    expect(
      render(<ChampionshipDirectory season={2026} kind="teams" />),
    ).not.toContain("<img");
    expect(
      render(<ChampionshipDirectory season={2026} kind="drivers" />),
    ).not.toContain("<img");
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
