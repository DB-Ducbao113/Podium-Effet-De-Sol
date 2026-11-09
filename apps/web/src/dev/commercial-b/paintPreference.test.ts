import { describe, expect, it } from 'vitest';
import { DEFAULT_MODEL_B_PAINT_ID, MODEL_B_PAINT_STORAGE_KEY, persistModelBPaint, readModelBPaint } from './paintPreference';

describe('Model B paint preference', () => {
  it('restores a known paint and falls back for invalid or unavailable storage', () => {
    expect(readModelBPaint({ getItem: () => 'papaya-rush' })).toBe('papaya-rush');
    expect(readModelBPaint({ getItem: () => 'unknown' })).toBe(DEFAULT_MODEL_B_PAINT_ID);
    expect(readModelBPaint({ getItem: () => { throw new Error('blocked'); } })).toBe(DEFAULT_MODEL_B_PAINT_ID);
  });

  it('writes only a known paint using the versioned key', () => {
    const writes: [string, string][] = [];
    const storage = { setItem: (key: string, value: string) => { writes.push([key, value]); } };
    persistModelBPaint(storage, 'silver-pulse');
    persistModelBPaint(storage, 'unknown');
    expect(writes).toEqual([[MODEL_B_PAINT_STORAGE_KEY, 'silver-pulse']]);
  });
});
