'use server';

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db, JeepneyFormData, serializeDoc } from '@/lib';
import type { Jeepney } from '@/types';

const COL = 'jeepneys';

export async function getJeepneys(organizationId: string): Promise<Jeepney[]> {
  console.log('TEST');
  const q = query(
    collection(db, COL),
    where('organizationId', '==', organizationId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => serializeDoc({ ...(d.data() as Jeepney), id: d.id }));
}

export async function getJeepney(id: string): Promise<Jeepney | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return serializeDoc({ ...(snap.data() as Jeepney), id: snap.id });
}

export async function getUnassignedJeepneys(organizationId: string): Promise<Jeepney[]> {
  const q = query(
    collection(db, COL),
    where('organizationId', '==', organizationId),
    where('assignedDriverId', '==', null),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => serializeDoc({ ...(d.data() as Jeepney), id: d.id }));
}

export async function createJeepney(
  data: JeepneyFormData,
  organizationId: string,
  routeId: string
): Promise<string> {
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, COL), {
    plateNumber: data.plateNumber,
    jeepneyNumber: data.jeepneyNumber,
    organizationId,
    routeId,
    assignedDriverId: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateJeepney(id: string, data: Partial<JeepneyFormData>): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteJeepney(id: string): Promise<void> {
  // If a driver is assigned, clear the assignment first
  const snap = await getDoc(doc(db, COL, id));
  if (snap.exists()) {
    const jeepney = snap.data() as Jeepney;
    if (jeepney.assignedDriverId) {
      await updateDoc(doc(db, 'drivers', jeepney.assignedDriverId), {
        assignedJeepneyId: null,
        updatedAt: Timestamp.now(),
      });
    }
  }
  await deleteDoc(doc(db, COL, id));
}
