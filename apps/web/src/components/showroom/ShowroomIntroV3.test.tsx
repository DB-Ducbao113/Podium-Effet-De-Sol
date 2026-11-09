import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ShowroomIntroV3, { ShowroomIntroSurface } from "./ShowroomIntroV3";
import {
  SHOWROOM_INTRO_COPY,
  SHOWROOM_INTRO_MEDIA,
  type ShowroomIntroPhase,
  type ShowroomIntroTier,
} from "./showroomIntroState";
import type { Language } from "../../types";

const noop = () => {};
const videoRef = { current: null };
const openRef = { current: null };
const skipRef = { current: null };

function surface(
  lang: Language,
  tier: ShowroomIntroTier,
  phase: ShowroomIntroPhase,
  progress = 0,
) {
  return renderToStaticMarkup(
    <ShowroomIntroSurface
      lang={lang}
      tier={tier}
      phase={phase}
      progress={progress}
      videoRef={videoRef}
      openRef={openRef}
      skipRef={skipRef}
      onOpen={noop}
      onEnter={noop}
      onTimeUpdate={noop}
    />,
  );
}

describe("ShowroomIntroV3 surface", () => {
  it("renders the gate with open and skip controls in both languages", () => {
    for (const lang of ["vi", "en"] as const) {
      const html = surface(lang, "T2", "gate");
      const copy = SHOWROOM_INTRO_COPY[lang];
      expect(html).toContain('data-phase="gate"');
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="false"');
      expect(html).toContain(copy.eyebrow);
      expect(html).toContain(copy.open);
      expect(html).toContain(copy.skip);
      expect(html).toContain(SHOWROOM_INTRO_MEDIA.poster);
      expect(html).toContain("sr-intro-open");
      expect(html).toContain("sr-intro-skip");
    }
  });

  it("trims the gate to essential copy, dropping the lede and caption annotations", () => {
    for (const lang of ["vi", "en"] as const) {
      const html = surface(lang, "T2", "gate");
      expect(html).not.toContain("sr-intro-lede");
      expect(html).not.toContain("sr-intro-hint");
      expect(html).not.toContain("sr-intro-review");
    }
  });

  it("layers cinematic motion behind the gate: rays, rushing rings and trailing sparks", () => {
    const html = surface("en", "T2", "gate");
    expect(html).toContain("sr-intro-rays");
    expect(html).toContain("sr-intro-glow");
    expect(html).toContain("sr-intro-ring--1");
    expect(html).toContain("sr-intro-embers");
    expect((html.match(/sr-intro-ember"/g) ?? []).length).toBe(7);
    expect(html).toContain("--ember-x");
    expect(html).toContain("--ember-y");
  });

  it("keeps the gate padding valid by wrapping zoom division in calc", () => {
    const css = readFileSync(
      "src/components/showroom/showroomIntroV3.css",
      "utf8",
    );
    // Bare `6vw / var(...)` in a shorthand is invalid CSS and silently drops the
    // whole padding, leaving the gate flush against the screen edge.
    expect(css).toMatch(/padding: 0 calc\(6vw \/ var\(--peds-visual-zoom\)\)/);
    expect(css).toContain(
      "padding-bottom: calc(4vh / var(--peds-visual-zoom))",
    );
  });

  it("drives the motion with compositor keyframes and disables it for reduced motion", () => {
    const css = readFileSync(
      "src/components/showroom/showroomIntroV3.css",
      "utf8",
    );
    expect(css).toContain("@keyframes sr-poster-drift");
    expect(css).toContain("@keyframes sr-rays-spin");
    expect(css).toContain("@keyframes sr-ember-fly");
    expect(css).toContain("@keyframes sr-glow-breathe");
    expect(css).toContain("@keyframes sr-ring-pulse");
    const reduced = css.slice(
      css.indexOf("@media (prefers-reduced-motion: reduce)"),
    );
    expect(reduced).toContain("sr-intro-rays");
    expect(reduced).toContain("sr-intro-ember");
    expect(reduced).toContain('.sr-intro[data-phase="gate"] .sr-intro-poster');
  });

  it("keeps T0 free of video and both film sources", () => {
    const html = surface("en", "T0", "gate");
    expect(html).toContain(SHOWROOM_INTRO_MEDIA.poster);
    expect(html).not.toContain("<video");
    expect(html).not.toContain(SHOWROOM_INTRO_MEDIA.webm);
    expect(html).not.toContain(SHOWROOM_INTRO_MEDIA.mp4);
  });

  it("selects only the small MP4 for T1", () => {
    const html = surface("en", "T1", "gate");
    expect(html).toContain("<video");
    expect(html).toContain(SHOWROOM_INTRO_MEDIA.mp4);
    expect(html).not.toContain(SHOWROOM_INTRO_MEDIA.webm);
  });

  it("offers WebM with an MP4 fallback for T2", () => {
    const html = surface("en", "T2", "gate");
    expect(html).toContain(SHOWROOM_INTRO_MEDIA.webm);
    expect(html).toContain(SHOWROOM_INTRO_MEDIA.mp4);
    expect(html.indexOf(SHOWROOM_INTRO_MEDIA.webm)).toBeLessThan(
      html.indexOf(SHOWROOM_INTRO_MEDIA.mp4),
    );
    expect(html).toContain("muted");
    expect(html).toContain("playsinline");
    expect(html).toContain('preload="none"');
  });

  it("exposes a skip target and progress bar while the film plays", () => {
    const html = surface("vi", "T2", "playing", 0.4);
    expect(html).toContain('data-phase="playing"');
    expect(html).toContain("sr-intro-hit");
    expect(html).toContain("sr-intro-skip");
    expect(html).toContain("scaleX(0.4)");
    expect(html).toContain(SHOWROOM_INTRO_COPY.vi.filmLabel);
  });

  it("marks the entered phase and keeps skip available", () => {
    const html = surface("en", "T2", "entered", 1);
    expect(html).toContain('data-phase="entered"');
    expect(html).toContain("scaleX(1)");
    expect(html).toContain("sr-intro-skip");
    expect(html).toContain("sr-intro-veil");
  });

  it("never carries the retired model, simulated room, car images or ownership claims", () => {
    for (const tier of ["T0", "T1", "T2"] as ShowroomIntroTier[]) {
      for (const phase of [
        "gate",
        "playing",
        "entered",
      ] as ShowroomIntroPhase[]) {
        const html = surface("en", tier, phase).toLowerCase();
        expect(html).not.toContain("eds-g01");
        expect(html).not.toContain("livery");
        expect(html).not.toContain("spec");
        expect(html).not.toContain('.webp" alt="f1');
        expect(html).not.toMatch(/ownership|own the model/);
      }
    }
  });

  it("renders the gate by default from the stateful container during SSR", () => {
    const html = renderToStaticMarkup(
      <ShowroomIntroV3 lang="en" tier="T2" onEnter={noop} onDismissed={noop} />,
    );
    expect(html).toContain('data-phase="gate"');
    expect(html).toContain(SHOWROOM_INTRO_COPY.en.open);
    expect(html).toContain("sr-intro-skip");
  });
});
