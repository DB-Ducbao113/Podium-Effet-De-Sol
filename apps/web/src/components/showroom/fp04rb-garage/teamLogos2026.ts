import type { TeamId } from "./teams2026";

import ferrariBadgeUrl from "../../../dev/showroom-review/reference-assets/ferrari-logo.webp";
import mclarenBadgeUrl from "../../../dev/showroom-review/reference-assets/mclaren-logo.webp";
import mclarenWordmarkUrl from "../../../dev/showroom-review/reference-assets/mclaren-wordmark-2021.svg";
import pirelliWordmarkUrl from "../../../dev/showroom-review/reference-assets/mclaren-pirelli-wordmark-transparent.svg";
import cadillacBadgeUrl from "../../../dev/showroom-review/reference-assets/cadillac-logo.webp";
import hpLogoUrl from "../../../dev/showroom-review/reference-assets/hp-logo.svg";
import geminiLogoUrl from "../../../dev/showroom-review/reference-assets/gemini-logo.webp";
import twgAiLogoUrl from "../../../dev/showroom-review/reference-assets/twg-ai-partner.webp";
import mercedesBadgeUrl from "../../../dev/showroom-review/reference-assets/mercedes-official-logo.webp";
import redbullBadgeUrl from "../../../dev/showroom-review/reference-assets/redbull-official-logo.webp";
import racingbullsBadgeUrl from "../../../dev/showroom-review/reference-assets/racingbulls-official-logo.webp";
import astonmartinBadgeUrl from "../../../dev/showroom-review/reference-assets/astonmartin-official-logo.webp";
import alpineBadgeUrl from "../../../dev/showroom-review/reference-assets/alpine-official-logo.webp";
import williamsBadgeUrl from "../../../dev/showroom-review/reference-assets/williams-official-logo.webp";
import haasBadgeUrl from "../../../dev/showroom-review/reference-assets/haas-official-logo.webp";
import haasSidepodMarkUrl from "../../../dev/showroom-review/reference-assets/haas-2026-sidepod-mark-extracted.png";
import audiBadgeUrl from "../../../dev/showroom-review/reference-assets/audi-official-logo.webp";
import redbullGraphicUrl from "../../../dev/showroom-review/reference-assets/redbull-sun-bulls.png";
import petronasWordmarkUrl from "../../../dev/showroom-review/reference-assets/petronas-wordmark-white.png";
import oracleWordmarkUrl from "../../../dev/showroom-review/reference-assets/oracle-wordmark.svg";
import visaWordmarkUrl from "../../../dev/showroom-review/reference-assets/visa-logo.svg";
import aramcoWordmarkUrl from "../../../dev/showroom-review/reference-assets/aramco-logo.webp";
import bwtWordmarkUrl from "../../../dev/showroom-review/reference-assets/bwt-logo.svg";
import atlassianWordmarkUrl from "../../../dev/showroom-review/reference-assets/atlassian-logo.svg";
import barclaysCarMarkUrl from "../../../dev/showroom-review/reference-assets/barclays-car-mark.png";
import komatsuWordmarkUrl from "../../../dev/showroom-review/reference-assets/komatsu-wordmark.svg";
import revolutWordmarkUrl from "../../../dev/showroom-review/reference-assets/revolut-logo.svg";
import tgrWordmarkUrl from "../../../dev/showroom-review/reference-assets/tgr-logo.svg";
import shellMarkUrl from "../../../dev/showroom-review/reference-assets/shell-logo.svg";
import cevaWordmarkUrl from "../../../dev/showroom-review/reference-assets/ceva-logo.svg";
import unicreditWordmarkUrl from "../../../dev/showroom-review/reference-assets/unicredit-logo.svg";
import mastercardMarkUrl from "../../../dev/showroom-review/reference-assets/mastercard-logo.svg";
import dellTechnologiesUrl from "../../../dev/showroom-review/reference-assets/mclaren-dell.svg";
import dropboxWordmarkUrl from "../../../dev/showroom-review/reference-assets/mclaren-dropbox.svg";
import ciscoWordmarkUrl from "../../../dev/showroom-review/reference-assets/mclaren-cisco.svg";
import workdayWordmarkUrl from "../../../dev/showroom-review/reference-assets/mclaren-workday.svg";
import allwynWordmarkUrl from "../../../dev/showroom-review/reference-assets/mclaren-allwyn.webp";
import dpWorldWordmarkUrl from "../../../dev/showroom-review/reference-assets/mclaren-dpworld.webp";
import okxWordmarkUrl from "../../../dev/showroom-review/reference-assets/mclaren-okx.svg";
import ibmWordmarkUrl from "../../../dev/showroom-review/reference-assets/ibm-logo.svg";
import valvolineWordmarkUrl from "../../../dev/showroom-review/reference-assets/valvoline-wing-horizontal.svg";
import eniWordmarkUrl from "../../../dev/showroom-review/reference-assets/media-logoEni.svg";
import fordWordmarkUrl from "../../../dev/showroom-review/reference-assets/ford-logo.svg";
import microsoftWordmarkUrl from "../../../dev/showroom-review/reference-assets/microsoft-logo.svg";

