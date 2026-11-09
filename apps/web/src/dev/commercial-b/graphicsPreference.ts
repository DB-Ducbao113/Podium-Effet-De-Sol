import type { GraphicsMode } from './adaptiveController';

export const GRAPHICS_MODE_STORAGE_KEY = 'peds.showroom.graphicsMode.v1';
const STORED_VALUES = ['high', 'balanced', 'performance'] as const;

export function readGraphicsMode(
  storage: Pick<Storage, 'getItem' | 'removeItem'> | null,
): GraphicsMode {
  if (!storage) return 'AUTO';
  try {
    const value = storage.getItem(GRAPHICS_MODE_STORAGE_KEY);
    if (!value || value === 'auto') return 'AUTO';
    if ((STORED_VALUES as readonly string[]).includes(value))
      return value.toUpperCase() as GraphicsMode;
    storage.removeItem(GRAPHICS_MODE_STORAGE_KEY);
  } catch {
    return 'AUTO';
  }
  return 'AUTO';
}

export function persistGraphicsMode(
  storage: Pick<Storage, 'setItem' | 'removeItem'> | null,
  mode: GraphicsMode,
) {
  if (!storage) return;
  try {
    if (mode === 'AUTO') storage.removeItem(GRAPHICS_MODE_STORAGE_KEY);
    else storage.setItem(GRAPHICS_MODE_STORAGE_KEY, mode.toLowerCase());
  } catch {
    // Storage may be unavailable or disabled. The in-memory selection remains active.
  }
}
