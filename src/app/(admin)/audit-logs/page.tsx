'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { PageBreadcrumb } from '@/components/common';
import { Input, Select, Badge, Pagination, Spinner, PageError } from '@/components/ui';
import { useAuthStore } from '@/store';
import { useAuditLogs } from '@/hooks';
import type { AuditLogFilters } from '@/actions';
import { toDate } from '@/lib';

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
  LOGOUT: 'light' as 'info',
  GPS_TOGGLE: 'warning',
};

function getActionColor(action: string) {
  const prefix = action.split('_')[0];
  return ACTION_COLOR[prefix] ?? 'light';
}

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

  // Reset to page 1 when filters change
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

  if (error) return <PageError message={error.message} />;

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Audit Logs" />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-48 flex-1">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-600" />
          <Input
            placeholder="Search actor, action, target…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-40">
          <Select
            options={ROLE_OPTIONS}
            value={actorRole}
            onChange={(e) => setActorRole(e.target.value)}
            placeholder="All roles"
          />
        </div>

        <div className="flex items-center gap-2">
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
        </div>

        {(actorRole || dateFrom || dateTo || debouncedSearch) && (
          <button
            className="text-brand-400 text-xs hover:underline"
            onClick={() => {
              setActorRole('');
              setDateFrom('');
              setDateTo('');
              setSearch('');
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">
        {total.toLocaleString()} log{total !== 1 ? 's' : ''} found
      </p>

      {/* Log list */}
      {isPending || isFetching ? (
        <div className="flex h-60 items-center justify-center">
          <Spinner />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex h-60 items-center justify-center rounded-xl border border-gray-800 dark:border-gray-200">
          <p className="text-sm text-gray-600">No logs found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800 dark:border-gray-200">
          {logs.map((log, i) => {
            const date = toDate(log.createdAt);
            return (
              <div
                key={log.id}
                className={`flex items-start justify-between gap-4 px-5 py-4 ${
                  i !== logs.length - 1 ? 'border-b border-gray-800 dark:border-gray-200' : ''
                } bg-gray-950 hover:bg-gray-900/50 dark:bg-white dark:hover:bg-gray-50`}
              >
                <div className="flex items-start gap-3">
                  {/* Actor avatar */}
                  <div className="bg-brand-600/10 text-brand-400 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {log.actorName?.charAt(0).toUpperCase() ?? '?'}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-200 dark:text-gray-800">
                        {log.actorName}
                      </span>
                      <Badge color="light" size="sm">
                        {log.actorRole}
                      </Badge>
                      <Badge color={getActionColor(log.action)} size="sm">
                        {log.action}
                      </Badge>
                    </div>

                    {log.targetName && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {log.targetType}: <span className="text-gray-400">{log.targetName}</span>
                      </p>
                    )}

                    {log.details && <p className="mt-1 text-xs text-gray-600">{log.details}</p>}
                  </div>
                </div>

                <time className="shrink-0 text-xs text-gray-600">
                  {date ? format(date, 'MMM d, yyyy · h:mm a') : '—'}
                </time>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
