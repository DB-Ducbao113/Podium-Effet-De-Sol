import { describe, expect, it } from 'vitest';
import { modelBReviewCopy } from './modelBReviewCopy';

describe('Showroom route metadata', () => {
  it('names the local Model B review accurately in both languages', () => {
    expect(modelBReviewCopy('en').title).toContain('Model B');
    expect(modelBReviewCopy('vi').description).toContain('Model B');
  });
});
