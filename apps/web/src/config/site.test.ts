import { describe, expect, it } from "vitest";
import { isPreviewHostname, resolveCanIndexHost } from "./site";

describe("Site indexing host boundary", () => {
  it("allows indexing when the live host exactly matches the configured production VITE_SITE_URL", () => {
    expect(
      resolveCanIndexHost({
        configuredSiteUrl: "https://podiumeds.ducbao147258.workers.dev",
        indexingRequested: true,
        deploymentContext: "production",
        locationOrigin: "https://podiumeds.ducbao147258.workers.dev",
        locationHostname: "podiumeds.ducbao147258.workers.dev",
      }),
    ).toBe(true);
  });

  it("blocks indexing on preview contexts, localhost, and unconfigured preview hosts", () => {
    expect(isPreviewHostname("preview.podiumeds.workers.dev")).toBe(true);
    expect(
      resolveCanIndexHost({
        configuredSiteUrl: "https://podiumeds.ducbao147258.workers.dev",
        indexingRequested: true,
        deploymentContext: "preview",
        locationOrigin: "https://podiumeds.ducbao147258.workers.dev",
        locationHostname: "podiumeds.ducbao147258.workers.dev",
      }),
    ).toBe(false);
    expect(
      resolveCanIndexHost({
        configuredSiteUrl: "https://podiumeds.ducbao147258.workers.dev",
        indexingRequested: true,
        deploymentContext: "production",
        locationOrigin: "https://other-preview.ducbao147258.workers.dev",
        locationHostname: "other-preview.ducbao147258.workers.dev",
      }),
    ).toBe(false);
    expect(
      resolveCanIndexHost({
        configuredSiteUrl: "http://localhost:5173",
        indexingRequested: true,
        deploymentContext: "production",
        locationOrigin: "http://localhost:5173",
        locationHostname: "localhost",
      }),
    ).toBe(false);
  });
});
