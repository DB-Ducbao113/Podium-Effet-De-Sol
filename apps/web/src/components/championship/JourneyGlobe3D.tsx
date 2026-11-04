import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { GrandPrixRound, SeasonYear } from '../../types';
import { resolveCircuit } from './journeyCoordinates';
import { JOURNEY_WORLD_LAND_PATH } from './journeyWorldAtlas';

type Stop = { race: GrandPrixRound; vector: THREE.Vector3; latitude: number; longitude: number };
type SceneProps = { stops: readonly Stop[]; travelProgress: number; onSelectRound: (round: number) => void; closeUp: boolean };
const RADIUS = 1;
const ARC_SEGMENTS = 72;
const ARC_SIDES = 5;

function geoVector(latitude: number, longitude: number, radius = RADIUS) {
  const lat = THREE.MathUtils.degToRad(latitude);
  const lng = THREE.MathUtils.degToRad(longitude);
  // Matches Three SphereGeometry's UV convention (u=0 is -180° longitude).
  return new THREE.Vector3(
    Math.cos(lat) * Math.cos(lng),
    Math.sin(lat),
    -Math.cos(lat) * Math.sin(lng),
  ).multiplyScalar(radius);
}

function greatCircle(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  const angle = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
  if (angle < 0.0001) return a.clone().lerp(b, t).normalize();
  const sine = Math.sin(angle);
  return a.clone().multiplyScalar(Math.sin((1 - t) * angle) / sine)
    .addScaledVector(b, Math.sin(t * angle) / sine).normalize();
}

function arcPoints(start: THREE.Vector3, finish: THREE.Vector3) {
  const points: THREE.Vector3[] = [];
  const angle = Math.acos(THREE.MathUtils.clamp(start.dot(finish), -1, 1));
  for (let index = 0; index <= ARC_SEGMENTS; index++) {
    const t = index / ARC_SEGMENTS;
    const altitude = 1.014 + Math.sin(Math.PI * t) * (0.08 + angle * 0.055);
    points.push(greatCircle(start, finish, t).multiplyScalar(altitude));
  }
  return points;
}

function EarthSurface() {
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    if (!context) return null;
    // Procedural maritime chart texture: self-hosted geography, no external image/API key.
    context.fillStyle = '#061724';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgba(75,147,171,0.21)';
    context.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += canvas.width / 24) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, canvas.height); context.stroke();
    }
    for (let y = 0; y <= canvas.height; y += canvas.height / 12) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke();
    }
    context.save();
    context.scale(canvas.width / 1000, canvas.height / 500);
    const land = new Path2D(JOURNEY_WORLD_LAND_PATH);
    context.fillStyle = '#18333d';
    context.fill(land, 'evenodd');
    context.strokeStyle = 'rgba(105,186,188,.75)';
    context.lineWidth = 0.55;
    context.stroke(land);
    context.restore();
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 2;
    map.needsUpdate = true;
    return map;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return (
    <>
      <mesh>
        <sphereGeometry args={[RADIUS, 64, 48]} />
        <meshStandardMaterial
          color="#d6f8ff" map={texture ?? undefined} metalness={0.18} roughness={0.75}
          emissive="#12333a" emissiveIntensity={0.22}
        />
      </mesh>
      <mesh scale={1.065}>
        <sphereGeometry args={[RADIUS, 48, 32]} />
        <shaderMaterial
          transparent depthWrite={false} blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          vertexShader={`varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`}
          fragmentShader={`varying vec3 vNormal;
            void main() {
              float rim = pow(1.0 - abs(normalize(vNormal).z), 3.0);
              gl_FragColor = vec4(vec3(0.10, 0.52, 0.68) * rim, rim * 0.55);
            }`}
        />
      </mesh>
      <mesh rotation={[0.22, 0, 0.2]}>
        <torusGeometry args={[1.24, 0.0017, 4, 140]} />
        <meshBasicMaterial color="#45748c" transparent opacity={0.33} depthWrite={false}/>
      </mesh>
      <mesh rotation={[0.62, 0.3, -0.19]}>
        <torusGeometry args={[1.4, 0.0012, 4, 140]} />
        <meshBasicMaterial color="#8ea1ae" transparent opacity={0.16} depthWrite={false}/>
      </mesh>
    </>
  );
}

function Route({ from, to, completedFraction }: {
  from: THREE.Vector3; to: THREE.Vector3; completedFraction: number;
}) {
  const { invalidate } = useThree();
  const geometry = useMemo(() =>
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(arcPoints(from, to)), ARC_SEGMENTS, 0.0048, ARC_SIDES, false,
    ),
  [from, to]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    const segmentCount = Math.round(THREE.MathUtils.clamp(completedFraction, 0, 1) * ARC_SEGMENTS);
    geometry.setDrawRange(0, segmentCount * ARC_SIDES * 6);
    invalidate();
  }, [completedFraction, geometry, invalidate]);
  return (
    <>
      <mesh geometry={geometry} renderOrder={2}>
        <meshBasicMaterial color="#436b7b" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <mesh geometry={geometry} renderOrder={3}>
        <meshBasicMaterial color="#ff5a25" toneMapped={false} />
      </mesh>
    </>
  );
}

