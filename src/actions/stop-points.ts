'use server';

import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib';
import type { StopPoint } from '@/types';

const COL = 'stop_points';

export async function getStopPoints(routeId: string): Promise<StopPoint[]> {
  const q = query(
    collection(db, COL),
    where('routeId', '==', routeId),
    where('isActive', '==', true),
    orderBy('order', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as StopPoint), id: d.id }));
}
