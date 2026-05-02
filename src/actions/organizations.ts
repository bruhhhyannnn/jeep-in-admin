'use server';

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { serializeDoc, type OrganizationFormData } from '@/lib';
import type { Organization } from '@/types';

const COL = 'organizations';

export async function getOrganizations(): Promise<Organization[]> {
  const snap = await adminDb.collection(COL).orderBy('name', 'asc').get();
  return snap.docs.map((d) => serializeDoc({ ...(d.data() as Organization), id: d.id }));
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const snap = await adminDb.collection(COL).doc(id).get();
  if (!snap.exists) return null;
  return serializeDoc({ ...(snap.data() as Organization), id: snap.id });
}

export async function createOrganization(data: OrganizationFormData): Promise<string> {
  const docId = data.shortName.toUpperCase();
  const now = Timestamp.now();
  await adminDb.collection(COL).doc(docId).set({
    name: data.name,
    shortName: data.shortName.toUpperCase(),
    routeId: data.routeId,
    isActive: data.isActive,
    createdAt: now,
    updatedAt: now,
  });
  return docId;
}

export async function updateOrganization(id: string, data: OrganizationFormData): Promise<void> {
  await adminDb.collection(COL).doc(id).update({
    name: data.name,
    routeId: data.routeId,
    isActive: data.isActive,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteOrganization(id: string): Promise<void> {
  await adminDb.collection(COL).doc(id).delete();
}
