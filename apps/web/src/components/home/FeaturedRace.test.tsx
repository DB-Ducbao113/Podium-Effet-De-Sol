import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DetailedRaceResult, DetailedRaceResultEntry } from '../../types';

const nav = vi.hoisted(() => ({ lang: 'en' as 'en' | 'vi' }));

vi.mock('../../store/useNavigationStore', () => ({
  useNavigationStore: (selector: (state: { lang: 'en' | 'vi' }) => unknown) => selector({ lang: nav.lang }),
}));

afterEach(() => {
  nav.lang = 'en';
});

const mockStore = vi.hoisted(() => ({
  state: {
    detailedResults: { 2026: [] as unknown[] },
    syncMeta: { syncStatus: 'success' },
  },
}));

vi.mock('../../store/useChampionshipStore', () => ({
  useChampionshipStore: (selector: (state: typeof mockStore.state) => unknown) => selector(mockStore.state),
}));

import { FeaturedRace } from './FeaturedRace';

const entry = (over: Partial<DetailedRaceResultEntry>): DetailedRaceResultEntry => ({
  position: 1,
  driverId: 'driver-1',
  driverName: 'Test Driver',
  driverCode: 'TST',
  teamId: 'mercedes',
  teamName: 'Test Team',
  laps: 56,
  status: 'Finished',
  timeOrGap: '1:30:00.000',
  points: 25,
  ...over,
});

const race = (over: Partial<DetailedRaceResult>): DetailedRaceResult => ({
  id: 'race-2026-r18',
  season: 2026,
  round: 18,
  grandPrix: 'United States Grand Prix',
  officialName: 'United States Grand Prix',
  circuit: 'Circuit of the Americas',
  location: 'Austin',
  country: 'USA',
  date: '2026-10-25',
  status: 'completed',
  lapsTotal: 56,
  entries: [],
  dataSource: 'Jolpica F1 API',
  ...over,
});

const raceEntries = [
  entry({ position: 1, driverId: 'antonelli', driverName: 'Andrea Kimi Antonelli', driverCode: 'ANT', gridPosition: 4 }),
  entry({ position: 2, driverId: 'leclerc', driverName: 'Charles Leclerc', driverCode: 'LEC', teamId: 'ferrari', teamName: 'Ferrari', timeOrGap: '+4.215', fastestLap: true, fastestLapTime: '1:37.976' }),
  entry({ position: 3, driverId: 'verstappen', driverName: 'Max Verstappen', driverCode: 'VER', teamId: 'redbull', teamName: 'Red Bull', timeOrGap: '+8.900' }),
  entry({ position: 4, driverId: 'hamilton', driverName: 'Lewis Hamilton', driverCode: 'HAM', teamId: 'ferrari', teamName: 'Ferrari', timeOrGap: '+12.100' }),
  entry({ position: 5, driverId: 'norris', driverName: 'Lando Norris', driverCode: 'NOR', teamId: 'mclaren', teamName: 'McLaren', gridPosition: 12, timeOrGap: '+15.300' }),
  entry({ position: 6, driverId: 'piastri', driverName: 'Oscar Piastri', driverCode: 'PIA', teamId: 'mclaren', teamName: 'McLaren', timeOrGap: '+18.000' }),
  entry({ position: 7, driverId: 'russell', driverName: 'George Russell', driverCode: 'RUS', timeOrGap: '+21.500' }),
  entry({ position: 8, driverId: 'hadjar', driverName: 'Isack Hadjar', driverCode: 'HAD', teamId: 'redbull', teamName: 'Red Bull', timeOrGap: '+24.700' }),
  entry({ position: 9, driverId: 'alonso', driverName: 'Fernando Alonso', driverCode: 'ALO', teamId: 'astonmartin', teamName: 'Aston Martin', timeOrGap: '+31.900' }),
];

function setRaces(races: DetailedRaceResult[], syncStatus = 'success') {
  mockStore.state.detailedResults[2026] = races;
  mockStore.state.syncMeta = { syncStatus };
}

function renderHomeRace() {
  return renderToStaticMarkup(<MemoryRouter><FeaturedRace /></MemoryRouter>);
}

