'use client';

import { useEffect, useRef, useState } from 'react';
import { Bus, MapPin } from 'lucide-react';
import { PageBreadcrumb } from '@/components/common';
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
  Select,
  Spinner,
  type MapRef,
} from '@/components/ui';
import type { DriverLocation } from '@/types';

const DEFAULT_CENTER: [number, number] = [120.551474, 18.058174];
const DEFAULT_ZOOM = 14.5;

export default function MapPage() {
  const { userProfile } = useAuthStore();
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const orgId = userProfile?.organizationId ?? '';

  const [selectedOrgId, setSelectedOrgId] = useState(orgId);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const mapRef = useRef<MapRef>(null);

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

      <div className="flex flex-wrap gap-4">
        <div className="dark:shadow-theme-md-dark relative h-72 min-w-80 flex-1 overflow-hidden rounded-xl border border-gray-200 shadow-md md:h-125 dark:border-gray-800">
          <Map ref={mapRef} center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM}>
            <MapControls position="top-right" showZoom showLocate showFullscreen />

            {/* Legend */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-5 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="bg-brand-600 h-3.5 w-3.5 animate-pulse rounded-full border border-white" />
                <span>Jeepney (live GPS)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="bg-warning-400 h-3 w-3 rounded-full border border-white" />
                <span>Stop point</span>
              </div>
            </div>

            {/* Render Stop Points */}
            {stopPoints.map((stop) => (
              <MapMarker key={stop.id} longitude={stop.longitude} latitude={stop.latitude}>
                <MarkerContent>
                  <div className="bg-warning-400 h-3.5 w-3.5 rounded-full border-2 border-white shadow" />
                </MarkerContent>
                <MarkerTooltip className="bg-white">{stop.name}</MarkerTooltip>
                <MarkerPopup className="bg-white">
                  <div className="min-w-44 space-y-2">
                    {/* Header */}
                    <div className="flex items-start gap-2">
                      <div className="bg-warning-400/20 mt-0.5 flex h-7 w-7 shrink-0 animate-pulse items-center justify-center rounded-full">
                        <div className="bg-warning-400 h-3 w-3 rounded-full" />
                      </div>
                      <div>
                        <p className="text-sm leading-tight font-semibold text-gray-900">
                          {stop.name}
                        </p>
                        {stop.address && (
                          <p className="mt-0.5 text-xs text-gray-500">{stop.address}</p>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100" />

                    {/* Direction badge */}
                    <div className="flex items-center gap-1.5">
                      <span className="bg-brand-50 text-brand-600 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                        {stop.routeDirection
                          .split('_')
                          .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
                          .join(' → ')}
                      </span>
                    </div>

                    {/* Info note */}
                    <div className="flex items-start gap-1.5 rounded-lg bg-gray-50 p-1">
                      <svg
                        className="text-brand-500 mt-0.5 h-5 w-5 shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-xs leading-relaxed text-gray-500">
                        Wait at this stop for jeepneys heading in this direction.
                      </p>
                    </div>
                  </div>
                </MarkerPopup>
              </MapMarker>
            ))}

            {/* Render Driver Locations */}
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

      {/* Stop Points panel */}
      {stopPoints.length > 0 && (
        <div className="dark:shadow-theme-md-dark rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-2">
            <MapPin size={14} className="text-warning-400" />
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Stop Points{' '}
              <span className="ml-1 font-normal normal-case">({stopPoints.length})</span>
            </p>
          </div>

          {/* Group by direction */}
          {Array.from(new Set(stopPoints.map((s) => s.routeDirection))).map((dir) => (
            <div key={dir} className="mb-4 last:mb-0">
              <p className="mb-2 text-xs font-medium text-gray-400">
                {dir
                  .split('_')
                  .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
                  .join(' → ')}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {stopPoints
                  .filter((s) => s.routeDirection === dir)
                  .map((stop) => (
                    <button
                      key={stop.id}
                      onClick={() =>
                        mapRef.current?.flyTo({
                          center: [stop.longitude, stop.latitude],
                          zoom: 17,
                          duration: 800,
                        })
                      }
                      className="hover:border-warning-400/50 hover:bg-warning-400/10 flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-left transition-colors dark:border-gray-800 dark:bg-gray-800/50"
                    >
                      <div className="bg-warning-400 h-2 w-2 shrink-0 rounded-full" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                          {stop.name}
                        </p>
                        {stop.address && (
                          <p className="truncate text-xs text-gray-400">{stop.address}</p>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
