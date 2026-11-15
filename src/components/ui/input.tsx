import React, { forwardRef } from 'react';
import { cn } from '@/lib';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  success?: boolean;
  hint?: string;
  /** Content pinned inside the right edge of the field (e.g. a "Show" toggle). */
  endSlot?: React.ReactNode;
}

export const fieldClasses =
  'h-12 w-full rounded-input border-[1.5px] bg-card px-4 text-[15px] text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-meta focus:border-action focus:ring-[3px] focus:ring-action/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-muted';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, hint, className, id, endSlot, ...props }, ref) => (
    <div>
      {label && (
        <label htmlFor={id} className="text-label text-ink-muted mb-1.5 block">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={error || undefined}
          className={cn(
            fieldClasses,
            error
              ? 'border-danger focus:border-danger focus:ring-danger/15'
              : success
                ? 'border-live'
                : 'border-line-strong',
            endSlot && 'pr-20',
            className
          )}
          {...props}
        />
        {endSlot && <div className="absolute inset-y-0 right-2 flex items-center">{endSlot}</div>}
      </div>
      {hint && (
        <p className={cn('mt-1.5 text-[13px]', error ? 'text-danger-ink' : 'text-ink-muted')}>
          {hint}
        </p>
      )}
    </div>
  )
);
Input.displayName = 'Input';
