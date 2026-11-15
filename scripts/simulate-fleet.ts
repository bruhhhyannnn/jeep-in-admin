/**
 * Simulation Script — bot jeeps driving the route, for demos and testing
 * (the same bots as the dashboard's "Simulate jeeps" panel; model in src/lib/fleet-simulation.ts)
 *
 * Each bot writes what the driver app writes: driver_locations/bot-0N with lat, long,
 * heading, speed (m/s), isSharing and updatedAt, every 5 s. Bots get their own docs —
 * jeepneys/sim-0N (plate SIM-0N, isBot: true) and driver_locations/bot-0N — so real
 * drivers and jeepneys are never touched.
 *
 *   npx tsx scripts/simulate-fleet.ts                                   # 4 bots for 60 min
 *   npx tsx scripts/simulate-fleet.ts --bots 5 --minutes 30 --flaky
 *   npx tsx scripts/simulate-fleet.ts --dry-run                         # simulate, write nothing
 *   npx tsx scripts/simulate-fleet.ts --stop                            # sharing off (after a hard kill)
 *   npx tsx scripts/simulate-fleet.ts --cleanup                         # delete the bot docs
 *
 *   --flaky: the last bot drops signal for 3 min every 10 min ("last seen" / "stopped sharing").
 *
 * Ctrl+C (or the time limit) turns sharing off for every bot, so they leave the map.
 * Firestore free tier is 20,000 writes a day: 4 bots every 5 s ≈ 2,900 writes an hour.
 * The Mapbox token is MAPBOX_PUBLIC_KEY in .env.local (same public token as the apps).
 */

import { join } from 'node:path';
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
  MAX_BOTS,
  SIMULATION_TICK_S,
  botId,
  botJeepneyId,
  buildRoadPath,
  describeBot,
  directionsUrl,
  placeBots,
  reading,
  step,
  type Bot,
  type LngLat,
  type RoadPath,
} from '../src/lib/fleet-simulation';
import { LAOAG_PAOAY, PAOAY_LAOAG } from './seed-stop-points';

// ─── CONFIGURE BEFORE RUNNING ───────────────────────────────────────────────
const ROUTE_ID = 'q2JCd9VCVuwhlFWfLais'; // Laoag–Batac–Paoay
const ORGANIZATION_ID = 'ITC';
const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string, fallback: number) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const BOTS = Math.min(MAX_BOTS, Math.max(1, option('bots', 4)));
const MINUTES = option('minutes', 60);
const DRY_RUN = flag('dry-run');
const FLAKY = flag('flaky');

config({ path: join(__dirname, '..', '.env.local'), quiet: true });
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN ?? process.env.MAPBOX_PUBLIC_KEY;

