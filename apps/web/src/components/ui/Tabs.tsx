import React, { useEffect, useRef } from 'react';
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
}

export function Tabs<T extends string>({
  items,
  value,
  onValueChange,
  ariaLabel,
  idBase,
  className,
}: TabsProps<T>) {
  const tabListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tabList = tabListRef.current;
    const selectedTab = tabList?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!tabList || !selectedTab) return;

    const selectedStart = selectedTab.offsetLeft;
    const selectedEnd = selectedStart + selectedTab.offsetWidth;
    const visibleStart = tabList.scrollLeft;
    const visibleEnd = visibleStart + tabList.clientWidth;
    if (selectedStart >= visibleStart && selectedEnd <= visibleEnd) return;

    const centeredLeft = selectedStart - (tabList.clientWidth - selectedTab.offsetWidth) / 2;
    const maxLeft = Math.max(0, tabList.scrollWidth - tabList.clientWidth);
    tabList.scrollLeft = Math.min(maxLeft, Math.max(0, centeredLeft));
  }, [value]);

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex items-center gap-1.5 overflow-x-auto p-1', className)}
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
              document.getElementById(`${idBase}-tab-${nextItem.value}`)?.focus();
            }}
            data-championship-tab={item.value}
            className={cn(
              'flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-peds-sm px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] transition-colors duration-peds-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peds-focus disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none min-[861px]:min-h-9 sm:px-4',
              selected
                ? 'bg-peds-accent text-white shadow-peds-accent'
                : 'text-peds-text-muted hover:bg-white/7 hover:text-peds-text',
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
