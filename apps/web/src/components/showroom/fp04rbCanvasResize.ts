export type CanvasSizeSetter = (width: number, height: number) => void;

export function observeFp04rbCanvasHost(
  host: HTMLElement,
  setSize: CanvasSizeSetter,
): () => void {
  const update = () => {
    const width = host.offsetWidth;
    const height = host.offsetHeight;
    if (width > 0 && height > 0) setSize(width, height);
  };

  const observer =
    typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
  observer?.observe(host);
  const windowTarget = typeof window === "undefined" ? null : window;
  windowTarget?.addEventListener("resize", update);
  update();

  return () => {
    observer?.disconnect();
    windowTarget?.removeEventListener("resize", update);
  };
}
