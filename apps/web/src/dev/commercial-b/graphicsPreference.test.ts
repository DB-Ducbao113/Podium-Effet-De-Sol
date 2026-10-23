import { describe, expect, it, vi } from 'vitest';
import {
  GRAPHICS_MODE_STORAGE_KEY,
  persistGraphicsMode,
  readGraphicsMode,
} from './graphicsPreference';

describe('graphics preference', () => {
  it('restores a valid manual profile', () => {
    const storage = { getItem: vi.fn(() => 'balanced'), removeItem: vi.fn() };
    expect(readGraphicsMode(storage)).toBe('BALANCED');
    expect(storage.getItem).toHaveBeenCalledWith(GRAPHICS_MODE_STORAGE_KEY);
  });

  it('removes invalid data and falls back to AUTO', () => {
    const storage = { getItem: vi.fn(() => 'ultra'), removeItem: vi.fn() };
    expect(readGraphicsMode(storage)).toBe('AUTO');
    expect(storage.removeItem).toHaveBeenCalledWith(GRAPHICS_MODE_STORAGE_KEY);
  });

  it('persists manual mode and clears AUTO', () => {
    const storage = { setItem: vi.fn(), removeItem: vi.fn() };
    persistGraphicsMode(storage, 'HIGH');
    expect(storage.setItem).toHaveBeenCalledWith(GRAPHICS_MODE_STORAGE_KEY, 'high');
    persistGraphicsMode(storage, 'AUTO');
    expect(storage.removeItem).toHaveBeenCalledWith(GRAPHICS_MODE_STORAGE_KEY);
  });
});
