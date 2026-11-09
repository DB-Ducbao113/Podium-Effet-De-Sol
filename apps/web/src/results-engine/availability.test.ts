import { describe, expect, it } from "vitest";
import type { GrandPrixRound, RaceResult } from "../types";
import type { ResultDataSources } from "./availability";
import {
  getAvailableResultRounds,
  getAvailableSessions,
  getLatestAvailableResultRound,
  getSessionClassification,
  getSessionResultStatus,
} from "./availability";

const session = (name: string) => ({
  name,
  dateStr: "2026-01-01",
  timeStr: "10:00",
  status: "finished" as const,
});
const calendar: GrandPrixRound[] = [
  {
    round: 18,
    name: "Standard GP",
    officialName: "Standard GP",
    circuit: "A",
    location: "A",
    country: "A",
    countryCode: "AA",
    flag: "",
    dates: "2026-01-01",
    season: 2026,
    status: "completed",
    hasSprint: false,
    laps: 50,
    circuitLengthKm: 5,
    raceDistanceKm: 250,
    sessions: {
      fp1: session("Practice 1"),
      fp2: session("Practice 2"),
      fp3: session("Practice 3"),
      qualifying: session("Qualifying"),
      race: session("Race"),
    },
  },
  {
    round: 19,
    name: "Sprint GP",
    officialName: "Sprint GP",
    circuit: "B",
    location: "B",
    country: "B",
    countryCode: "BB",
    flag: "",
    dates: "2026-01-08",
    season: 2026,
    status: "current",
    hasSprint: true,
    laps: 50,
    circuitLengthKm: 5,
    raceDistanceKm: 250,
    sessions: {
      fp1: session("Practice 1"),
      sprintQualifying: session("Sprint Qualifying"),
      sprint: session("Sprint"),
      qualifying: session("Qualifying"),
      race: session("Race"),
    },
  },
  {
    round: 20,
    name: "Future GP",
    officialName: "Future GP",
    circuit: "C",
    location: "C",
    country: "C",
    countryCode: "CC",
    flag: "",
    dates: "2026-01-15",
    season: 2026,
    status: "upcoming",
    hasSprint: false,
    laps: 50,
    circuitLengthKm: 5,
    raceDistanceKm: 250,
    sessions: {
      fp1: session("Practice 1"),
      fp2: session("Practice 2"),
      fp3: session("Practice 3"),
      qualifying: session("Qualifying"),
      race: session("Race"),
    },
  },
];

const raceSummary: RaceResult = {
  round: 18,
  grandPrix: "Standard GP",
  circuit: "A",
  season: 2026,
  date: "2026-01-01",
  dataSource: "Verified snapshot",
  podium: {
    p1: { driver: "Driver One", team: "Team A", time: "1:30:00", points: 25 },
    p2: { driver: "Driver Two", team: "Team B", gap: "+2.000", points: 18 },
    p3: { driver: "Driver Three", team: "Team C", gap: "+3.000", points: 15 },
  },
};

const fp1Entry = {
  position: 1,
  driverId: "one",
  driverName: "Driver One",
  driverCode: "ONE",
  driverNumber: 1,
  teamId: "mclaren" as const,
  teamName: "Team A",
  bestLapTime: "1:20.000",
  gapToP1: "LEADER",
  lapsCompleted: 20,
};
const qEntry = {
  ...fp1Entry,
  q1Time: "1:20.000",
  q2Time: "1:19.500",
  q3Time: "1:19.000",
  gapToPole: "LEADER",
};

const sources: ResultDataSources = {
  season: 2026,
  calendar,
  detailedResults: [],
  raceSummaries: [raceSummary],
  practice: {
    18: {
      round: 18,
      grandPrix: "Standard GP",
      season: 2026,
      circuit: "A",
      sessions: {
        fp1: {
          sessionKey: "fp1",
          sessionName: "Practice 1",
          dateStr: "2026-01-01T10:00:00Z",
          status: "finished",
          entries: [fp1Entry],
        },
        fp2: {
          sessionKey: "fp2",
          sessionName: "Practice 2",
          dateStr: "2026-01-01T14:00:00Z",
          status: "finished",
          entries: [fp1Entry],
        },
        fp3: {
          sessionKey: "fp3",
          sessionName: "Practice 3",
          dateStr: "2026-01-02T10:00:00Z",
          status: "finished",
          entries: [fp1Entry],
        },
      },
    },
    19: {
      round: 19,
      grandPrix: "Sprint GP",
      season: 2026,
      circuit: "B",
      sessions: {
        fp1: {
          sessionKey: "fp1",
          sessionName: "Practice 1",
          dateStr: "2026-01-08T10:00:00Z",
          status: "finished",
          entries: [fp1Entry],
        },
      },
    },
  },
  qualifying: {
    18: {
      round: 18,
      grandPrix: "Standard GP",
      season: 2026,
      circuit: "A",
      sessions: {
        qualifying: {
          sessionKey: "qualifying",
          sessionName: "Qualifying",
          dateStr: "2026-01-02T14:00:00Z",
          status: "finished",
          entries: [qEntry],
        },
      },
    },
  },
};

describe("Results R2 availability", () => {
  it("lists only rounds with a verified classification and selects the latest", () => {
    expect(getAvailableResultRounds(sources)).toEqual([18, 19]);
    expect(getLatestAvailableResultRound(sources)).toBe(19);
  });

  it("orders a standard weekend by importance", () => {
    expect(getAvailableSessions(sources, 18)).toEqual([
      "race",
      "qualifying",
      "fp3",
      "fp2",
      "fp1",
    ]);
  });

  it("adds a new round as soon as verified FP1 rows exist without exposing future rounds", () => {
    expect(getAvailableSessions(sources, 19)).toEqual(["fp1"]);
    expect(getAvailableSessions(sources, 20)).toEqual([]);
  });

  it("keeps absent Sprint sessions awaiting instead of inventing FP2 or FP3", () => {
    expect(getSessionResultStatus(sources, 19, "sprint")).toBe("awaiting");
    expect(getSessionResultStatus(sources, 19, "fp2")).toBe("unavailable");
  });

  it("preserves qualifying phase times and marks a podium summary as partial", () => {
    expect(
      getSessionClassification(sources, 18, "qualifying")?.rows[0].q3,
    ).toBe("1:19.000");
    expect(getSessionClassification(sources, 18, "race")?.partial).toBe(true);
  });

  it("keeps unclassified Sprint drivers visible with their verified status", () => {
    const sprintSources: ResultDataSources = {
      ...sources,
      qualifying: {
        ...sources.qualifying,
        19: {
          round: 19,
          grandPrix: "Sprint GP",
          season: 2026,
          circuit: "B",
          sessions: {
            sprint: {
              sessionKey: "sprint",
              sessionName: "Sprint",
              dateStr: "2026-01-09T10:00:00Z",
              status: "finished",
              entries: [
                { ...qEntry, sprintPoints: 8 },
                {
                  ...qEntry,
                  position: 0,
                  driverId: "two",
                  driverName: "Driver Two",
                  driverCode: "TWO",
                  driverNumber: 2,
                  bestLapTime: "",
                  gapToPole: "",
                  sprintPoints: 0,
                  status: "DNF",
                },
              ],
            },
          },
        },
      },
    };
    const rows = getSessionClassification(sprintSources, 19, "sprint")?.rows;
    expect(rows?.map((row) => row.position)).toEqual([1, 0]);
    expect(rows?.at(-1)?.status).toBe("DNF");
  });
});
