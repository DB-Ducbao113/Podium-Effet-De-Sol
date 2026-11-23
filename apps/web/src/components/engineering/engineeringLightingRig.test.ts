import { describe, expect, it } from "vitest";
import {
  COCKPIT_INTERIOR_LIGHT_PRESET,
  ENGINEERING_CHAPTER_LIGHT_PRESETS,
  classifyEngineeringMaterial,
  createMutableLightRigState,
  resolveMaterialClassEnvIntensity,
  resolveTargetLightPreset,
  stepLightRigTowardChapter,
} from "./engineeringLightingRig";
import { ENGINEERING_STORY_CHAPTERS } from "./engineeringStoryTimeline";

describe("engineeringLightingRig — chapter studio lighting & material-class calibration", () => {
  it("defines restrained, finite lighting presets for all eight engineering chapters", () => {
    for (const ch of ENGINEERING_STORY_CHAPTERS) {
      const preset = ENGINEERING_CHAPTER_LIGHT_PRESETS[ch.id];
      expect(preset).toBeDefined();
      expect(preset.ambientIntensity).toBeGreaterThanOrEqual(0.35);
      expect(preset.ambientIntensity).toBeLessThanOrEqual(0.55);
      expect(preset.keyIntensity).toBeGreaterThanOrEqual(1.8);
      expect(preset.keyIntensity).toBeLessThanOrEqual(2.8);
      expect(preset.accentPointIntensity).toBeLessThanOrEqual(1.3);
    }

    // Core chapter shifts accent point light below the car for Venturi underfloor illumination
    expect(
      ENGINEERING_CHAPTER_LIGHT_PRESETS.core.accentPointPosition[1],
    ).toBeLessThan(0);
    // Cockpit chapter keeps task light off-axis (non-zero X) to avoid washing out the central OLED
    expect(
      Math.abs(
        ENGINEERING_CHAPTER_LIGHT_PRESETS.cockpit.accentPointPosition[0],
      ),
    ).toBeGreaterThan(0.5);
  });

  it("converges smoothly between chapter lighting presets without overshoot", () => {
    const state = createMutableLightRigState();
    for (let i = 0; i < 40; i += 1) {
      stepLightRigTowardChapter(state, "core", 0.25);
    }
    expect(state.accentPointPosition[1]).toBeCloseTo(
      ENGINEERING_CHAPTER_LIGHT_PRESETS.core.accentPointPosition[1],
      3,
    );
    expect(state.accentPointColor).toBe(
      ENGINEERING_CHAPTER_LIGHT_PRESETS.core.accentPointColor,
    );
  });

  it("elevates interior tub fill for carbon seat and survival liner without altering steering wheel OLED lighting", () => {
    const wheelPreset = resolveTargetLightPreset(
      "cockpit",
      "STEERING_WHEEL_LCD",
    );
    const seatPreset = resolveTargetLightPreset(
      "cockpit",
      "COCKPIT_SEAT_CARBON",
    );
    const linerPreset = resolveTargetLightPreset(
      "cockpit",
      "COCKPIT_SURVIVAL_LINER",
    );

    expect(wheelPreset).toEqual(ENGINEERING_CHAPTER_LIGHT_PRESETS.cockpit);
    expect(seatPreset).toEqual(COCKPIT_INTERIOR_LIGHT_PRESET);
    expect(linerPreset).toEqual(COCKPIT_INTERIOR_LIGHT_PRESET);
    expect(seatPreset.accentPointIntensity).toBeGreaterThan(
      wheelPreset.accentPointIntensity,
    );
    expect(seatPreset.fillIntensity).toBeGreaterThan(wheelPreset.fillIntensity);

    const state = createMutableLightRigState();
    for (let i = 0; i < 40; i += 1) {
      stepLightRigTowardChapter(state, "cockpit", 0.25, "COCKPIT_SEAT_CARBON");
    }
    expect(state.accentPointIntensity).toBeCloseTo(
      COCKPIT_INTERIOR_LIGHT_PRESET.accentPointIntensity,
      3,
    );
  });

  it("distinguishes painted bodywork, carbon fiber, tire rubber, machined metal, glass, and cockpit displays", () => {
    expect(classifyEngineeringMaterial("main_body_texture", false, false)).toBe(
      "painted-bodywork",
    );
    expect(
      classifyEngineeringMaterial("Carbon Fiber (no UV)", false, false),
    ).toBe("carbon-fiber");
    expect(classifyEngineeringMaterial("Tyre Thread ", false, false)).toBe(
      "rubber-fabric",
    );
    expect(
      classifyEngineeringMaterial("SE_Titanium_Machined", false, false),
    ).toBe("metal-machined");
    expect(
      classifyEngineeringMaterial("glass_clear_headlight", true, false),
    ).toBe("glass-alpha");
    expect(
      classifyEngineeringMaterial("ferrari_dashboard_screen", false, true),
    ).toBe("display-sticker");
    expect(
      classifyEngineeringMaterial("steering_wheel_stickers.001", false, false),
    ).toBe("display-sticker");

    // Metals & clearcoat paint reflect significantly more studio IBL than matte tire rubber & cockpit displays
    const metalEnv = resolveMaterialClassEnvIntensity(
      "SE_Titanium_Machined",
      false,
      false,
    );
    const paintEnv = resolveMaterialClassEnvIntensity(
      "main_body_texture",
      false,
      false,
    );
    const carbonEnv = resolveMaterialClassEnvIntensity(
      "Carbon Fiber (no UV)",
      false,
      false,
    );
    const rubberEnv = resolveMaterialClassEnvIntensity(
      "Tyre Thread ",
      false,
      false,
    );
    const oledEnv = resolveMaterialClassEnvIntensity(
      "ferrari_dashboard_screen",
      false,
      true,
    );

    expect(metalEnv).toBeGreaterThan(paintEnv);
    expect(paintEnv).toBeGreaterThan(carbonEnv);
    expect(carbonEnv).toBeGreaterThan(rubberEnv);
    expect(oledEnv).toBeLessThan(rubberEnv);
  });
});
