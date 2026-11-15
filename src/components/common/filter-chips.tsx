'use client';

import { cn } from '@/lib';

interface FilterChip<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterChipsProps<T extends string> {
  options: FilterChip<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Status filters as pills; the selected filter is solid blue. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterChipsProps<T>) {
  return (
    <div role="tablist" className={cn('flex flex-wrap items-center gap-2', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-150',
              active
                ? 'bg-action text-on-action'
                : 'border-line bg-card text-ink-muted hover:text-ink hover:border-line-strong border-[1.5px]'
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={cn('font-data text-[12px]', active ? 'opacity-80' : 'opacity-70')}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
