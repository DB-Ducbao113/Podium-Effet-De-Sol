import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { BAY_X, GARAGE_DIMENSIONS } from "./garageCameraMath";
import type { WheelCorner } from "./fp04rbLoader";
import {
  applyTeamSuitToPitCrew,
  clonePitCrewInstance,
  disposePitCrewInstance,
  type CachedPitCrewAsset,
  type PitCrewAnimationName,
  type PitCrewInstance,
} from "./pitCrewLoader";
import { getProcessedLogoCanvas } from "./teamLogos2026";
import type { Team2026Spec } from "./teams2026";
import type {
  MaintenanceState,
  MaintenanceTransforms,
} from "./ServiceSequence";

export interface GarageEquipmentProps {
  team: Team2026Spec;
  maintenanceState: MaintenanceState;
  maintenanceTransforms: MaintenanceTransforms;
  pitCrewAsset?: CachedPitCrewAsset | null;
  logosVersion?: number;
}

function makeSignageTexture(
  team: Team2026Spec,
  bayLabel: string,
  driverLabel: string,
  subtitle: string,
  _logosVersion = 0,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#12151A";
  ctx.fillRect(0, 0, 1024, 256);

  ctx.fillStyle = team.primaryColor;
  ctx.fillRect(0, 0, 32, 256);
  ctx.fillStyle = team.accentColor;
  ctx.fillRect(32, 0, 10, 256);

  ctx.fillStyle = team.accentColor;
  ctx.font = '800 28px "Inter", Arial, sans-serif';
  ctx.fillText(bayLabel, 68, 64);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = '900 54px "Inter", Arial, sans-serif';
  ctx.fillText(team.name.toUpperCase(), 68, 136);

  ctx.fillStyle = "#B8C2CC";
  ctx.font = '600 26px "Inter", Arial, sans-serif';
  ctx.fillText(`${driverLabel} · ${subtitle}`, 68, 202);

  // Draw transparent-cutout constructor badge on right side of bay signage board
  const badgeCanvas = getProcessedLogoCanvas(
    team.logos.constructorBadge.key,
    team.logos.constructorBadge.tone,
  );
  if (badgeCanvas && badgeCanvas.width > 0 && badgeCanvas.height > 0) {
    const aspect = badgeCanvas.width / badgeCanvas.height;
    let dw = 172;
    let dh = dw / aspect;
    if (dh > 168) {
      dh = 168;
      dw = dh * aspect;
    }
    ctx.drawImage(badgeCanvas, 892 - dw / 2, 128 - dh / 2, dw, dh);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function makeTelemetryScreenTexture(
  team: Team2026Spec,
  screenIndex: number,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#090D12";
  ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let x = 32; x < 512; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 320);
    ctx.stroke();
  }
  for (let y = 32; y < 320; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  ctx.fillStyle = team.accentColor;
  ctx.font = "700 18px monospace";
  ctx.fillText(
    screenIndex % 2 === 0
      ? `BAY DIAGNOSTIC // ${team.shortCode} [ILLUSTRATIVE]`
      : `TYRE & FLOOR BALANCE // FP-04 RB CONCEPT`,
    20,
    34,
  );
  // Stylized illustrative sinusoidal traces
  ctx.strokeStyle = team.primaryColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 20; x <= 492; x += 6) {
    const y =
      135 + Math.sin(x * 0.03 + screenIndex) * 34 + Math.cos(x * 0.08) * 14;
    if (x === 20) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = team.accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 20; x <= 492; x += 6) {
    const y = 230 + Math.cos(x * 0.025 + screenIndex * 1.4) * 26;
    if (x === 20) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const CornerWheelSet: React.FC<{
  position: [number, number, number];
  accentColor: string;
  rotationY?: number;
}> = ({ position, accentColor, rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    {[0, 0.38, 0.76, 1.14].map((offset, idx) => (
      <group
        key={idx}
        position={[offset, 0.36, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.32, 18]} />
          <meshStandardMaterial
            color="#181A1E"
            roughness={0.62}
            metalness={0.05}
          />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.21, 0.21, 0.33, 14]} />
          <meshStandardMaterial
            color="#2C323B"
            roughness={0.35}
            metalness={0.75}
          />
        </mesh>
        <mesh>
          <torusGeometry args={[0.27, 0.015, 8, 20]} />
          <meshStandardMaterial
            color={accentColor}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
      </group>
    ))}
  </group>
);

const LowPolyMechanic: React.FC<{
  position: [number, number, number];
  rotationY: number;
  suitColor: string;
  accentColor: string;
  crouched?: boolean;
  holdingGun?: boolean;
  name: string;
}> = ({
  position,
  rotationY,
  suitColor,
  accentColor,
  crouched = false,
  holdingGun = false,
  name,
}) => {
  const hipY = crouched ? 0.52 : 0.88;
  const torsoAngle = crouched ? 0.42 : 0.06;

  return (
    <group name={name} position={position} rotation={[0, rotationY, 0]}>
      {/* Boots / Lower legs */}
      <mesh position={[-0.12, hipY * 0.5, 0]} castShadow>
        <boxGeometry args={[0.13, hipY, 0.14]} />
        <meshStandardMaterial color="#191D24" roughness={0.7} />
      </mesh>
      <mesh position={[0.12, hipY * 0.5, 0]} castShadow>
        <boxGeometry args={[0.13, hipY, 0.14]} />
        <meshStandardMaterial color="#191D24" roughness={0.7} />
      </mesh>

      {/* Torso + team race suit + headset helmet */}
      <group position={[0, hipY, 0]} rotation={[torsoAngle, 0, 0]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[0.38, 0.52, 0.22]} />
          <meshStandardMaterial color={suitColor} roughness={0.55} />
        </mesh>
        {/* Shoulder stripe in team accent */}
        <mesh position={[0, 0.52, 0]}>
          <boxGeometry args={[0.4, 0.07, 0.23]} />
          <meshStandardMaterial color={accentColor} roughness={0.4} />
        </mesh>
        {/* Head + pit comms visor */}
        <mesh position={[0, 0.68, 0.02]} castShadow>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshStandardMaterial
            color="#1C2026"
            roughness={0.3}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.69, 0.12]}>
          <boxGeometry args={[0.18, 0.06, 0.05]} />
          <meshStandardMaterial
            color={accentColor}
            roughness={0.2}
            metalness={0.4}
          />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.25, 0.3, 0.14]} rotation={[-0.65, 0, 0]} castShadow>
          <boxGeometry args={[0.1, 0.42, 0.1]} />
          <meshStandardMaterial color={suitColor} roughness={0.55} />
        </mesh>
        <mesh position={[0.25, 0.3, 0.14]} rotation={[-0.65, 0, 0]} castShadow>
          <boxGeometry args={[0.1, 0.42, 0.1]} />
          <meshStandardMaterial color={suitColor} roughness={0.55} />
        </mesh>
        {holdingGun && (
          <group position={[0.18, 0.15, 0.38]}>
            <mesh castShadow>
              <boxGeometry args={[0.1, 0.12, 0.28]} />
              <meshStandardMaterial
                color="#D6402B"
                roughness={0.35}
                metalness={0.6}
              />
            </mesh>
            <mesh position={[0, 0.01, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.028, 0.028, 0.14, 10]} />
              <meshStandardMaterial
                color="#CBD5E1"
                roughness={0.25}
                metalness={0.85}
              />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};

const RiggedPitCrewMember: React.FC<{
  position: [number, number, number];
  rotationY: number;
  team: Team2026Spec;
  suitRole: "primary" | "secondary";
  animationName: PitCrewAnimationName;
  crouched?: boolean;
  holdingGun?: boolean;
  name: string;
  pitCrewAsset?: CachedPitCrewAsset | null;
  logosVersion?: number;
}> = ({
  position,
  rotationY,
  team,
  suitRole,
  animationName,
  crouched = false,
  holdingGun = false,
  name,
  pitCrewAsset,
  logosVersion = 0,
}) => {
  const hostRef = useRef<THREE.Group>(null);
  const instanceRef = useRef<PitCrewInstance | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !pitCrewAsset) return;
    const inst = clonePitCrewInstance(pitCrewAsset);
    instanceRef.current = inst;
    host.add(inst.root);
    return () => {
      host.remove(inst.root);
      disposePitCrewInstance(inst);
      instanceRef.current = null;
    };
  }, [pitCrewAsset]);

  useEffect(() => {
    const inst = instanceRef.current;
    if (!inst) return;
    applyTeamSuitToPitCrew(inst, team, suitRole, holdingGun);
  }, [team, suitRole, holdingGun, pitCrewAsset, logosVersion]);

  useEffect(() => {
    const inst = instanceRef.current;
    if (!inst) return;
    inst.mixer.stopAllAction();
    const action =
      inst.actions[animationName] ?? inst.actions.Idle_Standby ?? null;
    if (action) {
      action.reset();
      action.play();
      // Advance immediately to an expressive keyframe so static/reduced-motion captures show the pose immediately
      inst.mixer.update(0.36);
    }
  }, [animationName, pitCrewAsset]);

  useFrame((_state, delta) => {
    const inst = instanceRef.current;
    if (!inst) return;
    inst.mixer.update(Math.min(delta, 0.05));
  });

  if (pitCrewAsset) {
    return (
      <group
        ref={hostRef}
        name={name}
        position={position}
        rotation={[0, rotationY, 0]}
      />
    );
  }

  return (
    <LowPolyMechanic
      name={name}
      position={position}
      rotationY={rotationY}
      suitColor={
        suitRole === "primary"
          ? team.zonePaint.crewSuitPrimary
          : team.zonePaint.crewSuitSecondary
      }
      accentColor={team.accentColor}
      crouched={crouched}
      holdingGun={holdingGun}
    />
  );
};

