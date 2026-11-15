import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib';
import { fieldClasses } from './input';

/* ─── Label ─── */
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Kept for API compatibility; every field is required unless it says "(optional)". */
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, required: _required, className, ...props }, ref) => (
    <label ref={ref} className={cn('text-label text-ink-muted mb-1.5 block', className)} {...props}>
      {children}
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
  /** `pill` is the compact toolbar style used for filters and scope pickers. */
  appearance?: 'field' | 'pill';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      placeholder = 'Select an option',
      error,
      hint,
      className,
      appearance = 'field',
      ...props
    },
    ref
  ) => (
    <div className={cn(appearance === 'pill' && 'shrink-0')}>
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={error || undefined}
          className={cn(
            appearance === 'field'
              ? cn(fieldClasses, 'cursor-pointer appearance-none pr-11')
              : 'border-line-strong bg-card text-ink focus:border-action focus:ring-action/15 h-10 w-full cursor-pointer appearance-none rounded-full border-[1.5px] pr-10 pl-4 text-[13px] font-semibold shadow-sm focus:ring-[3px] focus:outline-none',
            error ? 'border-danger' : appearance === 'field' && 'border-line-strong',
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
        <ChevronDown
          size={appearance === 'pill' ? 15 : 17}
          className={cn(
            'text-ink-muted pointer-events-none absolute top-1/2 -translate-y-1/2',
            appearance === 'pill' ? 'right-3.5' : 'right-4'
          )}
        />
      </div>
      {hint && (
        <p className={cn('mt-1.5 text-[13px]', error ? 'text-danger-ink' : 'text-ink-muted')}>
          {hint}
        </p>
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
          fieldClasses,
          'h-auto min-h-24 py-3 leading-relaxed',
          error ? 'border-danger' : 'border-line-strong',
          className
        )}
        {...props}
      />
      {hint && (
        <p className={cn('mt-1.5 text-[13px]', error ? 'text-danger-ink' : 'text-ink-muted')}>
          {hint}
        </p>
      )}
    </div>
  )
);
Textarea.displayName = 'Textarea';

/* ─── Switch ─── */
interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export function Switch({ checked, onCheckedChange, id, disabled, ...rest }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest['aria-label']}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-[26px] w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
        checked ? 'bg-action' : 'bg-line-strong',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'bg-card absolute left-[3px] h-5 w-5 rounded-full shadow-sm transition-transform duration-200 ease-(--ease-calm)',
          checked && 'translate-x-[18px]'
        )}
      />
    </button>
  );
}

/* ─── Field: label + control + hint in one block ─── */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {(error || hint) && (
        <p className={cn('mt-1.5 text-[13px]', error ? 'text-danger-ink' : 'text-ink-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
