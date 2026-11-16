import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
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

  it('ends the wipe on the animation event instead of a duplicated duration', () => {
    const source = readFileSync('src/components/common/F1PageTransition.tsx', 'utf8');
    const css = readFileSync('src/index.css', 'utf8');
    // A literal 420 next to a 0.4s keyframe is a race, not a contract.
    expect(source).not.toContain('420');
    expect(source).toContain('onAnimationEnd');
    expect(source).toContain('event.target === event.currentTarget');
    // Reduced motion declares animation:none, so the event can never arrive.
    expect(source).toContain('setIsWiping(!reducedMotion)');
    const safety = Number(source.match(/WIPE_SAFETY_MS = (\d+)/)?.[1]);
    const wipeMs = Number(css.match(/animation: f1SpeedWipe ([\d.]+)s/)?.[1]) * 1000;
    expect(wipeMs).toBeGreaterThan(0);
    expect(safety).toBeGreaterThan(wipeMs);
  });
});
