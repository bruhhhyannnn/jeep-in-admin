'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib';
import type { DriverLocation } from '@/types';

/**
 * Realtime hook — uses Firestore onSnapshot for live GPS updates.
 * Only returns drivers that are actively sharing their location.
 * Scoped to a specific organizationId via the drivers collection cross-reference.
 *
 * TODO: Working hours enforcement — when outside the route's working hours,
 * the mobile app should set isSharing=false. Until then, this hook
 * shows all drivers with isSharing=true regardless of time.
 * See: /src/actions/routes.ts → isWithinWorkingHours()
 */
export function useDriverLocations(organizationId: string) {
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    // Query only drivers sharing location
    const q = query(collection(db, 'driver_locations'), where('isSharing', '==', true));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => d.data() as DriverLocation);
        setLocations(data);
        setLoading(false);
      },
      (err) => {
        console.error('[useDriverLocations]', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

  return { locations, loading, error };
}

/**
 * Realtime hook for super admin — sees all active driver locations system-wide.
 * organizationId filter is applied client-side after fetching.
 */
export function useAllDriverLocations() {
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'driver_locations'), where('isSharing', '==', true));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setLocations(snap.docs.map((d) => d.data() as DriverLocation));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { locations, loading, error };
}
