import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RaceClassificationModal } from './RaceClassificationModal';
import type { DetailedRaceResult } from '../../types';

const locale = vi.hoisted(() => ({ lang: 'en' as 'en' | 'vi' }));
vi.mock('../../store/useNavigationStore', () => ({
  useNavigationStore: (selector?: (state: { lang: 'en' | 'vi' }) => unknown) =>
    selector ? selector({ lang: locale.lang }) : { lang: locale.lang },
}));

const race: DetailedRaceResult = {
  id: 'race-2024-r1',
  season: 2024,
  round: 1,
  grandPrix: 'Bahrain Grand Prix',
  officialName: 'Formula 1 Gulf Air Bahrain Grand Prix',
  circuit: 'Bahrain International Circuit',
  country: 'BHR',
  date: '2024-03-02',
  status: 'completed',
  lapsTotal: 57,
  winner: { driver: 'Max Verstappen', team: 'Red Bull Racing', time: '1:29:18.633' },
  fastestLap: { driver: 'Max Verstappen', team: 'Red Bull Racing', time: '1:29.179' },
  entries: [
    {
      position: 1,
      driverId: 'max-verstappen',
      driverName: 'Max Verstappen',
      driverCode: 'VER',
      driverNumber: 1,
      teamId: 'redbull',
      teamName: 'Red Bull Racing',
      laps: 57,
      status: 'Finished',
      timeOrGap: '1:29:18.633',
      points: 25,
    },
    {
      position: 2,
      driverId: 'charles-leclerc',
      driverName: 'Charles Leclerc',
      driverCode: 'LEC',
      driverNumber: 16,
      teamId: 'ferrari',
      teamName: 'Ferrari',
      laps: 49,
      status: 'Retired',
      timeOrGap: 'Retired',
      points: 0,
    },
    {
      position: 3,
      driverId: 'zhou',
      driverName: 'Guanyu Zhou',
      driverCode: 'ZHO',
      driverNumber: 24,
      teamId: 'audi',
      teamName: 'Kick Sauber F1 Team',
      laps: 56,
      status: '+1 Lap',
      timeOrGap: '+1 Lap',
      points: 0,
    },
  ],
};

const render = (lang: 'en' | 'vi' = 'en') => {
  locale.lang = lang;
  return renderToStaticMarkup(<RaceClassificationModal race={race} onClose={() => {}} />);
};

describe('race classification dialog', () => {
  beforeEach(() => {
    locale.lang = 'en';
  });

  it('names the dialog with the Grand Prix heading instead of an English-only label', () => {
    const html = render();
    expect(html).toContain('aria-labelledby="race-classification-title"');
    expect(html).toContain('id="race-classification-title"');
    expect(html).toContain('Bahrain Grand Prix');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it('keeps the close control reachable and labelled in both languages', () => {
    expect(render('en')).toContain('aria-label="Close"');

    const html = render('vi');
    expect(html).toContain('aria-label="Đóng"');
    expect(html).not.toContain('aria-label="Close"');
  });

  it('marks the panel as a focus target for the keyboard trap', () => {
    expect(render()).toContain('tabindex="-1"');
  });

  it('exposes the classification table with column headers', () => {
    const html = render();
    expect(html.match(/<th scope="col"/g)?.length).toBe(7);
    expect(html).not.toMatch(/<th class=/);
  });

  it('keeps the driver cell in the table column model', () => {
    const html = render();
    expect(html).toContain('<td class="py-3 px-4 font-bold">');
    expect(html).not.toContain('class="py-3 px-4 font-bold flex');
  });

  it('marks a retirement reason as a non-finish but keeps a lap-down finish in the time column', () => {
    const html = render();
    expect(html).toContain('text-red-400 font-bold uppercase">Retired</span>');
    expect(html).toContain('<span class="text-studio-300">+1 Lap</span>');
  });
});
