'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { WorkingHoursFormData, serializeDoc } from '@/lib';
import type { Route } from '@/types';

export async function getRoute(routeId: string): Promise<Route | null> {
  const snap = await adminDb.collection('routes').doc(routeId).get();
  if (!snap.exists) return null;
  return serializeDoc({ ...(snap.data() as Route), id: snap.id });
}

export async function getAllRoutes(): Promise<Route[]> {
  const snap = await adminDb.collection('routes').get();
  return snap.docs.map((d) => serializeDoc({ ...(d.data() as Route), id: d.id }));
}

export async function updateWorkingHours(
  routeId: string,
  data: WorkingHoursFormData
): Promise<void> {
  await adminDb
    .collection('routes')
    .doc(routeId)
    .update({
      workingHours: { start: data.start, end: data.end },
      updatedAt: FieldValue.serverTimestamp(),
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
