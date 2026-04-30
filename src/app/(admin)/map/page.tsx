'use client';

import { useEffect, useState } from 'react';
import { Bus } from 'lucide-react';
import { PageBreadcrumb } from '@/components/common';
import { Select, Spinner } from '@/components/ui';
import { useAuthStore } from '@/store';
import {
  useDriverLocations,
  useAllDriverLocations,
  useDrivers,
  useJeepneys,
  useStopPoints,
  useOrganization,
  useOrganizations,
} from '@/hooks';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
  useMap,
} from '@/components/ui';
import type { DriverLocation } from '@/types';

/**
 * Map uses mapcn (built on MapLibre GL).
 * TODO: When transitioning to Mapbox, update the map style URL inside
 * src/components/ui/map.tsx and add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local
 */

const DEFAULT_CENTER: [number, number] = [120.5936, 18.198];
const DEFAULT_ZOOM = 12;

/* Flies to selected driver on the map */
function RealtimeLayer({
  locations,
  selectedDriver,
}: {
  locations: DriverLocation[];
  selectedDriver: string | null;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || !selectedDriver) return;
    const loc = locations.find((l) => l.driverId === selectedDriver);
    if (loc) {
      map.flyTo({ center: [loc.longitude, loc.latitude], zoom: 15, duration: 800 });
    }
  }, [selectedDriver, map, isLoaded, locations]);

  return null;
}

export default function MapPage() {
  const { userProfile } = useAuthStore();
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const orgId = userProfile?.organizationId ?? '';

  const [selectedOrgId, setSelectedOrgId] = useState(orgId);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const { data: allOrgs = [] } = useOrganizations();
  const orgToUse = isSuperAdmin ? selectedOrgId || orgId : orgId;
  const { data: org } = useOrganization(orgToUse);
  const routeId = org?.routeId ?? '';

  const { data: drivers = [] } = useDrivers(orgToUse);
  const { data: jeepneys = [] } = useJeepneys(orgToUse);
  const { data: stopPoints = [] } = useStopPoints(routeId);

  const adminLocations = useDriverLocations(orgToUse);
  const superAdminLocations = useAllDriverLocations();
  const { locations: driverLocations, loading: locLoading } = isSuperAdmin
    ? superAdminLocations
    : adminLocations;

  const activeCount = driverLocations.length;

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Live Map" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-800 dark:bg-gray-900">
            <span className="bg-success-400 h-2 w-2 animate-pulse rounded-full" />
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              {locLoading ? '...' : activeCount} active jeepney{activeCount !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-xs text-gray-600">{stopPoints.length} stop points</span>
        </div>

        {isSuperAdmin && allOrgs.length > 0 && (
          <div className="w-52">
            <Select
              options={allOrgs.map((o) => ({ value: o.id, label: `${o.shortName} - ${o.name}` }))}
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              placeholder="Select organization..."
            />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="bg-brand-600 h-3.5 w-3.5 rounded-full border border-white" />
          <span>Jeepney (live GPS)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="bg-warning-400 h-3 w-3 rounded-full border border-white" />
          <span>Stop point</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div
          className="dark:shadow-theme-md-dark relative flex-1 overflow-hidden rounded-xl border border-gray-200 shadow-md dark:border-gray-800"
          style={{ height: '500px' }}
        >
          <Map center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM}>
            <MapControls />

            {stopPoints.map((stop) => (
              <MapMarker key={stop.id} longitude={stop.longitude} latitude={stop.latitude}>
                <MarkerContent>
                  <div className="bg-warning-400 h-3.5 w-3.5 rounded-full border-2 border-white shadow" />
                </MarkerContent>
                <MarkerTooltip>{stop.name}</MarkerTooltip>
                <MarkerPopup>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">{stop.name}</p>
                    <p className="text-xs text-gray-500">
                      {stop.distanceFromTerminalKm} km from terminal
                    </p>
                  </div>
                </MarkerPopup>
              </MapMarker>
            ))}

            {driverLocations.map((loc) => {
              const driver = drivers.find((d) => d.uid === loc.driverId);
              const jeepney = driver?.assignedJeepneyId
                ? jeepneys.find((j) => j.id === driver.assignedJeepneyId)
                : null;
              const isSelected = selectedDriver === loc.driverId;

              return (
                <MapMarker key={loc.driverId} longitude={loc.longitude} latitude={loc.latitude}>
                  <MarkerContent>
                    <div
                      onClick={() => setSelectedDriver(isSelected ? null : loc.driverId)}
                      className={[
                        'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 shadow-lg transition-transform',
                        isSelected
                          ? 'border-brand-400 bg-brand-700 scale-125'
                          : 'bg-brand-600 border-white hover:scale-110',
                      ].join(' ')}
                    >
                      <Bus size={16} className="text-white" />
                    </div>
                  </MarkerContent>
                  <MarkerTooltip>
                    {driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown driver'}
                  </MarkerTooltip>
                  <MarkerPopup>
                    <div className="min-w-40 space-y-1">
                      <p className="font-semibold">
                        {driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown driver'}
                      </p>
                      {jeepney && (
                        <p className="text-xs text-gray-500">
                          Jeepney #{jeepney.jeepneyNumber} - {jeepney.plateNumber}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="bg-success-400 h-1.5 w-1.5 rounded-full" />
                        <span className="text-xs text-gray-500">Live GPS</span>
                      </div>
                    </div>
                  </MarkerPopup>
                </MapMarker>
              );
            })}

            <RealtimeLayer locations={driverLocations} selectedDriver={selectedDriver} />
          </Map>
        </div>

        {/* Active Drivers, right side */}
        <div
          className="custom-scrollbar dark:shadow-theme-md-dark w-64 shrink-0 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-md dark:border-gray-800 dark:bg-gray-900"
          style={{ maxHeight: '600px' }}
        >
          <p className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Active Drivers
          </p>
          {locLoading ? (
            <Spinner center size="sm" />
          ) : driverLocations.length === 0 ? (
            <p className="text-xs text-gray-600">No active drivers</p>
          ) : (
            driverLocations.map((loc) => {
              const d = drivers.find((dr) => dr.uid === loc.driverId);
              const j = d?.assignedJeepneyId
                ? jeepneys.find((je) => je.id === d.assignedJeepneyId)
                : null;
              const isSelected = selectedDriver === loc.driverId;

              return (
                <button
                  key={loc.driverId}
                  onClick={() => setSelectedDriver(isSelected ? null : loc.driverId)}
                  className={[
                    'w-full rounded-lg border p-3 text-left transition-colors',
                    isSelected
                      ? 'border-brand-600 bg-brand-600/10'
                      : 'border-gray-800 hover:border-gray-700 dark:border-gray-200 dark:hover:border-gray-300',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <Bus size={14} className="text-brand-400" />
                    <span className="text-xs font-medium text-gray-200 dark:text-gray-800">
                      {d ? `${d.firstName} ${d.lastName}` : 'Unknown'}
                    </span>
                  </div>
                  {j && (
                    <p className="mt-1 text-xs text-gray-500">
                      #{j.jeepneyNumber} - {j.plateNumber}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-1">
                    <span className="bg-success-400 h-1.5 w-1.5 rounded-full" />
                    <span className="text-xs text-gray-600">Live</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
