import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStopPoints,
  createStopPoint,
  updateStopPoint,
  deleteStopPoint,
} from '@/actions';
import type { StopPointFormData } from '@/lib';

export function useStopPoints(routeId?: string) {
  return useQuery({
    queryKey: ['stop-points', routeId],
    queryFn: () => getStopPoints(routeId!),
    enabled: !!routeId,
  });
}

export function useCreateStopPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, routeId }: { data: StopPointFormData; routeId: string }) =>
      createStopPoint(data, routeId),
    onSuccess: (_, { routeId }) =>
      qc.invalidateQueries({ queryKey: ['stop-points', routeId] }),
  });
}

export function useUpdateStopPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StopPointFormData> }) =>
      updateStopPoint(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stop-points'] }),
  });
}

export function useDeleteStopPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStopPoint(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stop-points'] }),
  });
}
