import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@react-three/fiber", () => ({
  Canvas: () => null,
  useFrame: () => undefined,
  useThree: () => undefined,
}));
vi.mock("@react-three/drei", () => ({ ContactShadows: () => null }));

vi.stubGlobal("window", { location: { search: "" } });
vi.stubGlobal("document", { visibilityState: "visible" });
vi.stubGlobal("matchMedia", () => ({ matches: false }));

const { App } = await import("./main");

describe("single livery Showroom selection", () => {
  it("offers one 2026 livery for each team without a version switch", () => {
    const html = renderToStaticMarkup(<App embedded />);
    expect(html.match(/aria-label="[^"]+ 2026 livery"/g)).toHaveLength(11);
    expect(html).not.toMatch(
      /2026 launch|Current review|Mexico race|February launch|Belgium 17 Jul|>Version</,
    );
    expect(html).toContain("Photo source");
  });
});
