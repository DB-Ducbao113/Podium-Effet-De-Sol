import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import './compactShowroom.css';

export interface ShowroomPaintPreset {
  id: string;
  name: string;
  colors: readonly [string, string, string];
}

export type ShowroomAdvancedTab = 'anatomy' | 'graphics' | 'specs';

export interface CompactShowroomLayoutProps {
  /** The existing 3D Canvas, fallback and loaders. Keep the rendering logic unchanged. */
  children: React.ReactNode;
  /** The EXISTING camera/zoom control dock; do not render a second dock inside children. */
  cameraControls: React.ReactNode;
  paintPresets: readonly ShowroomPaintPreset[];
  selectedPaintId: string;
  onSelectPaint: (id: string) => void;
  /** Pass existing anatomy controls, without the former right-column wrapper. */
  anatomyPanel?: React.ReactNode;
  /** Pass existing AUTO/HIGH/BALANCED/PERFORMANCE controls, without absolute positioning. */
  graphicsPanel?: React.ReactNode;
  /** Pass existing performance and engineering metrics, without absolute positioning. */
  specificationsPanel?: React.ReactNode;
  /** E.g. 'AUTO · HIGH · 1.00×' */
  graphicsSummary: string;
  hotspotsEnabled?: boolean;
  onToggleHotspots?: () => void;
  lang?: 'vi' | 'en';
  modelLabel?: string;
  className?: string;
}

/**
 * Presentation-only shell for Model B. This does not touch GLB loading, materials,
 * the graphics quality controller, camera controls, or the existing livery engine.
 *
 * Integration rule: the 3D Canvas must stay mounted when a popover/drawer opens.
 * Treat paint selection and graphics as controlled values from the existing page.
 */
