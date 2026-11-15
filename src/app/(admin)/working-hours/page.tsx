'use client';

import { useEffect, useState } from 'react';
import { Route as RouteIcon } from 'lucide-react';
import { Select } from '@/components/ui';
import { Notice, PageHeader, ShiftHoursForm } from '@/components/common';
import { useAllRoutes, useOrganization } from '@/hooks';
import { useAuthStore } from '@/store';

export default function WorkingHoursPage() {
  const { userProfile } = useAuthStore();
  const isSuperAdmin = userProfile?.role === 'super_admin';

  const { data: allRoutes = [] } = useAllRoutes();
  const [selectedRouteId, setSelectedRouteId] = useState('');

  useEffect(() => {
    if (isSuperAdmin && !selectedRouteId && allRoutes.length > 0) {
      setSelectedRouteId(allRoutes[0].id);
    }
  }, [isSuperAdmin, allRoutes, selectedRouteId]);

  const orgId = userProfile?.organizationId ?? '';
  const { data: org } = useOrganization(isSuperAdmin ? undefined : orgId);
  const routeId = isSuperAdmin ? selectedRouteId : (org?.routeId ?? '');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shift hours"
        description="When drivers are allowed to share their location on the map."
        actions={
          isSuperAdmin && (
            <Select
              appearance="pill"
              aria-label="Route"
              options={allRoutes.map((r) => ({ value: r.id, label: r.name }))}
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              placeholder="Choose a route"
              className="max-w-[280px]"
            />
          )
        }
      />

      {routeId ? (
        <ShiftHoursForm key={routeId} routeId={routeId} />
      ) : (
        <Notice
          icon={<RouteIcon size={17} />}
          tone="info"
          title={isSuperAdmin ? 'No routes yet' : 'Your organization has no route yet'}
          description={
            isSuperAdmin
              ? 'Create a route first; each route has its own shift hours.'
              : 'Shift hours belong to a route. Ask your super admin to assign one.'
          }
        />
      )}
    </div>
  );
}
