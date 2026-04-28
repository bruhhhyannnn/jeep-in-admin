import React, { forwardRef } from 'react';
import { cn } from '@/lib';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  success?: boolean;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, hint, className, id, ...props }, ref) => (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'h-11 w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:outline-none dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-600',
          error
            ? 'border-danger-500 focus:ring-danger-500/20'
            : success
              ? 'border-success-500 focus:ring-success-500/20'
              : 'focus:border-brand-600 focus:ring-brand-600/20 border-gray-300 dark:border-gray-700',
          className
        )}
        {...props}
      />
      {hint && (
        <p className={cn('mt-1.5 text-xs', error ? 'text-danger-400' : 'text-gray-500')}>{hint}</p>
      )}
    </div>
  )
);
Input.displayName = 'Input';
