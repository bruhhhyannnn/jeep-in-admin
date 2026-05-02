import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdmins,
  getAdmin,
  createAdmin,
  deactivateAdmin,
  reactivateAdmin,
  deleteAdmin,
  reassignAdminOrg,
} from '@/actions';
import { AdminCreateFormData } from '@/lib';

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

export function useReactivateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => reactivateAdmin(uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  });
}

export function useReassignAdminOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, organizationId }: { uid: string; organizationId: string }) =>
      reassignAdminOrg(uid, organizationId),
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
