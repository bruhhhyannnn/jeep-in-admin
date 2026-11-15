import { toDate } from '@/lib';
import type { DriverLocation, DriverProfile, Jeepney } from '@/types';

/** A position older than this is shown as "last known · no signal". */
export const STALE_AFTER_MS = 2 * 60 * 1000;

export type UnitState = 'live' | 'stale' | 'off' | 'no-driver';

export interface FleetUnit {
  /** Jeepney id, or `driver:<uid>` for a driver sharing without a unit. */
  key: string;
  jeepney: Jeepney | null;
  driver: DriverProfile | null;
  location: DriverLocation | null;
  lastSeen: Date | null;
  state: UnitState;
}

const STATE_ORDER: Record<UnitState, number> = { live: 0, stale: 1, off: 2, 'no-driver': 3 };

function hasPosition(loc: DriverLocation | null | undefined): loc is DriverLocation {
  return (
    !!loc &&
    typeof loc.latitude === 'number' &&
    typeof loc.longitude === 'number' &&
    !Number.isNaN(loc.latitude) &&
    !Number.isNaN(loc.longitude)
  );
}

function stateFor(driver: DriverProfile | null, location: DriverLocation | null, now: number) {
  if (!driver) return { state: 'no-driver' as const, lastSeen: null };
  if (!location) return { state: 'off' as const, lastSeen: null };
  const lastSeen = toDate(location.updatedAt);
  const stale = lastSeen ? now - lastSeen.getTime() > STALE_AFTER_MS : false;
  return { state: stale ? ('stale' as const) : ('live' as const), lastSeen };
}

/**
 * Simulated units have no driver record (bots aren't sign-in accounts), so they show
 * with a placeholder driver instead.
 */
function simulatedDriver(j: Jeepney): DriverProfile {
  return {
    uid: j.assignedDriverId ?? '',
    email: '',
    firstName: 'Simulated',
    lastName: 'driver',
    organizationId: j.organizationId,
    assignedJeepneyId: j.id,
    routeId: j.routeId,
    isActive: true,
    mustChangePassword: false,
    lastLocationUpdate: null,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}

/** Joins units, drivers and live positions into one list, live units first. */
export function buildFleet(
  jeepneys: Jeepney[],
  drivers: DriverProfile[],
  locations: DriverLocation[],
  now: number
): FleetUnit[] {
  const driverById = new Map(drivers.map((d) => [d.uid, d]));
  const locByDriver = new Map(locations.filter(hasPosition).map((l) => [l.driverId, l] as const));

  const units: FleetUnit[] = jeepneys.map((j) => {
    const driver = j.assignedDriverId
      ? (driverById.get(j.assignedDriverId) ?? (j.isBot ? simulatedDriver(j) : null))
      : null;
    const location = driver ? (locByDriver.get(driver.uid) ?? null) : null;
    return { key: j.id, jeepney: j, driver, location, ...stateFor(driver, location, now) };
  });

  // Drivers who are sharing but have no unit assigned still belong on the map.
  const placed = new Set(units.map((u) => u.driver?.uid).filter(Boolean));
  for (const [driverId, location] of locByDriver) {
    const driver = driverById.get(driverId);
    if (!driver || placed.has(driverId)) continue;
    units.push({
      key: `driver:${driverId}`,
      jeepney: null,
      driver,
      location,
      ...stateFor(driver, location, now),
    });
  }

  return units.sort(
    (a, b) =>
      STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
      (a.jeepney?.jeepneyNumber ?? '').localeCompare(b.jeepney?.jeepneyNumber ?? '', undefined, {
        numeric: true,
      })
  );
}

export function driverName(d: DriverProfile | null | undefined) {
  return d ? `${d.firstName} ${d.lastName}` : '';
}
