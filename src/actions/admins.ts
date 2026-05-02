'use server';

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { AdminCreateFormData, serializeDoc } from '@/lib';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { AdminProfile } from '@/types';

const COL = 'admins';

export async function getAdmins(): Promise<AdminProfile[]> {
  const snap = await adminDb.collection(COL).orderBy('createdAt', 'desc').get();
  return snap.docs.map((d) => serializeDoc({ ...(d.data() as AdminProfile), uid: d.id }));
}

export async function getAdmin(uid: string): Promise<AdminProfile | null> {
  const snap = await adminDb.collection(COL).doc(uid).get();
  if (!snap.exists) return null;
  return serializeDoc({ ...(snap.data() as AdminProfile), uid: snap.id });
}

export async function createAdmin(data: AdminCreateFormData): Promise<string> {
  const userRecord = await adminAuth.createUser({
    email: data.email,
    password: data.password,
    displayName: `${data.firstName} ${data.lastName}`,
  });

  const uid = userRecord.uid;
  await adminAuth.setCustomUserClaims(uid, { role: 'admin' });

  const now = Timestamp.now();

  await adminDb
    .collection('users')
    .doc(uid)
    .set({
      uid,
      email: data.email,
      role: 'admin',
      displayName: `${data.firstName} ${data.lastName}`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

  await adminDb.collection(COL).doc(uid).set({
    uid,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    organizationId: data.organizationId,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  return uid;
}

export async function deactivateAdmin(uid: string): Promise<void> {
  await adminDb
    .collection(COL)
    .doc(uid)
    .update({ isActive: false, updatedAt: FieldValue.serverTimestamp() });
  await adminAuth.revokeRefreshTokens(uid);
  await adminAuth.updateUser(uid, { disabled: true });
}

export async function reactivateAdmin(uid: string): Promise<void> {
  await adminAuth.updateUser(uid, { disabled: false });
  await adminDb
    .collection(COL)
    .doc(uid)
    .update({ isActive: true, updatedAt: FieldValue.serverTimestamp() });
}

export async function reassignAdminOrg(uid: string, organizationId: string): Promise<void> {
  await adminDb
    .collection(COL)
    .doc(uid)
    .update({ organizationId, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteAdmin(uid: string): Promise<void> {
  await adminDb.collection(COL).doc(uid).delete();
  await adminDb.collection('users').doc(uid).delete();
  await adminAuth.deleteUser(uid);
}
