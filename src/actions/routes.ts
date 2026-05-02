'use server';

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { WorkingHoursFormData, RouteFormData, serializeDoc } from '@/lib';
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

export async function createRoute(data: RouteFormData): Promise<string> {
  const now = Timestamp.now();
  const ref = await adminDb.collection('routes').add({
    name: data.name,
    description: data.description ?? null,
    directions: data.directions,
    isActive: data.isActive,
    workingHours: { start: data.workingHours.start, end: data.workingHours.end },
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateRoute(routeId: string, data: RouteFormData): Promise<void> {
  await adminDb
    .collection('routes')
    .doc(routeId)
    .update({
      name: data.name,
      description: data.description ?? null,
      directions: data.directions,
      isActive: data.isActive,
      workingHours: { start: data.workingHours.start, end: data.workingHours.end },
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function deleteRoute(routeId: string): Promise<void> {
  const batch = adminDb.batch();

  // Stop points
  const stopsSnap = await adminDb.collection('stop_points').where('routeId', '==', routeId).get();
  stopsSnap.docs.forEach((d) => batch.delete(d.ref));

  // Fare guide entries
  const fareSnap = await adminDb.collection('fare_guide').where('routeId', '==', routeId).get();
  fareSnap.docs.forEach((d) => batch.delete(d.ref));

  // Unassign organizations that reference this route
  const orgsSnap = await adminDb.collection('organizations').where('routeId', '==', routeId).get();
  orgsSnap.docs.forEach((d) =>
    batch.update(d.ref, { routeId: null, updatedAt: FieldValue.serverTimestamp() })
  );

  // Delete drivers on this route (no route reassignment UI exists)
  const driversSnap = await adminDb.collection('drivers').where('routeId', '==', routeId).get();
  const driverUids = driversSnap.docs.map((d) => d.id);
  driversSnap.docs.forEach((d) => {
    batch.delete(d.ref);
    batch.delete(adminDb.collection('users').doc(d.id));
  });

  // Route itself
  batch.delete(adminDb.collection('routes').doc(routeId));

  await batch.commit();

  // Delete Firebase Auth accounts for deleted drivers
  await Promise.all(driverUids.map((uid) => adminAuth.deleteUser(uid).catch(() => null)));
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
