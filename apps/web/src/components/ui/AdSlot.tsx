import React from 'react';
import { cn } from '../../utils/cn';

export type AdSlotVariant = 'leaderboard' | 'in-content' | 'sidebar';

interface AdSlotProps {
  variant: AdSlotVariant;
  reviewMode?: boolean;
  placement?: string;
  className?: string;
}

const variantClassNames: Record<AdSlotVariant, string> = {
  leaderboard: 'min-h-[100px] w-full max-w-[970px] sm:min-h-[90px]',
  'in-content': 'min-h-[250px] w-full max-w-[728px]',
  sidebar: 'aspect-[6/5] min-h-[250px] w-full max-w-[300px]',
};

/**
 * Provider-neutral reserved ad surface. It renders only when an explicit design/review caller opts in.
 * No script, network request, identifier, cookie, or tracking behavior is attached here.
 */
export const AdSlot: React.FC<AdSlotProps> = ({
  variant,
  reviewMode = false,
  placement,
  className,
}) => {
  if (!reviewMode) return null;

  return (
    <aside
      aria-label="Advertisement / Quảng cáo"
      data-ad-slot={variant}
      data-ad-placement={placement}
      className={cn(
        'mx-auto flex items-center justify-center rounded-peds-md border border-dashed border-peds-line-strong bg-peds-surface-muted p-4 text-center text-peds-text-muted',
        variantClassNames[variant],
        className,
      )}
    >
      <div>
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em]">
          Advertisement / Quảng cáo
        </p>
        <p className="mt-1 text-xs text-peds-text-subtle">{variant}</p>
      </div>
    </aside>
  );
};