export const CompactShowroomLayout: React.FC<CompactShowroomLayoutProps> = ({
  children,
  cameraControls,
  paintPresets,
  selectedPaintId,
  onSelectPaint,
  anatomyPanel,
  graphicsPanel,
  specificationsPanel,
  graphicsSummary,
  hotspotsEnabled,
  onToggleHotspots,
  lang = 'vi',
  modelLabel = 'MODEL B',
  className = '',
}) => {
  const [openPanel, setOpenPanel] = useState<'paint' | 'advanced' | null>(null);
  const [tab, setTab] = useState<ShowroomAdvancedTab>('anatomy');
  const paintButtonRef = useRef<HTMLButtonElement>(null);
  const advancedButtonRef = useRef<HTMLButtonElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const selectedPaint = useMemo(
    () => paintPresets.find((paint) => paint.id === selectedPaintId),
    [paintPresets, selectedPaintId],
  );
  const isVietnamese = lang === 'vi';

  useEffect(() => {
    if (!openPanel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        const trigger = openPanel === 'paint' ? paintButtonRef.current : advancedButtonRef.current;
        setOpenPanel(null);
        trigger?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (floatingRef.current?.contains(target)) return;
      if (paintButtonRef.current?.contains(target)) return;
      if (advancedButtonRef.current?.contains(target)) return;
      setOpenPanel(null);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [openPanel]);

  const togglePanel = (panel: 'paint' | 'advanced') => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };
  const close = () => {
    const trigger = openPanel === 'paint' ? paintButtonRef.current : advancedButtonRef.current;
    setOpenPanel(null);
    trigger?.focus();
  };

  const tabs = [
    { id: 'anatomy', vi: 'Giải phẫu', en: 'Anatomy' },
    { id: 'graphics', vi: 'Đồ họa', en: 'Graphics' },
    { id: 'specs', vi: 'Thông số', en: 'Metrics' },
  ] as const;
  const activeContent =
    tab === 'anatomy'
      ? anatomyPanel
      : tab === 'graphics'
        ? graphicsPanel
        : specificationsPanel;

  return (
    <section
      className={`peds-compact-studio ${className}`}
      aria-label={isVietnamese ? 'Phòng trưng bày xe 3D' : '3D car showroom'}
      data-testid="compact-showroom"
    >
      <div className="peds-compact-studio__canvas" data-testid="compact-showroom-stage">
        {children}
      </div>

      <div className="peds-compact-studio__toolbar">
        <div className="peds-compact-studio__model-badge" title={selectedPaint?.name}>
          <strong>{modelLabel}</strong>
          <span aria-hidden="true">/</span>
          <span className="peds-compact-studio__model-paint">
            {selectedPaint?.name ?? (isVietnamese ? 'Chưa chọn màu' : 'No paint selected')}
          </span>
        </div>
        <div className="peds-compact-studio__actions">
          <span className="peds-compact-studio__quality" title={graphicsSummary}>
            {graphicsSummary}
          </span>
          <button
            type="button"
            ref={paintButtonRef}
            className="peds-compact-studio__action"
            aria-expanded={openPanel === 'paint'}
            aria-controls={`${id}-paint`}
            onClick={() => togglePanel('paint')}
            data-testid="compact-paint-trigger"
          >
            <span
              className="peds-compact-studio__current-swatch"
              style={{ background: selectedPaint?.colors[0] ?? '#39414c' }}
              aria-hidden="true"
            />
            {isVietnamese ? 'Màu sơn' : 'Paint'}
            <span aria-hidden="true">⌄</span>
          </button>
          <button
            type="button"
            ref={advancedButtonRef}
            className={`peds-compact-studio__action ${openPanel === 'advanced' ? 'is-active' : ''}`}
            aria-expanded={openPanel === 'advanced'}
            aria-controls={`${id}-advanced`}
            onClick={() => togglePanel('advanced')}
            data-testid="compact-advanced-trigger"
          >
            <span aria-hidden="true">⚙</span>
            {isVietnamese ? 'Nâng cao' : 'Advanced'}
          </button>
        </div>
      </div>

      {openPanel === 'paint' && (
        <div
          id={`${id}-paint`}
          className="peds-compact-studio__floating peds-compact-studio__paint-panel"
          ref={floatingRef}
          role="region"
          aria-label={isVietnamese ? 'Chọn màu sơn' : 'Choose paint'}
        >
          <div className="peds-compact-studio__panel-heading">
            <div>
              <strong>{isVietnamese ? 'Bộ màu sơn' : 'Paint collection'}</strong>
              <small>{isVietnamese ? 'Phong cách riêng · Không logo' : 'Original styles · No logos'}</small>
            </div>
            <button className="peds-compact-studio__close" type="button" onClick={close} aria-label={isVietnamese ? 'Đóng bảng màu' : 'Close paint panel'}>×</button>
          </div>
          <div className="peds-compact-studio__paint-grid">
            {paintPresets.map((paint) => (
              <button
                key={paint.id}
                type="button"
                className={`peds-compact-studio__paint-choice ${selectedPaintId === paint.id ? 'is-selected' : ''}`}
                aria-pressed={selectedPaintId === paint.id}
                onClick={() => {
                  onSelectPaint(paint.id);
                  setOpenPanel(null);
                  paintButtonRef.current?.focus();
                }}
              >
                <span className="peds-compact-studio__swatch" aria-hidden="true">
                  {paint.colors.map((color, index) => <span key={index} style={{ background: color }} />)}
                </span>
                <span className="peds-compact-studio__paint-name">{paint.name}</span>
                {selectedPaintId === paint.id && <span className="peds-compact-studio__check" aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {openPanel === 'advanced' && (
        <div
          id={`${id}-advanced`}
          className="peds-compact-studio__floating peds-compact-studio__advanced-panel"
          ref={floatingRef}
          role="region"
          aria-label={isVietnamese ? 'Cài đặt nâng cao' : 'Advanced settings'}
          data-testid="compact-advanced-panel"
        >
          <div className="peds-compact-studio__advanced-heading">
            <div>
              <strong>{isVietnamese ? 'Cài đặt nâng cao' : 'Advanced settings'}</strong>
              <small>{graphicsSummary}</small>
            </div>
            <button className="peds-compact-studio__close" type="button" onClick={close} aria-label={isVietnamese ? 'Đóng cài đặt' : 'Close settings'}>×</button>
          </div>
          <div className="peds-compact-studio__tabs" role="tablist" aria-label={isVietnamese ? 'Nhóm cài đặt' : 'Setting groups'}>
            {tabs.map((item) => (
              <button
                key={item.id}
                id={`${id}-tab-${item.id}`}
                className={tab === item.id ? 'is-selected' : ''}
                role="tab"
                type="button"
                aria-selected={tab === item.id}
                aria-controls={`${id}-tab-content`}
                onClick={() => setTab(item.id)}
              >
                {isVietnamese ? item.vi : item.en}
              </button>
            ))}
          </div>
          <div
            className="peds-compact-studio__advanced-content"
            id={`${id}-tab-content`}
            role="tabpanel"
            aria-labelledby={`${id}-tab-${tab}`}
            tabIndex={0}
          >
            {tab === 'anatomy' && onToggleHotspots && (
              <button
                type="button"
                className="peds-compact-studio__hotspot-toggle"
                aria-pressed={Boolean(hotspotsEnabled)}
                onClick={onToggleHotspots}
              >
                {isVietnamese ? 'Hiển thị điểm trên xe' : 'Show car hotspots'}
                <span className={hotspotsEnabled ? 'is-on' : ''}>
                  {hotspotsEnabled ? (isVietnamese ? 'BẬT' : 'ON') : (isVietnamese ? 'TẮT' : 'OFF')}
                </span>
              </button>
            )}
            {activeContent ?? (
              <p className="peds-compact-studio__empty">
                {isVietnamese ? 'Nội dung này chưa có trên model hiện tại.' : 'Not available for the current model.'}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="peds-compact-studio__camera" data-testid="compact-camera-dock">
        {cameraControls}
      </div>
    </section>
  );
};

export default CompactShowroomLayout;
