'use server';

import { cookies } from 'next/headers';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { loadSimulationRoads } from '@/lib/simulation-roads';
import { MAX_BOTS, botId, botJeepneyId, type RoadLine } from '@/lib/fleet-simulation';

/**
 * Bot jeeps for demos — the dashboard's "Simulate jeeps" panel. The browser tab moves
 * the bots (src/hooks/use-fleet-simulation.ts) and these actions write them with the
 * Admin SDK, exactly as the driver app would: jeepneys/sim-0N and driver_locations/bot-0N.
 * Real drivers and jeepneys are never touched. Super admins only.
 */

async function requireSuperAdmin() {
  const session = (await cookies()).get('jeep-in-session')?.value;
  // Expired, revoked or forged sessions all get the same plain answer.
  const decoded = session
    ? await adminAuth.verifySessionCookie(session, true).catch(() => null)
    : null;
  if (!decoded) throw new Error('Sign in again to run the simulation.');
  if (decoded.role !== 'super_admin') {
    throw new Error('Only super admins can run the simulation.');
  }
}

/** The route's roads for the bots (see src/lib/simulation-roads.ts). */
export async function getSimulationRoads(
  routeId: string
): Promise<{ roads: RoadLine[]; approximate: boolean }> {
  await requireSuperAdmin();
  return loadSimulationRoads(routeId);
}

/** Creates (or moves) bot units SIM-01… on the organization's route; extra ones are removed. */
export async function startSimulation(organizationId: string, routeId: string, count: number) {
  await requireSuperAdmin();
  const bots = z.number().int().min(1).max(MAX_BOTS).parse(count);
  const now = Timestamp.now();
  const batch = adminDb.batch();

  for (let n = 1; n <= MAX_BOTS; n++) {
    const jeepRef = adminDb.collection('jeepneys').doc(botJeepneyId(n));
    if (n <= bots) {
      batch.set(
        jeepRef,
        {
          plateNumber: `SIM-0${n}`,
          jeepneyNumber: `S0${n}`,
          organizationId,
          routeId,
          assignedDriverId: botId(n),
          status: 'On route',
          isActive: true,
          isBot: true,
          createdAt: now,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      batch.delete(jeepRef);
      batch.delete(adminDb.collection('driver_locations').doc(botId(n)));
    }
  }
  await batch.commit();
}

const readingsSchema = z
  .array(
    z.object({
      n: z.number().int().min(1).max(MAX_BOTS),
      // Ilocos Norte and around; anything else is a bug, not a jeep.
      lat: z.number().min(17).max(19),
      long: z.number().min(119.5).max(121.5),
      heading: z.number().min(0).max(360),
      speed: z.number().min(0).max(40),
      directionId: z.string().min(1).max(64).nullable(),
    })
  )
  .max(MAX_BOTS);

/** One tick: the bots' positions, written as the driver app writes them. */
export async function writeSimulatedLocations(readings: z.input<typeof readingsSchema>) {
  await requireSuperAdmin();
  const rows = readingsSchema.parse(readings);
  const batch = adminDb.batch();
  for (const { n, directionId, ...position } of rows) {
    batch.set(
      adminDb.collection('driver_locations').doc(botId(n)),
      {
        driverId: botId(n),
        ...position,
        directionId: directionId ?? FieldValue.delete(),
        isSharing: true,
        isBot: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
  await batch.commit();
}

/** Turns sharing off for every bot, so they leave every map. */
export async function stopSimulation() {
  await requireSuperAdmin();
  const refs = Array.from({ length: MAX_BOTS }, (_, i) =>
    adminDb.collection('driver_locations').doc(botId(i + 1))
  );
  const snaps = await adminDb.getAll(...refs);
  const batch = adminDb.batch();
  snaps.filter((s) => s.exists).forEach((s) => batch.update(s.ref, { isSharing: false }));
  await batch.commit();
}

/** Deletes the bot units and their locations. */
export async function removeSimulation() {
  await requireSuperAdmin();
  const batch = adminDb.batch();
  for (let n = 1; n <= MAX_BOTS; n++) {
    batch.delete(adminDb.collection('jeepneys').doc(botJeepneyId(n)));
    batch.delete(adminDb.collection('driver_locations').doc(botId(n)));
  }
  await batch.commit();
}

/** How many bot units exist and how many are still on the map. */
export async function getSimulationStatus(): Promise<{ units: number; sharing: number }> {
  await requireSuperAdmin();
  const ids = Array.from({ length: MAX_BOTS }, (_, i) => i + 1);
  const [jeeps, locations] = await Promise.all([
    adminDb.getAll(...ids.map((n) => adminDb.collection('jeepneys').doc(botJeepneyId(n)))),
    adminDb.getAll(...ids.map((n) => adminDb.collection('driver_locations').doc(botId(n)))),
  ]);
  return {
    units: jeeps.filter((s) => s.exists).length,
    sharing: locations.filter((s) => s.exists && s.data()?.isSharing === true).length,
  };
}