function StopMarker({ stop, visited, active, onSelectRound }: {
  stop: Stop; visited: boolean; active: boolean; onSelectRound: (round: number) => void;
}) {
  const position = useMemo(() => stop.vector.clone().multiplyScalar(1.018), [stop]);
  return (
    <group position={position.toArray()} onClick={(event) => {
      event.stopPropagation();
      onSelectRound(stop.race.round);
    }}>
      <mesh>
        <sphereGeometry args={[active ? 0.022 : 0.013, 9, 8]} />
        <meshBasicMaterial color={active ? '#fff8e8' : visited ? '#ff632e' : '#7392a4'} toneMapped={false} />
      </mesh>
      {active && <mesh scale={1.95}>
        <sphereGeometry args={[0.025, 10, 8]} />
        <meshBasicMaterial color="#ff632e" transparent opacity={0.25} depthWrite={false} />
      </mesh>}
    </group>
  );
}

function SceneMotion({ stops, travelProgress, onSelectRound, closeUp }: SceneProps) {
  const globe = useRef<THREE.Group>(null);
  const { camera, invalidate } = useThree();
  const last = Math.max(0, stops.length - 1);
  const position = THREE.MathUtils.clamp(travelProgress, 0, last);
  const index = Math.min(last, Math.floor(position));
  const fraction = Math.max(0, position - index);
  const start = stops[index]?.vector;
  const finish = stops[Math.min(last, index + 1)]?.vector;
  const facing = start && finish ? greatCircle(start, finish, fraction) : new THREE.Vector3(0, 0, 1);
  const heading = Math.atan2(-facing.z, facing.x);
  const latitude = Math.asin(THREE.MathUtils.clamp(facing.y, -1, 1));
  const desiredYaw = -Math.PI / 2 - heading;
  const desiredPitch = latitude;
  const distance = (closeUp ? 3.22 : 3.78) + Math.sin(fraction * Math.PI) * 0.15;

  useEffect(() => { invalidate(); }, [travelProgress, closeUp, invalidate]);

  useFrame((_, delta) => {
    if (!globe.current) return;
    const smoothing = 1 - Math.exp(-Math.min(0.1, delta) * 3.6);
    const rotation = globe.current.rotation;
    // Shortest longitude path avoids the 360° snap at the international date line.
    const yawDelta = Math.atan2(Math.sin(desiredYaw - rotation.y), Math.cos(desiredYaw - rotation.y));
    const pitchDelta = desiredPitch - rotation.x;
    rotation.order = 'XYZ';
    rotation.y += yawDelta * smoothing;
    rotation.x += pitchDelta * smoothing;
    camera.position.z += (distance - camera.position.z) * smoothing;
    if (Math.abs(yawDelta) > .002 || Math.abs(pitchDelta) > .002 || Math.abs(camera.position.z - distance) > .002) {
      invalidate();
    }
  });

  const activeArc = index < last && start && finish && fraction > 0 && fraction < 1
    ? greatCircle(start, finish, fraction).multiplyScalar(
      1.014 + Math.sin(Math.PI * fraction) * (0.08 + Math.acos(THREE.MathUtils.clamp(start.dot(finish), -1, 1)) * 0.055),
    )
    : null;

  return (
    <>
      <ambientLight intensity={1.15} />
      <directionalLight position={[3, 2.5, 5]} color="#a9e3ff" intensity={2.6} />
      <directionalLight position={[-3, -2, -3]} color="#ff5a25" intensity={0.55} />
      <group ref={globe}>
        <EarthSurface />
        {stops.slice(1).map((stop, i) => (
          <Route key={stop.race.round} from={stops[i].vector} to={stop.vector}
            completedFraction={THREE.MathUtils.clamp(travelProgress - i, 0, 1)} />
        ))}
        {stops.map((stop, i) => <StopMarker key={stop.race.round} stop={stop}
          visited={travelProgress >= i - 0.02}
          active={stop.race.round === stops[index]?.race.round}
          onSelectRound={onSelectRound} />)}
        {activeArc && <mesh position={activeArc.toArray()}>
          <sphereGeometry args={[0.018, 12, 10]}/>
          <meshBasicMaterial color="#fff3bc" toneMapped={false} />
        </mesh>}
      </group>
    </>
  );
}

export function JourneyGlobe3D({ season, calendar, travelProgress, onSelectRound, lang, closeUp }: {
  season: SeasonYear;
  calendar: readonly GrandPrixRound[];
  travelProgress: number;
  onSelectRound: (round: number) => void;
  lang: 'vi' | 'en';
  closeUp: boolean;
}) {
  const stops = useMemo(() => calendar.flatMap((race) => {
    const geo = resolveCircuit(race);
    return geo ? [{ race, ...geo, vector: geoVector(geo.latitude, geo.longitude) }] : [];
  }), [calendar]);

  return (
    <div className="rcj-globe-stage" role="img" aria-label={lang === 'vi'
      ? `Địa cầu 3D tương tác thể hiện ${stops.length} chặng F1 mùa ${season}`
      : `Interactive 3D globe showing ${stops.length} F1 rounds in ${season}`}>
      <div className="rcj-globe-vignette" aria-hidden="true" />
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 3.8], fov: 36, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}>
        <SceneMotion stops={stops} travelProgress={travelProgress}
          onSelectRound={onSelectRound} closeUp={closeUp} />
      </Canvas>
      <span className="rcj-globe-caption">51.507° / 0.000° · PODIUM EDS / GEO RACE ENGINE</span>
    </div>
  );
}
