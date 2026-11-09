import React, { useMemo, useEffect } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import { TeamId } from '../../types';
import { TEAMS_DATA } from '../../data/teams';
import {
  createTeamBackdropTexture,
  createTechnicalBackdropTexture,
  createDriversWallTexture,
  createAchievementsWallTexture,
} from './StudioBackdropTexture';
import { createEDSBackdropTexture } from './EDSStudioBackdropTexture';
import { EDSLiveryPreset } from '../../data/showroom/edsLiveries';

interface StudioW15StageProps {
  teamId: TeamId;
  lang?: 'vi' | 'en';
  edsLivery?: EDSLiveryPreset;
}

/**
 * StudioW15Stage — Fully Enclosed 360° Luxury Automotive Launch Pavilion
 *
 * All 4 walls and 4 corners are meticulously themed and sealed:
 * 1. North Wall (Back): Main Manufacturer Premiere Branding Wall (cadillac.webp match)
 * 2. South Wall (Front): Machine Technical Dossier & Telemetry Wall
 * 3. West Wall (Left): Drivers Hall of Fame (Tên các tay đua huyền thoại & hiện tại đã từng thi đấu)
 * 4. East Wall (Right): All-Time Achievements (Bảng vàng thành tích toàn thời gian: Vô địch, Chiến thắng, Pole, Podium)
 * 5. 4 Sealed Corners (NW, NE, SW, SE): Chamfered architectural columns with floor-to-ceiling LED light pillars
 * 6. High-Fidelity Mirror Floor: Reflects the car, podium outline, and all 4 thematic exhibition walls in 360°
 */
