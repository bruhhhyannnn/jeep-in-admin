'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { StopPoint } from '@/types';

const COL = 'stop_points';

export async function getStopPoints(routeId: string): Promise<StopPoint[]> {
  const snap = await adminDb
    .collection(COL)
    .where('routeId', '==', routeId)
    .where('isActive', '==', true)
    .orderBy('order', 'asc')
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as StopPoint), id: d.id }));
}
