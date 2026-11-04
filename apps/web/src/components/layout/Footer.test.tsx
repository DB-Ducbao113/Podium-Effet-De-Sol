import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Footer } from './Footer';
import { t } from '../../i18n/translations';

const locale = vi.hoisted(() => ({ lang: 'en' as 'en' | 'vi' }));
vi.mock('../../store/useNavigationStore', () => ({
  useNavigationStore: (selector: (state: { lang: 'en' | 'vi' }) => unknown) =>
    selector({ lang: locale.lang }),
}));

function renderFooter(lang: 'en' | 'vi') {
  locale.lang = lang;
  return renderToStaticMarkup(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
}

describe('Cinematic Footer / About and Credits contract', () => {
  beforeEach(() => { locale.lang = 'en'; });

  it.each(['en', 'vi'] as const)('preserves attribution, official brand, routes and accessible links (%s)', (lang) => {
    const html = renderFooter(lang);
    expect(html).toContain('data-footer-design="cinematic-v2"');
    expect(html).toContain('id="peds-credits"');
    expect(html).toContain('id="peds-attribution"');
    expect(html).toContain(t[lang].footer.disclaimer);
    expect(html).toContain(t[lang].footer.copyright);
    expect(html).toContain('/logo/logo.png');
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="#peds-attribution"');
    expect(html).toContain('href="/showroom"');
    expect(html).toContain('href="/season/2026"');
    expect(html).toContain('href="/teams"');
    expect(html).toContain('href="/drivers"');
    expect(html).toContain('peds-footer__backtop');
    expect(html).not.toMatch(/<canvas|<video/i);
  });

  it('places the project story in the About column and keeps one main legal disclosure', () => {
    const html = renderFooter('en');
    expect(html).toContain('ABOUT PODIUM EDS');
    expect(html).toContain('BUILT FOR THE LOVE OF RACING.');
    expect(html).toContain('Project &amp; creator');
    expect(html).toContain('Credits &amp; rights');
    expect(html.match(/Independent, unofficial platform/g)).toHaveLength(1);
  });
});
