'use server';

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { DriverCreateFormData, serializeDoc } from '@/lib';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { DriverProfile } from '@/types';

const COL = 'drivers';

export async function getDrivers(organizationId: string): Promise<DriverProfile[]> {
  const snap = await adminDb
    .collection(COL)
    .where('organizationId', '==', organizationId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => serializeDoc({ ...(d.data() as DriverProfile), uid: d.id }));
}

export async function getDriver(uid: string): Promise<DriverProfile | null> {
  const snap = await adminDb.collection(COL).doc(uid).get();
  if (!snap.exists) return null;
  return serializeDoc({ ...(snap.data() as DriverProfile), uid: snap.id });
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

export async function deactivateDriver(uid: string): Promise<void> {
  // Mark inactive and unassign jeepney
  const snap = await adminDb.collection(COL).doc(uid).get();
  if (snap.exists) {
    const driver = snap.data() as DriverProfile;

    // If assigned to a jeepney, clear that assignment too
    if (driver.assignedJeepneyId) {
      await adminDb.collection('jeepneys').doc(driver.assignedJeepneyId).update({
        assignedDriverId: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
  await adminDb.collection(COL).doc(uid).update({
    isActive: false,
    assignedJeepneyId: null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Revoke Firebase Auth session (immediate kick-out)
  await adminAuth.revokeRefreshTokens(uid);
}

export async function reactivateDriver(uid: string): Promise<void> {
  await adminAuth.updateUser(uid, { disabled: false });
  await adminDb
    .collection(COL)
    .doc(uid)
    .update({ isActive: true, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteDriver(uid: string): Promise<void> {
  // Clear jeepney assignment if any
  const snap = await adminDb.collection(COL).doc(uid).get();
  if (snap.exists) {
    const driver = snap.data() as DriverProfile;
    if (driver.assignedJeepneyId) {
      await adminDb.collection('jeepneys').doc(driver.assignedJeepneyId).update({
        assignedDriverId: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  // Remove from Firestore
  await adminDb.collection(COL).doc(uid).delete();
  await adminDb.collection('users').doc(uid).delete();

  // Delete Firebase Auth account
  await adminAuth.deleteUser(uid);
}

export async function assignJeepney(driverUid: string, jeepneyId: string): Promise<void> {
  // Clear old assignment on previous jeepney if any
  const snap = await adminDb.collection(COL).doc(driverUid).get();
  if (snap.exists) {
    const driver = snap.data() as DriverProfile;
    if (driver.assignedJeepneyId && driver.assignedJeepneyId !== jeepneyId) {
      await adminDb.collection('jeepneys').doc(driver.assignedJeepneyId).update({
        assignedDriverId: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  // Assign driver → jeepney
  await adminDb.collection(COL).doc(driverUid).update({
    assignedJeepneyId: jeepneyId,
    updatedAt: FieldValue.serverTimestamp(),
  });
  // Assign jeepney → driver
  await adminDb.collection('jeepneys').doc(jeepneyId).update({
    assignedDriverId: driverUid,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function unassignJeepney(driverUid: string, jeepneyId: string): Promise<void> {
  await adminDb.collection(COL).doc(driverUid).update({
    assignedJeepneyId: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await adminDb.collection('jeepneys').doc(jeepneyId).update({
    assignedDriverId: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
