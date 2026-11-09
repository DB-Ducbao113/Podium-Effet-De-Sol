import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Card3DTilt } from './Card3DTilt';

describe('Card3DTilt', () => {
  it('renders children with perspective and transform styling container', () => {
    const html = renderToStaticMarkup(
      <Card3DTilt maxTilt={4} glareOpacity={0.15} className="custom-test-card">
        <div id="test-content">F1 Car Content</div>
      </Card3DTilt>,
    );

    expect(html).toContain('custom-test-card');
    expect(html).toContain('id="test-content"');
    expect(html).toContain('F1 Car Content');
    expect(html).toContain('pointer-events-none');
  });

  it('renders safely when no optional props are provided', () => {
    const html = renderToStaticMarkup(
      <Card3DTilt>
        <span>Simple Child</span>
      </Card3DTilt>,
    );

    expect(html).toContain('Simple Child');
  });
});
