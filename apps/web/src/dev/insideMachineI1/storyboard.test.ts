import { describe, expect, it } from 'vitest';
import { CHAPTERS, poseAt, progressForChapter } from './storyboard';

describe('Inside the Machine chapter navigation', () => {
  it('lands inside each selected chapter after browser scroll-position rounding', () => {
    const scrollRange = 46 * 900 - 900;
    CHAPTERS.forEach((chapter, index) => {
      const target = progressForChapter(index);
      const rounded = Math.floor(target * scrollRange) / scrollRange;
      expect(poseAt(rounded).chapterIndex, chapter.id).toBe(index);
    });
    expect(progressForChapter(0)).toBe(0);
  });
});
