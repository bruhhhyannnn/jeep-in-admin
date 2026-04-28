'use server';

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db, FareGuideFormData, serializeDoc } from '@/lib';
import type { FareGuide } from '@/types';

const COL = 'fare_guide';

export async function getFareGuide(routeId?: string): Promise<FareGuide[]> {
  const q = routeId
    ? query(collection(db, COL), where('routeId', '==', routeId), orderBy('distanceKm', 'asc'))
    : query(collection(db, COL), orderBy('distanceKm', 'asc'));

  const snap = await getDocs(q);
  return snap.docs.map((d) => serializeDoc({ ...(d.data() as FareGuide), id: d.id }));
}

export async function createFareEntry(data: FareGuideFormData): Promise<string> {
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, COL), {
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
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: Timestamp.now() });
}

export async function deleteFareEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
