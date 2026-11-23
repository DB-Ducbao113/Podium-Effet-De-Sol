import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { MeshoptDecoder } from "meshoptimizer";
import { getProcessedLogoCanvas } from "./teamLogos2026";
import type { Team2026Spec } from "./teams2026";

export const PIT_CREW_GLB_URL = "/models/fp04rb-pit-crew-v1.glb";

export type PitCrewAnimationName =
  "Idle_Standby" | "WheelGun_Crouch" | "Jack_Operate" | "Telemetry_Console";

export interface CachedPitCrewAsset {
  url: string;
  template: THREE.Group;
  animations: THREE.AnimationClip[];
  triangles: number;
}

export interface PitCrewInstance {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  actions: Partial<Record<PitCrewAnimationName, THREE.AnimationAction>>;
  materials: Map<string, THREE.MeshStandardMaterial[]>;
  gunMeshes: THREE.Object3D[];
  ownedTextures: THREE.Texture[];
}

let cachedCrewPromise: Promise<CachedPitCrewAsset> | null = null;

export function loadPitCrewAsset(
  url = PIT_CREW_GLB_URL,
): Promise<CachedPitCrewAsset> {
  if (cachedCrewPromise) return cachedCrewPromise;

  cachedCrewPromise = (async () => {
    await MeshoptDecoder.ready;
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url);

    let triangles = 0;
    gltf.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.frustumCulled = false;
        const geom = obj.geometry;
        if (geom) {
          triangles += geom.index
            ? geom.index.count / 3
            : (geom.attributes.position?.count ?? 0) / 3;
        }
      }
    });

    return {
      url,
      template: gltf.scene,
      animations: gltf.animations ?? [],
      triangles: Math.round(triangles),
    };
  })().catch((err) => {
    cachedCrewPromise = null;
    throw err;
  });

  return cachedCrewPromise;
}

export function clonePitCrewInstance(
  asset: CachedPitCrewAsset,
): PitCrewInstance {
  const root = SkeletonUtils.clone(asset.template);
  const materials = new Map<string, THREE.MeshStandardMaterial[]>();
  const gunMeshes: THREE.Object3D[] = [];

  root.traverse((obj) => {
    if (
      obj.name.includes("WHEEL_GUN") ||
      obj.name.includes("CrewWheelGunData")
    ) {
      gunMeshes.push(obj);
    }
    if (!(obj instanceof THREE.Mesh)) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    obj.frustumCulled = false;

    const cloneMat = (m: THREE.Material): THREE.Material => {
      const cloned = m.clone();
      if (cloned instanceof THREE.MeshStandardMaterial) {
        const list = materials.get(cloned.name) ?? [];
        list.push(cloned);
        materials.set(cloned.name, list);
      }
      return cloned;
    };

    if (Array.isArray(obj.material)) {
      obj.material = obj.material.map(cloneMat);
    } else if (obj.material) {
      obj.material = cloneMat(obj.material);
    }
  });

  const mixer = new THREE.AnimationMixer(root);
  const actions: Partial<Record<PitCrewAnimationName, THREE.AnimationAction>> =
    {};
  for (const clip of asset.animations) {
    const name = clip.name as PitCrewAnimationName;
    actions[name] = mixer.clipAction(clip);
  }

  return {
    root,
    mixer,
    actions,
    materials,
    gunMeshes,
    ownedTextures: [],
  };
}

function makeChestPatchTexture(
  team: Team2026Spec,
  suitColor: string,
): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = suitColor;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle racing stripe across chest patch
  ctx.fillStyle = team.accentColor;
  ctx.fillRect(16, 196, 224, 18);

  const logoCanvas = getProcessedLogoCanvas(
    team.logos.constructorBadge.key,
    team.logos.constructorBadge.tone,
  );
  if (logoCanvas && logoCanvas.width > 0 && logoCanvas.height > 0) {
    const aspect = logoCanvas.width / logoCanvas.height;
    let dw = 188;
    let dh = dw / aspect;
    if (dh > 136) {
      dh = 136;
      dw = dh * aspect;
    }
    ctx.drawImage(logoCanvas, (256 - dw) / 2, (184 - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = '900 44px "Inter", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(team.shortCode, 128, 104);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.needsUpdate = true;
  return tex;
}

export function applyTeamSuitToPitCrew(
  instance: PitCrewInstance,
  team: Team2026Spec,
  suitRole: "primary" | "secondary",
  holdingGun: boolean,
): void {
  for (const prev of instance.ownedTextures) {
    prev.dispose();
  }
  instance.ownedTextures.length = 0;

  const zp = team.zonePaint;
  const mainSuitColor =
    suitRole === "primary" ? zp.crewSuitPrimary : zp.crewSuitSecondary;
  const trimSuitColor =
    suitRole === "primary" ? zp.crewSuitSecondary : zp.crewSuitPrimary;

  const setColor = (
    slot: string,
    hex: string,
    roughness: number,
    metalness: number,
  ) => {
    const list = instance.materials.get(slot);
    if (!list) return;
    for (const mat of list) {
      mat.map = null;
      mat.color.set(hex);
      mat.roughness = roughness;
      mat.metalness = metalness;
      mat.needsUpdate = true;
    }
  };

  setColor("crew_suit_primary", mainSuitColor, 0.52, 0.04);
  setColor("crew_suit_secondary", trimSuitColor, 0.56, 0.05);
  setColor("crew_suit_accent", team.accentColor, 0.36, 0.14);
  setColor("crew_helmet_shell", zp.crewHelmet, 0.16, 0.28);
  setColor("crew_visor_glass", "#090D12", 0.08, 0.88);
  setColor("crew_gear_dark", "#14171D", 0.64, 0.08);
  setColor("crew_metal", "#B8C2CC", 0.26, 0.86);

  const patchTex = makeChestPatchTexture(team, mainSuitColor);
  if (patchTex) {
    instance.ownedTextures.push(patchTex);
    const patchMats = instance.materials.get("crew_chest_logo") ?? [];
    for (const mat of patchMats) {
      mat.map = patchTex;
      mat.color.set("#FFFFFF");
      mat.roughness = 0.42;
      mat.metalness = 0.05;
      mat.needsUpdate = true;
    }
  }

  for (const gun of instance.gunMeshes) {
    gun.visible = holdingGun;
  }
}

export function disposePitCrewInstance(instance: PitCrewInstance): void {
  instance.mixer.stopAllAction();
  for (const tex of instance.ownedTextures) {
    tex.dispose();
  }
  instance.ownedTextures.length = 0;
  for (const list of instance.materials.values()) {
    for (const mat of list) {
      mat.dispose();
    }
  }
  instance.materials.clear();
}
