import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: React.ReactNode;
  wrapperClassName?: string;
}

export const Dropdown = React.forwardRef<HTMLSelectElement, DropdownProps>(
  ({ label, id, className, wrapperClassName, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <label
        htmlFor={selectId}
        className={cn(
          'flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-peds-text-muted',
          wrapperClassName,
        )}
      >
        <span>{label}</span>
        <span className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'min-h-11 appearance-none rounded-peds-md border border-peds-line bg-peds-surface-muted py-2.5 pl-3 pr-9 text-sm font-bold normal-case tracking-normal text-peds-text outline-none transition-colors duration-peds-fast hover:border-peds-line-strong focus:border-peds-accent focus:ring-2 focus:ring-peds-focus/30 motion-reduce:transition-none',
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-peds-text-subtle"
          />
        </span>
      </label>
    );
  },
);

Dropdown.displayName = 'Dropdown';
