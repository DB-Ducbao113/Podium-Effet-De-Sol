import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ENGINEERING_ARTICLES, HOTSPOT_LABELS } from './engineeringArticles';

describe('Engineering Insights content', () => {
  it('contains four substantive bilingual flagship articles', () => {
    expect(ENGINEERING_ARTICLES).toHaveLength(4);
    for (const article of ENGINEERING_ARTICLES) {
      expect(article.title.vi.length).toBeGreaterThan(20);
      expect(article.title.en.length).toBeGreaterThan(20);
      expect(article.sections.length).toBeGreaterThanOrEqual(4);
      expect(article.readingMinutes).toBeGreaterThanOrEqual(8);
      for (const section of article.sections) {
        expect(section.paragraphs.vi).toHaveLength(2);
        expect(section.paragraphs.en).toHaveLength(2);
        expect(section.paragraphs.vi.join(' ').length).toBeGreaterThan(500);
        expect(section.paragraphs.en.join(' ').length).toBeGreaterThan(500);
      }
    }
  });

  it('uses valid internal relationships, original local illustrations and HTTPS sources', () => {
    const slugs = new Set(ENGINEERING_ARTICLES.map((article) => article.slug));
    for (const article of ENGINEERING_ARTICLES) {
      expect(existsSync(`public${article.heroImage}`)).toBe(true);
      expect(existsSync(`public${article.socialImage}`)).toBe(true);
      expect(article.socialImage).toMatch(/\.png$/);
      expect(article.imageAlt.vi.length).toBeGreaterThan(40);
      expect(article.imageAlt.en.length).toBeGreaterThan(40);
      expect(article.sources.length).toBeGreaterThanOrEqual(3);
      article.sources.forEach((source) => {
        expect(source.url).toMatch(/^https:\/\//);
        expect(source.version.length).toBeGreaterThan(5);
        expect(source.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(source.verification.vi.length).toBeGreaterThan(20);
        expect(source.verification.en.length).toBeGreaterThan(20);
      });
      expect(article.editorialReview.status).toBe('SOURCE_CHECKED_HUMAN_REVIEW_REQUIRED');
      article.related.forEach((slug) => expect(slugs.has(slug)).toBe(true));
      article.hotspots.forEach((hotspot) => expect(HOTSPOT_LABELS[hotspot]).toBeDefined());
    }
  });

  it('does not invent publication dates or quantified EDS performance claims', () => {
    const serialized = JSON.stringify(ENGINEERING_ARTICLES);
    expect(serialized).not.toMatch(/datePublished|publicationDate|CFD result/i);
    expect(serialized).toMatch(/NOT CFD|không phải ảnh CFD|not CFD output/i);
  });
});
