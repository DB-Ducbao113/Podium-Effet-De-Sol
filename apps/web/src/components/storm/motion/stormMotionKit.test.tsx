import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CircuitTelemetryLine,
  CountdownOdometer,
  LiquidGlassTiltCard,
  MagneticButton,
  OdometerNumber,
  ROUTE_VEIL_MAX_DURATION_MS,
  RouteTransitionVeil,
  STORM_MOTION_PRESETS,
  StormSplitHeadline,
  TelemetryScrambleText,
  clampBoundedOffset,
  computeCardTiltAngles,
  isEligibleForLenis,
} from "./index";

describe("Storm Motion Kit — Pure-Effect Production Integration Suite", () => {
  it("enforces Lenis desktop-only, reduced-motion, and non-3D-route guards (REQ-08)", () => {
    expect(
      isEligibleForLenis({
        enabled: true,
        reducedMotion: false,
        pathname: "/",
        isFinePointer: true,
      }),
    ).toBe(true);

    expect(
      isEligibleForLenis({
        enabled: true,
        reducedMotion: false,
        pathname: "/season/2026",
        isFinePointer: true,
      }),
    ).toBe(true);

    expect(
      isEligibleForLenis({
        enabled: true,
        reducedMotion: true,
        pathname: "/",
        isFinePointer: true,
      }),
    ).toBe(false);

    expect(
      isEligibleForLenis({
        enabled: true,
        reducedMotion: false,
        pathname: "/",
        isFinePointer: false,
      }),
    ).toBe(false);

    for (const route3D of [
      "/showroom",
      "/showroom/",
      "/engineering",
      "/engineering/car-anatomy",
    ]) {
      expect(
        isEligibleForLenis({
          enabled: true,
          reducedMotion: false,
          pathname: route3D,
          isFinePointer: true,
        }),
        route3D,
      ).toBe(false);
    }
  });

  it("keeps magnetic offsets, 3D tilt angles, and route veil duration strictly bounded", () => {
    expect(ROUTE_VEIL_MAX_DURATION_MS).toBeLessThanOrEqual(220);

    expect(clampBoundedOffset(1000, 5)).toBe(5);
    expect(clampBoundedOffset(-1000, 5)).toBe(-5);
    expect(clampBoundedOffset(Number.NaN, 5)).toBe(0);

    const center = computeCardTiltAngles(0.5, 0.5, 3.5);
    expect(center).toEqual({ rotateX: 0, rotateY: 0 });

    const topRight = computeCardTiltAngles(
      1,
      0,
      STORM_MOTION_PRESETS.luxury.tiltMaxDeg,
    );
    expect(topRight.rotateX).toBe(3.5);
    expect(topRight.rotateY).toBe(3.5);
  });

  it("renders pure-effect primitives with accessible semantics, Vietnamese diacritics, and reduced-motion safety", () => {
    const splitHtml = renderToStaticMarkup(
      <StormSplitHeadline as="h1" reducedMotion={true}>
        GIẢI MÃ BIÊN ĐỘ CHIẾN THẮNG.
      </StormSplitHeadline>,
    );
    expect(splitHtml).toContain("GIẢI MÃ BIÊN ĐỘ CHIẾN THẮNG.");

    const scrambleHtml = renderToStaticMarkup(
      <TelemetryScrambleText
        text="RACECRAFT / TELEMETRY"
        reducedMotion={true}
      />,
    );
    expect(scrambleHtml).toContain('aria-label="RACECRAFT / TELEMETRY"');
    expect(scrambleHtml).toContain('aria-hidden="true"');

    const odoHtml = renderToStaticMarkup(
      <OdometerNumber value={384} suffix=" PTS" reducedMotion={true} />,
    );
    expect(odoHtml).toContain('data-fx="FX-03"');

    const countdownHtml = renderToStaticMarkup(
      <CountdownOdometer
        days={2}
        hours={14}
        minutes={5}
        seconds={9}
        reducedMotion={true}
      />,
    );
    expect(countdownHtml).toContain('aria-label="02D 14H 05M 09S"');

    const reducedCardHtml = renderToStaticMarkup(
      <LiquidGlassTiltCard reducedMotion={true} borderBeam={true}>
        <span>Card Body</span>
      </LiquidGlassTiltCard>,
    );
    expect(reducedCardHtml).not.toContain("sm-border-beam");

    const reducedBtnHtml = renderToStaticMarkup(
      <MagneticButton reducedMotion={true}>Action</MagneticButton>,
    );
    expect(reducedBtnHtml).not.toContain("sm-magnetic-sheen");

    const svgHtml = renderToStaticMarkup(
      <CircuitTelemetryLine reducedMotion={true} />,
    );
    expect(svgHtml).toContain('aria-hidden="true"');

    const reducedVeilHtml = renderToStaticMarkup(
      <RouteTransitionVeil triggerKey={1} reducedMotion={true} />,
    );
    expect(reducedVeilHtml).toBe("");
  });

  it("removes the DEV Motion Lab route/page completely and keeps 0 Three.js imports in storm/motion", () => {
    expect(
      existsSync(
        path.resolve("src/components/storm/motion/StormMotionLabPage.tsx"),
      ),
    ).toBe(false);

    const appSource = readFileSync(path.resolve("src/App.tsx"), "utf8");
    expect(appSource).not.toContain("__motion-lab");
    expect(appSource).not.toContain("StormMotionLab");

    const shellSource = readFileSync(
      path.resolve("src/components/storm/StormAppShell.tsx"),
      "utf8",
    );
    expect(shellSource).toContain("useLenisSmoothScroll");
    expect(shellSource).toContain("useStormSurfaceMotion");
    expect(shellSource).toContain("RouteTransitionVeil");

    const motionDir = path.resolve("src/components/storm/motion");
    const files = readdirSync(motionDir).filter(
      (f) => /\.(ts|tsx)$/.test(f) && !f.endsWith(".test.tsx"),
    );
    expect(files.length).toBeGreaterThanOrEqual(10);

    for (const file of files) {
      const src = readFileSync(path.join(motionDir, file), "utf8");
      expect(src, file).not.toMatch(/from\s+["'](?:three|@react-three\/)/);
    }
  });
});
