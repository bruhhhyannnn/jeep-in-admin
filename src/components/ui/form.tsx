import React, { forwardRef } from 'react';
import { cn } from '@/lib';

/* ─── Label ─── */
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, required, className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('mb-1.5 block text-sm font-medium text-gray-400 dark:text-gray-600', className)}
      {...props}
    >
      {children}
      {required && <span className="text-danger-400 ml-0.5">*</span>}
    </label>
  )
);
Label.displayName = 'Label';

/* ─── Select ─── */
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder = 'Select an option', error, hint, className, ...props }, ref) => (
    <div>
      <select
        ref={ref}
        className={cn(
          'h-11 w-full appearance-none rounded-lg border bg-gray-900 px-4 py-2.5 text-sm text-gray-100 focus:ring-2 focus:outline-none dark:bg-gray-50 dark:text-gray-900',
          error
            ? 'border-danger-500 focus:ring-danger-500/20'
            : 'focus:border-brand-600 focus:ring-brand-600/20 border-gray-700 dark:border-gray-300',
          className
        )}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && (
        <p className={cn('mt-1.5 text-xs', error ? 'text-danger-400' : 'text-gray-500')}>{hint}</p>
      )}
    </div>
  )
);
Select.displayName = 'Select';

/* ─── Textarea ─── */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, hint, className, ...props }, ref) => (
    <div>
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-gray-900 px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:ring-2 focus:outline-none dark:bg-gray-50 dark:text-gray-900',
          error
            ? 'border-danger-500 focus:ring-danger-500/20'
            : 'focus:border-brand-600 focus:ring-brand-600/20 border-gray-700 dark:border-gray-300',
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
Textarea.displayName = 'Textarea';