function cornerCrewPose(
  corner: WheelCorner,
  isIdle: boolean,
): {
  pos: [number, number, number];
  rotY: number;
} {
  const bx = BAY_X.bay1;
  if (isIdle) {
    // Park standby technician cleanly beside the rear-right tool cabinets so no overview/inspection/3-4 sightline is occluded
    return { pos: [bx - 3.35, 0, -3.55], rotY: Math.PI * 0.28 };
  }
  switch (corner) {
    case "FL":
      return { pos: [bx + 1.85, 0, 0.12], rotY: -Math.PI * 0.72 };
    case "FR":
      return { pos: [bx - 1.85, 0, 0.12], rotY: Math.PI * 0.72 };
    case "RL":
      return { pos: [bx + 1.85, 0, -2.95], rotY: -Math.PI * 0.24 };
    case "RR":
      return { pos: [bx - 1.85, 0, -2.95], rotY: Math.PI * 0.24 };
  }
}

export const GarageEquipment: React.FC<GarageEquipmentProps> = ({
  team,
  maintenanceState,
  maintenanceTransforms,
  pitCrewAsset,
  logosVersion = 0,
}) => {
  const halfW = GARAGE_DIMENSIONS.width / 2;
  const halfD = GARAGE_DIMENSIONS.depth / 2;

  const bay1SignTex = useMemo(
    () =>
      makeSignageTexture(
        team,
        "BAY 01 · PRIMARY SPEC",
        team.drivers.bay1,
        team.garageTagline.en,
        logosVersion,
      ),
    [team, logosVersion],
  );
  const bay2SignTex = useMemo(
    () =>
      makeSignageTexture(
        team,
        "BAY 02 · TEAMMATE LOD",
        team.drivers.bay2,
        team.constructorTitle,
        logosVersion,
      ),
    [team, logosVersion],
  );
  const screenTex0 = useMemo(() => makeTelemetryScreenTexture(team, 0), [team]);
  const screenTex1 = useMemo(() => makeTelemetryScreenTexture(team, 1), [team]);

  useEffect(() => {
    return () => {
      bay1SignTex.dispose();
      bay2SignTex.dispose();
      screenTex0.dispose();
      screenTex1.dispose();
    };
  }, [bay1SignTex, bay2SignTex, screenTex0, screenTex1]);

  const frontJackX = THREE.MathUtils.lerp(
    BAY_X.bay1 - 1.25,
    BAY_X.bay1,
    maintenanceTransforms.frontJackExtendProgress,
  );
  const frontJackZ = THREE.MathUtils.lerp(
    3.65,
    2.95,
    maintenanceTransforms.frontJackExtendProgress,
  );
  const rearJackX = THREE.MathUtils.lerp(
    BAY_X.bay1 - 1.25,
    BAY_X.bay1,
    maintenanceTransforms.rearJackExtendProgress,
  );
  const rearJackZ = THREE.MathUtils.lerp(
    -3.75,
    -2.5,
    maintenanceTransforms.rearJackExtendProgress,
  );
  const gunCrew = cornerCrewPose(
    maintenanceState.corner,
    maintenanceState.step === "IDLE",
  );
  const gunCrewCrouched = maintenanceState.step !== "IDLE";
  const gunCrewStandoff =
    maintenanceState.step === "INSPECTION_DETACHED"
      ? ([
          gunCrew.pos[0] +
            (maintenanceState.corner.endsWith("L") ? 0.35 : -0.35),
          0,
          gunCrew.pos[2] +
            (maintenanceState.corner.startsWith("F") ? -0.25 : 0.25),
        ] as [number, number, number])
      : gunCrew.pos;

  // Keep a ref just to verify overhead booms cleanly
  const gantryRef = useRef<THREE.Group>(null);

  return (
    <group name="GARAGE_EQUIPMENT_ROOT">
      {/* EQ-03: Modular Tool Cabinets & Workstations along left, right, and rear walls */}
      <group name="EQ_03_TOOL_CABINETS">
        {[BAY_X.bay1, BAY_X.bay2].map((bayX, bayIdx) => (
          <group key={bayIdx} position={[bayX, 0, -5.28]}>
            <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
              <boxGeometry args={[4.4, 0.96, 0.68]} />
              <meshStandardMaterial
                color={team.secondaryColor}
                roughness={0.42}
                metalness={0.35}
              />
            </mesh>
            {/* Stainless brushed workbench top */}
            <mesh position={[0, 0.98, 0]} castShadow receiveShadow>
              <boxGeometry args={[4.44, 0.05, 0.72]} />
              <meshStandardMaterial
                color="#94A3B8"
                roughness={0.28}
                metalness={0.85}
              />
            </mesh>
            {/* Drawer accent trims */}
            {[-1.5, -0.5, 0.5, 1.5].map((dx, dIdx) => (
              <mesh key={dIdx} position={[dx, 0.5, 0.35]}>
                <boxGeometry args={[0.82, 0.72, 0.02]} />
                <meshStandardMaterial
                  color="#1E242D"
                  roughness={0.4}
                  metalness={0.5}
                />
              </mesh>
            ))}
            <mesh position={[0, 0.91, 0.35]}>
              <boxGeometry args={[4.2, 0.04, 0.03]} />
              <meshStandardMaterial color={team.accentColor} roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Side-wall mobile tool chests */}
        {[-7.42, 7.42].map((wx, idx) => (
          <group key={idx} position={[wx, 0, -1.5]}>
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.68, 1.1, 2.2]} />
              <meshStandardMaterial
                color={team.primaryColor}
                roughness={0.38}
                metalness={0.3}
              />
            </mesh>
            <mesh position={[0, 1.12, 0]} castShadow>
              <boxGeometry args={[0.7, 0.04, 2.24]} />
              <meshStandardMaterial
                color="#1E242D"
                roughness={0.4}
                metalness={0.6}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* EQ-04: Front & Rear Quick-Lift Jacks, Wheel Gun Carts & Stands (Bay 1 Animated + Bay 2 Staged) */}
      <group name="EQ_04_JACKS_AND_GUNS">
        {/* Bay 1 Active Front Quick-Lift Jack */}
        <group position={[frontJackX, 0, frontJackZ]}>
          <mesh position={[0, 0.05, -0.18]} castShadow>
            <boxGeometry args={[0.42, 0.06, 0.48]} />
            <meshStandardMaterial
              color={team.accentColor}
              roughness={0.35}
              metalness={0.65}
            />
          </mesh>
          <mesh position={[0, 0.52, 0.38]} rotation={[0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.06, 1.05, 0.06]} />
            <meshStandardMaterial
              color="#E2E8F0"
              roughness={0.28}
              metalness={0.8}
            />
          </mesh>
        </group>

        {/* Bay 1 Active Rear Quick-Lift Jack */}
        <group position={[rearJackX, 0, rearJackZ]}>
          <mesh position={[0, 0.05, 0.12]} castShadow>
            <boxGeometry args={[0.44, 0.06, 0.44]} />
            <meshStandardMaterial
              color={team.primaryColor}
              roughness={0.38}
              metalness={0.6}
            />
          </mesh>
          <mesh position={[0, 0.52, -0.35]} rotation={[-0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.06, 1.05, 0.06]} />
            <meshStandardMaterial
              color="#E2E8F0"
              roughness={0.28}
              metalness={0.8}
            />
          </mesh>
        </group>

        {/* Equipment & wheel gun caddy stand beside Bay 2 */}
        <group position={[BAY_X.bay2 + 2.35, 0, 0.4]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[0.5, 0.9, 0.85]} />
            <meshStandardMaterial
              color="#1D222B"
              roughness={0.45}
              metalness={0.5}
            />
          </mesh>
          <mesh position={[0, 0.94, 0]}>
            <boxGeometry args={[0.52, 0.06, 0.88]} />
            <meshStandardMaterial color={team.accentColor} roughness={0.35} />
          </mesh>
        </group>
      </group>

      {/* EQ-05: Tyre Racks, Spare Tyres & Tyre Trolley */}
      <group name="EQ_05_TYRE_RACKS">
        {/* Left & right double-tier tyre racks */}
        {[-7.25, 7.25].map((rx, idx) => (
          <group
            key={idx}
            position={[rx, 0, 2.2]}
            rotation={[0, idx === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          >
            <mesh position={[0.55, 0.95, 0]}>
              <boxGeometry args={[2.1, 1.9, 0.1]} />
              <meshStandardMaterial
                color="#181C23"
                roughness={0.5}
                metalness={0.6}
                wireframe={false}
              />
            </mesh>
            <CornerWheelSet
              position={[0, 0.02, 0.25]}
              accentColor={team.accentColor}
            />
            <CornerWheelSet
              position={[0, 0.92, 0.25]}
              accentColor={team.primaryColor}
            />
          </group>
        ))}
        {/* Staged pit-stop tyre trolley on left flank of Bay 1 */}
        <group position={[-6.05, 0, 1.85]}>
          <mesh position={[0.45, 0.06, 0]} castShadow>
            <boxGeometry args={[1.35, 0.06, 0.62]} />
            <meshStandardMaterial
              color="#272D37"
              roughness={0.4}
              metalness={0.7}
            />
          </mesh>
          <CornerWheelSet
            position={[0, 0.1, 0]}
            accentColor={team.accentColor}
          />
        </group>
      </group>

      {/* EQ-06: Overhead Technical Truss & Power Boom */}
      <group ref={gantryRef} name="EQ_06_OVERHEAD_GANTRY">
        {[-2.4, 0, 2.4].map((tz, i) => (
          <mesh key={i} position={[0, 4.58, tz]} castShadow>
            <boxGeometry args={[14.8, 0.22, 0.24]} />
            <meshStandardMaterial
              color="#2A303A"
              roughness={0.38}
              metalness={0.78}
            />
          </mesh>
        ))}
        {[-3.4, 3.4].map((lx, i) => (
          <group key={i} position={[lx, 4.44, 0]}>
            <mesh>
              <boxGeometry args={[2.2, 0.08, 6.2]} />
              <meshStandardMaterial
                color="#1C2129"
                roughness={0.35}
                metalness={0.65}
              />
            </mesh>
            {/* Emissive LED technical strips facing floor */}
            <mesh position={[0, -0.05, 0]}>
              <boxGeometry args={[1.8, 0.02, 5.4]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive="#E2F1FF"
                emissiveIntensity={1.2}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* EQ-07: Central Engineer Telemetry Island & Screens (positioned rear-center so center aisle sightlines remain open) */}
      <group name="EQ_07_TELEMETRY_ISLAND" position={[0, 0, -3.65]}>
        <mesh position={[0, 0.56, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.15, 1.12, 2.8]} />
          <meshStandardMaterial
            color="#151920"
            roughness={0.45}
            metalness={0.4}
          />
        </mesh>
        <mesh position={[0, 1.14, 0]} castShadow>
          <boxGeometry args={[1.22, 0.05, 2.86]} />
          <meshStandardMaterial
            color={team.secondaryColor}
            roughness={0.35}
            metalness={0.5}
          />
        </mesh>
        {/* Accent pit-wall stripe around console */}
        <mesh position={[0, 0.96, 0]}>
          <boxGeometry args={[1.18, 0.06, 2.82]} />
          <meshStandardMaterial color={team.accentColor} roughness={0.3} />
        </mesh>
        {/* Dual angled engineering displays */}
        {[-0.65, 0.65].map((mz, idx) => (
          <group
            key={idx}
            position={[0, 1.44, mz]}
            rotation={[0, idx === 0 ? 0.16 : -0.16, 0]}
          >
            <mesh castShadow>
              <boxGeometry args={[0.06, 0.44, 0.84]} />
              <meshStandardMaterial
                color="#101318"
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>
            <mesh position={[-0.036, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[0.78, 0.38]} />
              <meshBasicMaterial map={idx === 0 ? screenTex0 : screenTex1} />
            </mesh>
            <mesh position={[0.036, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[0.78, 0.38]} />
              <meshBasicMaterial map={idx === 0 ? screenTex1 : screenTex0} />
            </mesh>
          </group>
        ))}
      </group>

      {/* EQ-08: Modular Garage Walls & Team Signage (16m W x 12m D x 5m H) */}
      <group name="EQ_08_MODULAR_WALLS_SIGNAGE">
        {/* Rear bulkhead wall */}
        <mesh
          position={[0, GARAGE_DIMENSIONS.height / 2, -halfD]}
          receiveShadow
        >
          <boxGeometry
            args={[GARAGE_DIMENSIONS.width, GARAGE_DIMENSIONS.height, 0.18]}
          />
          <meshStandardMaterial
            color="#1D222A"
            roughness={0.62}
            metalness={0.22}
          />
        </mesh>
        {/* Team color horizontal wall fascia bar */}
        <mesh position={[0, 2.75, -halfD + 0.11]}>
          <boxGeometry args={[GARAGE_DIMENSIONS.width - 0.4, 0.14, 0.04]} />
          <meshStandardMaterial color={team.primaryColor} roughness={0.35} />
        </mesh>
        <mesh position={[0, 2.64, -halfD + 0.11]}>
          <boxGeometry args={[GARAGE_DIMENSIONS.width - 0.4, 0.05, 0.04]} />
          <meshStandardMaterial color={team.accentColor} roughness={0.3} />
        </mesh>

        {/* Left & Right modular side walls */}
        <mesh
          position={[-halfW, GARAGE_DIMENSIONS.height / 2, 0]}
          receiveShadow
        >
          <boxGeometry
            args={[0.18, GARAGE_DIMENSIONS.height, GARAGE_DIMENSIONS.depth]}
          />
          <meshStandardMaterial
            color="#1B2028"
            roughness={0.62}
            metalness={0.2}
          />
        </mesh>
        <mesh position={[halfW, GARAGE_DIMENSIONS.height / 2, 0]} receiveShadow>
          <boxGeometry
            args={[0.18, GARAGE_DIMENSIONS.height, GARAGE_DIMENSIONS.depth]}
          />
          <meshStandardMaterial
            color="#1B2028"
            roughness={0.62}
            metalness={0.2}
          />
        </mesh>

        {/* Pit-lane top fascia shutter beam (open portal to pit lane at +Z) */}
        <mesh position={[0, 4.6, halfD - 0.15]}>
          <boxGeometry args={[GARAGE_DIMENSIONS.width, 0.8, 0.25]} />
          <meshStandardMaterial
            color="#161A21"
            roughness={0.5}
            metalness={0.4}
          />
        </mesh>

        {/* Illuminated Team Bay Header Billboards on Rear Wall */}
        <mesh position={[BAY_X.bay1, 3.65, -halfD + 0.14]}>
          <planeGeometry args={[5.4, 1.35]} />
          <meshBasicMaterial map={bay1SignTex} />
        </mesh>
        <mesh position={[BAY_X.bay2, 3.65, -halfD + 0.14]}>
          <planeGeometry args={[5.4, 1.35]} />
          <meshBasicMaterial map={bay2SignTex} />
        </mesh>
      </group>

      {/* EQ-09: Overhead Air Hoses, Cable Protectors & Cooling Blowers */}
      <group name="EQ_09_HOSES_AND_COOLING">
        {/* Yellow-black floor cable ramps along central spine */}
        {[-3.4, -0.4, 2.4].map((zPos, i) => (
          <mesh key={i} position={[0, 0.025, zPos]} receiveShadow>
            <boxGeometry args={[0.55, 0.05, 1.8]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#EAB308" : "#1E222A"}
              roughness={0.75}
            />
          </mesh>
        ))}

        {/* Overhead pneumatic drop hoses at Bay 1 corners */}
        {[
          [BAY_X.bay1 + 1.55, 1.75],
          [BAY_X.bay1 - 1.55, 1.75],
          [BAY_X.bay1 + 1.55, -1.85],
          [BAY_X.bay1 - 1.55, -1.85],
        ].map(([hx, hz], idx) => (
          <mesh key={idx} position={[hx, 3.15, hz]}>
            <cylinderGeometry args={[0.018, 0.018, 2.6, 8]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? team.accentColor : "#38BDF8"}
              roughness={0.45}
            />
          </mesh>
        ))}

        {/* Portable nose & sidepod cooling blower fans staged near Bay 1 & Bay 2 */}
        {[
          [BAY_X.bay1 - 1.45, 3.35],
          [BAY_X.bay2 + 1.45, 3.35],
        ].map(([bx, bz], idx) => (
          <group
            key={idx}
            position={[bx, 0, bz]}
            rotation={[0, idx === 0 ? 0.55 : -0.55, 0]}
          >
            <mesh position={[0, 0.24, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 0.36, 14]} />
              <meshStandardMaterial
                color={team.primaryColor}
                roughness={0.4}
                metalness={0.35}
              />
            </mesh>
            <mesh position={[0, 0.24, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.12, 12]} />
              <meshStandardMaterial color="#111417" roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* EQ-10: Rigged 3D Pit Crew performing purposeful garage roles */}
      <group name="EQ_10_ARTICULATED_CREW">
        {/* Corner wheel-gun technician aligned with selected Maintenance corner */}
        <RiggedPitCrewMember
          name="CREW_WHEEL_GUNNER"
          position={gunCrewStandoff}
          rotationY={gunCrew.rotY}
          team={team}
          suitRole="primary"
          animationName={gunCrewCrouched ? "WheelGun_Crouch" : "Idle_Standby"}
          crouched={gunCrewCrouched}
          holdingGun
          pitCrewAsset={pitCrewAsset}
          logosVersion={logosVersion}
        />
        {/* Front jack operator standing at Bay 1 nose standoff */}
        <RiggedPitCrewMember
          name="CREW_FRONT_JACK"
          position={[frontJackX - 0.35, 0, frontJackZ + 0.4]}
          rotationY={Math.PI}
          team={team}
          suitRole="secondary"
          animationName={
            maintenanceState.step === "LIFT_CAR" ||
            maintenanceState.step === "APPROACH_JACKS"
              ? "Jack_Operate"
              : "Idle_Standby"
          }
          crouched={maintenanceState.step === "LIFT_CAR"}
          pitCrewAsset={pitCrewAsset}
          logosVersion={logosVersion}
        />
        {/* Telemetry engineer at central console desk */}
        <RiggedPitCrewMember
          name="CREW_TELEMETRY_ENGINEER"
          position={[0.82, 0, -3.65]}
          rotationY={-Math.PI / 2}
          team={team}
          suitRole="secondary"
          animationName="Telemetry_Console"
          pitCrewAsset={pitCrewAsset}
          logosVersion={logosVersion}
        />
        {/* Bay 2 readiness technician */}
        <RiggedPitCrewMember
          name="CREW_BAY2_TECH"
          position={[BAY_X.bay2 + 1.55, 0, 0.35]}
          rotationY={-Math.PI / 2}
          team={team}
          suitRole="primary"
          animationName="Idle_Standby"
          pitCrewAsset={pitCrewAsset}
          logosVersion={logosVersion}
        />
      </group>
    </group>
  );
};
