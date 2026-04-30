'use server';

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { JeepneyFormData, serializeDoc } from '@/lib';
import type { Jeepney } from '@/types';

const COL = 'jeepneys';

export async function getJeepneys(organizationId: string): Promise<Jeepney[]> {
  const snap = await adminDb
    .collection(COL)
    .where('organizationId', '==', organizationId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => serializeDoc({ ...(d.data() as Jeepney), id: d.id }));
}

export async function getJeepney(id: string): Promise<Jeepney | null> {
  const snap = await adminDb.collection(COL).doc(id).get();
  if (!snap.exists) return null;
  return serializeDoc({ ...(snap.data() as Jeepney), id: snap.id });
}

export async function getUnassignedJeepneys(organizationId: string): Promise<Jeepney[]> {
  const snap = await adminDb
    .collection(COL)
    .where('organizationId', '==', organizationId)
    .where('assignedDriverId', '==', null)
    .where('isActive', '==', true)
    .get();
  return snap.docs.map((d) => serializeDoc({ ...(d.data() as Jeepney), id: d.id }));
}

export async function createJeepney(
  data: JeepneyFormData,
  organizationId: string,
  routeId: string
): Promise<string> {
  const now = Timestamp.now();
  const ref = await adminDb.collection(COL).add({
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
  await adminDb
    .collection(COL)
    .doc(id)
    .update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function deleteJeepney(id: string): Promise<void> {
  // If a driver is assigned, clear the assignment first
  const snap = await adminDb.collection(COL).doc(id).get();
  if (snap.exists) {
    const jeepney = snap.data() as Jeepney;
    if (jeepney.assignedDriverId) {
      await adminDb.collection('drivers').doc(jeepney.assignedDriverId).update({
        assignedJeepneyId: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
  await adminDb.collection(COL).doc(id).delete();
}
