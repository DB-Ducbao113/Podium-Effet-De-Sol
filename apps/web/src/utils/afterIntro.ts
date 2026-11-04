/** Runs once the site intro overlay is gone (or immediately when it was already skipped). */
export function afterIntro(run: () => void) {
  if (typeof document === 'undefined' || !document.querySelector('.podium-intro')) {
    run();
    return () => {};
  }
  const observer = new MutationObserver(() => {
    if (document.querySelector('.podium-intro')) return;
    observer.disconnect();
    run();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
