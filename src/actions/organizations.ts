'use server';

import { adminDb } from '@/lib/firebase-admin';
import { serializeDoc } from '@/lib';
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
