import { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FRONT_LEFT_WHEEL_V2 } from '../design/frontLeftWheelV2';

interface PartLabel {
  id: string;
  node: string;
  heading: string;
  subtitle: string;
  offset: readonly [number, number, number];
}

const LABELS: readonly PartLabel[] = [
  {
    id: 'FRONT_LEFT_WHEEL.CENTER_LOCK_NUT',
    node: FRONT_LEFT_WHEEL_V2[0].node,
    heading: '01 / CENTER LOCK',
    subtitle: 'AXIAL RELEASE',
    offset: [0.05, 0.20, -0.12],
  },
  {
    id: 'FRONT_LEFT_WHEEL.WHEEL_OUTER',
    node: FRONT_LEFT_WHEEL_V2[1].node,
    heading: '02 / OUTER WHEEL',
    subtitle: 'RUBBER / RIM',
    offset: [0, -0.24, -0.10],
  },
] as const;

/**
 * Two DOM labels are physically anchored to GLB source nodes.
 * No screen-space coordinates or fabricated telemetry are used.
 * Deliberately no labels over the full-car opening frame.
 */
export default function P1PartAnnotations({
  model, progress, selected,
}: {
  model: THREE.Group;
  progress: number;
  selected: string;
}) {
  const targets = useMemo(
    () => LABELS.map((label) => model.getObjectByName(label.node)),
    [model],
  );
  const rootA = useRef<THREE.Group>(null);
  const rootB = useRef<THREE.Group>(null);
  const world = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    [rootA.current, rootB.current].forEach((group, index) => {
      const target = targets[index];
      if (!group || !target) return;
      target.getWorldPosition(world);
      const offset = LABELS[index].offset;
      group.position.set(
        world.x + offset[0],
        world.y + offset[1],
        world.z + offset[2],
      );
    });
  });

  const visible = progress >= 0.26 && progress < 0.958;
  return (
    <>
      {LABELS.map((label, index) => (
        <group key={label.id} ref={index === 0 ? rootA : rootB} visible={visible}>
          <Html
            center={false}
            distanceFactor={6}
            style={{ pointerEvents: 'none', opacity: visible ? 1 : 0 }}
          >
            <div
              className={
                selected === label.id
                  ? 'itm-p1__annotation itm-p1__annotation--active'
                  : 'itm-p1__annotation'
              }
              aria-hidden="true"
            >
              <span className="itm-p1__annotation-line" />
              <div className="itm-p1__annotation-content">
                <strong>{label.heading}</strong>
                <small>{label.subtitle}</small>
              </div>
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}
