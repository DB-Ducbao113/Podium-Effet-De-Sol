import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const webRoot = process.cwd();
const temporaryDirectories: string[] = [];
const fixture = () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "peds-build-path-"));
  temporaryDirectories.push(directory);
  return directory;
};
const run = (
  script: string,
  args: string[] = [],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
) =>
  spawnSync(
    process.execPath,
    [path.join(webRoot, "scripts", script), ...args],
    {
      cwd: options.cwd ?? webRoot,
      env: options.env ?? process.env,
      encoding: "utf8",
    },
  );

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe("Cloudflare build output contract", () => {
  it("uses the same client directory in the helper and Wrangler", () => {
    const helper = readFileSync("scripts/build-paths.mjs", "utf8");
    const wrangler = readFileSync("../../wrangler.jsonc", "utf8");
    expect(helper).toMatch(/path\.resolve\(["']dist["'],\s*["']client["']\)/);
    expect(wrangler).toMatch(/"directory"\s*:\s*"\.\/apps\/web\/dist\/client"/);
    for (const script of [
      "generate-seo-artifacts.mjs",
      "prerender-engineering.mjs",
      "prune-legacy-showroom-assets.mjs",
      "check-commercial-visual-isolation.mjs",
    ]) {
      expect(readFileSync(`scripts/${script}`, "utf8")).toContain(
        "from './build-paths.mjs'",
      );
    }
    expect(readFileSync("package.json", "utf8")).toContain(
      "verify-cloudflare-build.mjs",
    );
  });

  it("prerenders Engineering pages from an explicit shell into only the selected output", () => {
    const temporary = fixture();
    const output = path.join(temporary, "client");
    const shell = path.join(temporary, "shell.html");
    writeFileSync(
      shell,
      '<html><head><title>Shell</title></head><body><div id="root"></div></body></html>',
    );
    const result = run("prerender-engineering.mjs", [
      `--output=${output}`,
      `--shell=${shell}`,
    ]);
    expect(result.status).toBe(0);
    expect(existsSync(path.join(output, "engineering", "index.html"))).toBe(
      true,
    );
    const article = JSON.parse(
      readFileSync("src/data/engineeringArticles.json", "utf8"),
    )[0];
    const html = readFileSync(
      path.join(output, "engineering", article.slug, "index.html"),
      "utf8",
    );
    expect(html).toContain("application/ld+json");
    expect(html).toContain("noindex, nofollow");
    expect(existsSync(path.join(temporary, "engineering"))).toBe(false);
  });

  it("keeps prerendered pages noindex in preview even with an indexing flag", () => {
    const temporary = fixture();
    const output = path.join(temporary, "client");
    mkdirSync(output, { recursive: true });
    writeFileSync(
      path.join(output, "index.html"),
      '<html><head><title>Shell</title></head><body><div id="root"></div></body></html>',
    );
    const result = run("prerender-engineering.mjs", [`--output=${output}`], {
      env: {
        ...process.env,
        VITE_SITE_URL: "https://preview.example",
        VITE_ALLOW_INDEXING: "true",
        VITE_DEPLOYMENT_CONTEXT: "preview",
      },
    });
    expect(result.status).toBe(0);
    expect(
      readFileSync(path.join(output, "engineering", "index.html"), "utf8"),
    ).toContain("noindex, nofollow");
  });

  it("fails clearly when the required Vite HTML shell is missing", () => {
    const output = path.join(fixture(), "client");
    const result = run("prerender-engineering.mjs", [`--output=${output}`]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Missing Vite client HTML shell");
    expect(existsSync(path.join(output, "engineering"))).toBe(false);
  });

  it("writes SEO files into the selected client output and blocks preview indexing", () => {
    const output = path.join(fixture(), "client");
    const result = run("generate-seo-artifacts.mjs", [`--output=${output}`], {
      env: {
        ...process.env,
        VITE_SITE_URL: "https://preview.example",
        VITE_ALLOW_INDEXING: "true",
        VITE_DEPLOYMENT_CONTEXT: "preview",
      },
    });
    expect(result.status).toBe(0);
    expect(readFileSync(path.join(output, "robots.txt"), "utf8")).toContain(
      "Disallow: /",
    );
    expect(readFileSync(path.join(output, "sitemap.xml"), "utf8")).toContain(
      "https://preview.example/",
    );
    expect(existsSync(path.join(path.dirname(output), "robots.txt"))).toBe(
      false,
    );
  });

  it("fails closed for a missing original asset without pruning outside client output", () => {
    const temporary = fixture();
    const clientModels = path.join(temporary, "dist", "client", "models");
    const outerModels = path.join(temporary, "dist", "models");
    mkdirSync(clientModels, { recursive: true });
    mkdirSync(outerModels, { recursive: true });
    writeFileSync(
      path.join(temporary, "dist", "client", "index.html"),
      "<html></html>",
    );
    writeFileSync(path.join(clientModels, "c42.v2.glb"), "forbidden");
    writeFileSync(
      path.join(outerModels, "c42.v2.glb"),
      "outside-client-sentinel",
    );
    const result = run("prune-legacy-showroom-assets.mjs", [], {
      cwd: temporary,
    });
    expect(result.status).not.toBe(0);
    expect(existsSync(path.join(clientModels, "c42.v2.glb"))).toBe(false);
    expect(readFileSync(path.join(outerModels, "c42.v2.glb"), "utf8")).toBe(
      "outside-client-sentinel",
    );
    expect(result.stderr).toContain("ENOENT");
  });
});
