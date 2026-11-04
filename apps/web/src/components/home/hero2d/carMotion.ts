export type PointerTarget = { x: number; y: number };
export const clamp = (value: number, a: number, b: number) => Math.min(b, Math.max(a, value));

export function normalizePointer(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
): PointerTarget {
  return {
    x: clamp(((clientX - rect.left) / Math.max(1, rect.width) - .5) * 2, -1, 1),
    y: clamp(((clientY - rect.top) / Math.max(1, rect.height) - .5) * 2, -1, 1),
  };
}

export function damp(current: number, target: number, delta: number, speed = 7) {
  return current + (target - current) * (1 - Math.exp(-speed * clamp(delta, 0, .05)));
}

/** Deliberately small angles: rotating a flat illustration too far exposes the 2.5D illusion. */
export function carPose(x: number, y: number) {
  const boundedX = clamp(x, -1, 1);
  const boundedY = clamp(y, -1, 1);
  return {
    translateX: boundedX * 16,
    translateY: boundedY * 10,
    yaw: boundedX * 3.4,
    pitch: -boundedY * 1.8,
    shineX: 52 + boundedX * 26,
    shineY: 47 + boundedY * 22,
  };
}

/** Normalized impulse from movement distance, independent of viewport size. */
export function movementImpulse(distance: number) {
  return clamp(distance * 2.4, 0, 1);
}

/** Zero until the top of Hero scrolls above the viewport, then bounded until it exits. */
export function heroScrollProgress(top: number, height: number) {
  return clamp(-top / Math.max(1, height), 0, 1);
}
