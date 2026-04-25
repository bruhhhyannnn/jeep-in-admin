'use server';

import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { AdminProfile, AdminCreateFormData } from '@/types';

const COL = 'admins';

export async function getAdmins(): Promise<AdminProfile[]> {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as AdminProfile), uid: d.id }));
}

export async function getAdmin(uid: string): Promise<AdminProfile | null> {
  const snap = await getDoc(doc(db, COL, uid));
  if (!snap.exists()) return null;
  return { ...(snap.data() as AdminProfile), uid: snap.id };
}

export async function createAdmin(data: AdminCreateFormData): Promise<string> {
  // 1. Create Firebase Auth user
  const userRecord = await adminAuth.createUser({
    email: data.email,
    password: data.password,
    displayName: `${data.firstName} ${data.lastName}`,
  });

  const uid = userRecord.uid;

  // 2. Set custom claim
  await adminAuth.setCustomUserClaims(uid, { role: 'admin' });

  const now = Timestamp.now();

  // 3. /users doc
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

  // 4. /admins doc
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
  await updateDoc(doc(db, COL, uid), { isActive: false, updatedAt: Timestamp.now() });
  // Immediate session revoke
  await adminAuth.revokeRefreshTokens(uid);
}

export async function deleteAdmin(uid: string): Promise<void> {
  await deleteDoc(doc(db, COL, uid));
  await adminDb.collection('users').doc(uid).delete();
  await adminAuth.deleteUser(uid);
}
