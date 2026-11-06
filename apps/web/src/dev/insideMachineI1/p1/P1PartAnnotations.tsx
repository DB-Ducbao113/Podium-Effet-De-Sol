import { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FRONT_LEFT_WHEEL_V2 } from '../design/frontLeftWheelV2';

const LABEL_DETAIL = [
  ['CENTER LOCK', 'AXIAL RELEASE'],
  ['OUTER WHEEL', 'RUBBER / RIM'],
  ['WHEEL HUB', 'MOUNTING INTERFACE'],
  ['BRAKE DISC', 'CARBON COMPOSITE'],
  ['BRAKE CALIPER', 'CALIPER BODY'],
  ['SUSPENSION LINKS', 'ARM / JOINT SYSTEM'],
  ['HUB MOUNT', 'ILLUSTRATIVE INTERFACE'],
] as const;

interface PartLabel {
  id: string;
  node: string;
  heading: string;
  subtitle: string;
  offset: readonly [number, number, number];
}

const LABELS: readonly PartLabel[] = FRONT_LEFT_WHEEL_V2.map((part, index) => ({
  id: part.id,
  node: part.node,
  heading: `${String(index + 1).padStart(2, '0')} / ${LABEL_DETAIL[index][0]}`,
  subtitle: LABEL_DETAIL[index][1],
  offset: index === 1
    ? [0.02, -0.22, -0.08] as const
    : [0.05, 0.13, -0.10] as const,
}));

/**
 * Real geometry-backed label positions, including the hub-mount node whose
 * authored pivot is incorrectly [0,0,0]. Only one label is shown in
 * Focus mode; the two original callouts remain in guided teardown mode.
 */
export default function P1PartAnnotations({
  model,
  progress,
  selected,
  focusPart,
}: {
  model: THREE.Group;
  progress: number;
  selected: string;
  focusPart: string | null;
}) {
  const targets = useMemo(
    () => LABELS.map((label) => model.getObjectByName(label.node)),
    [model],
  );
  const groups = useRef(new Map<string, THREE.Group>());
  const worldCenter = useMemo(() => new THREE.Vector3(), []);
  const bounds = useMemo(() => new THREE.Box3(), []);

  useFrame(() => {
    LABELS.forEach((label, index) => {
      const group = groups.current.get(label.id);
      const node = targets[index];
      if (!group || !node) return;
      const isVisible = focusPart
        ? focusPart === label.id
        : index < 2 && progress >= 0.27 && progress < 0.958;
      group.visible = isVisible;
      if (!isVisible) return;

      node.updateWorldMatrix(true, true);
      bounds.setFromObject(node, true);
      if (bounds.isEmpty()) {
        node.getWorldPosition(worldCenter);
      } else {
        bounds.getCenter(worldCenter);
      }
      group.position.set(
        worldCenter.x + label.offset[0],
        worldCenter.y + label.offset[1],
        worldCenter.z + label.offset[2],
      );
    });
  });

  return (
    <>
      {LABELS.map((label, index) => {
        const visible = focusPart
          ? focusPart === label.id
          : index < 2 && progress >= 0.27 && progress < 0.958;
        return (
          <group
            key={label.id}
            ref={(object) => {
              if (object) groups.current.set(label.id, object);
              else groups.current.delete(label.id);
            }}
            visible={visible}
          >
            <Html
              center={false}
              distanceFactor={5.2}
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
        );
      })}
    </>
  );
}
