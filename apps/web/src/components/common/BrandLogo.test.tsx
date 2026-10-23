import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrandLogo, BrandLogoMark } from './BrandLogo';

describe('BrandLogo Component', () => {
  it('renders BrandLogoMark svg with multi-element aerodynamic paths', () => {
    const html = renderToStaticMarkup(<BrandLogoMark size="md" />);
    expect(html).toContain('viewBox="0 0 36 36"');
    expect(html).toContain('geBrandRed');
    expect(html).toContain('geBrandSilver');

    // Should NOT contain any F1 trademark text
    expect(html).not.toContain('>F1<');
  });

  it('renders BrandLogo with full title and HUB accent pill', () => {
    const html = renderToStaticMarkup(<BrandLogo variant="full" />);
    expect(html).toContain('Ground Effect');
    expect(html).toContain('Hub');
  });

  it('supports mark-only variant without text labels', () => {
    const html = renderToStaticMarkup(<BrandLogo variant="mark" size="sm" />);
    expect(html).toContain('viewBox="0 0 36 36"');
    expect(html).not.toContain('Ground Effect');
  });

  it('supports dark theme styling', () => {
    const html = renderToStaticMarkup(<BrandLogo variant="full" theme="dark" />);
    expect(html).toContain('text-white');
  });
});
