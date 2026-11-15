'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Button,
  DataTable,
  PageError,
  Pagination,
  StatusChip,
  type ChipTone,
} from '@/components/ui';
import { Avatar, FilterChips, PageHeader, SearchField } from '@/components/common';
import { useAuthStore } from '@/store';
import { useAuditLogs } from '@/hooks';
import type { AuditLogFilters } from '@/actions';
import { toDate } from '@/lib';
import type { AuditLog } from '@/types';

const PER_PAGE = 20;

type RoleFilter = '' | 'driver' | 'admin';

const ACTION_TONE: Record<string, ChipTone> = {
  CREATE: 'live',
  UPDATE: 'info',
  DELETE: 'error',
  ASSIGN: 'info',
  UNASSIGN: 'pending',
  LOGIN: 'neutral',
  GPS: 'pending',
};

/** "GPS_TOGGLE_ON" → "Gps toggle on" */
function readableAction(action: string) {
  const s = action.toLowerCase().replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const dateInputClasses =
  'font-data border-line-strong bg-card text-ink focus:border-action focus:ring-action/15 h-10 rounded-full border-[1.5px] px-4 text-[13px] shadow-sm focus:ring-[3px] focus:outline-none';

export default function AuditLogsPage() {
  const { userProfile } = useAuthStore();
  const isSuperAdmin = userProfile?.role === 'super_admin';

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actorRole, setActorRole] = useState<RoleFilter>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, actorRole, dateFrom, dateTo]);

  const filters: AuditLogFilters = {
    organizationId: isSuperAdmin ? undefined : (userProfile?.organizationId ?? ''),
    actorRole: actorRole || undefined,
    search: debouncedSearch || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { data, isPending, isFetching, error } = useAuditLogs(filters, page);
  const logs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PER_PAGE);
  const hasFilters = !!(actorRole || dateFrom || dateTo || debouncedSearch);

  const columns: ColumnDef<AuditLog, unknown>[] = [
    {
      id: 'actor',
      header: 'Who',
      accessorFn: (log) => log.actorName,
      cell: ({ row: { original: log } }) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={log.actorName ?? '?'} />
          <div className="min-w-0">
            <p className="text-ink truncate font-semibold">{log.actorName}</p>
            <p className="text-ink-muted text-[12px] capitalize">
              {log.actorRole?.replace('_', ' ')}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'action',
      header: 'What happened',
      accessorFn: (log) => log.action,
      cell: ({ row: { original: log } }) => (
        <StatusChip tone={ACTION_TONE[log.action.split('_')[0]] ?? 'neutral'}>
          {readableAction(log.action)}
        </StatusChip>
      ),
    },
    {
      id: 'target',
      header: 'To',
      accessorFn: (log) => log.targetName ?? '',
      cell: ({ row: { original: log } }) =>
        log.targetName ? (
          <div>
            <p className="text-ink">{log.targetName}</p>
            <p className="text-ink-muted text-[12px] capitalize">
              {log.targetType?.replace('_', ' ')}
            </p>
          </div>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
    {
      id: 'details',
      header: 'Details',
      accessorFn: (log) => log.details ?? '',
      cell: ({ row: { original: log } }) => (
        <span className="text-ink-muted line-clamp-2 max-w-[320px] text-[13px]">
          {log.details ?? '—'}
        </span>
      ),
    },
    {
      id: 'date',
      header: 'When',
      accessorFn: (log) => toDate(log.createdAt)?.getTime() ?? 0,
      cell: ({ row: { original: log } }) => {
        const date = toDate(log.createdAt);
        return (
          <time className="font-data text-ink-muted text-[12px] whitespace-nowrap">
            {date ? format(date, 'MMM d, yyyy · h:mm a') : '—'}
          </time>
        );
      },
    },
  ];

  if (error) return <PageError message={error.message} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit logs"
        description={
          isPending
            ? 'Who did what, and when.'
            : `${total.toLocaleString()} ${total === 1 ? 'entry' : 'entries'}${hasFilters ? ' match your filters' : ''} · who did what, and when`
        }
        actions={
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search name, action, target"
            className="sm:w-[280px]"
          />
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          value={actorRole}
          onChange={setActorRole}
          options={[
            { value: '', label: 'Everyone' },
            { value: 'driver', label: 'Drivers' },
            { value: 'admin', label: 'Admins' },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            aria-label="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={dateInputClasses}
          />
          <span className="text-ink-muted text-[13px]">to</span>
          <input
            type="date"
            aria-label="To date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={dateInputClasses}
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActorRole('');
                setDateFrom('');
                setDateTo('');
                setSearch('');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={isPending || isFetching}
        emptyMessage={hasFilters ? 'No entries match' : 'No activity yet'}
        emptyHint={hasFilters ? 'Try a wider date range or clear the filters.' : undefined}
      />

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-ink-muted text-[13px]">
            Page <span className="font-data text-ink">{page}</span> of{' '}
            <span className="font-data text-ink">{totalPages}</span>
          </p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
