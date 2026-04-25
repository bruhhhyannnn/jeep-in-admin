import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdmins, getAdmin, createAdmin, deactivateAdmin, deleteAdmin } from '@/actions';
import type { AdminCreateFormData } from '@/types';

export function useAdmins() {
  return useQuery({
    queryKey: ['admins'],
    queryFn: getAdmins,
  });
}

export function useAdminProfile(uid?: string) {
  return useQuery({
    queryKey: ['admin', uid],
    queryFn: () => getAdmin(uid!),
    enabled: !!uid,
  });
}

export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminCreateFormData) => createAdmin(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  });
}

export function useDeactivateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => deactivateAdmin(uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  });
}

export function useDeleteAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => deleteAdmin(uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  });
}
