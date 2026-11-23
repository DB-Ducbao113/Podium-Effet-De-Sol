import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import {
  FP04RB_PAINTABLE_SLOTS,
  FP04RB_REQUIRED_NODES,
  cloneFp04rbCarInstance,
  disposeFp04rbInstance,
  type CachedFp04rbAsset,
} from "./fp04rbLoader";
import { TEAMS_2026 } from "./teams2026";
import { applyLiveryInPlace, buildLiveryAtlasSummary } from "./liveryComposer";
import { removeBackgroundFromRgbaBuffer } from "./teamLogos2026";
import {
  applyTeamSuitToPitCrew,
  clonePitCrewInstance,
  disposePitCrewInstance,
  type CachedPitCrewAsset,
} from "./pitCrewLoader";

function buildSyntheticAsset(): CachedFp04rbAsset {
  const root = new THREE.Group();
  root.name = "FP04RB_CAR_ROOT";
  for (const name of FP04RB_REQUIRED_NODES) {
    if (name === "FP04RB_CAR_ROOT") continue;
    const matName =
      name === "PART_BODY_SHELL"
        ? "main_body_texture"
        : name === "PART_FRONT_WING"
          ? "front_wing_texture"
          : name === "PART_REAR_WING"
            ? "rear_wing_texture"
            : name === "PART_FLOOR"
              ? "floor_texture"
              : name === "PART_SUSPENSION"
                ? "Carbon Fiber (no UV)"
                : "carbon";
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshPhysicalMaterial({ name: matName }),
    );
    mesh.name = name;
    root.add(mesh);
  }
  for (const extraSlot of FP04RB_PAINTABLE_SLOTS) {
    if (!root.getObjectByName(extraSlot)) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        new THREE.MeshStandardMaterial({ name: extraSlot }),
      );
      m.name = extraSlot;
      root.add(m);
    }
  }
  return {
    lod: "desktop",
    url: "/models/fp04rb-showroom-desktop.glb",
    template: root,
    bytes: 5534176,
    fetchMs: 5,
    decodeParseMs: 10,
    triangles: 230242,
    meshCount: 25,
  };
}

function stubCanvas2dEnvironment() {
  const noop = () => { };
  const fakeCtx = {
    save: noop,
    restore: noop,
    fillRect: noop,
    strokeRect: noop,
    clearRect: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    quadraticCurveTo: noop,
    arc: noop,
    rect: noop,
    clip: noop,
    fill: noop,
    stroke: noop,
    translate: noop,
    rotate: noop,
    scale: noop,
    fillText: noop,
    strokeText: noop,
    drawImage: noop,
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    font: "12px sans-serif",
    textAlign: "center",
    textBaseline: "middle",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
  };
  vi.stubGlobal("document", {
    createElement: (tag: string) => {
      if (tag !== "canvas") throw new Error(`Unexpected tag ${tag}`);
      return { width: 0, height: 0, getContext: () => fakeCtx };
    },
  });
}

