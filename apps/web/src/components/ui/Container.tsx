import React from 'react';
import { cn } from '../../utils/cn';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: 'content' | 'wide' | 'full';
}

const widthClasses: Record<NonNullable<ContainerProps['width']>, string> = {
  content: 'max-w-peds-content',
  wide: 'max-w-peds-wide',
  full: 'max-w-peds-full',
};

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, width = 'wide', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mx-auto w-full px-5 sm:px-8 lg:px-12 xl:px-16',
        widthClasses[width],
        className,
      )}
      {...props}
    />
  ),
);

Container.displayName = 'Container';
