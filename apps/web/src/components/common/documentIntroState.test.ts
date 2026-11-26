import { readFileSync } from "node:fs";
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

  it("keeps DocumentIntroController mounted in main.tsx above Storm layers", () => {
    const mainSrc = readFileSync("src/main.tsx", "utf8");
    const introCss = readFileSync(
      "src/components/common/F1StartLightsPreloader.css",
      "utf8",
    );
    expect(mainSrc).toContain("<DocumentIntroController />");
    expect(introCss).toMatch(/\.podium-intro\s*\{[^}]*z-index:\s*9999;/s);
  });
});
