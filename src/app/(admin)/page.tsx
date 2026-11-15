'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Bot, Clock, Route as RouteIcon } from 'lucide-react';
import { Button, PageError } from '@/components/ui';
import {
  Notice,
  OrgPicker,
  PageHeader,
  SearchField,
  ShiftHoursPanel,
  StatTile,
} from '@/components/common';
import {
  FleetMap,
  SimulationNotice,
  SimulationPanel,
  UnitRail,
  buildFleet,
  driverName,
} from '@/components/fleet';
import {
  useDriverLocations,
  useDrivers,
  useJeepneys,
  useNow,
  useOrgScope,
  useOrganization,
  useRoute,
  useStopPoints,
} from '@/hooks';
import { formatClock, isWithinHours, timeAgo } from '@/lib';

export default function FleetOverviewPage() {
  const { orgId, isSuperAdmin, orgs } = useOrgScope();
  const { data: org } = useOrganization(orgId || undefined);
  const routeId = org?.routeId ?? '';
  const { data: route } = useRoute(routeId || undefined);

  const { data: drivers = [], isPending: loadingDrivers, error } = useDrivers(orgId);
  const { data: jeepneys = [], isPending: loadingJeepneys } = useJeepneys(orgId);
  const { data: stopPoints = [] } = useStopPoints(routeId || undefined);
  const { locations, loading: loadingLocations, syncedAt } = useDriverLocations(orgId);

  const now = useNow(5000);
  const [query, setQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [simulateOpen, setSimulateOpen] = useState(false);
  // Bot jeeps for demos and testing; super admins only.
  const canSimulate = isSuperAdmin && !!routeId && !!route;

  const inShift = route?.workingHours ? isWithinHours(route.workingHours, new Date(now)) : true;

  const fleet = useMemo(
    () => buildFleet(jeepneys, drivers, locations, now),
    [jeepneys, drivers, locations, now]
  );

  const q = query.trim().toLowerCase();
  const visible = q
    ? fleet.filter((u) =>
        [u.jeepney?.plateNumber, u.jeepney?.jeepneyNumber, driverName(u.driver)]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    : fleet;

  const liveCount = fleet.filter((u) => u.state === 'live').length;
  const staleCount = fleet.filter((u) => u.state === 'stale').length;
  const withDriver = jeepneys.filter((j) => j.assignedDriverId).length;
  const activeDrivers = drivers.filter((d) => d.isActive).length;
  const loading = !!orgId && (loadingDrivers || loadingJeepneys);
  const dash = (v: number) => (loading ? '—' : v);

  if (error) return <PageError message={error.message} />;

  if (isSuperAdmin && orgs.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Fleet overview" />
        <Notice
          icon={<RouteIcon size={17} />}
          tone="info"
          title="No organizations yet"
          description="Create an organization and give it a route, then its fleet shows up here."
        />
      </div>
    );
  }

  const statusLine = inShift ? (
    <span className="text-ink-muted flex items-center gap-1.5 text-[12px] font-medium">
      <span className="relative flex h-2 w-2">
        <span className="bg-live animate-pulse-ring absolute inset-0 rounded-full" />
        <span className="bg-live relative h-2 w-2 rounded-full" />
      </span>
      {syncedAt ? `Live · updated ${timeAgo(new Date(syncedAt), now)} ago` : 'Connecting…'}
    </span>
  ) : (
    <span className="text-ink-muted flex items-center gap-1.5 text-[12px] font-medium">
      <span className="border-stale h-2 w-2 rounded-full border-[1.5px]" />
      Opens {formatClock(route?.workingHours.start)}
    </span>
  );

  const emptyState = !inShift
    ? {
        title: 'No jeepneys on the map yet',
        description: 'Markers appear as drivers switch sharing on at the terminal.',
      }
    : !loadingLocations && fleet.every((u) => !u.location)
      ? {
          title: 'No one is sharing right now',
          description: 'Markers appear as soon as a driver switches sharing on.',
        }
      : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fleet overview"
        description={
          org
            ? `${org.name}${route ? ` · ${route.name} · shift ${formatClock(route.workingHours.start)} – ${formatClock(route.workingHours.end)}` : ''}`
            : 'Where every unit is right now.'
        }
        actions={
          <>
            <OrgPicker />
            <SearchField value={query} onChange={setQuery} placeholder="Search plate or driver" />
            {canSimulate && (
              <Button
                variant="outline"
                startIcon={<Bot size={16} />}
                onClick={() => setSimulateOpen(true)}
              >
                Simulate
              </Button>
            )}
          </>
        }
      />

      {isSuperAdmin && <SimulationNotice />}

      {org && !routeId && (
        <Notice
          icon={<RouteIcon size={17} />}
          tone="info"
          title="This organization has no route yet"
          description="Stops and shift hours appear once a super admin assigns a route."
        />
      )}

      {!inShift && route && (
        <Notice
          icon={<Clock size={17} />}
          title={`Outside shift hours — sharing opens at ${formatClock(route.workingHours.start)}`}
          description={`An empty map right now is normal. ${format(new Date(now), 'EEE, MMM d · h:mm a')}`}
          action={
            <Button variant="outline" size="sm" onClick={() => setShiftOpen(true)}>
              Change shift hours
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          value={inShift ? dash(liveCount) : '—'}
          label="Sharing live"
          swatch={
            <span className="bg-moment h-4 w-4 rounded-[5px] border-2 border-white shadow-sm" />
          }
        />
        <StatTile
          value={inShift ? dash(staleCount) : '—'}
          label="Last known · no signal"
          swatch={
            <span className="border-stale h-4 w-4 rounded-[5px] border-[1.5px] border-dashed" />
          }
        />
        <StatTile
          value={
            loading ? (
              '—'
            ) : (
              <>
                {withDriver}
                <span className="text-ink-muted text-[17px] font-bold"> / {jeepneys.length}</span>
              </>
            )
          }
          label="Units with a driver"
        />
        <StatTile value={dash(activeDrivers)} label="Active drivers" />
      </div>

      <div className="grid gap-4 lg:h-[calc(100dvh-330px)] lg:min-h-[480px] lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[380px] sm:h-[440px] lg:h-full">
          <FleetMap
            units={visible}
            stops={stopPoints}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            now={now}
            emptyState={emptyState}
          />
        </div>
        <div className="flex max-h-[560px] min-h-0 flex-col lg:h-full lg:max-h-none">
          <UnitRail
            units={visible}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            now={now}
            inShift={inShift}
            statusLine={statusLine}
            loading={loading}
          />
        </div>
      </div>

      <ShiftHoursPanel isOpen={shiftOpen} onClose={() => setShiftOpen(false)} routeId={routeId} />
      {canSimulate && (
        <SimulationPanel
          isOpen={simulateOpen}
          onClose={() => setSimulateOpen(false)}
          organizationId={orgId}
          routeId={routeId}
          routeName={route.name}
        />
      )}
    </div>
  );
}
