import React from 'react';
import { cn } from '@/lib';

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950 dark:border-gray-200 dark:bg-white">
      <div className="max-w-full overflow-x-auto">
        <table className={cn('w-full border-collapse', className)}>{children}</table>
      </div>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-gray-800 dark:border-gray-200">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-800 dark:divide-gray-200">{children}</tbody>;
}

export function TableRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn('transition-colors hover:bg-gray-900/50 dark:hover:bg-gray-50', className)}>
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
        'bg-gray-900/50 px-5 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:bg-gray-50',
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
      className={cn('px-5 py-3.5 text-sm text-gray-300 dark:text-gray-700', className)}
    >
      {children}
    </td>
  );
}
