import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DriverDetailPage } from './DriverDetailPage';
import { TeamDetailPage } from './TeamDetailPage';

const renderDriver = (path: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/drivers/:driverId" element={<DriverDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

const renderTeam = (path: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/teams/:teamId" element={<TeamDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('Driver profile detail', () => {
  it('does not nest a second main landmark inside the app shell', () => {
    expect(renderDriver('/drivers/verstappen?season=2024')).not.toContain('<main');
  });

  it('exposes the podium results as a table with column headers', () => {
    const html = renderDriver('/drivers/verstappen?season=2024');
    expect(html).toContain('role="table"');
    expect(html).toContain('role="columnheader"');
    expect(html).toContain('role="row"');
    expect(html).not.toContain('aria-hidden="true"><span>Rd</span>');
  });

  it('states the round of every form badge instead of leaving it hover-only', () => {
    const html = renderDriver('/drivers/verstappen?season=2024');
    expect(html).toContain('role="group"');
    expect(html).toMatch(/class="sr-only">Round \d+/);
  });

  it('reads the season statistics from the standings entry', () => {
    const html = renderDriver('/drivers/verstappen?season=2024');
    expect(html).toContain('<strong>P1</strong>');
    expect(html).toContain('<strong>437</strong>');
  });

  it('shows the teammate of the same team in the same season', () => {
    const html = renderDriver('/drivers/ocon?season=2024');
    expect(html).toContain('href="/drivers/gasly?season=2024"');
  });
});

describe('Team profile detail', () => {
  it('does not nest a second main landmark inside the app shell', () => {
    expect(renderTeam('/teams/ferrari?season=2024')).not.toContain('<main');
  });

  it('keeps the season on the back-link to the directory', () => {
    expect(renderTeam('/teams/ferrari?season=2024')).toContain('href="/teams?season=2024"');
  });

  it('offers the car detail and the constructor standings from the hero', () => {
    const html = renderTeam('/teams/ferrari?season=2024');
    const hero = html.match(/<header class="p5-team-hero"[\s\S]*?<\/header>/)?.[0] ?? '';
    expect(hero).toContain('href="/cars/');
    expect(hero).toContain('href="/season/2024?tab=standings&amp;category=constructors"');
  });

  it('does not repeat the standing position and points in the season snapshot', () => {
    const html = renderTeam('/teams/ferrari?season=2024');
    const facts = html.match(/<dl class="p5-facts"[\s\S]*?<\/dl>/)?.[0] ?? '';
    expect(facts).toContain('Gap to leader');
    expect(facts).not.toContain('<dt>Points</dt>');
    expect(facts).not.toContain('<dt>Position</dt>');
  });

  it('states the round of every form badge instead of leaving it hover-only', () => {
    const html = renderTeam('/teams/ferrari?season=2024');
    expect(html).toMatch(/class="sr-only">Round \d+[^<]*team/);
  });
});