export type LogoAssetKey =
  | "ferrari"
  | "mclaren"
  | "mclarenWordmark"
  | "pirelli"
  | "cadillac"
  | "hp"
  | "gemini"
  | "twg"
  | "mercedes"
  | "redbull"
  | "redbullSunBulls"
  | "racingbulls"
  | "astonmartin"
  | "alpine"
  | "williams"
  | "haas"
  | "haasSidepod"
  | "audi"
  | "petronas"
  | "oracle"
  | "visa"
  | "aramco"
  | "bwt"
  | "atlassian"
  | "barclays"
  | "komatsu"
  | "revolut"
  | "tgr"
  | "shell"
  | "ceva"
  | "unicredit"
  | "mastercard"
  | "dell"
  | "dropbox"
  | "cisco"
  | "workday"
  | "allwyn"
  | "dpWorld"
  | "okx"
  | "ibm"
  | "valvoline"
  | "eni"
  | "ford"
  | "microsoft";

export type LogoToneVariant =
  "original" | "light" | "dark" | "papaya" | "red" | "blue" | "pink";

export interface LogoProcessingSpec {
  url: string;
  cutoutMode: "none" | "edge-flood" | "matte-white" | "matte-gray" | "auto";
  preserveInteriorColors?: boolean;
}

export const LOGO_ASSET_SPECS: Record<LogoAssetKey, LogoProcessingSpec> = {
  ferrari: {
    url: ferrariBadgeUrl,
    cutoutMode: "edge-flood",
    preserveInteriorColors: true,
  },
  mclaren: { url: mclarenBadgeUrl, cutoutMode: "auto" },
  mclarenWordmark: { url: mclarenWordmarkUrl, cutoutMode: "none" },
  pirelli: { url: pirelliWordmarkUrl, cutoutMode: "none" },
  cadillac: {
    url: cadillacBadgeUrl,
    cutoutMode: "auto",
    preserveInteriorColors: true,
  },
  hp: { url: hpLogoUrl, cutoutMode: "none", preserveInteriorColors: true },
  gemini: { url: geminiLogoUrl, cutoutMode: "matte-white" },
  twg: { url: twgAiLogoUrl, cutoutMode: "matte-gray" },
  mercedes: {
    url: mercedesBadgeUrl,
    cutoutMode: "auto",
    preserveInteriorColors: true,
  },
  redbull: {
    url: redbullBadgeUrl,
    cutoutMode: "auto",
    preserveInteriorColors: true,
  },
  redbullSunBulls: {
    url: redbullGraphicUrl,
    cutoutMode: "auto",
    preserveInteriorColors: true,
  },
  racingbulls: {
    url: racingbullsBadgeUrl,
    cutoutMode: "auto",
    preserveInteriorColors: true,
  },
  astonmartin: {
    url: astonmartinBadgeUrl,
    cutoutMode: "auto",
    preserveInteriorColors: true,
  },
  alpine: { url: alpineBadgeUrl, cutoutMode: "auto" },
  williams: { url: williamsBadgeUrl, cutoutMode: "auto" },
  haas: {
    url: haasBadgeUrl,
    cutoutMode: "auto",
    preserveInteriorColors: true,
  },
  haasSidepod: { url: haasSidepodMarkUrl, cutoutMode: "auto" },
  audi: { url: audiBadgeUrl, cutoutMode: "auto" },
  petronas: { url: petronasWordmarkUrl, cutoutMode: "auto" },
  oracle: { url: oracleWordmarkUrl, cutoutMode: "none" },
  visa: { url: visaWordmarkUrl, cutoutMode: "none" },
  aramco: {
    url: aramcoWordmarkUrl,
    cutoutMode: "auto",
    preserveInteriorColors: true,
  },
  bwt: {
    url: bwtWordmarkUrl,
    cutoutMode: "none",
    preserveInteriorColors: true,
  },
  atlassian: { url: atlassianWordmarkUrl, cutoutMode: "none" },
  barclays: { url: barclaysCarMarkUrl, cutoutMode: "auto" },
  komatsu: { url: komatsuWordmarkUrl, cutoutMode: "none" },
  revolut: { url: revolutWordmarkUrl, cutoutMode: "none" },
  tgr: {
    url: tgrWordmarkUrl,
    cutoutMode: "none",
    preserveInteriorColors: true,
  },
  shell: {
    url: shellMarkUrl,
    cutoutMode: "none",
    preserveInteriorColors: true,
  },
  ceva: { url: cevaWordmarkUrl, cutoutMode: "none" },
  unicredit: {
    url: unicreditWordmarkUrl,
    cutoutMode: "none",
    preserveInteriorColors: true,
  },
  mastercard: {
    url: mastercardMarkUrl,
    cutoutMode: "none",
    preserveInteriorColors: true,
  },
  dell: { url: dellTechnologiesUrl, cutoutMode: "none" },
  dropbox: { url: dropboxWordmarkUrl, cutoutMode: "none" },
  cisco: { url: ciscoWordmarkUrl, cutoutMode: "none" },
  workday: {
    url: workdayWordmarkUrl,
    cutoutMode: "none",
    preserveInteriorColors: true,
  },
  allwyn: { url: allwynWordmarkUrl, cutoutMode: "matte-white" },
  dpWorld: { url: dpWorldWordmarkUrl, cutoutMode: "matte-white" },
  okx: { url: okxWordmarkUrl, cutoutMode: "none" },
  ibm: { url: ibmWordmarkUrl, cutoutMode: "none" },
  valvoline: {
    url: valvolineWordmarkUrl,
    cutoutMode: "none",
    preserveInteriorColors: true,
  },
  eni: {
    url: eniWordmarkUrl,
    cutoutMode: "none",
    preserveInteriorColors: true,
  },
  ford: {
    url: fordWordmarkUrl,
    cutoutMode: "none",
    preserveInteriorColors: true,
  },
  microsoft: {
    url: microsoftWordmarkUrl,
    cutoutMode: "none",
    preserveInteriorColors: true,
  },
};

