'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { PageBreadcrumb } from '@/components/common';
import { Input, Select, Badge, Pagination, DataTable, PageError, Button } from '@/components/ui';
import { useAuthStore } from '@/store';
import { useAuditLogs } from '@/hooks';
import type { AuditLogFilters } from '@/actions';
import { toDate } from '@/lib';
import type { ColumnDef } from '@tanstack/react-table';
import type { AuditLog } from '@/types';

const PER_PAGE = 20;

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'driver', label: 'Drivers' },
  { value: 'admin', label: 'Admins' },
  { value: 'super_admin', label: 'Super Admin' },
];

const ACTION_COLOR: Record<string, 'primary' | 'success' | 'danger' | 'warning' | 'info'> = {
  CREATE: 'success',
  UPDATE: 'primary',
  DELETE: 'danger',
  ASSIGN: 'info',
  UNASSIGN: 'warning',
  LOGIN: 'info',
  GPS_TOGGLE: 'warning',
};

export default function AuditLogsPage() {
  const { userProfile } = useAuthStore();
  const isSuperAdmin = userProfile?.role === 'super_admin';

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actorRole, setActorRole] = useState('');
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

  const columns: ColumnDef<AuditLog, unknown>[] = [
    {
      id: 'actor',
      header: 'Actor',
      accessorFn: (log) => log.actorName,
      cell: ({ row: { original: log } }) => (
        <div className="flex items-center gap-3">
          <div className="bg-brand-600/10 text-brand-400 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {log.actorName?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium text-gray-800 dark:text-gray-200">{log.actorName}</p>
            <div>
              <Badge color="light" size="sm">
                {log.actorRole}
              </Badge>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      accessorFn: (log) => log.action,
      cell: ({ row: { original: log } }) => (
        <Badge color={getActionColor(log.action)} size="sm">
          {log.action}
        </Badge>
      ),
    },
    {
      id: 'target',
      header: 'Target',
      accessorFn: (log) => log.targetName ?? '',
      cell: ({ row: { original: log } }) =>
        log.targetName ? (
          <div>
            <p className="text-xs text-gray-500">{log.targetType}</p>
            <p className="text-gray-700 dark:text-gray-300">{log.targetName}</p>
          </div>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        ),
    },
    {
      id: 'details',
      header: 'Details',
      accessorFn: (log) => log.details ?? '',
      cell: ({ row: { original: log } }) => (
        <span className="text-gray-500">{log.details ?? '—'}</span>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      accessorFn: (log) => log.createdAt,
      cell: ({ row: { original: log } }) => {
        const date = toDate(log.createdAt);
        return (
          <time className="text-xs text-gray-500">
            {date ? format(date, 'MMM d, yyyy · h:mm a') : '—'}
          </time>
        );
      },
    },
  ];

  if (error) return <PageError message={error.message} />;

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Audit Logs" />

      {/* Filters */}
      <div className="flex flex-col flex-wrap gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="w-40">
            {/* TODO: revalidate all roles */}
            <Select
              options={ROLE_OPTIONS}
              value={actorRole}
              onChange={(e) => setActorRole(e.target.value)}
              placeholder="All roles"
            />
          </div>

          <div className="relative min-w-48 flex-1">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-600" />
            <Input
              placeholder="Search actor, action, target…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36"
          />
          <span className="text-xs text-gray-600">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36"
          />

          {(actorRole || dateFrom || dateTo || debouncedSearch) && (
            <Button
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

      {/* Count */}
      <p className="text-sm text-gray-500">
        {total.toLocaleString()} log{total !== 1 ? 's' : ''} found
      </p>

      <DataTable
        columns={columns}
        data={logs}
        loading={isPending || isFetching}
        emptyMessage="No logs found"
      />

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

function getActionColor(action: string) {
  const prefix = action.split('_')[0];
  return ACTION_COLOR[prefix] ?? 'light';
}
