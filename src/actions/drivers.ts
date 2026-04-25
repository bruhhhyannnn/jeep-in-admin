'use server';

import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { DriverProfile, DriverCreateFormData, DriverEditFormData } from '@/types';

const COL = 'drivers';

export async function getDrivers(organizationId: string): Promise<DriverProfile[]> {
  const q = query(
    collection(db, COL),
    where('organizationId', '==', organizationId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as DriverProfile), uid: d.id }));
}

export async function getDriver(uid: string): Promise<DriverProfile | null> {
  const snap = await getDoc(doc(db, COL, uid));
  if (!snap.exists()) return null;
  return { ...(snap.data() as DriverProfile), uid: snap.id };
}

export async function createDriver(
  data: DriverCreateFormData,
  organizationId: string,
  routeId: string
): Promise<{ uid: string; tempPassword: string }> {
  // 1. Create Firebase Auth user via Admin SDK
  const userRecord = await adminAuth.createUser({
    email: data.email,
    password: data.password,
    displayName: `${data.firstName} ${data.lastName}`,
  });

  const uid = userRecord.uid;

  // 2. Set custom claim: role = driver
  await adminAuth.setCustomUserClaims(uid, { role: 'driver' });

  const now = Timestamp.now();

  // 3. Create /users/{uid}
  await adminDb
    .collection('users')
    .doc(uid)
    .set({
      uid,
      email: data.email,
      role: 'driver',
      displayName: `${data.firstName} ${data.lastName}`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

  // 4. Create /drivers/{uid}
  await adminDb.collection(COL).doc(uid).set({
    uid,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    organizationId,
    routeId,
    assignedJeepneyId: null,
    isActive: true,
    mustChangePassword: true,
    lastLocationUpdate: null,
    createdAt: now,
    updatedAt: now,
  });

  return { uid, tempPassword: data.password };
}

export async function updateDriver(uid: string, data: Partial<DriverEditFormData>): Promise<void> {
  await updateDoc(doc(db, COL, uid), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deactivateDriver(uid: string): Promise<void> {
  const now = Timestamp.now();
  // Mark inactive and unassign jeepney
  const driverSnap = await getDoc(doc(db, COL, uid));
  if (driverSnap.exists()) {
    const driver = driverSnap.data() as DriverProfile;
    // If assigned to a jeepney, clear that assignment too
    if (driver.assignedJeepneyId) {
      await updateDoc(doc(db, 'jeepneys', driver.assignedJeepneyId), {
        assignedDriverId: null,
        updatedAt: now,
      });
    }
  }

  await updateDoc(doc(db, COL, uid), {
    isActive: false,
    assignedJeepneyId: null,
    updatedAt: now,
  });

  // Revoke Firebase Auth session (immediate kick-out)
  await adminAuth.revokeRefreshTokens(uid);
}

export async function deleteDriver(uid: string): Promise<void> {
  // Remove from Firestore
  await deleteDoc(doc(db, COL, uid));
  await adminDb.collection('users').doc(uid).delete();

  // Delete Firebase Auth account
  await adminAuth.deleteUser(uid);
}

export async function assignJeepney(driverUid: string, jeepneyId: string): Promise<void> {
  const now = Timestamp.now();

  // Clear old assignment on previous jeepney if any
  const driverSnap = await getDoc(doc(db, COL, driverUid));
  if (driverSnap.exists()) {
    const driver = driverSnap.data() as DriverProfile;
    if (driver.assignedJeepneyId && driver.assignedJeepneyId !== jeepneyId) {
      await updateDoc(doc(db, 'jeepneys', driver.assignedJeepneyId), {
        assignedDriverId: null,
        updatedAt: now,
      });
    }
  }

  // Assign driver → jeepney
  await updateDoc(doc(db, COL, driverUid), { assignedJeepneyId: jeepneyId, updatedAt: now });
  // Assign jeepney → driver
  await updateDoc(doc(db, 'jeepneys', jeepneyId), { assignedDriverId: driverUid, updatedAt: now });
}

export async function unassignJeepney(driverUid: string, jeepneyId: string): Promise<void> {
  const now = Timestamp.now();
  await updateDoc(doc(db, COL, driverUid), { assignedJeepneyId: null, updatedAt: now });
  await updateDoc(doc(db, 'jeepneys', jeepneyId), { assignedDriverId: null, updatedAt: now });
}
