import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AdSlot } from './AdSlot';

describe('AdSlot', () => {
  it('renders nothing unless design/review mode is explicit', () => {
    expect(renderToStaticMarkup(<AdSlot variant="leaderboard" />)).toBe('');
  });

  it.each(['leaderboard', 'in-content', 'sidebar'] as const)(
    'reserves an accessible %s review surface without provider markup',
    (variant) => {
      const markup = renderToStaticMarkup(
        <AdSlot variant={variant} reviewMode placement="homepage-after-intro" />,
      );

      expect(markup).toContain('aria-label="Advertisement / Quảng cáo"');
      expect(markup).toContain(`data-ad-slot="${variant}"`);
      expect(markup).toContain('data-ad-placement="homepage-after-intro"');
      expect(markup).not.toContain('<script');
      expect(markup).not.toContain('<iframe');
      expect(markup).not.toContain('http');
    },
  );
});
