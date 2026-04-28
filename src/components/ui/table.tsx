import React from 'react';
import { cn } from '@/lib';

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="dark:shadow-theme-md-dark overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-800 dark:bg-gray-950">
      <div className="max-w-full overflow-x-auto">
        <table className={cn('w-full border-collapse', className)}>{children}</table>
      </div>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-gray-200 dark:border-gray-800">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-200 dark:divide-gray-800">{children}</tbody>;
}

export function TableRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn('transition-colors hover:bg-gray-100 dark:hover:bg-gray-900', className)}>
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
}) {
  return (
    <th
      onClick={onClick}
      className={cn(
        'bg-gray-100 px-5 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:bg-gray-900',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn('px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300', className)}
    >
      {children}
    </td>
  );
}
