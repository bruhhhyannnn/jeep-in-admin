'use server';

import { Timestamp } from 'firebase-admin/firestore';
import type { Query } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { serializeDoc } from '@/lib';
import type { AuditLog } from '@/types';

const COL = 'audit_logs';
const PER_PAGE = 20;

export interface AuditLogFilters {
  organizationId?: string;
  actorRole?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getAuditLogs(
  filters: AuditLogFilters = {},
  page = 1
): Promise<{ data: AuditLog[]; total: number; hasMore: boolean }> {
  let q: Query = adminDb.collection(COL).orderBy('createdAt', 'desc');

  if (filters.organizationId) {
    q = q.where('organizationId', '==', filters.organizationId);
  }
  if (filters.actorRole) {
    q = q.where('actorRole', '==', filters.actorRole);
  }
  if (filters.dateFrom) {
    q = q.where('createdAt', '>=', Timestamp.fromDate(new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    q = q.where('createdAt', '<=', Timestamp.fromDate(to));
  }

  const allSnap = await q.get();
  let docs = allSnap.docs.map((d) => serializeDoc({ ...(d.data() as AuditLog), id: d.id }));

  // Client-side search filter (Firestore doesn't support full-text search)
  if (filters.search) {
    const term = filters.search.toLowerCase();
    docs = docs.filter(
      (log) =>
        log.actorName?.toLowerCase().includes(term) ||
        log.action?.toLowerCase().includes(term) ||
        log.targetName?.toLowerCase().includes(term) ||
        log.details?.toLowerCase().includes(term)
    );
  }

  const total = docs.length;
  const start = (page - 1) * PER_PAGE;
  const paginated = docs.slice(start, start + PER_PAGE);

  return {
    data: paginated,
    total,
    hasMore: start + PER_PAGE < total,
  };
}
