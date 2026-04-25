import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getJeepneys,
  getJeepney,
  getUnassignedJeepneys,
  createJeepney,
  updateJeepney,
  deleteJeepney,
} from '@/actions';
import type { JeepneyFormData } from '@/types';

export function useJeepneys(organizationId: string) {
  return useQuery({
    queryKey: ['jeepneys', organizationId],
    queryFn: () => getJeepneys(organizationId),
    enabled: !!organizationId,
  });
}

export function useJeepney(id?: string) {
  return useQuery({
    queryKey: ['jeepney', id],
    queryFn: () => getJeepney(id!),
    enabled: !!id,
  });
}

export function useUnassignedJeepneys(organizationId: string) {
  return useQuery({
    queryKey: ['jeepneys-unassigned', organizationId],
    queryFn: () => getUnassignedJeepneys(organizationId),
    enabled: !!organizationId,
  });
}

export function useCreateJeepney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      organizationId,
      routeId,
    }: {
      data: JeepneyFormData;
      organizationId: string;
      routeId: string;
    }) => createJeepney(data, organizationId, routeId),
    onSuccess: (_, { organizationId }) =>
      qc.invalidateQueries({ queryKey: ['jeepneys', organizationId] }),
  });
}

export function useUpdateJeepney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JeepneyFormData> }) =>
      updateJeepney(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['jeepneys'] });
      qc.invalidateQueries({ queryKey: ['jeepney', id] });
    },
  });
}

export function useDeleteJeepney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJeepney(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jeepneys'] }),
  });
}
