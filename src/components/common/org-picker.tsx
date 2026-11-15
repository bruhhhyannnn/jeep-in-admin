'use client';

import { Select } from '@/components/ui';
import { useOrgScope } from '@/hooks';

/** Super admins choose which organization the page shows. Hidden for admins. */
export function OrgPicker({ className }: { className?: string }) {
  const { isSuperAdmin, orgs, orgId, setOrgId } = useOrgScope();
  if (!isSuperAdmin) return null;

  return (
    <Select
      appearance="pill"
      aria-label="Organization"
      options={orgs.map((o) => ({ value: o.id, label: `${o.shortName} · ${o.name}` }))}
      value={orgId}
      onChange={(e) => setOrgId(e.target.value)}
      placeholder={orgs.length ? 'Choose organization' : 'No organizations yet'}
      className={className ?? 'max-w-[260px]'}
    />
  );
}