if (!getApps().length) {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

// ─── Route ───────────────────────────────────────────────────────────────────

type Stop = { name: string; order: number; lng: number; lat: number };

/** Stops per direction in order: live documents, or the seed lists while `order` isn't saved yet. */
async function loadStops(): Promise<Record<string, Stop[]>> {
  const snap = await db.collection('stop_points').where('routeId', '==', ROUTE_ID).get();
  const live = snap.docs.map((d) => d.data()).filter((s) => s.isActive !== false);
  const byDirection: Record<string, Stop[]> = {};

  if (live.length && live.every((s) => typeof s.order === 'number')) {
    for (const s of live) {
      const direction = String(s.routeDirection ?? s.directionId);
      (byDirection[direction] ??= []).push({
        name: s.name,
        order: s.order,
        lng: Number(s.longitude ?? s.long),
        lat: Number(s.latitude ?? s.lat),
      });
    }
  } else {
    console.log('⚠️  Stops have no `order` yet — using the seed lists.');
    console.log('   Run scripts/fix-commuter-data.ts --apply so the apps draw the same road.\n');
    for (const s of [...LAOAG_PAOAY, ...PAOAY_LAOAG]) {
      (byDirection[s.routeDirection] ??= []).push({
        name: s.name,
        order: s.order,
        lng: s.longitude,
        lat: s.latitude,
      });
    }
  }
  for (const stops of Object.values(byDirection)) stops.sort((a, b) => a.order - b.order);
  return byDirection;
}

async function roadPath(directionId: string, stops: Stop[]): Promise<RoadPath> {
  const json = (await (await fetch(directionsUrl(stops, MAPBOX_TOKEN!))).json()) as {
    routes?: { geometry: { coordinates: LngLat[] } }[];
    message?: string;
  };
  const line = json.routes?.[0]?.geometry.coordinates;
  if (!line) throw new Error(`No road for ${directionId}: ${json.message ?? 'no route'}`);
  return buildRoadPath({ directionId, line, stops });
}

// ─── Firestore ───────────────────────────────────────────────────────────────

async function createJeepneys() {
  const batch = db.batch();
  for (let n = 1; n <= BOTS; n++) {
    batch.set(
      db.collection('jeepneys').doc(botJeepneyId(n)),
      {
        plateNumber: `SIM-0${n}`,
        jeepneyNumber: `S0${n}`,
        organizationId: ORGANIZATION_ID,
        routeId: ROUTE_ID,
        assignedDriverId: botId(n),
        status: 'On route',
        isActive: true,
        isBot: true,
        createdAt: Timestamp.now(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
  await batch.commit();
}

async function writeLocations(bots: Bot[], paths: RoadPath[], now: number) {
  const batch = db.batch();
  let writes = 0;
  for (const bot of bots) {
    if (now < bot.offlineUntil) continue;
    const { n, directionId, ...position } = reading(bot, paths);
    batch.set(
      db.collection('driver_locations').doc(botId(n)),
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
    writes += 1;
  }
  if (writes) await batch.commit();
  return writes;
}

async function stopSharing() {
  const batch = db.batch();
  for (let n = 1; n <= MAX_BOTS; n++) {
    const ref = db.collection('driver_locations').doc(botId(n));
    if ((await ref.get()).exists) batch.update(ref, { isSharing: false });
  }
  await batch.commit();
}

async function cleanup() {
  const batch = db.batch();
  for (let n = 1; n <= MAX_BOTS; n++) {
    batch.delete(db.collection('jeepneys').doc(botJeepneyId(n)));
    batch.delete(db.collection('driver_locations').doc(botId(n)));
  }
  await batch.commit();
  console.log(
    `✅ Deleted jeepneys/${botJeepneyId(1)}…${botJeepneyId(MAX_BOTS)} and driver_locations/${botId(1)}…${botId(MAX_BOTS)}`
  );
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const status = (bots: Bot[], paths: RoadPath[], now: number) =>
  bots.map((b) => describeBot(b, paths, now)).join(' | ');

async function main() {
  if (flag('cleanup')) return cleanup();
  if (flag('stop')) {
    await stopSharing();
    console.log('✅ Sharing turned off for every bot.');
    return;
  }
  if (!MAPBOX_TOKEN) throw new Error('Add MAPBOX_PUBLIC_KEY (the public pk. token) to .env.local.');

  const stops = await loadStops();
  const paths = await Promise.all(
    [LAOAG_PAOAY[0].routeDirection, PAOAY_LAOAG[0].routeDirection].map((d) =>
      roadPath(d, stops[d] ?? [])
    )
  );
  paths.forEach((p) =>
    console.log(`🛣️  ${p.directionId}: ${(p.length / 1000).toFixed(1)} km, ${p.stops.length} stops`)
  );
  const bots = placeBots(paths, BOTS);
  const ticks = Math.round((MINUTES * 60) / SIMULATION_TICK_S);

  if (DRY_RUN) {
    // Simulated time, no waiting and no writes.
    let now = Date.now();
    for (let t = 0; t < ticks; t++) {
      now += SIMULATION_TICK_S * 1000;
      bots.forEach((b) => step(b, paths, now));
      bots.forEach((b) => reading(b, paths));
      if (t % 60 === 0)
        console.log(
          `  +${String(Math.round((t * SIMULATION_TICK_S) / 60)).padStart(3)} min  ${status(bots, paths, now)}`
        );
    }
    console.log(
      `\n📝 Dry run: ${ticks} ticks, would write ${ticks * BOTS} locations. Nothing was written.`
    );
    return;
  }

  console.log(
    `\n🚌 ${BOTS} bots for ${MINUTES} min — about ${Math.round((3600 / SIMULATION_TICK_S) * BOTS)} writes an hour. Ctrl+C to stop.\n`
  );
  await createJeepneys();

  let stopping = false;
  const finish = async (reason: string) => {
    if (stopping) return;
    stopping = true;
    await stopSharing();
    console.log(`\n✅ ${reason}: sharing turned off for every bot. Delete them with --cleanup.`);
    process.exit(0);
  };
  process.on('SIGINT', () => void finish('Stopped'));
  process.on('SIGTERM', () => void finish('Stopped'));

  let written = 0;
  for (let t = 0; t < ticks && !stopping; t++) {
    const now = Date.now();
    bots.forEach((b) => step(b, paths, now));
    if (FLAKY) {
      const last = bots[bots.length - 1];
      if (t > 0 && t % 120 === 0) last.offlineUntil = now + 3 * 60 * 1000; // every 10 min, for 3 min
    }
    written += await writeLocations(bots, paths, now);
    if (t % 6 === 0)
      console.log(`${new Date(now).toLocaleTimeString()}  ${status(bots, paths, now)}`);
    await new Promise((r) => setTimeout(r, SIMULATION_TICK_S * 1000));
  }
  console.log(`\n${written} locations written.`);
  await finish('Time limit reached');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Simulation failed:', err);
    process.exit(1);
  });
