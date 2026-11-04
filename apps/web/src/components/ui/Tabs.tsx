import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

export interface TabItem<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  ariaLabel: string;
  idBase: string;
  className?: string;
  scrollCueLabel?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onValueChange,
  ariaLabel,
  idBase,
  className,
  scrollCueLabel,
}: TabsProps<T>) {
  const tabListRef = useRef<HTMLDivElement>(null);
  const layoutSignatureRef = useRef('');
  const revealFrameRef = useRef(0);
  const firstLayoutRef = useRef(true);
  const [edges, setEdges] = useState({ start: false, end: false });

  const revealSelected = useCallback(
    (behavior: 'auto' | 'instant' | 'smooth' = 'auto') => {
      const tabList = tabListRef.current;
      if (!tabList) return;
      const selectedTab = tabList.querySelector<HTMLElement>(
        '[role="tab"][aria-selected="true"]',
      );
      if (!selectedTab) return;
      const selectedStart = selectedTab.offsetLeft;
      const selectedEnd = selectedStart + selectedTab.offsetWidth;
      const visibleStart = tabList.scrollLeft;
      const visibleEnd = visibleStart + tabList.clientWidth;
      if (selectedStart >= visibleStart && selectedEnd <= visibleEnd) return;
      const centeredLeft =
        selectedStart - (tabList.clientWidth - selectedTab.offsetWidth) / 2;
      const maxLeft = Math.max(0, tabList.scrollWidth - tabList.clientWidth);
      tabList.scrollTo({
        left: Math.min(maxLeft, Math.max(0, centeredLeft)),
        behavior: behavior as ScrollBehavior,
      });
    },
    [],
  );

  const updateEdges = useCallback(() => {
    const tabList = tabListRef.current;
    if (!tabList) return;
    const maxLeft = tabList.scrollWidth - tabList.clientWidth;
    setEdges({
      start: tabList.scrollLeft > 4,
      end: maxLeft > 4 && tabList.scrollLeft < maxLeft - 4,
    });
  }, []);

  const syncLayout = useCallback(
    (behavior: 'auto' | 'instant' = 'auto') => {
      const tabList = tabListRef.current;
      if (!tabList) return;
      const selectedTab = tabList.querySelector<HTMLElement>(
        '[role="tab"][aria-selected="true"]',
      );
      const signature = [
        value,
        tabList.clientWidth,
        tabList.scrollWidth,
        selectedTab?.offsetWidth ?? 0,
      ].join(':');
      if (signature !== layoutSignatureRef.current) {
        layoutSignatureRef.current = signature;
        revealSelected(behavior);
      }
      updateEdges();
    },
    [revealSelected, updateEdges, value],
  );

  // Keyboard focus scrolling runs after the state update, so reveal once more
  // after the browser has settled the focused tab's position.
  const scheduleReveal = useCallback(() => {
    cancelAnimationFrame(revealFrameRef.current);
    revealFrameRef.current = requestAnimationFrame(() => {
      revealFrameRef.current = requestAnimationFrame(() => {
        revealSelected();
        updateEdges();
      });
    });
  }, [revealSelected, updateEdges]);

  useEffect(() => {
    syncLayout(firstLayoutRef.current ? 'instant' : 'auto');
    firstLayoutRef.current = false;
    scheduleReveal();
    const tabList = tabListRef.current;
    const observer = tabList
      ? new ResizeObserver(() => syncLayout('instant'))
      : null;
    if (tabList) observer?.observe(tabList);
    const selectedTab = tabList?.querySelector<HTMLElement>(
      '[role="tab"][aria-selected="true"]',
    );
    if (observer && selectedTab) observer.observe(selectedTab);
    // Text-only zoom resizes the page without resizing the rail's border box.
    const rootObserver = tabList
      ? new ResizeObserver(() => syncLayout('instant'))
      : null;
    rootObserver?.observe(document.documentElement);
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (cancelled) return;
      syncLayout('instant');
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
      rootObserver?.disconnect();
      cancelAnimationFrame(revealFrameRef.current);
    };
  }, [scheduleReveal, syncLayout]);

  return (
    <div
      className={cn('peds-tabs-shell relative min-w-0 max-w-full flex-1')}
      data-scroll-start={edges.start ? 'true' : undefined}
      data-scroll-end={edges.end ? 'true' : undefined}
    >
      <div
        ref={tabListRef}
        role="tablist"
        aria-label={ariaLabel}
        aria-describedby={
          edges.end && scrollCueLabel ? `${idBase}-scroll-hint` : undefined
        }
        onScroll={updateEdges}
        className={cn(
          'peds-tabs-rail flex items-center gap-1 overflow-x-auto p-1',
          className,
        )}
      >
        {items.map((item) => {
          const selected = value === item.value;
          return (
            <button
              key={item.value}
              id={`${idBase}-tab-${item.value}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${idBase}-panel-${item.value}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => onValueChange(item.value)}
              onKeyDown={(event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                const enabledItems = items.filter((candidate) => !candidate.disabled);
                const currentIndex = enabledItems.findIndex(
                  (candidate) => candidate.value === item.value,
                );
                const nextIndex =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? enabledItems.length - 1
                      : event.key === 'ArrowRight'
                        ? (currentIndex + 1) % enabledItems.length
                        : (currentIndex - 1 + enabledItems.length) % enabledItems.length;
                const nextItem = enabledItems[nextIndex];
                onValueChange(nextItem.value);
                document
                  .getElementById(`${idBase}-tab-${nextItem.value}`)
                  ?.focus({ preventScroll: true });
              }}
              data-championship-tab={item.value}
              className={cn(
                'flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-peds-sm px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] transition-colors duration-peds-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peds-focus disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none min-[861px]:min-h-9 sm:px-4',
                selected
                  ? 'bg-peds-ignition text-peds-carbon shadow-peds-ignition'
                  : 'text-peds-text-muted hover:bg-white/7 hover:text-peds-text',
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      {scrollCueLabel && edges.end && (
        <span id={`${idBase}-scroll-hint`} className="sr-only">
          {scrollCueLabel}
        </span>
      )}
    </div>
  );
}
