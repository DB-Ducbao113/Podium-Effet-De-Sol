/**
 * Scroll target for a chapter: the tall frame when it is promoted to a pinned
 * floor, otherwise the section itself. display:contents frames have no box, so
 * scrollIntoView on them would silently do nothing in lite/off quality.
 */
export function chapterScrollTarget(id: string): HTMLElement | null {
  const node = document.getElementById(id);
  if (!node) return null;
  const frame = node.closest<HTMLElement>('[data-home-chapter-frame]');
  return frame && frame.getClientRects().length > 0 ? frame : node;
}