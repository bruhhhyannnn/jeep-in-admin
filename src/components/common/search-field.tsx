'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export function SearchField({ value, onChange, placeholder, className }: SearchFieldProps) {
  return (
    <div className={cn('relative w-full sm:w-[240px]', className)}>
      <Search
        size={16}
        className="text-ink-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="border-line-strong bg-card text-ink placeholder:text-ink-meta focus:border-action focus:ring-action/15 h-10 w-full rounded-full border-[1.5px] pr-9 pl-10 text-[14px] shadow-sm transition-[border-color,box-shadow] focus:ring-[3px] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="text-ink-muted hover:text-ink absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