export const TEAM_CONSTRUCTOR_LOGO_KEY: Record<TeamId, LogoAssetKey> = {
  mclaren: "mclaren",
  ferrari: "ferrari",
  mercedes: "mercedes",
  "red-bull": "redbull",
  "racing-bulls": "racingbulls",
  "aston-martin": "astonmartin",
  alpine: "alpine",
  williams: "williams",
  haas: "haas",
  audi: "audi",
  cadillac: "cadillac",
};

const TONE_HEX: Record<
  Exclude<LogoToneVariant, "original">,
  [number, number, number]
> = {
  light: [246, 248, 250],
  dark: [18, 21, 26],
  papaya: [239, 110, 18],
  red: [216, 39, 52],
  blue: [24, 70, 168],
  pink: [241, 132, 189],
};

const baseCutoutCache = new Map<LogoAssetKey, HTMLCanvasElement>();
const variantCache = new Map<string, HTMLCanvasElement>();
const badgeDataUrlCache = new Map<TeamId, string>();
let preloadPromise: Promise<void> | null = null;
let logosReady = false;
const readyListeners = new Set<() => void>();

/**
 * Pure pixel buffer processor (exported for deterministic unit testing in Vitest).
 * Removes opaque edge-connected backgrounds (black/white/gray) without erasing
 * interior enclosed details (such as the black prancing horse inside the Ferrari shield).
 */
