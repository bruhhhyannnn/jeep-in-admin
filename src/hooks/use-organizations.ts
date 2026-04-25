import { useQuery } from '@tanstack/react-query';
import { getOrganizations, getOrganization } from '@/actions';

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  });
}

export function useOrganization(id?: string) {
  return useQuery({
    queryKey: ['organization', id],
    queryFn: () => getOrganization(id!),
    enabled: !!id,
  });
}
