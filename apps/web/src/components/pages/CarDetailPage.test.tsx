import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CarDetailPage } from './CarDetailPage';

const locale = vi.hoisted(() => ({ lang: 'en' as 'en' | 'vi' }));
vi.mock('../../store/useNavigationStore', () => ({
  useNavigationStore: (selector?: (state: { lang: 'en' | 'vi' }) => unknown) =>
    selector ? selector({ lang: locale.lang }) : { lang: locale.lang },
}));

const render = (lang: 'en' | 'vi' = 'en') => {
  locale.lang = lang;
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/cars/sf24']}>
      <Routes>
        <Route path="/cars/:carId" element={<CarDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('car detail page localisation', () => {
  beforeEach(() => {
    locale.lang = 'en';
  });

  it('serves the aerodynamic notes in the active interface language', () => {
    const english = render('en');
    expect(english).toContain('Lowered sidepod channels feed the airflow directly');
    expect(english).toContain('A constant Venturi channel into the diffuser');
    expect(english).not.toContain('Máng trượt sidepod');

    const vietnamese = render('vi');
    expect(vietnamese).toContain('Máng trượt sidepod');
    expect(vietnamese).not.toContain('Lowered sidepod channels');
  });

  it('localises the technical notes kicker', () => {
    expect(render('en')).toContain('Engineering notes');
    expect(render('vi')).toContain('Ghi chú kỹ thuật');
  });

  it('keeps the sheet on the dark canvas instead of the light editorial surface', () => {
    const html = render();
    expect(html).not.toContain('peds-editorial-light');
    expect(html).not.toMatch(/class="[^"]*(^|\s)bg-studio-100(\s|")/);
    expect(html).toContain('bg-studio-950');
  });
});
