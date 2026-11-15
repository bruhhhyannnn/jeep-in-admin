import { adminDb } from './firebase-admin';
import { directionIds, hasCoordinates, stopFields } from './shapes';
import { directionsUrl, type LngLat, type RoadLine } from './fleet-simulation';

/**
 * Server only (Admin SDK). The roads the "Simulate jeeps" bots drive, used by the
 * auth-guarded getSimulationRoads server action in src/actions/simulation.ts.
 */

/** The Mapbox road through the stops, or null when there is no token or Mapbox can't route it. */
async function mapboxRoad(
  directionId: string,
  stops: { lng: number; lat: number }[],
  token: string | undefined
): Promise<LngLat[] | null> {
  if (!token) return null;
  try {
    const res = await fetch(directionsUrl(stops, token));
    const json = (await res.json()) as {
      routes?: { geometry: { coordinates: LngLat[] } }[];
      message?: string;
    };
    const line = json.routes?.[0]?.geometry.coordinates;
    if (line && line.length >= 2) return line;
    console.warn(
      `[simulation] Mapbox found no road for ${directionId}:`,
      json.message ?? res.status
    );
  } catch (err) {
    console.warn(`[simulation] Mapbox request failed for ${directionId}:`, err);
  }
  return null;
}

/**
 * The route's roads: stops in order per direction and the road through them. The road
 * comes from Mapbox (MAPBOX_PUBLIC_KEY); without it, or when Mapbox fails, bots drive
 * straight from stop to stop instead (`approximate`), so the simulation still runs.
 */
export async function loadSimulationRoads(
  routeId: string
): Promise<{ roads: RoadLine[]; approximate: boolean }> {
  const token = process.env.MAPBOX_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const [routeSnap, stopsSnap] = await Promise.all([
    adminDb.collection('routes').doc(routeId).get(),
    adminDb.collection('stop_points').where('routeId', '==', routeId).get(),
  ]);
  const directions = directionIds(routeSnap.data()?.directions);
  const stops = stopsSnap.docs
    .map((d) => d.data())
    .filter((s) => s.isActive !== false)
    .map((s) => ({ name: String(s.name), order: s.order as unknown, ...stopFields(s) }));

  if (stops.some((s) => typeof s.order !== 'number')) {
    throw new Error('Some stops on this route have no order yet, so the road is unknown.');
  }

  const roads: RoadLine[] = [];
  let approximate = false;
  for (const directionId of directions) {
    const ordered = stops
      .filter((s) => s.routeDirection === directionId)
      .sort((a, b) => (a.order as number) - (b.order as number))
      .filter(hasCoordinates)
      .map((s) => ({ name: s.name, lng: s.longitude, lat: s.latitude }));
    if (ordered.length < 2) continue;

    let line = await mapboxRoad(directionId, ordered, token);
    if (!line) {
      line = ordered.map((s): LngLat => [s.lng, s.lat]);
      approximate = true;
    }
    roads.push({ directionId, line, stops: ordered });
  }

  if (!roads.length) {
    throw new Error('This route needs at least two stops with a location in one direction.');
  }
  return { roads, approximate };
}
