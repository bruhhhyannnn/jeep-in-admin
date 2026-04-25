import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deactivateDriver,
  deleteDriver,
  assignJeepney,
  unassignJeepney,
} from '@/actions';
import type { DriverCreateFormData, DriverEditFormData } from '@/types';

export function useDrivers(organizationId: string) {
  return useQuery({
    queryKey: ['drivers', organizationId],
    queryFn: () => getDrivers(organizationId),
    enabled: !!organizationId,
  });
}

export function useDriver(uid?: string) {
  return useQuery({
    queryKey: ['driver', uid],
    queryFn: () => getDriver(uid!),
    enabled: !!uid,
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      organizationId,
      routeId,
    }: {
      data: DriverCreateFormData;
      organizationId: string;
      routeId: string;
    }) => createDriver(data, organizationId, routeId),
    onSuccess: (_, { organizationId }) =>
      qc.invalidateQueries({ queryKey: ['drivers', organizationId] }),
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: Partial<DriverEditFormData> }) =>
      updateDriver(uid, data),
    onSuccess: (_, { uid }) => {
      qc.invalidateQueries({ queryKey: ['drivers'] });
      qc.invalidateQueries({ queryKey: ['driver', uid] });
    },
  });
}

export function useDeactivateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => deactivateDriver(uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => deleteDriver(uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  });
}

export function useAssignJeepney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverUid, jeepneyId }: { driverUid: string; jeepneyId: string }) =>
      assignJeepney(driverUid, jeepneyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] });
      qc.invalidateQueries({ queryKey: ['jeepneys'] });
    },
  });
}

export function useUnassignJeepney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverUid, jeepneyId }: { driverUid: string; jeepneyId: string }) =>
      unassignJeepney(driverUid, jeepneyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] });
      qc.invalidateQueries({ queryKey: ['jeepneys'] });
    },
  });
}
