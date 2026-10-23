import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: 'vi' | 'en';
}

export const EDSSchematicModal: React.FC<Props> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;
  const content = (
    <div
      className="fixed inset-0 z-[85] bg-black/75 backdrop-blur-md p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eds-schematic-title"
    >
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-cyan-400/25 bg-studio-950">
        <header className="flex items-center justify-between border-b border-studio-800 px-5 py-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-300">
              EDS-CAD-MASTER-01
            </p>
            <h2 id="eds-schematic-title" className="font-display text-lg font-black uppercase">
              {lang === 'vi' ? 'Sơ đồ khí động học EDS-G01' : 'EDS-G01 Aerodynamic Schematic'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-xl border border-studio-700"
            aria-label={lang === 'vi' ? 'Đóng' : 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-auto bg-black p-3">
          <img
            src="/images/showroom/eds-g01/schematic.svg"
            alt={lang === 'vi' ? 'Sơ đồ chiếu bằng EDS-G01' : 'EDS-G01 top-view schematic'}
            className="h-full min-h-[420px] w-full object-contain"
          />
        </div>
        <footer className="border-t border-studio-800 px-5 py-3 font-mono text-xs text-studio-400">
          5.05 m · 3.60 m wheelbase · deterministic vector projection · no third-party marks
        </footer>
      </div>
    </div>
  );
  return typeof document === 'undefined' ? content : createPortal(content, document.body);
};