describe('FeaturedRace (Latest GP + Race Intelligence)', () => {
  it('uses only the latest verified completed round and renders top 8 with derived race intelligence', () => {
    setRaces([
      race({ round: 18, entries: raceEntries }),
      race({ round: 19, status: 'scheduled', grandPrix: 'Mexican Grand Prix', entries: [] }),
      race({ round: 20, isSynthesized: true, grandPrix: 'Synthesized Grand Prix', entries: raceEntries }),
    ]);
    const html = renderHomeRace();

    expect(html).toContain('United States Grand Prix');
    expect(html).not.toContain('Mexican Grand Prix');
    expect(html).not.toContain('Synthesized Grand Prix');
    expect(html.split('home-latest-gp__row').length - 1).toBe(8);
    expect(html).not.toContain('Fernando Alonso');
    expect(html).toContain('+1 more drivers');
    expect(html).toContain('Winning margin');
    expect(html).toContain('+4.215');
    expect(html).toContain('1:37.976');
    expect(html).toContain('Biggest gain');
    expect(html).toContain('+7');
    expect(html).toContain('NOR · P12 → P5');
    expect(html).toContain('Verified classification');
    expect(html).toContain('Jolpica F1 API');
    expect(html).toContain('/season/2026/race/18');
  });

  it('shows an honest unavailable state and keeps championship destinations when no verified round exists', () => {
    setRaces([race({ isSynthesized: true, entries: raceEntries })], 'error');
    const html = renderHomeRace();

    expect(html).toContain('DATA / UNAVAILABLE');
    expect(html).toContain('Verified results are temporarily unavailable.');
    expect(html).not.toContain('home-latest-gp__row');
    expect(html).toContain('tab=results');
    expect(html).toContain('tab=calendar');
  });

  it('offers a sprint session only when verified sprint entries exist', () => {
    setRaces([
      race({
        round: 18,
        entries: raceEntries,
        sprintEntries: [entry({ position: 1, driverId: 'sprint-winner', driverName: 'Sprint Winner', driverCode: 'SPR' })],
      }),
    ]);
    const html = renderHomeRace();

    expect(html).toContain('>Sprint<');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('Race classification');
    expect(html).not.toContain('Sprint Winner');
    expect(html).not.toContain('Sprint classification unavailable');
  });

  it('marks the saved snapshot while a fresh sync is still running', () => {
    setRaces([race({ round: 15, grandPrix: 'Azerbaijan Grand Prix', dataSource: 'Formula1.com result snapshot', entries: raceEntries })], 'syncing');
    const html = renderHomeRace();

    expect(html).toContain('Checking latest round');
    expect(html).toContain('Saved R15 snapshot · Formula1.com result snapshot');
    expect(html).not.toContain('Verified classification');
    expect(html).toContain('home-latest-gp__verified is-syncing');
  });

  it('reports an unverified latest round when the sync fails and a snapshot remains visible', () => {
    setRaces([race({ round: 15, grandPrix: 'Azerbaijan Grand Prix', dataSource: 'Formula1.com result snapshot', entries: raceEntries })], 'error');
    const html = renderHomeRace();

    expect(html).toContain('Latest round unverified');
    expect(html).toContain('Saved R15 snapshot · Formula1.com result snapshot');
    expect(html).not.toContain('Verified classification');
    expect(html).toContain('home-latest-gp__verified is-stale');
  });

  it('localizes the pending snapshot indicator in Vietnamese', () => {
    nav.lang = 'vi';
    setRaces([race({ round: 15, grandPrix: 'Azerbaijan Grand Prix', dataSource: 'Formula1.com result snapshot', entries: raceEntries })], 'syncing');
    const html = renderHomeRace();

    expect(html).toContain('Đang kiểm tra chặng mới nhất');
    expect(html).toContain('Bản lưu R15 · Formula1.com result snapshot');
    expect(html).not.toContain('Phân loại đã xác minh');
  });

  it('localizes the Race Intelligence heading and accessible table labels in Vietnamese', () => {
    nav.lang = 'vi';
    setRaces([race({ round: 18, entries: raceEntries })]);
    const html = renderHomeRace();

    expect(html).toContain('PHÂN TÍCH CHẶNG ĐUA');
    expect(html).not.toContain('RACE INTELLIGENCE');
    expect(html).toContain('<th scope="col">Hạng</th>');
    expect(html).not.toContain('>Pos<');
    expect(html).toContain('Cách biệt dẫn đầu');
    expect(html).toContain('Vòng nhanh nhất');
    expect(html).toContain('Vượt nhiều nhất');
    expect(html).toContain('Jolpica F1 API');
  });
});
