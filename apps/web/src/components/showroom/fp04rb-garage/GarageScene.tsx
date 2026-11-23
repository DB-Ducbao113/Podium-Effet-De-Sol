import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  cloneFp04rbCarInstance,
  disposeFp04rbInstance,
  type CachedFp04rbAsset,
  type Fp04rbCarInstance,
} from "./fp04rbLoader";
import { applyLiveryInPlace } from "./liveryComposer";
import type { LiveryVariantId } from "./liveryPrdManifest2026";
import type { Team2026Spec } from "./teams2026";
import {
  computeMaintenanceTransforms,
  type MaintenanceState,
} from "./ServiceSequence";
import { GarageEquipment } from "./GarageEquipment";
import { GarageLighting } from "./GarageLighting";
import { BAY_X, CAR_Z_CENTER, GARAGE_DIMENSIONS } from "./garageCameraMath";
import type { CachedPitCrewAsset } from "./pitCrewLoader";

export interface GarageSceneProps {
  primaryAsset: CachedFp04rbAsset;
  secondaryAsset: CachedFp04rbAsset;
  pitCrewAsset?: CachedPitCrewAsset | null;
  logosVersion?: number;
  team: Team2026Spec;
  liveryVariant?: LiveryVariantId;
  qualityTier: "desktop" | "mobile";
  maintenanceState: MaintenanceState;
  activeMode: "overview" | "inspection" | "maintenance";
  highlightedPartNode?: string | null;
  onStatsSample?: (stats: { bay1Tris: number; bay2Tris: number }) => void;
}

