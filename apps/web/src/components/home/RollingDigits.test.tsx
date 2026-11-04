import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RollingDigits } from './RollingDigits';

const motion = vi.hoisted(() => ({ reduced: false }));

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => motion.reduced,
}));

const visibleText = (html: string) => html.replace(/<[^>]+>/g, '');

describe('RollingDigits', () => {
  beforeEach(() => {
    motion.reduced = false;
  });

  it('keeps decorative digits hidden from assistive technology and pads display width', () => {
    const html = renderToStaticMarkup(<RollingDigits value={7} />);
    expect(html).toContain('aria-hidden="true"');
    expect((html.match(/h25-odometer__window/g) ?? []).length).toBe(2);
    expect(html).toContain('translateY(-70%)');
  });

  it('supports larger non-negative day values', () => {
    const html = renderToStaticMarkup(<RollingDigits value={123} />);
    expect((html.match(/h25-odometer__window/g) ?? []).length).toBe(3);
  });

  it('renders the actual value without a moving strip under reduced motion', () => {
    motion.reduced = true;
    const html = renderToStaticMarkup(<RollingDigits value={7} />);
    expect(html).toContain('data-reduced-motion="true"');
    expect(html).not.toContain('h25-odometer__strip');
    expect(html).toContain('h25-odometer__value');
    expect(visibleText(html)).toBe('07');
  });
});
