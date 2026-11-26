import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-peds-ignition text-peds-carbon shadow-peds-ignition hover:bg-peds-accent-strong',
  secondary:
    'border-peds-line bg-peds-surface-raised text-peds-text shadow-peds-panel hover:border-peds-line-strong hover:bg-peds-surface-overlay',
  ghost:
    'border-transparent bg-transparent text-peds-text-muted hover:bg-white/7 hover:text-peds-text',
  danger: 'border-peds-error bg-peds-error text-white hover:brightness-90',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 rounded-peds-sm px-3 text-[0.6875rem]',
  md: 'min-h-11 rounded-peds-md px-4 text-xs',
  lg: 'min-h-12 rounded-peds-md px-5 text-xs',
  icon: 'h-11 w-11 rounded-peds-md p-0',
};

export const buttonClassName = ({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) =>
  cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border font-bold uppercase tracking-[0.12em] transition-[background-color,border-color,color,box-shadow,transform] duration-peds-fast ease-peds-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peds-focus focus-visible:ring-offset-2 focus-visible:ring-offset-peds-canvas active:translate-y-px disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:transform-none',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
