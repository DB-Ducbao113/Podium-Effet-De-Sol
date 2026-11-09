import React from 'react';
import { buttonClassName, type ButtonSize, type ButtonVariant } from './buttonStyles';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export type { ButtonSize, ButtonVariant } from './buttonStyles';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = 'button', variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonClassName({ variant, size, className })}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