function makeEpoxyFloorTexture(team: Team2026Spec): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  // Graphite epoxy base
  ctx.fillStyle = "#20252C";
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle floor slab expansion joints (2m grid inside 16x12m floor)
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 2;
  for (let i = 1; i < 8; i++) {
    const p = (i * 1024) / 8;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(1024, p);
    ctx.stroke();
  }

  // Bay 1 (x=-2.85) & Bay 2 (x=+2.85) epoxy outline markings inside 16m floor
  ctx.strokeStyle = team.accentColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(182, 210, 296, 560);
  ctx.strokeStyle = team.primaryColor;
  ctx.strokeRect(546, 210, 296, 560);

  // Pit-lane exit apron threshold lines at +Z (bottom of texture)
  ctx.fillStyle = "#EAB308";
  ctx.fillRect(0, 910, 1024, 14);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(0, 945, 1024, 6);

  // Subtle tyre rubber scuff tracks leading into both bays
  ctx.fillStyle = "rgba(8, 10, 14, 0.25)";
  for (const cx of [330, 694]) {
    ctx.fillRect(cx - 88, 360, 26, 620);
    ctx.fillRect(cx + 62, 360, 26, 620);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export const GarageScene: React.FC<GarageSceneProps> = ({
  primaryAsset,
  secondaryAsset,
  pitCrewAsset,
  logosVersion = 0,
  team,
  liveryVariant,
  qualityTier,
  maintenanceState,
  activeMode,
  highlightedPartNode,
  onStatsSample,
}) => {
  const bay1HostRef = useRef<THREE.Group>(null);
  const bay2HostRef = useRef<THREE.Group>(null);
  const bay1InstanceRef = useRef<Fp04rbCarInstance | null>(null);
  const bay2InstanceRef = useRef<Fp04rbCarInstance | null>(null);

  const floorTex = useMemo(() => makeEpoxyFloorTexture(team), [team]);
  useEffect(() => () => floorTex.dispose(), [floorTex]);

  // Mount GLB car clones once per loaded asset (NOT recreated when switching teams)
  useEffect(() => {
    const host1 = bay1HostRef.current;
    const host2 = bay2HostRef.current;
    if (!host1 || !host2) return;

    const car1 = cloneFp04rbCarInstance(primaryAsset);
    const car2 = cloneFp04rbCarInstance(secondaryAsset);
    bay1InstanceRef.current = car1;
    bay2InstanceRef.current = car2;

    host1.add(car1.root);
    host2.add(car2.root);

    onStatsSample?.({
      bay1Tris: car1.triangles,
      bay2Tris: car2.triangles,
    });

    return () => {
      host1.remove(car1.root);
      host2.remove(car2.root);
      disposeFp04rbInstance(car1);
      disposeFp04rbInstance(car2);
      bay1InstanceRef.current = null;
      bay2InstanceRef.current = null;
    };
  }, [primaryAsset, secondaryAsset, onStatsSample]);

  // Apply 11-team livery in place (0 GLB reloads, 0 car node remounts)
  useEffect(() => {
    const res = qualityTier === "desktop" ? 1024 : 512;
    if (bay1InstanceRef.current) {
      applyLiveryInPlace(
        bay1InstanceRef.current,
        team,
        "bay-1",
        res,
        liveryVariant,
      );
    }
    if (bay2InstanceRef.current) {
      applyLiveryInPlace(
        bay2InstanceRef.current,
        team,
        "bay-2",
        512,
        liveryVariant,
      );
    }
  }, [
    team,
    liveryVariant,
    qualityTier,
    primaryAsset,
    secondaryAsset,
    logosVersion,
  ]);

  // Subtle emissive highlight on inspected mesh group during Technical Inspection mode
  useEffect(() => {
    const car1 = bay1InstanceRef.current;
    if (!car1) return;
    const targetNode =
      activeMode === "inspection" && highlightedPartNode
        ? (car1.partNodes[highlightedPartNode] ?? null)
        : null;

    car1.root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (m instanceof THREE.MeshStandardMaterial) {
          m.emissive.set("#000000");
          m.emissiveIntensity = 0;
        }
      }
    });

    if (targetNode) {
      targetNode.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        for (const m of mats) {
          if (m instanceof THREE.MeshStandardMaterial) {
            m.emissive.set(team.accentColor);
            m.emissiveIntensity = 0.24;
          }
        }
      });
    }
  }, [activeMode, highlightedPartNode, team]);

  const maintenanceTransforms = useMemo(
    () => computeMaintenanceTransforms(maintenanceState),
    [maintenanceState],
  );

  // Drive live articulated maintenance transforms (lift, axial wheel extraction, center nut torque)
  useFrame(() => {
    const car1 = bay1InstanceRef.current;
    if (!car1) return;

    car1.root.position.y = maintenanceTransforms.chassisLiftMeters;

    (["FL", "FR", "RL", "RR"] as const).forEach((corner) => {
      const handles = car1.corners[corner];
      const active = corner === maintenanceState.corner;
      const wheelDx = active
        ? handles.extractSign * maintenanceTransforms.wheelOutwardOffsetMeters
        : 0;
      const nutDx = active
        ? handles.extractSign *
          (maintenanceTransforms.wheelOutwardOffsetMeters +
            maintenanceTransforms.wheelNutOffsetMeters)
        : 0;

      if (handles.wheelPivot) {
        handles.wheelPivot.position.x = handles.initialWheelPos.x + wheelDx;
      }
      if (handles.wheelNut) {
        handles.wheelNut.position.x = handles.initialNutPos.x + nutDx;
        handles.wheelNut.rotation.x = active
          ? maintenanceTransforms.wheelNutSpinRad
          : 0;
      }
    });
  });

  return (
    <group name="F1_PIT_GARAGE_ROOT">
      <GarageLighting
        qualityTier={qualityTier}
        accentColor={team.accentColor}
      />

      {/* EQ-01 & EQ-02: Graphite Epoxy Floor with Bay Lines, Joints & Pit-Lane Exit Apron */}
      <mesh
        name="EQ_02_EPOXY_FLOOR"
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry
          args={[GARAGE_DIMENSIONS.width, GARAGE_DIMENSIONS.depth + 4]}
        />
        <meshStandardMaterial
          map={floorTex}
          roughness={0.42}
          metalness={0.08}
        />
      </mesh>

      {/* Bay 1 Primary FP-04 RB Host */}
      <group
        ref={bay1HostRef}
        name="BAY_01_PRIMARY_HOST"
        position={[BAY_X.bay1, 0, CAR_Z_CENTER]}
      />

      {/* Bay 2 Secondary FP-04 RB Teammate Host */}
      <group
        ref={bay2HostRef}
        name="BAY_02_SECONDARY_HOST"
        position={[BAY_X.bay2, 0, CAR_Z_CENTER]}
      />

      <GarageEquipment
        team={team}
        maintenanceState={maintenanceState}
        maintenanceTransforms={maintenanceTransforms}
        pitCrewAsset={pitCrewAsset}
        logosVersion={logosVersion}
      />
    </group>
  );
};
