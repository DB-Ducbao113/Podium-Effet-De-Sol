import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RollingDigits } from './RollingDigits';

describe('RollingDigits', () => {
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
});
