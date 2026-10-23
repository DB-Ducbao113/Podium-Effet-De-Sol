import { describe, expect, it } from 'vitest';
import { isOriginAllowed, validateQueryShape } from './index';

describe('security primitives', () => {
  it('allows same-origin and rejects suffix tricks', () => {
    expect(isOriginAllowed('https://podium.example', 'podium.example', [])).toBe(true);
    expect(isOriginAllowed('https://podium.example.evil.test', 'podium.example', [])).toBe(false);
  });

  it('rejects repeated and unknown parameters', () => {
    const keys = new Set(['limit']);
    expect(validateQueryShape({ limit: ['1', '2'] }, keys).ok).toBe(false);
    expect(validateQueryShape({ upstream: 'https://evil.test' }, keys).ok).toBe(false);
  });
});
