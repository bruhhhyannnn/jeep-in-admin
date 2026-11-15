import { useEffect } from 'react';
import { useAuthStore, useScopeStore } from '@/store';
import { useOrganizations } from './use-organizations';

/**
 * The organization the current page is scoped to.
 * Admins are always scoped to their own organization; super admins pick one
 * (defaulting to the first) and the choice follows them across pages.
 */
export function useOrgScope() {
  const { userProfile } = useAuthStore();
  const isSuperAdmin = userProfile?.role === 'super_admin';

  const { data: orgs = [] } = useOrganizations();
  const { orgId: selectedOrgId, setOrgId } = useScopeStore();

  useEffect(() => {
    if (isSuperAdmin && !selectedOrgId && orgs.length > 0) {
      setOrgId(orgs[0].id);
    }
  }, [isSuperAdmin, orgs, selectedOrgId, setOrgId]);

  const orgId = isSuperAdmin ? selectedOrgId : (userProfile?.organizationId ?? '');

  return { orgId, isSuperAdmin, orgs, setOrgId };
}
