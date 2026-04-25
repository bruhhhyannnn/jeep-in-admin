import React from 'react';
import { cn } from '@/lib';

type BadgeColor = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  color?: BadgeColor;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  startIcon?: React.ReactNode;
}

const colorMap: Record<BadgeColor, string> = {
  primary: 'bg-brand-600/15 text-brand-400 dark:bg-brand-600/10 dark:text-brand-600',
  success: 'bg-success-500/15 text-success-400 dark:bg-success-500/10 dark:text-success-600',
  danger: 'bg-danger-500/15 text-danger-400 dark:bg-danger-500/10 dark:text-danger-600',
  warning: 'bg-warning-500/15 text-warning-400 dark:bg-warning-500/10 dark:text-warning-600',
  info: 'bg-info-500/15 text-info-400 dark:bg-info-500/10 dark:text-info-600',
  light: 'bg-gray-800 text-gray-400 dark:bg-gray-200 dark:text-gray-600',
  dark: 'bg-gray-700 text-gray-200 dark:bg-gray-300 dark:text-gray-800',
};

// keep template compat - 'error' maps to danger
const resolveColor = (c: string): BadgeColor => (c === 'error' ? 'danger' : (c as BadgeColor));

export function Badge({
  color = 'primary',
  size = 'md',
  children,
  className,
  startIcon,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        colorMap[resolveColor(color)],
        className
      )}
    >
      {startIcon}
      {children}
    </span>
  );
}
