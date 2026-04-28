import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFareGuide, createFareEntry, updateFareEntry, deleteFareEntry } from '@/actions';
import { FareGuideFormData } from '@/lib';

export function useFareGuide(routeId?: string) {
  return useQuery({
    queryKey: ['fare-guide', routeId ?? 'all'],
    queryFn: () => getFareGuide(routeId),
  });
}

export function useCreateFareEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FareGuideFormData) => createFareEntry(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fare-guide'] }),
  });
}

export function useUpdateFareEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FareGuideFormData> }) =>
      updateFareEntry(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fare-guide'] }),
  });
}

export function useDeleteFareEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFareEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fare-guide'] }),
  });
}
