import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'elevated' | 'subtle';
}

const toneClasses: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'border-peds-line bg-peds-surface shadow-peds-panel',
  elevated: 'border-peds-line-strong bg-peds-surface-raised shadow-peds-elevated',
  subtle: 'border-peds-line bg-peds-surface-muted shadow-none',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, tone = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-peds-lg border', toneClasses[tone], className)}
      {...props}
    />
  ),
);

Card.displayName = 'Card';
