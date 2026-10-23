import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { HotspotItem } from '../../data/showroom/hotspotsData';

interface Props {
  hotspot: HotspotItem | null;
  hotspots: HotspotItem[];
  onClose: () => void;
  onSelectHotspot: (hotspot: HotspotItem) => void;
  lang: 'vi' | 'en';
}

export const EDSHotspotDetailsModal: React.FC<Props> = ({
  hotspot,
  hotspots,
  onClose,
  onSelectHotspot,
  lang,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const isOpen = Boolean(hotspot);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button, a[href]');
      if (!focusable?.length) return;
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
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen]);

  if (!hotspot) return null;
  const index = hotspots.findIndex((item) => item.id === hotspot.id);
  const articleSlug = {
    wings: 'active-aerodynamics-wing-mechanics',
    drs: 'active-aerodynamics-wing-mechanics',
    power_unit: 'hybrid-powertrains-energy-management',
    sidepods: 'ground-effect-aerodynamics',
    tires: 'vehicle-dynamics-suspension',
    floor: 'ground-effect-aerodynamics',
  }[hotspot.id];
  const selectOffset = (offset: number) =>
    onSelectHotspot(hotspots[(index + offset + hotspots.length) % hotspots.length]);
  const content = (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eds-detail-title"
    >
      <div className="w-full max-w-5xl max-h-[92vh] overflow-auto rounded-t-3xl sm:rounded-3xl border border-cyan-400/25 bg-studio-950 shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-studio-800 bg-studio-950/95 px-5 py-4 backdrop-blur-xl">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-300">
              Podium EDS · Original engineering asset
            </p>
            <h2
              id="eds-detail-title"
              className="font-display text-lg font-black uppercase text-white"
            >
              {lang === 'vi' ? hotspot.nameVi : hotspot.nameEn}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-xl border border-studio-700 bg-studio-900 hover:bg-studio-800"
            aria-label={lang === 'vi' ? 'Đóng' : 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="grid gap-6 p-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-studio-800 bg-black">
            <img
              src={hotspot.imageUrl}
              alt={lang === 'vi' ? hotspot.nameVi : hotspot.nameEn}
              className="h-full min-h-[280px] w-full object-contain"
            />
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                {lang === 'vi' ? hotspot.categoryVi : hotspot.categoryEn}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-studio-300">
                {lang === 'vi' ? hotspot.descriptionVi : hotspot.descriptionEn}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-2">
              {hotspot.specs.map((spec) => (
                <div
                  key={spec.labelEn}
                  className="rounded-xl border border-studio-800 bg-studio-900/70 p-3"
                >
                  <dt className="text-[10px] uppercase text-studio-500">
                    {lang === 'vi' ? spec.labelVi : spec.labelEn}
                  </dt>
                  <dd className="mt-1 text-xs font-bold text-white">{spec.value}</dd>
                </div>
              ))}
            </dl>
            <ul className="space-y-2 text-xs text-studio-300">
              {(lang === 'vi' ? hotspot.highlightsVi : hotspot.highlightsEn).map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-cyan-300">◆</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {articleSlug && (
              <Link
                to={`/engineering/${articleSlug}`}
                onClick={onClose}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 text-xs font-bold text-cyan-100 hover:bg-cyan-300/20"
              >
                <BookOpen className="h-4 w-4" />
                {lang === 'vi' ? 'Đọc chuyên đề kỹ thuật' : 'Read engineering feature'}
              </Link>
            )}
          </div>
        </div>
        <footer className="flex items-center justify-between border-t border-studio-800 px-5 py-4">
          <button
            type="button"
            onClick={() => selectOffset(-1)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-studio-700 px-4 text-xs font-bold"
          >
            <ChevronLeft className="h-4 w-4" />
            {lang === 'vi' ? 'Trước' : 'Previous'}
          </button>
          <span className="font-mono text-xs text-studio-500">
            {index + 1} / {hotspots.length}
          </span>
          <button
            type="button"
            onClick={() => selectOffset(1)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-studio-700 px-4 text-xs font-bold"
          >
            {lang === 'vi' ? 'Tiếp' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </footer>
      </div>
    </div>
  );
  return typeof document === 'undefined' ? content : createPortal(content, document.body);
};
