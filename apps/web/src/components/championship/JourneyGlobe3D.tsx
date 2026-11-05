import { useEffect, useId, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { GrandPrixRound, SeasonYear } from '../../types';
import { resolveCircuit } from './journeyCoordinates';
import { JOURNEY_WORLD_LAND_PATH } from './journeyWorldAtlas';

type Stop = { race: GrandPrixRound; vector: THREE.Vector3; latitude: number; longitude: number };
type SceneProps = {
  stops: readonly Stop[];
  travelProgress: number;
  onSelectRound: (round: number) => void;
  closeUp: boolean;
  lang: 'vi' | 'en';
  stageId: string;
};
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
  const ghostGeometry = useMemo(() => geometry.clone(), [geometry]);
  useEffect(() => () => { geometry.dispose(); ghostGeometry.dispose(); }, [geometry, ghostGeometry]);
  useEffect(() => {
    const segmentCount = Math.round(THREE.MathUtils.clamp(completedFraction, 0, 1) * ARC_SEGMENTS);
    geometry.setDrawRange(0, segmentCount * ARC_SIDES * 6);
    invalidate();
  }, [completedFraction, geometry, invalidate]);
  return (
    <>
      <mesh geometry={ghostGeometry} renderOrder={2}>
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

function SceneMotion({ stops, travelProgress, onSelectRound, closeUp, lang, stageId }: SceneProps) {
  const globe = useRef<THREE.Group>(null);
  const firstFrame = useRef(true);
  const dragOffset = useRef({ yaw: 0, pitch: 0 });
  const draggedSinceDown = useRef(false);
  const lastTravel = useRef(travelProgress);
  const { invalidate } = useThree();

  // Mouse / pen / horizontal touch gestures rotate the globe independently of page scroll.
  // No OrbitControls or continuous render loop: use the existing demand-based renderer.
  useEffect(() => {
    const canvas = document.getElementById(stageId)?.querySelector('canvas');
    if (!canvas) return;
    let pointer: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let startX = 0;
    let startY = 0;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', lang === 'vi'
      ? 'Kéo chuột để xoay địa cầu. Dùng phím mũi tên để xoay. Cuộn trang để đi qua các chặng.'
      : 'Drag to rotate the globe. Arrow keys rotate it. Scroll the page to travel between rounds.');

    const down = (event: PointerEvent) => {
      if (pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      pointer = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      startX = lastX;
      startY = lastY;
      draggedSinceDown.current = false;
      canvas.setPointerCapture(event.pointerId);
      canvas.dataset.dragging = 'true';
    };
    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      if (Math.hypot(lastX - startX, lastY - startY) > 5) draggedSinceDown.current = true;
      if (dx === 0 && dy === 0) return;
      dragOffset.current.yaw += dx * 0.005;
      dragOffset.current.pitch = THREE.MathUtils.clamp(
        dragOffset.current.pitch + dy * 0.0035, -1.15, 1.15,
      );
      invalidate();
    };
    const end = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      pointer = null;
      delete canvas.dataset.dragging;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const lost = () => {
      pointer = null;
      delete canvas.dataset.dragging;
    };
    const key = (event: KeyboardEvent) => {
      const keys: Record<string, [number, number]> = {
        ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0],
        ArrowUp: [0, -0.12], ArrowDown: [0, 0.12],
      };
      const shift = keys[event.key];
      if (!shift) return;
      event.preventDefault();
      dragOffset.current.yaw += shift[0];
      dragOffset.current.pitch = THREE.MathUtils.clamp(
        dragOffset.current.pitch + shift[1], -1.15, 1.15,
      );
      invalidate();
    };

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('lostpointercapture', lost);
    canvas.addEventListener('keydown', key);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', end);
      canvas.removeEventListener('pointercancel', end);
      canvas.removeEventListener('lostpointercapture', lost);
      canvas.removeEventListener('keydown', key);
      delete canvas.dataset.dragging;
    };
  }, [stageId, invalidate, lang]);
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

  useEffect(() => {
    // The next wheel / page-scroll gesture resumes the guided Grand Prix camera path.
    if (Math.abs(travelProgress - lastTravel.current) > 0.0005) {
      dragOffset.current.yaw = 0;
      dragOffset.current.pitch = 0;
    }
    lastTravel.current = travelProgress;
    if (firstFrame.current && globe.current) {
      globe.current.rotation.set(desiredPitch, desiredYaw, 0, 'XYZ');
      firstFrame.current = false;
    }
    invalidate();
  }, [travelProgress, closeUp, desiredPitch, desiredYaw, invalidate]);

  useFrame((state, delta) => {
    const camera = state.camera;
    if (!globe.current) return;
    const smoothing = 1 - Math.exp(-Math.min(0.1, delta) * 3.6);
    const rotation = globe.current.rotation;
    // Shortest longitude path avoids the 360° snap at the international date line.
    const targetYaw = desiredYaw + dragOffset.current.yaw;
    const targetPitch = THREE.MathUtils.clamp(desiredPitch + dragOffset.current.pitch, -1.38, 1.38);
    const yawDelta = Math.atan2(Math.sin(targetYaw - rotation.y), Math.cos(targetYaw - rotation.y));
    const pitchDelta = targetPitch - rotation.x;
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
          onSelectRound={(round) => { if (!draggedSinceDown.current) onSelectRound(round); }} />)}
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
  const stageId = useId();
  const stops = useMemo(() => calendar.flatMap((race) => {
    const geo = resolveCircuit(race);
    return geo ? [{ race, ...geo, vector: geoVector(geo.latitude, geo.longitude) }] : [];
  }), [calendar]);

  return (
    <div id={stageId} className="rcj-globe-stage" role="group" aria-label={lang === 'vi'
      ? `Địa cầu 3D ${season} với ${stops.length} chặng. Kéo chuột để xoay, cuộn để di chuyển giữa các chặng.`
      : `3D globe with ${stops.length} rounds in ${season}. Drag to rotate; scroll to travel between races.`}>
      <div className="rcj-globe-vignette" aria-hidden="true" />
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 3.8], fov: 36, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}>
        <SceneMotion stops={stops} travelProgress={travelProgress}
          onSelectRound={onSelectRound} closeUp={closeUp} lang={lang} stageId={stageId} />
      </Canvas>
      <span className="rcj-globe-drag-hint" aria-hidden="true">{lang === 'vi' ? 'KÉO ĐỂ XOAY' : 'DRAG TO ROTATE'}</span>
    </div>
  );
}
