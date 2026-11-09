import { afterEach, describe, expect, it, vi } from "vitest";
import { shouldShowDocumentIntro } from "./documentIntroState";

afterEach(() => vi.unstubAllGlobals());

describe("document intro route", () => {
  it.each(["/season/2026", "/showroom", "/engineering", "/drivers"])(
    "does not cover direct review route %s",
    (pathname) => {
      vi.stubGlobal("window", {
        location: { pathname, search: "" },
        matchMedia: () => ({ matches: false }),
        sessionStorage: { getItem: () => null },
      });
      expect(shouldShowDocumentIntro()).toBe(false);
    },
  );

  it("keeps the first Homepage entrance", () => {
    vi.stubGlobal("window", {
      location: { pathname: "/", search: "" },
      matchMedia: () => ({ matches: false }),
      sessionStorage: { getItem: () => null },
    });
    expect(shouldShowDocumentIntro()).toBe(true);
  });
});
