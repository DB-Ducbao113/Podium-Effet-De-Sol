import { afterEach, describe, expect, it, vi } from "vitest";
import { observeFp04rbCanvasHost } from "./fp04rbCanvasResize";

describe("fp04rb canvas host sizing", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sets layout dimensions immediately and whenever the host resizes", () => {
    let onResize: (() => void) | undefined;
    const observeSpy = vi.fn();
    const disconnectSpy = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          onResize = callback;
        }
        observe = observeSpy;
        disconnect = disconnectSpy;
      },
    );
    let width = 390;
    let height = 780;
    const host = {
      get offsetWidth() {
        return width;
      },
      get offsetHeight() {
        return height;
      },
    } as HTMLElement;
    const setSize = vi.fn();
    const cleanup = observeFp04rbCanvasHost(host, setSize);

    expect(observeSpy).toHaveBeenCalledWith(host);
    expect(setSize).toHaveBeenLastCalledWith(390, 780);
    width = 1440;
    height = 852;
    onResize?.();
    expect(setSize).toHaveBeenLastCalledWith(1440, 852);

    cleanup();
    expect(disconnectSpy).toHaveBeenCalledOnce();
  });

  it("ignores a host with no measurable area", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    const host = { offsetWidth: 0, offsetHeight: 0 } as HTMLElement;
    const setSize = vi.fn();
    observeFp04rbCanvasHost(host, setSize)();
    expect(setSize).not.toHaveBeenCalled();
  });
});
