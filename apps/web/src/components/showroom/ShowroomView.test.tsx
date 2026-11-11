import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShowroomLoadFallback, ShowroomView } from './ShowroomView';

const locale = vi.hoisted(() => ({ lang: 'en' as 'en' | 'vi' }));
vi.mock('../../store/useNavigationStore', () => ({
  useNavigationStore: (selector?: (state: { lang: 'en' | 'vi' }) => unknown) =>
    selector ? selector({ lang: locale.lang }) : { lang: locale.lang },
}));
vi.mock('./ModelBShowroom', () => ({
  default: () => <section data-testid="model-b-showroom" />,
}));
vi.mock('../../dev/ShowroomReview', () => ({
  default: () => <section data-testid="p6-review-showroom" />,
}));

const modelBSource = readFileSync('src/components/showroom/ModelBShowroom.tsx', 'utf8');
const showroomViewSource = readFileSync('src/components/showroom/ShowroomView.tsx', 'utf8');

const render = (lang: 'en' | 'vi' = 'en') => {
  locale.lang = lang;
  return renderToStaticMarkup(<ShowroomView />);
};

describe('showroom route resilience', () => {
  beforeEach(() => {
    locale.lang = 'en';
    vi.stubGlobal('window', { location: { search: '' } });
  });

  it('serves the loading state in the active interface language', () => {
    expect(render('en')).toContain('Loading Showroom…');
    expect(render('vi')).toContain('Đang tải Showroom…');
  });

  it('keeps the 3D chunk behind an error boundary with a reload path', () => {
    expect(showroomViewSource).toContain('<ErrorBoundary fallback={<ShowroomLoadFallback lang={lang} />}>');

    const html = renderToStaticMarkup(<ShowroomLoadFallback lang="en" />);
    expect(html).toContain('3D model could not load');
    expect(html).toContain('Reload');

    const vietnamese = renderToStaticMarkup(<ShowroomLoadFallback lang="vi" />);
    expect(vietnamese).toContain('Không tải được mô hình 3D');
    expect(vietnamese).toContain('Tải lại');
  });

  it('does not nest a second main landmark inside the app shell', () => {
    expect(modelBSource).toContain('<section className="bg-[#111417] text-white" data-testid="model-b-showroom">');
    expect(modelBSource).not.toContain('<main className="bg-[#111417]');
  });
});
