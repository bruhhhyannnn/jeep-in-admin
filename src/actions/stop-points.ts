'use server';

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { serializeDoc } from '@/lib';
import type { StopPoint } from '@/types';
import type { StopPointFormData } from '@/lib';

const COL = 'stop_points';

export async function getStopPoints(routeId: string): Promise<StopPoint[]> {
  const snap = await adminDb
    .collection(COL)
    .where('routeId', '==', routeId)
    .orderBy('order', 'asc')
    .get();
  return snap.docs.map((d) => serializeDoc({ ...(d.data() as StopPoint), id: d.id }));
}

export async function getStopPoint(id: string): Promise<StopPoint | null> {
  const snap = await adminDb.collection(COL).doc(id).get();
  if (!snap.exists) return null;
  return serializeDoc({ ...(snap.data() as StopPoint), id: snap.id });
}

export async function createStopPoint(data: StopPointFormData, routeId: string): Promise<string> {
  const now = Timestamp.now();
  const ref = await adminDb.collection(COL).add({
    name: data.name,
    address: data.address ?? null,
    routeId,
    routeDirection: data.routeDirection,
    latitude: data.latitude,
    longitude: data.longitude,
    isActive: data.isActive,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateStopPoint(id: string, data: Partial<StopPointFormData>): Promise<void> {
  await adminDb
    .collection(COL)
    .doc(id)
    .update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function deleteStopPoint(id: string): Promise<void> {
  await adminDb.collection(COL).doc(id).delete();
}
