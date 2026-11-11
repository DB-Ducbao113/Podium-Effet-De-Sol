import { describe, expect, it } from "vitest";
import {
  CAD_EDGE_THRESHOLD_DEG,
  CAD_RENDER_MODES,
  computeAutoTourPlan,
  isSubtreeVisible,
  nextCadRenderMode,
  resolvePickComponentId,
  type HierarchyVisibilityNode,
} from "./cadPresentation";

interface TestNode extends HierarchyVisibilityNode {
  name: string;
  parent: TestNode | null;
}

describe("CAD presentation & raycast picking helpers", () => {
  it("cycles technical render modes deterministically from PBR -> Hybrid CAD -> CAD Wireframe", () => {
    expect(CAD_RENDER_MODES).toEqual(["pbr", "hybrid", "wireframe"]);
    expect(CAD_EDGE_THRESHOLD_DEG).toBe(22);
    expect(nextCadRenderMode("pbr")).toBe("hybrid");
    expect(nextCadRenderMode("hybrid")).toBe("wireframe");
    expect(nextCadRenderMode("wireframe")).toBe("pbr");
  });

  it("plans proportional Anime.js Auto-Tour runs and wraps cleanly at endpoints", () => {
    expect(computeAutoTourPlan(0, 1, false)).toEqual({
      start: 0,
      end: 1,
      duration: 24000,
    });
    expect(computeAutoTourPlan(0.5, 1, false)).toEqual({
      start: 0.5,
      end: 1,
      duration: 12000,
    });
    expect(computeAutoTourPlan(0.996, 1, false)).toEqual({
      start: 0,
      end: 1,
      duration: 24000,
    });
    expect(computeAutoTourPlan(0, -1, false)).toEqual({
      start: 1,
      end: 0,
      duration: 24000,
    });
    expect(computeAutoTourPlan(0.6, -1, false)).toEqual({
      start: 0.6,
      end: 0,
      duration: 14400,
    });
    expect(computeAutoTourPlan(0, 1, true).duration).toBe(2500);
    expect(computeAutoTourPlan(-2, 1, false).start).toBe(0);
  });

  it("respects ancestor visibility and differentiates opaque vs CAD Wireframe/Cutaway ray picking", () => {
    const root: TestNode = { name: "MODEL", visible: true, parent: null };
    const chassisShell: TestNode = {
      name: "CHASSIS_CORE",
      visible: true,
      parent: root,
    };
    const hullMesh: TestNode = {
      name: "HULL_MESH",
      visible: true,
      parent: chassisShell,
    };
    const engineGroup: TestNode = {
      name: "ENGINE",
      visible: true,
      parent: root,
    };
    const engineMesh: TestNode = {
      name: "ENGINE_MESH",
      visible: true,
      parent: engineGroup,
    };
    const wheelMesh: TestNode = {
      name: "WHEEL_MESH",
      visible: true,
      parent: root,
    };

    const ownerMap = new Map<TestNode, string>([
      [engineMesh, "POWERTRAIN.ENGINE_BLOCK"],
      [wheelMesh, "FRONT_LEFT_WHEEL.WHEEL_OUTER"],
    ]);
    const getComponentId = (n: TestNode) => ownerMap.get(n);

    expect(isSubtreeVisible(hullMesh, root)).toBe(true);
    chassisShell.visible = false;
    expect(isSubtreeVisible(hullMesh, root)).toBe(false);
    chassisShell.visible = true;

    // Opaque hull hits first -> blocks internal engine in opaque PBR/Hybrid without cutaway
    const occludedHits = [{ object: hullMesh }, { object: engineMesh }];
    expect(
      resolvePickComponentId(occludedHits, getComponentId, {
        modelRoot: root,
        renderMode: "pbr",
        cutaway: false,
      }),
    ).toBeNull();
    expect(
      resolvePickComponentId(occludedHits, getComponentId, {
        modelRoot: root,
        renderMode: "hybrid",
        cutaway: false,
      }),
    ).toBeNull();

    // CAD Wireframe lets rays penetrate X-Ray hull onto internal engine block
    expect(
      resolvePickComponentId(occludedHits, getComponentId, {
        modelRoot: root,
        renderMode: "wireframe",
        cutaway: false,
      }),
    ).toBe("POWERTRAIN.ENGINE_BLOCK");

    // Cutaway hides CHASSIS_CORE so internal engine becomes directly pickable even in PBR
    chassisShell.visible = false;
    expect(
      resolvePickComponentId(occludedHits, getComponentId, {
        modelRoot: root,
        renderMode: "pbr",
        cutaway: true,
      }),
    ).toBe("POWERTRAIN.ENGINE_BLOCK");

    // Exterior visible component picks cleanly in all modes
    expect(
      resolvePickComponentId([{ object: wheelMesh }], getComponentId, {
        modelRoot: root,
        renderMode: "pbr",
        cutaway: false,
      }),
    ).toBe("FRONT_LEFT_WHEEL.WHEEL_OUTER");
  });
});
