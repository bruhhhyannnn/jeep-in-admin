'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const stepClasses =
  'border-line-strong bg-card text-ink-muted hover:bg-sunken hover:text-ink flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-[1.5px] transition-colors disabled:cursor-not-allowed disabled:opacity-40';

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={stepClasses}
      >
        <ChevronLeft size={16} />
      </button>

      {visible.map((p, i) => {
        const prev = visible[i - 1];
        const showEllipsis = prev && p - prev > 1;
        return (
          <React.Fragment key={p}>
            {showEllipsis && <span className="text-ink-muted px-1">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'font-data flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full px-2 text-[13px] font-semibold transition-colors',
                p === page
                  ? 'bg-action text-on-action'
                  : 'text-ink-muted hover:bg-sunken hover:text-ink'
              )}
            >
              {p}
            </button>
          </React.Fragment>
        );
      })}

      <button
        type="button"
        aria-label="Next page"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={stepClasses}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
