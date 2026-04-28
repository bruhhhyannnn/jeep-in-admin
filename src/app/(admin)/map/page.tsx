'use client';

import { useEffect, useRef, useState } from 'react';
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

/**
 * Map implementation uses MapLibre GL (free, no token required).
 * TODO: When transitioning to Mapbox, replace:
 *   import maplibregl from 'maplibre-gl' → import mapboxgl from 'mapbox-gl'
 *   new maplibregl.Map({ style: 'https://...' }) → new mapboxgl.Map({ style: 'mapbox://styles/...' })
 *   Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local and pass it as accessToken
 */

// Default center: Laoag City, Ilocos Norte
const DEFAULT_CENTER: [number, number] = [120.5936, 18.198];
const DEFAULT_ZOOM = 12;

export default function MapPage() {
  const { userProfile } = useAuthStore();
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const orgId = userProfile?.organizationId ?? '';

  // Super admin org picker
  const [selectedOrgId, setSelectedOrgId] = useState(orgId);
  const { data: allOrgs = [] } = useOrganizations();
  // const { data: selectedOrg } = useOrganization(selectedOrgId || orgId);

  const orgToUse = isSuperAdmin ? selectedOrgId || orgId : orgId;
  const { data: org } = useOrganization(orgToUse);
  const routeId = org?.routeId ?? '';

  const { data: drivers = [] } = useDrivers(orgToUse);
  const { data: jeepneys = [] } = useJeepneys(orgToUse);
  const { data: stopPoints = [] } = useStopPoints(routeId);

  // Realtime driver locations
  const { locations: driverLocations, loading: locLoading } = isSuperAdmin
    ? useAllDriverLocations()
    : useDriverLocations(orgToUse);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const markersRef = useRef<Map<string, unknown>>(new Map());
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize MapLibre map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let map: unknown;

    import('maplibre-gl')
      .then((maplibregl) => {
        // Import CSS dynamically
        import('maplibre-gl/dist/maplibre-gl.css').catch(() => {
          // CSS may already be loaded
        });

        map = new maplibregl.default.Map({
          container: mapRef.current!,
          // Free OpenStreetMap-based style
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
        });

        // @ts-expect-error dynamic import
        map.on('load', () => {
          setMapLoaded(true);
          mapInstance.current = map;
        });

        // @ts-expect-error dynamic import
        map.on('error', (e: Error) => {
          console.error('[MapLibre]', e);
          setMapError('Failed to load map. Check your internet connection.');
        });
      })
      .catch(() => {
        setMapError('MapLibre GL could not be loaded. Run: npm install maplibre-gl');
      });

    return () => {
      if (map) {
        // @ts-expect-error dynamic import
        map.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Add stop point markers when map is loaded
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current || stopPoints.length === 0) return;

    import('maplibre-gl').then((maplibregl) => {
      stopPoints.forEach((stop) => {
        const el = document.createElement('div');
        el.className =
          'flex h-4 w-4 items-center justify-center rounded-full bg-warning-400 border-2 border-white';
        el.title = stop.name;

        new maplibregl.default.Marker({ element: el })
          .setLngLat([stop.longitude, stop.latitude])
          .setPopup(
            new maplibregl.default.Popup({ offset: 25 }).setHTML(
              `<p class="font-semibold text-xs">${stop.name}</p>
             <p class="text-xs text-gray-500">${stop.distanceFromTerminalKm} km from terminal</p>`
            )
          )
          // @ts-expect-error dynamic import
          .addTo(mapInstance.current);
      });
    });
  }, [mapLoaded, stopPoints]);

  // Update jeepney markers in realtime
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;

    import('maplibre-gl').then((maplibregl) => {
      const activeIds = new Set(driverLocations.map((l) => l.driverId));

      // Remove markers for drivers that stopped sharing
      markersRef.current.forEach((marker, driverId) => {
        if (!activeIds.has(driverId)) {
          // @ts-expect-error dynamic import
          marker.remove();
          markersRef.current.delete(driverId);
        }
      });

      // Add or update markers
      driverLocations.forEach((loc) => {
        const driver = drivers.find((d) => d.uid === loc.driverId);
        const jeepney = driver?.assignedJeepneyId
          ? jeepneys.find((j) => j.id === driver.assignedJeepneyId)
          : null;

        const isSelected = selectedDriver === loc.driverId;

        if (markersRef.current.has(loc.driverId)) {
          // Update position
          // @ts-expect-error dynamic import
          markersRef.current.get(loc.driverId)!.setLngLat([loc.longitude, loc.latitude]);
        } else {
          // Create new marker
          const el = document.createElement('div');
          el.className = `flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 shadow-lg transition-all ${
            isSelected ? 'border-brand-400 bg-brand-600 scale-125' : 'border-white bg-brand-600'
          }`;
          el.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
          el.title = driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown driver';

          el.addEventListener('click', () => setSelectedDriver(loc.driverId));

          const popup = new maplibregl.default.Popup({ offset: 40, closeButton: false }).setHTML(
            `<div style="font-family:sans-serif;padding:4px">
                <p style="font-weight:600;font-size:13px">${driver ? `${driver.firstName} ${driver.lastName}` : 'Driver'}</p>
                ${jeepney ? `<p style="font-size:11px;color:#6b7280">Jeepney #${jeepney.jeepneyNumber} · ${jeepney.plateNumber}</p>` : ''}
                <p style="font-size:11px;color:#6b7280;margin-top:2px">Live tracking</p>
              </div>`
          );

          const marker = new maplibregl.default.Marker({ element: el })
            .setLngLat([loc.longitude, loc.latitude])
            .setPopup(popup)
            // @ts-expect-error dynamic import
            .addTo(mapInstance.current);

          markersRef.current.set(loc.driverId, marker);
        }
      });
    });
  }, [mapLoaded, driverLocations, drivers, jeepneys, selectedDriver]);

  const activeCount = driverLocations.length;
  // const selectedLoc = driverLocations.find((l) => l.driverId === selectedDriver);
  // const selectedDriverInfo = drivers.find((d) => d.uid === selectedDriver);
  // const selectedJeepney = selectedDriverInfo?.assignedJeepneyId
  //   ? jeepneys.find((j) => j.id === selectedDriverInfo.assignedJeepneyId)
  //   : null;

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Live Map" />

      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 dark:border-gray-800 dark:bg-gray-900">
            <span className="bg-success-400 h-2 w-2 animate-pulse rounded-full" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {locLoading ? '…' : activeCount} active jeepney{activeCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-xs text-gray-600">{stopPoints.length} stop points</div>
        </div>

        {/* Super admin org picker */}
        {isSuperAdmin && allOrgs.length > 0 && (
          <div className="w-52">
            <Select
              options={allOrgs.map((o) => ({ value: o.id, label: o.shortName + ' — ' + o.name }))}
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              placeholder="Select organization…"
            />
          </div>
        )}
      </div>

      {/* Map + sidebar */}
      <div className="flex gap-4">
        {/* Map container */}
        <div
          className="relative flex-1 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
          style={{ height: '600px' }}
        >
          {mapError ? (
            <div className="flex h-full items-center justify-center bg-gray-900 dark:bg-gray-50">
              <div className="text-center">
                <p className="text-danger-400 text-sm">{mapError}</p>
                <p className="mt-2 text-xs text-gray-600">Run: npm install maplibre-gl</p>
              </div>
            </div>
          ) : (
            <>
              <div ref={mapRef} className="h-full w-full" />
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-950/80">
                  <Spinner />
                </div>
              )}
            </>
          )}
        </div>

        {/* Side panel - active drivers */}
        <div
          className="w-64 shrink-0 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950"
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
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? 'border-brand-600 bg-brand-600/10'
                      : 'border-gray-200 hover:border-gray-700 dark:border-gray-800 dark:hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bus size={14} className="text-brand-400" />
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      {d ? `${d.firstName} ${d.lastName}` : 'Unknown'}
                    </span>
                  </div>
                  {j && (
                    <p className="mt-1 text-xs text-gray-500">
                      #{j.jeepneyNumber} · {j.plateNumber}
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
    </div>
  );
}
