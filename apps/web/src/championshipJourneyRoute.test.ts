import { describe, expect, it } from "vitest";
import {
  isChampionshipJourneyRoute,
  isChampionshipMobileHubRoute,
} from "./championshipJourneyRoute";

describe("Championship journey scroll policy", () => {
  it("uses the immersive globe route for calendar, including a saved focus round", () => {
    expect(isChampionshipJourneyRoute("/season/2026", "?tab=calendar")).toBe(false);
    expect(isChampionshipJourneyRoute("/season/2026", "?tab=calendar&focus=9")).toBe(false);
    expect(isChampionshipJourneyRoute("/season/2026", "?tab=calendar&view=world")).toBe(true);
    expect(isChampionshipJourneyRoute("/season/2026", "?tab=calendar&view=world&focus=9")).toBe(true);
  });

  it("keeps results on the detailed table layout, never the globe journey", () => {
    expect(isChampionshipJourneyRoute("/season/2026", "?tab=results")).toBe(
      false,
    );
    expect(
      isChampionshipJourneyRoute("/season/2026", "?tab=results&focus=9"),
    ).toBe(false);
  });

  it("opens the mobile championship hub for results and calendar alike", () => {
    expect(isChampionshipMobileHubRoute("/season/2026", "?tab=results")).toBe(
      true,
    );
    expect(isChampionshipMobileHubRoute("/season/2026", "?tab=calendar")).toBe(
      true,
    );
    expect(
      isChampionshipMobileHubRoute("/season/2026", "?tab=calendar&focus=9"),
    ).toBe(true);
    expect(isChampionshipMobileHubRoute("/season/2026","?tab=calendar&view=world")).toBe(true);
    expect(isChampionshipMobileHubRoute("/season/2026", "?tab=results&round=9")).toBe(true);
    expect(isChampionshipMobileHubRoute("/season/2026", "?tab=calendar&round=9&view=classic")).toBe(true);
    expect(isChampionshipMobileHubRoute("/season/2026", "?tab=calendar&view=completed")).toBe(true);
    expect(isChampionshipMobileHubRoute("/showroom", "?tab=calendar")).toBe(
      false,
    );
  });

  it("keeps round details and filtered views outside the map policy", () => {
    expect(
      isChampionshipJourneyRoute("/season/2026", "?tab=calendar&round=9"),
    ).toBe(false);
    expect(
      isChampionshipJourneyRoute(
        "/season/2026",
        "?tab=calendar&view=completed",
      ),
    ).toBe(false);
    expect(
      isChampionshipJourneyRoute("/season/2026", "?tab=results&round=9"),
    ).toBe(false);
    expect(
      isChampionshipJourneyRoute("/season/2026", "?tab=results&view=classic"),
    ).toBe(false);
    expect(isChampionshipJourneyRoute("/showroom", "?tab=calendar")).toBe(
      false,
    );
  });
});