export function removeBackgroundFromRgbaBuffer(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  mode: LogoProcessingSpec["cutoutMode"],
): void {
  if (mode === "none" || width <= 0 || height <= 0) return;

  if (mode === "matte-white" || mode === "matte-gray") {
    const bg = mode === "matte-white" ? [255, 255, 255] : [239, 239, 239];
    for (let i = 0; i < data.length; i += 4) {
      const dist = Math.max(
        Math.abs(data[i] - bg[0]),
        Math.abs(data[i + 1] - bg[1]),
        Math.abs(data[i + 2] - bg[2]),
      );
      data[i + 3] = Math.round(
        Math.min(1, Math.max(0, (dist - 10) / 38)) * data[i + 3],
      );
    }
    return;
  }

  // Inspect corners for opaque uniform background
  const corners = [
    0,
    (width - 1) * 4,
    (height - 1) * width * 4,
    ((height - 1) * width + (width - 1)) * 4,
  ];
  let opaqueCorners = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (const c of corners) {
    if (data[c + 3] > 215) {
      opaqueCorners++;
      sumR += data[c];
      sumG += data[c + 1];
      sumB += data[c + 2];
    }
  }
  if (mode === "auto" && opaqueCorners < 2) {
    // Already has a transparent background
    return;
  }

  const bgR = opaqueCorners > 0 ? Math.round(sumR / opaqueCorners) : 0;
  const bgG = opaqueCorners > 0 ? Math.round(sumG / opaqueCorners) : 0;
  const bgB = opaqueCorners > 0 ? Math.round(sumB / opaqueCorners) : 0;
  const tolerance = mode === "edge-flood" ? 44 : 38;

  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const colorDist = (offset: number): number =>
    Math.max(
      Math.abs(data[offset] - bgR),
      Math.abs(data[offset + 1] - bgG),
      Math.abs(data[offset + 2] - bgB),
    );

  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (seen[idx]) return;
    const off = idx * 4;
    if (data[off + 3] > 16 && colorDist(off) > tolerance) return;
    seen[idx] = 1;
    queue[tail++] = idx;
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % width;
    const y = Math.floor(idx / width);
    data[idx * 4 + 3] = 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  // Feather 1-pixel fringe bordering flood-removed background pixels
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (seen[idx]) continue;
      if (
        seen[idx - 1] ||
        seen[idx + 1] ||
        seen[idx - width] ||
        seen[idx + width]
      ) {
        const off = idx * 4;
        const d = colorDist(off);
        if (d < tolerance * 1.65) {
          const factor = Math.min(
            1,
            Math.max(0.15, (d - tolerance * 0.5) / tolerance),
          );
          data[off + 3] = Math.round(data[off + 3] * factor);
        }
      }
    }
  }
}

function trimTransparentCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = source.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;
  const { width, height } = source;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      if (a > 14) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return source;

  const pad = 2;
  const sx = Math.max(0, minX - pad);
  const sy = Math.max(0, minY - pad);
  const sw = Math.min(width - sx, maxX - minX + 1 + pad * 2);
  const sh = Math.min(height - sy, maxY - minY + 1 + pad * 2);

  const trimmed = document.createElement("canvas");
  trimmed.width = sw;
  trimmed.height = sh;
  const tCtx = trimmed.getContext("2d");
  if (tCtx) {
    tCtx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  }
  return trimmed;
}

