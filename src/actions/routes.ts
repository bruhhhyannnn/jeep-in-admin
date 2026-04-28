'use server';

import { doc, getDoc, getDocs, collection, updateDoc, Timestamp } from 'firebase/firestore';
import { db, WorkingHoursFormData, serializeDoc } from '@/lib';
import type { Route } from '@/types';
import {} from '@/lib';

export async function getRoute(routeId: string): Promise<Route | null> {
  const snap = await getDoc(doc(db, 'routes', routeId));
  if (!snap.exists()) return null;
  return serializeDoc({ ...(snap.data() as Route), id: snap.id });
}

export async function getAllRoutes(): Promise<Route[]> {
  const snap = await getDocs(collection(db, 'routes'));
  return snap.docs.map((d) => serializeDoc({ ...(d.data() as Route), id: d.id }));
}

export async function updateWorkingHours(
  routeId: string,
  data: WorkingHoursFormData
): Promise<void> {
  await updateDoc(doc(db, 'routes', routeId), {
    workingHours: { start: data.start, end: data.end },
    updatedAt: Timestamp.now(),
  });
}

/** Returns true if current time is within working hours for the given route */
export async function isWithinWorkingHours(routeId: string): Promise<boolean> {
  const route = await getRoute(routeId);
  if (!route) return false;

  const now = new Date();
  const [startH, startM] = route.workingHours.start.split(':').map(Number);
  const [endH, endM] = route.workingHours.end.split(':').map(Number);

  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  const current = now.getHours() * 60 + now.getMinutes();

  return current >= start && current <= end;
}
