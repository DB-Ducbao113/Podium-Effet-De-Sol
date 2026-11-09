import type { ReactNode } from 'react';
import type { HomeChapter } from './homeJourneyMath';

/**
 * Inert wrapper (display:contents) unless the journey engine promotes the page
 * to full quality on wide screens; then CSS pins the chapter as a scroll floor.
 */
export function HomeChapterFrame({ id, children }: { id: HomeChapter; children: ReactNode }) {
  return (
    <div className="home-chapter-frame" data-home-chapter-frame={id}>
      {children}
    </div>
  );
}