describe("liveryComposer UV zones, orientations, and 0-reload swap", () => {
  it("builds complete upright/non-mirrored decal descriptors for all 11 teams", () => {
    for (const team of TEAMS_2026) {
      const summary = buildLiveryAtlasSummary(team, "bay-1");
      expect(summary.carNumber).toBe(team.carNumbers.bay1);
      expect(summary.decals.length).toBeGreaterThanOrEqual(8);

      const leftPod = summary.decals.find((d) => d.id === "sidepod-left");
      const rightPod = summary.decals.find((d) => d.id === "sidepod-right");
      expect(leftPod?.rotationRad).toBe(Math.PI);
      expect(rightPod?.rotationRad).toBe(0);

      if (team.id === "cadillac") {
        // Default Cadillac variant is Belgian GP (Spa: bilateral white-top / black-bottom)
        expect(summary.variantId).toBe("cadillac-spa-2026");
        expect(summary.asymmetricSplit).toBe(false);
        expect(summary.zones.sidepodLeft).toEqual(summary.zones.sidepodRight);

        // Secondary Debut variant preserves asymmetric white-left / black-right split
        const debutSummary = buildLiveryAtlasSummary(
          team,
          "bay-1",
          "cadillac-debut-2026",
        );
        expect(debutSummary.variantId).toBe("cadillac-debut-2026");
        expect(debutSummary.asymmetricSplit).toBe(true);
        expect(debutSummary.zones.sidepodLeft).not.toEqual(
          debutSummary.zones.sidepodRight,
        );
      }
    }
  });

  it("cycles all 11 teams in place without recreating car root or leaking textures", () => {
    stubCanvas2dEnvironment();
    const asset = buildSyntheticAsset();
    const instance = cloneFp04rbCarInstance(asset);
    const originalRoot = instance.root;

    const disposedCounts: number[] = [];
    for (let i = 0; i < TEAMS_2026.length; i++) {
      const prevTextures = [...instance.ownedTextures];
      const spies = prevTextures.map((t) => vi.spyOn(t, "dispose"));

      applyLiveryInPlace(instance, TEAMS_2026[i], "bay-1", 512);

      if (i > 0) {
        for (const s of spies) expect(s).toHaveBeenCalledOnce();
        disposedCounts.push(spies.length);
      }
      expect(instance.root).toBe(originalRoot);
      expect(instance.ownedTextures).toHaveLength(11);

      const bodyMat = instance.paintMaterials.get("main_body_texture")?.[0];
      expect(bodyMat?.map).not.toBeNull();
      expect(bodyMat?.map?.flipY).toBe(false);
      expect(bodyMat?.userData.carSpaceMode).toBe("body");
      expect(bodyMat?.userData.carSpaceUniforms?.uCarAtlas?.value).toBeTruthy();
      expect(bodyMat?.customProgramCacheKey()).toBe(
        "fp04rb-car-space-livery-v1-body",
      );
      const rawCarbonMat = instance.paintMaterials.get(
        "Carbon Fiber (no UV)",
      )?.[0];
      expect(rawCarbonMat?.color.getHexString()).toBe("181b20");
    }

    expect(disposedCounts).toHaveLength(10);
    disposeFp04rbInstance(instance);
    expect(instance.ownedTextures).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it("removes edge-connected background pixels while preserving enclosed interior logo pixels", () => {
    // 5x5 synthetic badge: black border (y=0,4 or x=0,4), yellow shield ring (x,y in 1..3), and black interior horse center at (2,2)
    const width = 5;
    const height = 5;
    const buf = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const off = (y * width + x) * 4;
        const isRing =
          x >= 1 && x <= 3 && y >= 1 && y <= 3 && !(x === 2 && y === 2);
        if (isRing) {
          buf[off] = 255;
          buf[off + 1] = 224;
          buf[off + 2] = 69;
          buf[off + 3] = 255;
        } else {
          // Black at outer border AND at enclosed center (2,2)
          buf[off] = 0;
          buf[off + 1] = 0;
          buf[off + 2] = 0;
          buf[off + 3] = 255;
        }
      }
    }

    removeBackgroundFromRgbaBuffer(buf, width, height, "edge-flood");
    // Outer black corner (0,0) must become transparent (alpha === 0)
    expect(buf[3]).toBe(0);
    // Enclosed black center (2,2) inside the yellow shield must remain opaque (alpha === 255)
    const centerAlpha = buf[(2 * width + 2) * 4 + 3];
    expect(centerAlpha).toBe(255);
  });

  it("clones rigged pit crew instances and updates team race suit, helmet, chest logo, and wheel gun visibility", () => {
    stubCanvas2dEnvironment();
    const root = new THREE.Group();
    const suitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.5, 0.2),
      new THREE.MeshStandardMaterial({ name: "crew_suit_primary" }),
    );
    const helmetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12),
      new THREE.MeshStandardMaterial({ name: "crew_helmet_shell" }),
    );
    const logoPatch = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 0.12),
      new THREE.MeshStandardMaterial({ name: "crew_chest_logo" }),
    );
    const gunMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.25),
      new THREE.MeshStandardMaterial({ name: "crew_metal" }),
    );
    gunMesh.name = "CREW_WHEEL_GUN";
    root.add(suitMesh, helmetMesh, logoPatch, gunMesh);

    const fakeAsset: CachedPitCrewAsset = {
      url: "/models/fp04rb-pit-crew-v1.glb",
      template: root,
      animations: [
        new THREE.AnimationClip("Idle_Standby", 1.92, []),
        new THREE.AnimationClip("WheelGun_Crouch", 1.44, []),
      ],
      triangles: 29886,
    };

    const crew = clonePitCrewInstance(fakeAsset);
    expect(crew.actions.Idle_Standby).toBeDefined();
    expect(crew.actions.WheelGun_Crouch).toBeDefined();

    for (const team of TEAMS_2026) {
      applyTeamSuitToPitCrew(crew, team, "primary", team.id === "ferrari");
      const suitMat = crew.materials.get("crew_suit_primary")?.[0];
      expect(suitMat?.color.getHexString().toUpperCase()).toBe(
        team.zonePaint.crewSuitPrimary.slice(1).toUpperCase(),
      );
      expect(crew.gunMeshes[0]?.visible).toBe(team.id === "ferrari");
    }

    disposePitCrewInstance(crew);
    expect(crew.ownedTextures).toHaveLength(0);
    vi.unstubAllGlobals();
  });
});
