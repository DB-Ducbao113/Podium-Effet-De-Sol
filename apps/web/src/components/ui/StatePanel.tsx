import React from 'react';
import { AlertTriangle, Inbox, LoaderCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatePanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  state: 'loading' | 'error' | 'empty';
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

const stateIcons = {
  loading: LoaderCircle,
  error: AlertTriangle,
  empty: Inbox,
};

export const StatePanel: React.FC<StatePanelProps> = ({
  state,
  title,
  description,
  action,
  className,
  ...props
}) => {
  const Icon = stateIcons[state];
  return (
    <div
      role={state === 'error' ? 'alert' : 'status'}
      aria-live={state === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'flex min-h-48 flex-col items-center justify-center rounded-peds-lg border border-dashed border-peds-line-strong bg-peds-surface-muted p-8 text-center text-peds-text-muted',
        className,
      )}
      {...props}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'mb-4 h-6 w-6 text-peds-text-subtle',
          state === 'loading' && 'animate-spin motion-reduce:animate-none',
          state === 'error' && 'text-peds-accent-soft',
        )}
      />
      <p className="text-sm font-bold text-peds-text">{title}</p>
      {description ? <p className="mt-2 max-w-lg text-sm leading-6">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
};
