import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoute, getAllRoutes, updateWorkingHours } from '@/actions';
import type { WorkingHoursFormData } from '@/types';

export function useRoute(routeId?: string) {
  return useQuery({
    queryKey: ['route', routeId],
    queryFn: () => getRoute(routeId!),
    enabled: !!routeId,
  });
}

export function useAllRoutes() {
  return useQuery({
    queryKey: ['routes'],
    queryFn: getAllRoutes,
  });
}

export function useUpdateWorkingHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: WorkingHoursFormData }) =>
      updateWorkingHours(routeId, data),
    onSuccess: (_, { routeId }) => qc.invalidateQueries({ queryKey: ['route', routeId] }),
  });
}
