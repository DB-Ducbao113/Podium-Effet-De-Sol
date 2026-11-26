import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

describe("Plan 4 — Storm Cutover & Legacy Retirement Boundary (US-04)", () => {
  it("AC-04.1 & AC-04.5: removes all src/dev modules and keeps 0 /__peds-prototype-assets or Model B runtime references", () => {
    expect(existsSync("src/dev")).toBe(false);

    const activeSrcFiles = walkFiles("src").filter(
      (f) => /\.(ts|tsx|css)$/.test(f) && !f.includes(".test."),
    );
    expect(activeSrcFiles.length).toBeGreaterThan(20);

    for (const file of activeSrcFiles) {
      const content = readFileSync(file, "utf8");
      expect(content, file).not.toContain("/__peds-prototype-assets");
      expect(content, file).not.toContain("model-b-eds-optimized-v1.glb");
      expect(content, file).not.toContain("hero-h3-2.mp4");
      expect(content, file).not.toContain("intro-tunnel-720.webm");
    }
  });

  it("AC-04.4: preserves CSP and Permissions-Policy lines 1..7 of public/_headers while caching /models/*", () => {
    const lines = readFileSync("public/_headers", "utf8")
      .replace(/\r\n/g, "\n")
      .split("\n");
    expect(lines[0]).toBe("/*");
    expect(lines[1]).toContain("Content-Security-Policy: default-src 'self';");
    expect(lines[2]).toBe(
      "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
    );
    expect(lines[5]).toBe("  X-Content-Type-Options: nosniff");
    expect(lines[6]).toBe("  X-Frame-Options: SAMEORIGIN");
    expect(lines.join("\n")).toContain("/models/*");
    expect(lines.join("\n")).toContain("/images/*");
    expect(lines.join("\n")).toContain("/logo/*");
    expect(lines.join("\n")).toContain("max-age=31536000");
    expect(lines.join("\n")).not.toContain("model-b-eds-optimized-v1.glb");
  });

  it("ships valid Agent Discoverability manifests (llms.txt and .well-known/ard.json) and responsive 240w AVIF logo", () => {
    const llms = readFileSync("public/llms.txt", "utf8");
    expect(llms).toMatch(/^#\s+\S+/m);
    expect(llms).toMatch(/\[[^\]]+\]\(https:\/\/[^)]+\)/);

    const ard = JSON.parse(readFileSync("public/.well-known/ard.json", "utf8"));
    expect(ard.version).toBeTruthy();
    expect(ard.name).toContain("PODIUM");
    expect(Array.isArray(ard.resources)).toBe(true);
    expect(ard.resources.length).toBeGreaterThanOrEqual(4);

    expect(existsSync("public/logo/logo-240.avif")).toBe(true);
    expect(existsSync("public/logo/logo-240.webp")).toBe(true);
  });
});
