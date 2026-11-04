export type PointerTarget = { x: number; y: number };
export const clamp = (value: number, a: number, b: number) => Math.min(b, Math.max(a, value));
export function normalizePointer(clientX: number, clientY: number, rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>): PointerTarget {
  return {
    x: clamp(((clientX - rect.left) / Math.max(1, rect.width) - .5) * 2, -1, 1),
    y: clamp(((clientY - rect.top) / Math.max(1, rect.height) - .5) * 2, -1, 1),
  };
}
export function damp(current: number, target: number, delta: number, speed = 7) {
  return current + (target - current) * (1 - Math.exp(-speed * clamp(delta, 0, .05)));
}
export function carPose(x: number, y: number) {
  return { translateX: x * 12, translateY: y * 8, yaw: x * 3.1, pitch: -y * 1.5, shineX: 54 + x * 21, shineY: 49 + y * 15 };
}