async function decodeAndCutoutLogo(
  key: LogoAssetKey,
): Promise<HTMLCanvasElement | null> {
  if (typeof Image === "undefined" || typeof document === "undefined")
    return null;
  const cached = baseCutoutCache.get(key);
  if (cached) return cached;

  const spec = LOGO_ASSET_SPECS[key];
  const img = new Image();
  img.decoding = "async";
  img.src = spec.url;
  try {
    await img.decode();
  } catch {
    return null;
  }

  const w = Math.max(1, img.naturalWidth || img.width || 256);
  const h = Math.max(1, img.naturalHeight || img.height || 256);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, w, h);
  if (spec.cutoutMode !== "none") {
    try {
      const pixels = ctx.getImageData(0, 0, w, h);
      removeBackgroundFromRgbaBuffer(pixels.data, w, h, spec.cutoutMode);
      ctx.putImageData(pixels, 0, 0);
    } catch {
      // Ignore in synthetic test DOM without getImageData support
    }
  }

  const trimmed = trimTransparentCanvas(canvas);
  baseCutoutCache.set(key, trimmed);
  variantCache.set(`${key}:original`, trimmed);
  return trimmed;
}

export function getProcessedLogoCanvas(
  key: LogoAssetKey,
  tone: LogoToneVariant = "original",
): HTMLCanvasElement | null {
  const cacheKey = `${key}:${tone}`;
  const existing = variantCache.get(cacheKey);
  if (existing) return existing;

  const base = baseCutoutCache.get(key);
  if (!base) return null;
  if (tone === "original") return base;

  const canvas = document.createElement("canvas");
  canvas.width = base.width;
  canvas.height = base.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return base;

  ctx.drawImage(base, 0, 0);
  try {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = pixels.data;
    const [tr, tg, tb] = TONE_HEX[tone];
    const spec = LOGO_ASSET_SPECS[key];

    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] <= 8) continue;
      if (spec.preserveInteriorColors) {
        // For multi-color emblems (like TWG, Gemini, Unicredit), invert dark text pixels when tone === "light"
        // or darken white text pixels when tone === "dark", keeping colored accents vivid
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const sat = Math.max(r, g, b) - Math.min(r, g, b);
        if (sat < 36) {
          d[i] = tr;
          d[i + 1] = tg;
          d[i + 2] = tb;
        }
      } else {
        d[i] = tr;
        d[i + 1] = tg;
        d[i + 2] = tb;
      }
    }
    ctx.putImageData(pixels, 0, 0);
  } catch {
    return base;
  }

  variantCache.set(cacheKey, canvas);
  return canvas;
}

export function areTeamLogosLoaded(): boolean {
  return logosReady;
}

export function onTeamLogosReady(listener: () => void): () => void {
  if (logosReady) {
    listener();
    return () => {};
  }
  readyListeners.add(listener);
  return () => {
    readyListeners.delete(listener);
  };
}

export function preloadTeamLogos2026(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  const allKeys = Object.keys(LOGO_ASSET_SPECS) as LogoAssetKey[];
  preloadPromise = Promise.all(allKeys.map((k) => decodeAndCutoutLogo(k)))
    .then(() => {
      // Pre-build transparent data URLs for the 11 team selector badges
      (
        Object.entries(TEAM_CONSTRUCTOR_LOGO_KEY) as [TeamId, LogoAssetKey][]
      ).forEach(([teamId, key]) => {
        const tone: LogoToneVariant =
          teamId === "mclaren"
            ? "papaya"
            : teamId === "audi" || teamId === "alpine" || teamId === "williams"
              ? "light"
              : "original";
        const c = getProcessedLogoCanvas(key, tone);
        if (c && typeof c.toDataURL === "function") {
          try {
            badgeDataUrlCache.set(teamId, c.toDataURL("image/png"));
          } catch {
            badgeDataUrlCache.set(teamId, LOGO_ASSET_SPECS[key].url);
          }
        }
      });
      logosReady = true;
      for (const listener of readyListeners) {
        listener();
      }
      readyListeners.clear();
    })
    .catch(() => {
      // Non-fatal in headless/test runs
    });
  return preloadPromise;
}

export function getTeamBadgeUrl(teamId: TeamId): string {
  return (
    badgeDataUrlCache.get(teamId) ??
    LOGO_ASSET_SPECS[TEAM_CONSTRUCTOR_LOGO_KEY[teamId]].url
  );
}
