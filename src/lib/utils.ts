import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/** Format a Firestore Timestamp or JS Date to a readable string */
export function formatDate(date: Date | null | undefined, fmt = 'MMM d, yyyy'): string {
  if (!date) return '—';
  const { format } = require('date-fns');
  return format(date, fmt);
}

/** Convert a Firestore Timestamp to a JS Date safely */
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  // Firestore Timestamp shape
  if (typeof value === 'object' && 'toDate' in (value as object)) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}
