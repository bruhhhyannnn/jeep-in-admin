'use server';

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
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
  const batch = adminDb.batch();

  // Jeepneys
  const jeepneysSnap = await adminDb.collection('jeepneys').where('organizationId', '==', id).get();
  jeepneysSnap.docs.forEach((d) => batch.delete(d.ref));

  // Audit logs
  const logsSnap = await adminDb.collection('audit_logs').where('organizationId', '==', id).get();
  logsSnap.docs.forEach((d) => batch.delete(d.ref));

  // Admins — collect UIDs for Auth deletion
  const adminsSnap = await adminDb.collection('admins').where('organizationId', '==', id).get();
  const adminUids = adminsSnap.docs.map((d) => d.id);
  adminsSnap.docs.forEach((d) => {
    batch.delete(d.ref);
    batch.delete(adminDb.collection('users').doc(d.id));
  });

  // Drivers — collect UIDs for Auth deletion
  const driversSnap = await adminDb.collection('drivers').where('organizationId', '==', id).get();
  const driverUids = driversSnap.docs.map((d) => d.id);
  driversSnap.docs.forEach((d) => {
    batch.delete(d.ref);
    batch.delete(adminDb.collection('users').doc(d.id));
    batch.delete(adminDb.collection('driver_locations').doc(d.id));
  });

  // Organization itself
  batch.delete(adminDb.collection(COL).doc(id));

  await batch.commit();

  // Delete Firebase Auth accounts (outside batch — Auth API is separate)
  await Promise.all([
    ...adminUids.map((uid) => adminAuth.deleteUser(uid).catch(() => null)),
    ...driverUids.map((uid) => adminAuth.deleteUser(uid).catch(() => null)),
  ]);
}
