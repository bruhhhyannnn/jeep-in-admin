'use server';

import { collection, doc, getDocs, getDoc, orderBy, query } from 'firebase/firestore';
import { db, serializeDoc } from '@/lib';
import type { Organization } from '@/types';

const COL = 'organizations';

export async function getOrganizations(): Promise<Organization[]> {
  const q = query(collection(db, COL), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => serializeDoc({ ...(d.data() as Organization), id: d.id }));
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return serializeDoc({ ...(snap.data() as Organization), id: snap.id });
}
