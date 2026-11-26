import { describe, expect, it } from "vitest";
import {
  engineeringInspectionReducer,
  INITIAL_ENGINEERING_INSPECTION_STATE,
  resolveEngineeringInspectionPose,
} from "./engineeringInspectionState";
import {
  ENGINEERING_PARTS,
  evaluateEngineeringTimeline,
} from "./engineeringDisassemblyData";

describe("Engineering component inspection state", () => {
  it("reassembles every component at its current story pose without accumulating offset", () => {
    const evaluation = evaluateEngineeringTimeline(0.55);

    for (const part of ENGINEERING_PARTS) {
      const storyPose = evaluation.parts[part.id];
      expect(
        resolveEngineeringInspectionPose(
          storyPose,
          part.explodeOffset,
          part.explodeEuler,
          false,
        ),
      ).toBe(storyPose);

      expect(
        resolveEngineeringInspectionPose(
          storyPose,
          part.explodeOffset,
          part.explodeEuler,
          true,
        ),
      ).toEqual({
        tx: part.explodeOffset[0],
        ty: part.explodeOffset[1],
        tz: part.explodeOffset[2],
        rx: part.explodeEuler[0],
        ry: part.explodeEuler[1],
        rz: part.explodeEuler[2],
      });
    }
  });

  it("interpolates inspection motion from the current story pose and back to the exact datum", () => {
    const part = ENGINEERING_PARTS.find(
      (entry) => entry.id === "FRONT_WING_ASSEMBLY",
    );
    if (!part) throw new Error("Expected front wing assembly in catalog");
    const storyPose = evaluateEngineeringTimeline(0.12).parts[part.id];
    const halfway = resolveEngineeringInspectionPose(
      storyPose,
      part.explodeOffset,
      part.explodeEuler,
      true,
      0.5,
    );
    expect(halfway.tx).toBeCloseTo((storyPose.tx + part.explodeOffset[0]) / 2);
    expect(halfway.ty).toBeCloseTo((storyPose.ty + part.explodeOffset[1]) / 2);
    expect(halfway.rz).toBeCloseTo((storyPose.rz + part.explodeEuler[2]) / 2);
    const restored = resolveEngineeringInspectionPose(
      storyPose,
      part.explodeOffset,
      part.explodeEuler,
      true,
      0,
    );
    expect(restored).toEqual({
      tx: storyPose.tx,
      ty: storyPose.ty,
      tz: storyPose.tz,
      rx: storyPose.rx,
      ry: storyPose.ry,
      rz: storyPose.rz,
    });
    expect(
      resolveEngineeringInspectionPose(
        storyPose,
        part.explodeOffset,
        part.explodeEuler,
        true,
        1,
      ),
    ).toEqual({
      tx: part.explodeOffset[0],
      ty: part.explodeOffset[1],
      tz: part.explodeOffset[2],
      rx: part.explodeEuler[0],
      ry: part.explodeEuler[1],
      rz: part.explodeEuler[2],
    });
  });

  it("isolates a selected component and reassembles it without changing the scroll mode", () => {
    const selected = engineeringInspectionReducer(
      INITIAL_ENGINEERING_INSPECTION_STATE,
      { type: "select", partId: "FRONT_WING_ASSEMBLY" },
    );
    const isolated = engineeringInspectionReducer(selected, {
      type: "isolate",
    });

    expect(isolated).toEqual({
      selectedPartId: "FRONT_WING_ASSEMBLY",
      isolatedPartId: "FRONT_WING_ASSEMBLY",
      orbitMode: true,
    });

    expect(
      engineeringInspectionReducer(isolated, { type: "reassemble" }),
    ).toEqual({
      selectedPartId: "FRONT_WING_ASSEMBLY",
      isolatedPartId: null,
      orbitMode: false,
    });
  });

  it("retargets an active isolation when another component is selected", () => {
    const isolated = engineeringInspectionReducer(
      {
        selectedPartId: "FRONT_WING_ASSEMBLY",
        isolatedPartId: "FRONT_WING_ASSEMBLY",
        orbitMode: true,
      },
      { type: "select", partId: "POWERTRAIN_V6_HYBRID" },
    );

    expect(isolated).toEqual({
      selectedPartId: "POWERTRAIN_V6_HYBRID",
      isolatedPartId: "POWERTRAIN_V6_HYBRID",
      orbitMode: true,
    });
  });

  it("exits isolation on chapter changes and clears inspection on a missed click", () => {
    const isolated = {
      selectedPartId: "FRONT_WING_ASSEMBLY",
      isolatedPartId: "FRONT_WING_ASSEMBLY",
      orbitMode: true,
    };

    expect(
      engineeringInspectionReducer(isolated, { type: "chapter-change" }),
    ).toEqual({
      selectedPartId: "FRONT_WING_ASSEMBLY",
      isolatedPartId: null,
      orbitMode: false,
    });
    expect(
      engineeringInspectionReducer(isolated, { type: "select", partId: null }),
    ).toEqual(INITIAL_ENGINEERING_INSPECTION_STATE);
  });
});
