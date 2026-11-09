import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  closeOnBackdrop?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  labelledBy,
  describedBy,
  children,
  className,
  overlayClassName,
  closeOnBackdrop = true,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? panel)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  const modal = (
    <div
      className={cn(
        'fixed inset-0 z-[85] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6',
        overlayClassName,
      )}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={cn(
          'max-h-full w-full overflow-hidden rounded-peds-xl border border-peds-line-strong bg-peds-surface-raised text-peds-text shadow-peds-elevated outline-none',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );

  return typeof document === 'undefined' ? modal : createPortal(modal, document.body);
};
