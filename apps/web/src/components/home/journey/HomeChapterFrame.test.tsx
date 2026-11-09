import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HomeChapterFrame } from './HomeChapterFrame';

describe('HomeChapterFrame', () => {
  it('wraps the chapter without altering its section anchor', () => {
    const html = renderToStaticMarkup(
      <HomeChapterFrame id="race-control">
        <section id="race-control">content</section>
      </HomeChapterFrame>,
    );
    expect(html).toContain('data-home-chapter-frame="race-control"');
    expect(html).toContain('class="home-chapter-frame"');
    expect(html).toContain('id="race-control"');
    expect(html).toContain('content');
  });
  it('renders no inline sizing so non-full quality stays in normal flow', () => {
    const html = renderToStaticMarkup(
      <HomeChapterFrame id="eds-explore"><section id="eds-explore" /></HomeChapterFrame>,
    );
    expect(html).not.toContain('style=');
    expect(html).not.toContain('height');
  });
});