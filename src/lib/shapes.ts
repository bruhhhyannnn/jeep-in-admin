/**
 * Firestore document shapes shared with the mobile apps, and the mapping to the
 * admin's types. The live data is written by the mobile apps, so the server actions
 * read through these helpers and write the same shape back.
 *
 *   routes.directions  [{ id: 'laoag_paoay', label: 'Toward Paoay', via: ['Laoag', …] }]
 *                      (older docs: ['laoag_paoay'])
 *   stop_points        lat, long, directionId, order
 *                      (older docs: latitude, longitude, routeDirection)
 */

export interface DirectionDoc {
  id: string;
  label: string;
  via: string[];
}

/** A direction's id, whether it is stored as `{ id, … }` or as a plain string. */
export function directionIdOf(direction: unknown): string {
  if (typeof direction === 'string') return direction;
  if (direction && typeof direction === 'object') {
    const id = (direction as { id?: unknown }).id;
    if (typeof id === 'string') return id;
  }
  return '';
}

/** A route's `directions` field as a list of ids. */
export function directionIds(directions: unknown): string[] {
  return Array.isArray(directions) ? directions.map(directionIdOf).filter(Boolean) : [];
}

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Direction ids from the route form → the `{ id, label, via }` docs the mobile apps read.
 * Directions that already exist keep their label and stops-via list.
 */
export function toDirectionDocs(ids: string[], existing: unknown = []): DirectionDoc[] {
  const kept = new Map<string, DirectionDoc>();
  if (Array.isArray(existing)) {
    for (const d of existing) {
      const id = directionIdOf(d);
      if (id && typeof d === 'object') kept.set(id, d as DirectionDoc);
    }
  }
  return ids.map((id) => {
    const prev = kept.get(id);
    if (prev) return prev;
    const via = id.split('_').filter(Boolean).map(titleCase);
    return { id, label: via.length ? `Toward ${via[via.length - 1]}` : id, via };
  });
}

/** Coordinates and direction of a stop_points doc, in either shape. */
export function stopFields(raw: Record<string, unknown>) {
  return {
    latitude: Number(raw.lat ?? raw.latitude),
    longitude: Number(raw.long ?? raw.longitude),
    routeDirection: String(raw.directionId ?? raw.routeDirection ?? ''),
  };
}

export const hasCoordinates = (p: { latitude: number; longitude: number }) =>
  Number.isFinite(p.latitude) && Number.isFinite(p.longitude);
