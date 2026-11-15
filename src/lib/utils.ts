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

/** "laoag_paoay" → "Laoag → Paoay" */
export function formatDirection(dir: string): string {
  return dir
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' → ');
}

/** "06:00" → "6:00 AM" */
export function formatClock(hhmm: string | undefined | null): string {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** True when `at` falls inside a route's working hours ("HH:mm" strings, inclusive). */
export function isWithinHours(hours: { start: string; end: string }, at = new Date()): boolean {
  const [sh, sm] = hours.start.split(':').map(Number);
  const [eh, em] = hours.end.split(':').map(Number);
  const cur = at.getHours() * 60 + at.getMinutes();
  return cur >= sh * 60 + sm && cur <= eh * 60 + em;
}

/** Compact elapsed time: "8s", "9 min", "2 h", "3 d". */
export function timeAgo(from: Date | null, now = Date.now()): string {
  if (!from) return '—';
  const s = Math.max(0, Math.round((now - from.getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h`;
  return `${Math.round(h / 24)} d`;
}

/** A readable temporary password, e.g. "k7Rm-42pX-Qe" (no look-alike characters). */
export function generatePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint32Array(10);
  crypto.getRandomValues(bytes);
  const s = Array.from(bytes, (b) => chars[b % chars.length]).join('');
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
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
