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

/**
 * Strips toJSON methods from Firestore Timestamps so they can cross the
 * server → client boundary in Next.js Server Actions / Server Components.
 * Timestamps become plain { seconds, nanoseconds } objects, which toDate() handles.
 */
export function serializeDoc<T extends Record<string, unknown>>(doc: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      'seconds' in value &&
      'nanoseconds' in value
    ) {
      result[key] = {
        seconds: (value as { seconds: number }).seconds,
        nanoseconds: (value as { nanoseconds: number }).nanoseconds,
      };
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

/** Convert a Firestore Timestamp to a JS Date safely */
export function toDate(value: unknown): Date | null {
  if (!value && value !== 0) return null;
  if (typeof value === 'number') return new Date(value);
  if (value instanceof Date) return value;
  // Firebase SDK Timestamp with toDate method
  if (typeof value === 'object' && 'toDate' in (value as object)) {
    return (value as { toDate: () => Date }).toDate();
  }
  // Serialized plain object from server actions { seconds, nanoseconds }
  if (typeof value === 'object' && 'seconds' in (value as object)) {
    const { seconds, nanoseconds } = value as { seconds: number; nanoseconds: number };
    return new Date(seconds * 1000 + nanoseconds / 1_000_000);
  }
  return null;
}
