import { describe, expect, it } from 'vitest';
import { modelBReviewCopy } from './modelBReviewCopy';
import { normalizeRoutePath } from './routePath';

describe('Showroom route metadata', () => {
  it('names the local Model B review accurately in both languages', () => {
    expect(modelBReviewCopy('en').title).toContain('Model B');
    expect(modelBReviewCopy('vi').description).toContain('Model B');
  });
});

describe('Prerendered route metadata', () => {
  it('uses the same canonical route with or without a directory trailing slash', () => {
    expect(normalizeRoutePath('/engineering/')).toBe('/engineering');
    expect(normalizeRoutePath('/engineering/ground-effect-aerodynamics/')).toBe(
      '/engineering/ground-effect-aerodynamics',
    );
    expect(normalizeRoutePath('/')).toBe('/');
  });
});