export const StudioW15Stage: React.FC<StudioW15StageProps> = ({
  teamId,
  lang = 'vi',
  edsLivery,
}) => {
  const team = TEAMS_DATA[teamId] || TEAMS_DATA.ferrari;
  const stageAccent = edsLivery?.accent || team.primaryColor;

  // 1. North Wall: Official Constructor Premiere Branding (CADILLAC FORMULA 1)
  const northTexture = useMemo(
    () =>
      edsLivery
        ? createEDSBackdropTexture('identity', edsLivery, lang)
        : createTeamBackdropTexture(teamId, lang),
    [edsLivery, teamId, lang],
  );

  // 2. South Wall: Machine Technical Dossier (CADILLAC MAC-26 / W15 / SF-24)
  const southTexture = useMemo(
    () =>
      edsLivery
        ? createEDSBackdropTexture('technical', edsLivery, lang)
        : createTechnicalBackdropTexture(teamId, lang),
    [edsLivery, teamId, lang],
  );

  // 3. West Wall (Left): Drivers Hall of Fame (Danh sách tay đua đã từng thi đấu)
  const westTexture = useMemo(
    () =>
      edsLivery
        ? createEDSBackdropTexture('aero', edsLivery, lang)
        : createDriversWallTexture(teamId, lang),
    [edsLivery, teamId, lang],
  );

  // 4. East Wall (Right): All-Time Constructor Achievements (Thành tích toàn thời gian)
  const eastTexture = useMemo(
    () =>
      edsLivery
        ? createEDSBackdropTexture('provenance', edsLivery, lang)
        : createAchievementsWallTexture(teamId, lang),
    [edsLivery, teamId, lang],
  );

  useEffect(() => {
    return () => {
      northTexture.dispose();
      southTexture.dispose();
      westTexture.dispose();
      eastTexture.dispose();
    };
  }, [northTexture, southTexture, westTexture, eastTexture]);

  // Lightened studio so near-black carbon (suspension/diffuser/wings) keeps silhouette.
  // Was '#0b0d12' walls + '#07080c' floor — black parts dissolved into background.
  const studioWallColor = '#232a35';
  const panelFrameColor = '#2b323e';

  return (
    <group position={[0, 0, 0]}>
      {/* ── Studio Ambient & Global Photometric Lighting ── */}
      <ambientLight intensity={1.7} color="#ffffff" />

      {/* Main Studio Key Light (High directional light casting crisp, soft car shadows) */}
      <directionalLight
        position={[6.0, 9.0, -4.5]}
        intensity={3.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />

      {/* Neutral fill reveals the opposite flank without tinting the team livery.
          Reuse the existing light: no extra shadow maps or render passes. */}
      <directionalLight position={[-7.0, 6.0, 3.5]} intensity={2.3} color="#f8fafc" />

      {/* Subtle Ground Bounce Light */}
      <directionalLight position={[0, -2.5, 0]} intensity={0.9} color="#dfe8f5" />

      {/* ── Rear rim / edge lights: carve black diffuser, beam-wing & suspension
          out of the dark background. Team-tinted + pure white for definition. ── */}
      <directionalLight position={[-4.5, 3.2, 5.5]} intensity={2.6} color="#ffffff" />
      <directionalLight position={[4.5, 2.4, 5.8]} intensity={1.8} color={stageAccent} />
      <pointLight position={[0, 1.6, 4.6]} intensity={8} distance={9} color="#ffffff" />
      {/* Under-glow lifts the floor/diffuser off the mirror so black strakes read */}
      <pointLight position={[0, 0.25, 0]} intensity={3.2} distance={5} color={stageAccent} />

      {/* ══════════════════════════════════════════════════════════════
          1. NORTH WALL (Back: z = +5.8) — Main Premiere Branding Wall
          ══════════════════════════════════════════════════════════════ */}
      <group position={[0, 0, 5.8]}>
        {/* Wall Facade */}
        <mesh position={[0, 3.9, 0]} rotation={[0, Math.PI, 0]} receiveShadow>
          <planeGeometry args={[16, 7.8]} />
          <meshStandardMaterial color={studioWallColor} roughness={0.9} metalness={0.12} />
        </mesh>

        {/* Vertical Shadow Joints */}
        {[-5.5, -2.8, 2.8, 5.5].map((x) => (
          <mesh key={`n-joint-${x}`} position={[x, 3.9, -0.01]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.03, 7.8]} />
            <meshBasicMaterial color="#161820" />
          </mesh>
        ))}

        {/* Ceiling Cove Light Strip */}
        <mesh position={[0, 7.4, -0.02]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[15, 0.08]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        {/* Main Floating Branding Display Board (cadillac.webp match) */}
        <group position={[0, 2.6, -0.08]}>
          <mesh rotation={[0, Math.PI, 0]}>
            <boxGeometry args={[7.8, 3.9, 0.12]} />
            <meshStandardMaterial color={panelFrameColor} roughness={0.3} metalness={0.88} />
          </mesh>

          <mesh position={[0, 0, -0.065]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[7.72, 3.82]} />
            <meshStandardMaterial color="#1a1c26" roughness={0.4} metalness={0.7} />
          </mesh>

          {northTexture && (
            <mesh position={[0, 0, -0.075]} rotation={[0, Math.PI, 0]} receiveShadow>
              <planeGeometry args={[7.6, 3.7]} />
              <meshStandardMaterial
                map={northTexture}
                roughness={0.25}
                metalness={0.2}
                emissive="#ffffff"
                emissiveMap={northTexture}
                emissiveIntensity={0.38}
              />
            </mesh>
          )}

          <pointLight position={[0, 0, 0.35]} intensity={2.2} distance={6.0} color={stageAccent} />
        </group>

        {/* Overhead Spotlight */}
        <spotLight
          position={[0, 6.2, -1.8]}
          target-position={[0, 2.6, -0.08]}
          angle={0.75}
          penumbra={0.65}
          intensity={3.2}
          color="#ffffff"
          shadow-bias={-0.0001}
        />
      </group>

      {/* ══════════════════════════════════════════════════════════════
          2. SOUTH WALL (Front: z = -5.8) — Machine Technical Dossier Wall
          ══════════════════════════════════════════════════════════════ */}
      <group position={[0, 0, -5.8]}>
        {/* Wall Facade */}
        <mesh position={[0, 3.9, 0]} receiveShadow>
          <planeGeometry args={[16, 7.8]} />
          <meshStandardMaterial color={studioWallColor} roughness={0.9} metalness={0.12} />
        </mesh>

        {/* Vertical Shadow Joints */}
        {[-5.5, -2.8, 2.8, 5.5].map((x) => (
          <mesh key={`s-joint-${x}`} position={[x, 3.9, 0.01]}>
            <planeGeometry args={[0.03, 7.8]} />
            <meshBasicMaterial color="#161820" />
          </mesh>
        ))}

        {/* Ceiling Cove Light Strip */}
        <mesh position={[0, 7.4, 0.02]}>
          <planeGeometry args={[15, 0.08]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        {/* Technical Dossier Presentation Board */}
        <group position={[0, 2.6, 0.08]}>
          <mesh>
            <boxGeometry args={[7.8, 3.9, 0.12]} />
            <meshStandardMaterial color={panelFrameColor} roughness={0.3} metalness={0.88} />
          </mesh>

          {southTexture && (
            <mesh position={[0, 0, 0.075]} receiveShadow>
              <planeGeometry args={[7.6, 3.7]} />
              <meshStandardMaterial
                map={southTexture}
                roughness={0.25}
                metalness={0.2}
                emissive="#ffffff"
                emissiveMap={southTexture}
                emissiveIntensity={0.36}
              />
            </mesh>
          )}

          <pointLight position={[0, 0, -0.35]} intensity={2.2} distance={6.0} color={stageAccent} />
        </group>

        {/* Overhead Spotlight */}
        <spotLight
          position={[0, 6.2, 1.8]}
          target-position={[0, 2.6, 0.08]}
          angle={0.75}
          penumbra={0.65}
          intensity={3.0}
          color="#ffffff"
          shadow-bias={-0.0001}
        />
      </group>

      {/* ══════════════════════════════════════════════════════════════
          3. WEST WALL (Left: x = -7.2) — DRIVERS HALL OF FAME WALL
             (Tên các tay đua huyền thoại & hiện tại đã từng thi đấu)
          ══════════════════════════════════════════════════════════════ */}
      <group position={[-7.2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Wall Facade */}
        <mesh position={[0, 3.9, 0]} receiveShadow>
          <planeGeometry args={[13, 7.8]} />
          <meshStandardMaterial color={studioWallColor} roughness={0.9} metalness={0.12} />
        </mesh>

        {/* Ceiling Cove Light Strip */}
        <mesh position={[0, 7.4, 0.02]}>
          <planeGeometry args={[12, 0.08]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        {/* Drivers Hall of Fame Large Display Board */}
        <group position={[0, 2.6, 0.08]}>
          <mesh>
            <boxGeometry args={[8.0, 4.0, 0.12]} />
            <meshStandardMaterial color={panelFrameColor} roughness={0.3} metalness={0.88} />
          </mesh>

          {westTexture && (
            <mesh position={[0, 0, 0.075]} receiveShadow>
              <planeGeometry args={[7.8, 3.8]} />
              <meshStandardMaterial
                map={westTexture}
                roughness={0.25}
                metalness={0.2}
                emissive="#ffffff"
                emissiveMap={westTexture}
                emissiveIntensity={0.38}
              />
            </mesh>
          )}

          <pointLight position={[0, 0, -0.35]} intensity={2.2} distance={6.0} color={stageAccent} />
        </group>

        {/* Overhead Spotlight shining down onto Drivers Board */}
        <spotLight
          position={[0, 6.2, 1.8]}
          target-position={[0, 2.6, 0.08]}
          angle={0.75}
          penumbra={0.65}
          intensity={3.0}
          color="#ffffff"
          shadow-bias={-0.0001}
        />
      </group>

      {/* ══════════════════════════════════════════════════════════════
          4. EAST WALL (Right: x = +7.2) — ALL-TIME ACHIEVEMENTS WALL
             (Bảng vàng thành tích toàn thời gian: Vô địch, Thắng, Pole, Podium)
          ══════════════════════════════════════════════════════════════ */}
      <group position={[7.2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Wall Facade */}
        <mesh position={[0, 3.9, 0]} receiveShadow>
          <planeGeometry args={[13, 7.8]} />
          <meshStandardMaterial color={studioWallColor} roughness={0.9} metalness={0.12} />
        </mesh>

        {/* Ceiling Cove Light Strip */}
        <mesh position={[0, 7.4, 0.02]}>
          <planeGeometry args={[12, 0.08]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        {/* All-Time Achievements Large Display Board */}
        <group position={[0, 2.6, 0.08]}>
          <mesh>
            <boxGeometry args={[8.0, 4.0, 0.12]} />
            <meshStandardMaterial color={panelFrameColor} roughness={0.3} metalness={0.88} />
          </mesh>

          {eastTexture && (
            <mesh position={[0, 0, 0.075]} receiveShadow>
              <planeGeometry args={[7.8, 3.8]} />
              <meshStandardMaterial
                map={eastTexture}
                roughness={0.25}
                metalness={0.2}
                emissive="#ffffff"
                emissiveMap={eastTexture}
                emissiveIntensity={0.38}
              />
            </mesh>
          )}

          <pointLight position={[0, 0, -0.35]} intensity={2.2} distance={6.0} color={stageAccent} />
        </group>

        {/* Overhead Spotlight shining down onto Achievements Board */}
        <spotLight
          position={[0, 6.2, 1.8]}
          target-position={[0, 2.6, 0.08]}
          angle={0.75}
          penumbra={0.65}
          intensity={3.0}
          color="#ffffff"
          shadow-bias={-0.0001}
        />
      </group>

      {/* ══════════════════════════════════════════════════════════════
          5. THE 4 CORNERS (NW, NE, SW, SE) — Chamfered LED Light Columns
             Seals all 4 corners so there is NEVER an empty gap or void!
          ══════════════════════════════════════════════════════════════ */}
      {/* 5A. NORTH-WEST CORNER */}
      <group position={[-6.2, 0, 5.0]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, 3.9, 0]} receiveShadow>
          <planeGeometry args={[3.2, 7.8]} />
          <meshStandardMaterial color="#0e1017" roughness={0.88} metalness={0.15} />
        </mesh>
        <mesh position={[0, 3.9, 0.02]}>
          <planeGeometry args={[0.08, 7.5]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <pointLight position={[0, 3.5, 0.35]} intensity={1.2} distance={4.5} color="#ffffff" />
      </group>

      {/* 5B. NORTH-EAST CORNER */}
      <group position={[6.2, 0, 5.0]} rotation={[0, -Math.PI / 4, 0]}>
        <mesh position={[0, 3.9, 0]} receiveShadow>
          <planeGeometry args={[3.2, 7.8]} />
          <meshStandardMaterial color="#0e1017" roughness={0.88} metalness={0.15} />
        </mesh>
        <mesh position={[0, 3.9, 0.02]}>
          <planeGeometry args={[0.08, 7.5]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <pointLight position={[0, 3.5, 0.35]} intensity={1.2} distance={4.5} color="#ffffff" />
      </group>

      {/* 5C. SOUTH-WEST CORNER */}
      <group position={[-6.2, 0, -5.0]} rotation={[0, (3 * Math.PI) / 4, 0]}>
        <mesh position={[0, 3.9, 0]} receiveShadow>
          <planeGeometry args={[3.2, 7.8]} />
          <meshStandardMaterial color="#0e1017" roughness={0.88} metalness={0.15} />
        </mesh>
        <mesh position={[0, 3.9, 0.02]}>
          <planeGeometry args={[0.08, 7.5]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <pointLight position={[0, 3.5, 0.35]} intensity={1.2} distance={4.5} color="#ffffff" />
      </group>

      {/* 5D. SOUTH-EAST CORNER */}
      <group position={[6.2, 0, -5.0]} rotation={[0, -(3 * Math.PI) / 4, 0]}>
        <mesh position={[0, 3.9, 0]} receiveShadow>
          <planeGeometry args={[3.2, 7.8]} />
          <meshStandardMaterial color="#0e1017" roughness={0.88} metalness={0.15} />
        </mesh>
        <mesh position={[0, 3.9, 0.02]}>
          <planeGeometry args={[0.08, 7.5]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <pointLight position={[0, 3.5, 0.35]} intensity={1.2} distance={4.5} color="#ffffff" />
      </group>

      {/* ══════════════════════════════════════════════════════════════
          6. SUSPENDED OVERHEAD SOFTBOX RIG (Automotive Photoshoot Rig)
          ══════════════════════════════════════════════════════════════ */}
      <group position={[0, 4.8, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.4, 9.5]} />
          <meshStandardMaterial color="#12131a" roughness={0.35} metalness={0.8} />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[4.0, 8.8]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[0.12, 8.6]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[-1.3, -0.02, 0]}>
          <planeGeometry args={[0.08, 8.6]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[1.3, -0.02, 0]}>
          <planeGeometry args={[0.08, 8.6]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        <spotLight
          position={[0, 0, 0]}
          angle={0.85}
          penumbra={0.75}
          intensity={2.4}
          color="#ffffff"
          shadow-bias={-0.0001}
        />
      </group>

      {/* ══════════════════════════════════════════════════════════════
          7. POLISHED LUXURY MIRROR FLOOR (MeshReflectorMaterial)
          ══════════════════════════════════════════════════════════════ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <planeGeometry args={[24, 24]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={256}
          mirror={0.55}
          mixBlur={0.6}
          mixStrength={2.0}
          roughness={0.32}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#2a303b"
          metalness={0.4}
        />
      </mesh>

      {/* ══════════════════════════════════════════════════════════════
          8. FLOOR DISPLAY PERIMETER BOX (cadillac.webp Podium Outline)
          ══════════════════════════════════════════════════════════════ */}
      <group position={[0, 0.002, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.8, 0, 0]}>
          <planeGeometry args={[0.02, 7.6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.8, 0, 0]}>
          <planeGeometry args={[0.02, 7.6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3.8]}>
          <planeGeometry args={[3.62, 0.02]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 3.8]}>
          <planeGeometry args={[3.62, 0.02]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[0.015, 6.2]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1.82]}>
          <planeGeometry args={[2.4, 0.012]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1.78]}>
          <planeGeometry args={[2.4, 0.012]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[3.2, 3.22, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[4.4, 4.43, 64]} />
          <meshBasicMaterial color={stageAccent} transparent opacity={0.22} />
        </mesh>
      </group>
    </group>
  );
};
