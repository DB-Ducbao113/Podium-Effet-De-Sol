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
import {
  COCKPIT_PRESERVE_EMISSIVE_KEY,
  enhanceShowroomCockpitMaterials,
} from "./cockpitEnhancer";
import type { LiveryVariantId } from "./liveryPrdManifest2026";
import type { Team2026Spec } from "./teams2026";
import {
  computeMaintenanceTransforms,
  type MaintenanceState,
} from "./ServiceSequence";
import { GarageEquipment } from "./GarageEquipment";
import { GarageLighting } from "./GarageLighting";
import { BAY_X, CAR_Z_CENTER, GARAGE_DIMENSIONS } from "./garageCameraMath";
import type { BayFocus } from "./inspectionParts";
import type { CachedPitCrewAsset } from "./pitCrewLoader";

export interface GarageSceneProps {
  primaryAsset: CachedFp04rbAsset;
  secondaryAsset: CachedFp04rbAsset;
  pitCrewAsset?: CachedPitCrewAsset | null;
  logosVersion?: number;
  team: Team2026Spec;
  liveryVariant?: LiveryVariantId;
  qualityTier: "desktop" | "mobile";
  bayFocus?: BayFocus;
  maintenanceState: MaintenanceState;
  activeMode: "overview" | "inspection" | "maintenance";
  highlightedPartNode?: string | null;
  reducedMotion?: boolean;
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
  bayFocus = "bay-1",
  maintenanceState,
  activeMode,
  highlightedPartNode,
  reducedMotion = false,
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

  // Apply 11-team livery + Engineering-grade cockpit OLED/LED/PBR enhancement in place
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
      enhanceShowroomCockpitMaterials(bay1InstanceRef.current, team, "bay-1");
    }
    if (bay2InstanceRef.current) {
      applyLiveryInPlace(
        bay2InstanceRef.current,
        team,
        "bay-2",
        512,
        liveryVariant,
      );
      enhanceShowroomCockpitMaterials(bay2InstanceRef.current, team, "bay-2");
    }
  }, [
    team,
    liveryVariant,
    qualityTier,
    primaryAsset,
    secondaryAsset,
    logosVersion,
  ]);

  // Subtle emissive highlight on inspected mesh group for the active bay while preserving cockpit OLED & LED emissives
  useEffect(() => {
    const car1 = bay1InstanceRef.current;
    const car2 = bay2InstanceRef.current;
    const isCockpitInspection =
      activeMode === "inspection" && highlightedPartNode === "PART_COCKPIT";

    for (const car of [car1, car2]) {
      if (!car) continue;
      car.root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        for (const m of mats) {
          if (
            m instanceof THREE.MeshStandardMaterial &&
            !m.userData[COCKPIT_PRESERVE_EMISSIVE_KEY]
          ) {
            m.emissive.set("#000000");
            m.emissiveIntensity = 0;
          }
        }
      });
    }

    const activeCar = bayFocus === "bay-2" ? car2 : car1;
    const targetNode =
      activeCar &&
      activeMode === "inspection" &&
      highlightedPartNode &&
      !isCockpitInspection
        ? (activeCar.partNodes[highlightedPartNode] ?? null)
        : null;

    if (targetNode) {
      targetNode.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        for (const m of mats) {
          if (
            m instanceof THREE.MeshStandardMaterial &&
            !m.userData[COCKPIT_PRESERVE_EMISSIVE_KEY]
          ) {
            m.emissive.set(team.accentColor);
            m.emissiveIntensity = 0.22;
          }
        }
      });
    }
  }, [activeMode, bayFocus, highlightedPartNode, team]);

  const maintenanceTransforms = useMemo(
    () => computeMaintenanceTransforms(maintenanceState),
    [maintenanceState],
  );

  // Drive live articulated maintenance transforms on whichever bay is active (Bay 1 OR Bay 2)
  useFrame(() => {
    const applyCarService = (
      car: Fp04rbCarInstance | null,
      isServicedBay: boolean,
    ) => {
      if (!car) return;
      car.root.position.y = isServicedBay
        ? maintenanceTransforms.chassisLiftMeters
        : 0;

      (["FL", "FR", "RL", "RR"] as const).forEach((corner) => {
        const handles = car.corners[corner];
        const active = isServicedBay && corner === maintenanceState.corner;
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
    };

    applyCarService(bay1InstanceRef.current, bayFocus === "bay-1");
    applyCarService(bay2InstanceRef.current, bayFocus === "bay-2");

    if (typeof window !== "undefined") {
      const c1 = bay1InstanceRef.current;
      const c2 = bay2InstanceRef.current;
      const w = window as unknown as Record<string, unknown>;
      w.__PEDS_CAR_SERVICE_STATE__ = {
        bayFocus,
        bay1Lift: c1 ? Number(c1.root.position.y.toFixed(4)) : 0,
        bay2Lift: c2 ? Number(c2.root.position.y.toFixed(4)) : 0,
        bay1MaxWheelDx: c1
          ? Number(
              Math.max(
                ...(["FL", "FR", "RL", "RR"] as const).map((k) =>
                  c1.corners[k].wheelPivot
                    ? Math.abs(
                        c1.corners[k].wheelPivot.position.x -
                          c1.corners[k].initialWheelPos.x,
                      )
                    : 0,
                ),
              ).toFixed(4),
            )
          : 0,
        bay2MaxWheelDx: c2
          ? Number(
              Math.max(
                ...(["FL", "FR", "RL", "RR"] as const).map((k) =>
                  c2.corners[k].wheelPivot
                    ? Math.abs(
                        c2.corners[k].wheelPivot.position.x -
                          c2.corners[k].initialWheelPos.x,
                      )
                    : 0,
                ),
              ).toFixed(4),
            )
          : 0,
      };
    }
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

      {/* Dedicated interior cockpit fill light on active bay so Steering Wheel OLED, encoders, carbon weave & crimson harness shine */}
      <pointLight
        position={[
          bayFocus === "bay-2" ? BAY_X.bay2 : BAY_X.bay1,
          1.18,
          CAR_Z_CENTER + 0.42,
        ]}
        intensity={
          activeMode === "inspection" && highlightedPartNode === "PART_COCKPIT"
            ? 1.9
            : 0.72
        }
        distance={2.4}
        color="#eef6ff"
      />

      <GarageEquipment
        team={team}
        bayFocus={bayFocus}
        maintenanceState={maintenanceState}
        maintenanceTransforms={maintenanceTransforms}
        pitCrewAsset={pitCrewAsset}
        logosVersion={logosVersion}
        reducedMotion={reducedMotion}
      />
    </group>
  );
};
