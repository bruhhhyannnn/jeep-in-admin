import { useQuery } from '@tanstack/react-query';
import { getAuditLogs, type AuditLogFilters } from '@/actions';

export function useAuditLogs(filters: AuditLogFilters = {}, page = 1) {
  return useQuery({
    queryKey: ['audit-logs', filters, page],
    queryFn: () => getAuditLogs(filters, page),
  });
}
