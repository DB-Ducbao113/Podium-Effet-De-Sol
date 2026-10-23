import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FullscreenCarStageHeading } from './FullscreenCarStage';
import { t } from '../../i18n/translations';

describe('FullscreenCarStageHeading', () => {
  it.each(['vi', 'en'] as const)(
    'keeps %s sentences on separate lines without an extra separator',
    (lang) => {
      const html = renderToStaticMarkup(<FullscreenCarStageHeading lang={lang} />);
      expect(html).toContain(`<span class="block">${t[lang].home.heroTitle1}</span>`);
      expect(html).toContain(`<span class="block">${t[lang].home.heroTitle2}</span>`);
      expect(html).not.toContain(' · ');
      expect(html).not.toContain('font-black');
      expect(html).not.toContain('tracking-tight');
      expect(html).not.toContain('leading-none');
    },
  );

  it('uses a Vietnamese-safe sans fallback and relaxed line spacing', () => {
    const html = renderToStaticMarkup(<FullscreenCarStageHeading lang="vi" />);
    expect(html).toContain('font-body leading-[1.3] tracking-normal');
  });
});
