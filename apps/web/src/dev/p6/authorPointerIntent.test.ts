import { describe, expect, it } from 'vitest';
import { shouldStartDecalPlacement } from './authorPointerIntent';

describe('Model B pointer ownership', () => {
  it('always leaves ordinary primary drag to orbit controls', () => {
    expect(shouldStartDecalPlacement({ shiftKey: false, button: 0 })).toBe(false);
  });
  it('uses Shift + primary pointer for decal editing only', () => {
    expect(shouldStartDecalPlacement({ shiftKey: true, button: 0 })).toBe(true);
    expect(shouldStartDecalPlacement({ shiftKey: true, button: 1 })).toBe(false);
    expect(shouldStartDecalPlacement({ shiftKey: true, button: 2 })).toBe(false);
  });
});
