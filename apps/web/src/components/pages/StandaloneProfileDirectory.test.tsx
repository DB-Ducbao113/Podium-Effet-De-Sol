import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { StandaloneProfileDirectory } from './StandaloneProfileDirectory';

const render = (path: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <StandaloneProfileDirectory kind="teams" />
    </MemoryRouter>,
  );

describe('Standalone profile directory', () => {
  it('does not nest a second main landmark inside the app shell', () => {
    const html = render('/teams');
    expect(html).not.toContain('<main');
    expect(html).toContain('p5-gallery-page');
  });

  it('honours the season carried in the URL so a profile back-link keeps its season', () => {
    const html = render('/teams?season=2024');
    expect(html).toContain('href="/season/2024?tab=standings&amp;category=constructors"');
    expect(html).toContain('2024');
  });

  it('falls back to the current season when the URL carries no season', () => {
    const html = render('/teams');
    expect(html).toContain('href="/season/2026?tab=standings&amp;category=constructors"');
  });
});
