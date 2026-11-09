import React from 'react';
import { cn } from '../../utils/cn';

interface SectionHeadingProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  as?: 'header' | 'div';
  titleAs?: 'h1' | 'h2' | 'h3';
  titleClassName?: string;
  descriptionClassName?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  action,
  as: Root = 'header',
  titleAs: Title = 'h2',
  titleClassName,
  descriptionClassName,
  className,
  ...props
}) => (
  <Root className={cn('flex flex-wrap items-end justify-between gap-5', className)} {...props}>
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="peds-eyebrow mb-3">{eyebrow}</p>
      ) : null}
      <Title
        className={cn(
          'font-display text-3xl font-bold uppercase leading-[1.08] tracking-[-0.025em] text-peds-text sm:text-5xl',
          titleClassName,
        )}
      >
        {title}
      </Title>
      {description ? (
        <p
          className={cn(
            'mt-4 max-w-2xl text-sm leading-7 text-peds-text-muted sm:text-base',
            descriptionClassName,
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </Root>
);
