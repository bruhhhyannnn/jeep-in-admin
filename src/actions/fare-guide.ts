'use server';

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { FareGuideFormData, serializeDoc } from '@/lib';
import type { FareGuide } from '@/types';

const COL = 'fare_guide';

export async function getFareGuide(routeId?: string): Promise<FareGuide[]> {
  const q = routeId
    ? adminDb.collection(COL).where('routeId', '==', routeId).orderBy('distanceKm', 'asc')
    : adminDb.collection(COL).orderBy('distanceKm', 'asc');

  const snap = await q.get();
  return snap.docs.map((d) => serializeDoc({ ...(d.data() as FareGuide), id: d.id }));
}

export async function createFareEntry(data: FareGuideFormData): Promise<string> {
  const now = Timestamp.now();
  const ref = await adminDb.collection(COL).add({
    routeId: data.routeId,
    stopPointName: data.stopPointName,
    distanceKm: data.distanceKm,
    regularFare: data.regularFare,
    discountedFare: data.discountedFare,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateFareEntry(id: string, data: Partial<FareGuideFormData>): Promise<void> {
  await adminDb
    .collection(COL)
    .doc(id)
    .update({ ...data, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteFareEntry(id: string): Promise<void> {
  await adminDb.collection(COL).doc(id).delete();
}
