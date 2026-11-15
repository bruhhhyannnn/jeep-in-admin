'use server';

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { serializeDoc, stopFields } from '@/lib';
import type { StopPoint } from '@/types';
import type { StopPointFormData } from '@/lib';

const COL = 'stop_points';

/**
 * stop_points is shared with the mobile apps, which store `lat`, `long` and `directionId`.
 * Reads map either shape to the admin's StopPoint; writes use the apps' shape.
 */
function toStopPoint(id: string, raw: Record<string, unknown>): StopPoint {
  return serializeDoc({ ...raw, ...stopFields(raw), id } as unknown as StopPoint &
    Record<string, unknown>);
}

export async function getStopPoints(routeId: string): Promise<StopPoint[]> {
  const snap = await adminDb
    .collection(COL)
    .where('routeId', '==', routeId)
    .orderBy('name', 'asc')
    .get();
  return snap.docs.map((d) => toStopPoint(d.id, d.data()));
}

export async function getStopPoint(id: string): Promise<StopPoint | null> {
  const snap = await adminDb.collection(COL).doc(id).get();
  if (!snap.exists) return null;
  return toStopPoint(snap.id, snap.data()!);
}

/** New stops go to the end of their direction, so the apps' road through the stops stays intact. */
async function nextOrder(routeId: string, directionId: string): Promise<number> {
  const snap = await adminDb.collection(COL).where('routeId', '==', routeId).get();
  const orders = snap.docs
    .map((d) => d.data())
    .filter((s) => stopFields(s).routeDirection === directionId && typeof s.order === 'number')
    .map((s) => s.order as number);
  return orders.length ? Math.max(...orders) + 1 : 1;
}

export async function createStopPoint(data: StopPointFormData, routeId: string): Promise<string> {
  const now = Timestamp.now();
  const ref = await adminDb.collection(COL).add({
    name: data.name,
    address: data.address ?? null,
    routeId,
    directionId: data.routeDirection,
    lat: data.latitude,
    long: data.longitude,
    order: await nextOrder(routeId, data.routeDirection),
    isActive: data.isActive,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateStopPoint(id: string, data: Partial<StopPointFormData>): Promise<void> {
  const { routeDirection, latitude, longitude, ...rest } = data;
  await adminDb
    .collection(COL)
    .doc(id)
    .update({
      ...rest,
      ...(routeDirection !== undefined && { directionId: routeDirection }),
      ...(latitude !== undefined && { lat: latitude }),
      ...(longitude !== undefined && { long: longitude }),
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function deleteStopPoint(id: string): Promise<void> {
  await adminDb.collection(COL).doc(id).delete();
}
