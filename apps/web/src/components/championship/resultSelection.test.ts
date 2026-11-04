import { describe, expect, it } from "vitest";
import type { ResultSessionKey } from "../../results-engine/availability";
import {
  getClassificationPresentation,
  resolveResultRound,
  resolveResultSession,
} from "./resultSelection";

describe("resolveResultRound", () => {
  it("keeps a requested round that exists in the season calendar", () => {
    expect(resolveResultRound([1, 2, 3, 4], 4, 2)).toBe(2);
  });

  it("falls back to the latest verified round when the request is outside the calendar", () => {
    expect(resolveResultRound([1, 2, 3, 4], 4, 99)).toBe(4);
  });

  it("does not assume a fixed round limit", () => {
    const rounds = [1, 2, 3, 4, 5, 6, 7];
    expect(resolveResultRound(rounds, rounds.at(-1) ?? null, 7)).toBe(7);
    expect(resolveResultRound(rounds, rounds.at(-1) ?? null, 8)).toBe(7);
  });

  it("falls back to the first available round when no verified round exists", () => {
    expect(resolveResultRound([1, 2], null, 9)).toBe(1);
  });

  it("returns null when the season has no rounds", () => {
    expect(resolveResultRound([], null, 1)).toBeNull();
  });
});

describe("resolveResultSession", () => {
  const sessions: ResultSessionKey[] = ["race", "qualifying", "fp2", "fp1"];

  it("keeps a requested session that the weekend actually ran", () => {
    expect(resolveResultSession(sessions, ["race", "fp1"], "fp1")).toBe("fp1");
  });

  it("falls back to the first verified session when the request does not exist", () => {
    expect(resolveResultSession(sessions, ["race", "fp1"], "sprint")).toBe(
      "race",
    );
  });

  it("falls back to the first scheduled session when nothing is verified", () => {
    expect(resolveResultSession(sessions, [], "sprint")).toBe("race");
  });

  it("accepts a requested session even when its result is not yet verified", () => {
    expect(resolveResultSession(sessions, [], "qualifying")).toBe("qualifying");
  });
});

describe("getClassificationPresentation", () => {
  it("treats a verified summary as a summary, not a final classification", () => {
    expect(
      getClassificationPresentation({ status: "final", partial: true }, false),
    ).toBe("summary");
  });

  it("distinguishes final, provisional, scheduled and unavailable", () => {
    expect(
      getClassificationPresentation({ status: "final" }, false),
    ).toBe("final");
    expect(
      getClassificationPresentation({ status: "provisional" }, false),
    ).toBe("provisional");
    expect(getClassificationPresentation(null, true)).toBe("scheduled");
    expect(getClassificationPresentation(null, false)).toBe("unavailable");
  });
});
