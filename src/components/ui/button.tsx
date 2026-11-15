import React, { forwardRef } from 'react';
import { cn } from '@/lib';

type ButtonVariant =
  | 'primary'
  | 'moment'
  | 'final'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'danger-outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * primary = default action (blue) · moment = the one hero action per screen (yellow) ·
   * final = last step of a flow (navy) · outline = secondary · danger = can't be undone
   */
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-action text-on-action hover:bg-action-hover active:bg-action-press',
  moment: 'bg-moment text-on-moment hover:bg-moment-hover',
  final: 'bg-final text-on-final hover:brightness-[.92]',
  outline:
    'border-[1.5px] border-line-strong bg-card text-ink shadow-sm hover:bg-sunken active:bg-sunken',
  ghost: 'text-ink-muted hover:bg-sunken hover:text-ink',
  danger: 'bg-danger text-white hover:brightness-[.92]',
  'danger-outline':
    'border-[1.5px] border-danger/50 bg-card text-danger-ink hover:bg-danger-soft hover:border-danger',
};

const disabledClasses: Record<ButtonVariant, string> = {
  primary: 'disabled:bg-disabled disabled:text-on-disabled',
  moment: 'disabled:bg-disabled disabled:text-on-disabled',
  final: 'disabled:bg-disabled disabled:text-on-disabled',
  danger: 'disabled:bg-disabled disabled:text-on-disabled',
  outline: 'disabled:text-on-disabled disabled:shadow-none',
  'danger-outline': 'disabled:text-on-disabled disabled:border-line',
  ghost: 'disabled:text-on-disabled',
};

const sizeClasses = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-[52px] px-6 text-[15px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      startIcon,
      endIcon,
      className,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,color,transform,filter,border-color] duration-150 ease-(--ease-calm) select-none active:scale-[.98]',
        variantClasses[variant],
        disabledClasses[variant],
        sizeClasses[size],
        'disabled:cursor-not-allowed disabled:active:scale-100',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {startIcon}
          {children}
          {endIcon}
        </>
      )}
    </button>
  )
);
Button.displayName = 'Button';
