import React from 'react';
import { cn } from '@/lib';

export type ChipTone = 'live' | 'pending' | 'stale' | 'error' | 'selected' | 'neutral' | 'info';

const toneClasses: Record<ChipTone, string> = {
  live: 'bg-live-soft text-live-ink',
  pending: 'bg-pending-soft text-pending-ink',
  stale: 'border-[1.5px] border-dashed border-line-strong text-ink-muted',
  error: 'bg-danger-soft text-danger-ink',
  selected: 'bg-action text-on-action',
  neutral: 'bg-sunken text-ink-muted',
  info: 'bg-action-soft text-action',
};

const dotClasses: Record<ChipTone, string> = {
  live: 'bg-live',
  pending: 'bg-yellow-600',
  stale: 'bg-stale',
  error: 'bg-danger',
  selected: 'bg-on-action',
  neutral: 'bg-ink-muted',
  info: 'bg-action',
};

interface StatusChipProps {
  tone?: ChipTone;
  /** Leading dot. Live chips pulse to show the value is moving. */
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

/** Status is a fact with a time: "Live · 8s ago", never "Online!". */
export function StatusChip({ tone = 'neutral', dot, children, className, icon }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold whitespace-nowrap',
        toneClasses[tone],
        className
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {tone === 'live' && (
            <span className="bg-live animate-pulse-ring absolute inset-0 rounded-full" />
          )}
          <span className={cn('relative h-1.5 w-1.5 rounded-full', dotClasses[tone])} />
        </span>
      )}
      {icon}
      {children}
    </span>
  );
}

/* ─── Legacy Badge API, mapped onto the status chip tones ─── */
type BadgeColor = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

const badgeTone: Record<BadgeColor, ChipTone> = {
  primary: 'info',
  success: 'live',
  danger: 'error',
  warning: 'pending',
  info: 'info',
  light: 'neutral',
  dark: 'neutral',
};

interface BadgeProps {
  color?: BadgeColor | 'error';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  startIcon?: React.ReactNode;
}

export function Badge({ color = 'primary', children, className, startIcon }: BadgeProps) {
  const tone = color === 'error' ? 'error' : badgeTone[color];
  return (
    <StatusChip tone={tone} className={className} icon={startIcon}>
      {children}
    </StatusChip>
  );
}
