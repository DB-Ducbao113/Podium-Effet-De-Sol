import React, { useId } from 'react';
import { cn } from '../../utils/cn';

interface TooltipProps {
  label: React.ReactNode;
  children: React.ReactElement<{ 'aria-describedby'?: string }>;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ label, children, className }) => {
  const id = useId();
  return (
    <span className={cn('group/tooltip relative inline-flex', className)}>
      {React.cloneElement(children, { 'aria-describedby': id })}
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-[100] w-max max-w-64 -translate-x-1/2 rounded-peds-sm border border-peds-line-strong bg-peds-surface-overlay px-2.5 py-1.5 text-center text-[0.6875rem] font-semibold normal-case tracking-normal text-peds-text opacity-0 shadow-peds-elevated transition-opacity duration-peds-fast group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 motion-reduce:transition-none"
      >
        {label}
      </span>
    </span>
  );
};
