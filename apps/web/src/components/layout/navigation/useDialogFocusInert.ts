import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (el) =>
      !el.hidden &&
      el.getAttribute("aria-hidden") !== "true" &&
      el.getClientRects().length > 0,
  );
}

export interface UseDialogFocusInertOptions {
  readonly open: boolean;
  readonly dialogRef: RefObject<HTMLElement | null>;
  readonly initialFocusRef?: RefObject<HTMLElement | null>;
  readonly shouldRestoreFocus: () => boolean;
  readonly onRequestClose: (restoreFocus: boolean) => void;
}

/**
 * Manages modal focus trap (Tab/Shift+Tab), Escape dismissal, snapshot-safe body scroll lock,
 * background `inert` tracking/restoration, and safe focus return to the trigger button (BR-11, ADR-NAV-04).
 */
export function useDialogFocusInert({
  open,
  dialogRef,
  initialFocusRef,
  shouldRestoreFocus,
  onRequestClose,
}: UseDialogFocusInertOptions): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onRequestClose);
  const shouldRestoreRef = useRef(shouldRestoreFocus);

  useEffect(() => {
    onCloseRef.current = onRequestClose;
    shouldRestoreRef.current = shouldRestoreFocus;
  }, [onRequestClose, shouldRestoreFocus]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const prevActive = document.activeElement;
    previousFocusRef.current =
      prevActive instanceof HTMLElement ? prevActive : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const modifiedInertElements: HTMLElement[] = [];
    const rootEl = document.getElementById("root");
    if (
      rootEl &&
      !rootEl.inert &&
      !rootEl.querySelector("[data-peds-nav-dialog='true']")
    ) {
      rootEl.inert = true;
      modifiedInertElements.push(rootEl);
    }

    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (child === rootEl) continue;
      if (child.hasAttribute("data-peds-nav-portal")) continue;
      if (child.querySelector("[data-peds-nav-dialog='true']")) continue;
      if (child.getAttribute("role") === "dialog") continue;
      if (!child.inert) {
        child.inert = true;
        modifiedInertElements.push(child);
      }
    }

    const focusTarget =
      initialFocusRef?.current ??
      (dialogRef.current ? getFocusableElements(dialogRef.current)[0] : null) ??
      dialogRef.current;
    const rafId = window.requestAnimationFrame(() => {
      focusTarget?.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current(true);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last?.focus({ preventScroll: true });
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first?.focus({ preventScroll: true });
      }
    };

    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown, true);
      for (const el of modifiedInertElements) {
        el.inert = false;
      }
      document.body.style.overflow = previousOverflow;
      if (
        shouldRestoreRef.current() &&
        previousFocusRef.current &&
        previousFocusRef.current.isConnected
      ) {
        previousFocusRef.current.focus({ preventScroll: true });
      }
      previousFocusRef.current = null;
    };
  }, [dialogRef, initialFocusRef, open]);
}
