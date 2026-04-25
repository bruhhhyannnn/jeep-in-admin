'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:bg-gray-900 disabled:opacity-40 dark:border-gray-200 dark:hover:bg-gray-100"
      >
        <ChevronLeft size={15} />
      </button>

      {visible.map((p, i) => {
        const prev = visible[i - 1];
        const showEllipsis = prev && p - prev > 1;
        return (
          <React.Fragment key={p}>
            {showEllipsis && <span className="px-1 text-gray-600">…</span>}
            <button
              onClick={() => onPageChange(p)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                p === page
                  ? 'bg-brand-600 text-white'
                  : 'border border-gray-800 text-gray-400 hover:bg-gray-900 dark:border-gray-200 dark:hover:bg-gray-100'
              )}
            >
              {p}
            </button>
          </React.Fragment>
        );
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:bg-gray-900 disabled:opacity-40 dark:border-gray-200 dark:hover:bg-gray-100"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

import React from 'react';
