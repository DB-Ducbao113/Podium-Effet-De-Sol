import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { F1PageTransition } from './F1PageTransition';

describe('F1PageTransition', () => {
  it('renders children and transition container without errors', () => {
    const html = renderToStaticMarkup(
      <F1PageTransition pathname="/championship">
        <div id="page-content">Championship Page</div>
      </F1PageTransition>,
    );
    expect(html).toContain('id="page-content"');
    expect(html).toContain('Championship Page');
  });

  it('renders correctly with root pathname', () => {
    const html = renderToStaticMarkup(
      <F1PageTransition pathname="/">
        <div>Home Page</div>
      </F1PageTransition>,
    );
    expect(html).toContain('Home Page');
  });

  it('does not trap mobile fixed navigation in a transformed containing block', () => {
    const html = renderToStaticMarkup(
      <F1PageTransition pathname="/mobile-hub" noTransform>
        <nav data-mobile-bottom-nav="true" />
      </F1PageTransition>,
    );
    expect(html).toContain('data-mobile-bottom-nav');
    expect(html).not.toContain('will-change-transform');
  });

  it('keeps the desktop page entrance animation', () => {
    const html = renderToStaticMarkup(
      <F1PageTransition pathname="/showroom">
        <main />
      </F1PageTransition>,
    );
    expect(html).toContain('animate-f1-depth-enter');
  });
});
