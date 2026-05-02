import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRoute,
  getAllRoutes,
  updateWorkingHours,
  createRoute,
  updateRoute,
  deleteRoute,
} from '@/actions';
import { WorkingHoursFormData, RouteFormData } from '@/lib';

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

export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RouteFormData) => createRoute(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  });
}

export function useUpdateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: RouteFormData }) =>
      updateRoute(routeId, data),
    onSuccess: (_, { routeId }) => {
      qc.invalidateQueries({ queryKey: ['routes'] });
      qc.invalidateQueries({ queryKey: ['route', routeId] });
    },
  });
}

export function useDeleteRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => deleteRoute(routeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routes'] });
      qc.invalidateQueries({ queryKey: ['stop-points'] });
      qc.invalidateQueries({ queryKey: ['fare-guide'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
      qc.invalidateQueries({ queryKey: ['organizations'] });
    },
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
