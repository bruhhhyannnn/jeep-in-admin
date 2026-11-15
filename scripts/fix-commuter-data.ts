/**
 * Fix Script — commuter data
 *
 *   1. stop_points: write `order`, from the lists in seed-stop-points.ts (the seed never saved it)
 *   2. routes: deactivate the "test" route (the apps pick the first active route)
 *   3. jeepneys: point jeepneys whose routeId no longer exists to their organization's route
 *   4. driver_locations: turn off sharing left on by an old app version (no `updatedAt`)
 *
 * Dry run (default) — changes nothing; writes scripts/backups/fix-plan.json and a map
 * preview per direction (the road check uses MAPBOX_PUBLIC_KEY from .env.local):
 *   npx tsx scripts/fix-commuter-data.ts
 * Apply exactly the reviewed plan:
 *   npx tsx scripts/fix-commuter-data.ts --apply
 *
 * Back up first: npx tsx scripts/backup-collections.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { LAOAG_PAOAY, PAOAY_LAOAG, type StopSeed } from './seed-stop-points';

// ─── CONFIGURE BEFORE RUNNING ───────────────────────────────────────────────
const ROUTE_ID = 'q2JCd9VCVuwhlFWfLais'; // Laoag–Batac–Paoay
const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';
// ─────────────────────────────────────────────────────────────────────────────

const APPLY = process.argv.includes('--apply');
config({ path: join(__dirname, '..', '.env.local'), quiet: true });
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN ?? process.env.MAPBOX_PUBLIC_KEY;
const BACKUP_DIR = join(__dirname, 'backups');
const PLAN_FILE = join(BACKUP_DIR, 'fix-plan.json');

if (!getApps().length) {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

type Change = {
  collection: string;
  id: string;
  label: string;
  /** Fields as they are now, for the review. */
  before: Record<string, unknown>;
  set: Record<string, unknown>;
  /** Also bump updatedAt, as the admin's server actions do. */
  touch: boolean;
};

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Straight-line distance in metres. */
function metres(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

type LiveStop = {
  id: string;
  name: string;
  direction: string;
  lat: number;
  lng: number;
  order: unknown;
};

/** Pairs each seed entry with the live stop of the same direction and name (nearest if several). */
function matchStops(seeds: StopSeed[], live: LiveStop[]) {
  const used = new Set<string>();
  const matched: { seed: StopSeed; stop: LiveStop; offsetM: number }[] = [];
  const missing: StopSeed[] = [];

  for (const seed of seeds) {
    const candidates = live.filter(
      (s) =>
        !used.has(s.id) &&
        s.direction === seed.routeDirection &&
        normalize(s.name) === normalize(seed.name)
    );
    if (!candidates.length) {
      missing.push(seed);
      continue;
    }
    const best = candidates
      .map((s) => ({ s, d: metres(s.lat, s.lng, seed.latitude, seed.longitude) }))
      .sort((a, b) => a.d - b.d)[0];
    used.add(best.s.id);
    matched.push({ seed, stop: best.s, offsetM: Math.round(best.d) });
  }
  return { matched, missing, used };
}

/** Drives the stops in the proposed order and flags legs that take a long way round. */
async function checkOnRoad(direction: string, stops: LiveStop[]) {
  if (!MAPBOX_TOKEN) {
    console.log(`  ⚠️  MAPBOX_TOKEN not set — skipped the road check for ${direction}`);
    return;
  }
  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';');
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?overview=simplified&geometries=polyline&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    routes?: { distance: number; geometry: string; legs: { distance: number }[] }[];
    message?: string;
  };
  const route = json.routes?.[0];
  if (!route) {
    console.log(`  ⚠️  Road check failed for ${direction}: ${json.message ?? res.status}`);
    return;
  }

  console.log(`\n  Road check ${direction}: ${(route.distance / 1000).toFixed(1)} km end to end`);
  route.legs.forEach((leg, i) => {
    const a = stops[i];
    const b = stops[i + 1];
    const straight = metres(a.lat, a.lng, b.lat, b.lng);
    const ratio = straight > 50 ? leg.distance / straight : 1;
    const flag = ratio > 2.5 && leg.distance > 500 ? '  ⚠️ long way round' : '';
    console.log(
      `    ${String(i + 1).padStart(2)} → ${String(i + 2).padEnd(2)} ${(leg.distance / 1000).toFixed(2).padStart(6)} km  ${a.name} → ${b.name}${flag}`
    );
  });

  // Numbered pins on the driven path, to check the order by eye.
  const pins = stops
    .map(
      (s, i) =>
        `pin-s-${i + 1}+${i === 0 ? '12b886' : '0b1b33'}(${s.lng.toFixed(5)},${s.lat.toFixed(5)})`
    )
    .join(',');
  const overlay = `path-4+1670e0-0.85(${encodeURIComponent(route.geometry)}),${pins}`;
  const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlay}/auto/700x1000@2x?padding=50&access_token=${MAPBOX_TOKEN}`;
  const image = await fetch(imageUrl);
  if (image.ok) {
    const file = join(BACKUP_DIR, `preview-${direction}.png`);
    writeFileSync(file, Buffer.from(await image.arrayBuffer()));
    console.log(`  🗺️  Preview: ${file}`);
  } else {
    console.log(`  ⚠️  Preview image failed: ${image.status} ${await image.text()}`);
  }
}

async function plan(): Promise<Change[]> {
  const [routesSnap, stopsSnap, jeepsSnap, orgsSnap, locationsSnap] = await Promise.all([
    db.collection('routes').get(),
    db.collection('stop_points').where('routeId', '==', ROUTE_ID).get(),
    db.collection('jeepneys').get(),
    db.collection('organizations').get(),
    db.collection('driver_locations').get(),
  ]);
  const changes: Change[] = [];

  // 1. Stop order.
  const live: LiveStop[] = stopsSnap.docs.map((d) => {
    const s = d.data();
    return {
      id: d.id,
      name: String(s.name ?? ''),
      direction: String(s.routeDirection ?? s.directionId ?? ''),
      lat: Number(s.latitude ?? s.lat),
      lng: Number(s.longitude ?? s.long ?? s.lng),
      order: s.order,
    };
  });
  console.log(`\n1. Stop order — ${live.length} stops on route ${ROUTE_ID}`);
  const usedIds = new Set<string>();
  for (const seeds of [LAOAG_PAOAY, PAOAY_LAOAG]) {
    const direction = seeds[0].routeDirection;
    const { matched, missing, used } = matchStops(seeds, live);
    used.forEach((id) => usedIds.add(id));
    console.log(
      `\n  ${direction}: ${matched.length} matched, ${missing.length} seed stops not found`
    );
    for (const { seed, stop, offsetM } of matched.sort((a, b) => a.seed.order - b.seed.order)) {
      const moved = offsetM > 100 ? `  ⚠️ ${offsetM} m from the seed position` : '';
      console.log(`    ${String(seed.order).padStart(2)}. ${stop.name}${moved}`);
      if (stop.order !== seed.order) {
        changes.push({
          collection: 'stop_points',
          id: stop.id,
          label: `${direction} #${seed.order} ${stop.name}`,
          before: { order: stop.order ?? null },
          set: { order: seed.order },
          touch: true,
        });
      }
    }
    missing.forEach((s) => console.log(`    ❓ not in Firestore: #${s.order} ${s.name}`));
    await checkOnRoad(
      direction,
      matched.sort((a, b) => a.seed.order - b.seed.order).map((m) => m.stop)
    );
  }
  const extra = live.filter((s) => !usedIds.has(s.id));
  extra.forEach((s) =>
    console.log(
      `  ❓ in Firestore but not in the seed lists: [${s.direction}] ${s.name} — left as is`
    )
  );

  // 2. The "test" route.
  const routeIds = new Set(routesSnap.docs.map((d) => d.id));
  console.log('\n2. Routes');
  for (const d of routesSnap.docs) {
    const r = d.data();
    if (String(r.name).trim().toLowerCase() === 'test' && r.isActive !== false) {
      console.log(`  ${r.name} (${d.id}): isActive true → false`);
      changes.push({
        collection: 'routes',
        id: d.id,
        label: `route "${r.name}"`,
        before: { isActive: r.isActive ?? true },
        set: { isActive: false },
        touch: true,
      });
    }
  }

  // 3. Jeepneys pointing at a deleted route.
  const orgRoute = new Map(
    orgsSnap.docs.map((d) => [d.id, d.data().routeId as string | undefined])
  );
  console.log('\n3. Jeepneys');
  for (const d of jeepsSnap.docs) {
    const j = d.data();
    if (routeIds.has(j.routeId)) continue;
    const fix = orgRoute.get(j.organizationId);
    if (fix && routeIds.has(fix)) {
      console.log(
        `  ${j.plateNumber}: routeId ${j.routeId} (deleted) → ${fix} (organization ${j.organizationId})`
      );
      changes.push({
        collection: 'jeepneys',
        id: d.id,
        label: `jeepney ${j.plateNumber}`,
        before: { routeId: j.routeId ?? null },
        set: { routeId: fix },
        touch: true,
      });
    } else {
      console.log(
        `  ${j.plateNumber}: routeId ${j.routeId} (deleted), organization ${j.organizationId} has no route — left as is`
      );
    }
  }

  // 4. Sharing stuck on.
  console.log('\n4. Driver locations');
  for (const d of locationsSnap.docs) {
    const l = d.data();
    if (l.isSharing === true && l.updatedAt == null) {
      console.log(`  ${d.id}: isSharing true with no updatedAt → false`);
      changes.push({
        collection: 'driver_locations',
        id: d.id,
        label: `driver location ${d.id.slice(0, 6)}…`,
        before: { isSharing: true },
        set: { isSharing: false },
        // The driver app's own "stop sharing" writes only isSharing.
        touch: false,
      });
    }
  }

  return changes;
}

async function apply() {
  if (!existsSync(PLAN_FILE)) {
    console.error(
      '❌ No reviewed plan. Run the dry run first: npx tsx scripts/fix-commuter-data.ts'
    );
    process.exit(1);
  }
  const changes = JSON.parse(readFileSync(PLAN_FILE, 'utf8')) as Change[];
  const batch = db.batch();
  for (const c of changes) {
    const ref = db.collection(c.collection).doc(c.id);
    if (!(await ref.get()).exists) {
      console.error(`❌ ${c.collection}/${c.id} no longer exists — run the dry run again.`);
      process.exit(1);
    }
    batch.update(ref, c.touch ? { ...c.set, updatedAt: FieldValue.serverTimestamp() } : c.set);
  }
  await batch.commit();
  console.log(`✅ Applied ${changes.length} changes from ${PLAN_FILE}`);
}

async function main() {
  if (APPLY) return apply();

  mkdirSync(BACKUP_DIR, { recursive: true });
  const changes = await plan();
  writeFileSync(PLAN_FILE, JSON.stringify(changes, null, 2));
  const counts = changes.reduce<Record<string, number>>((acc, c) => {
    acc[c.collection] = (acc[c.collection] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`\n📝 Dry run: ${changes.length} changes planned ${JSON.stringify(counts)}`);
  console.log(`   Plan saved to ${PLAN_FILE}. Nothing was written.`);
  console.log('   Apply it with: npx tsx scripts/fix-commuter-data.ts --apply\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Fix failed:', err);
    process.exit(1);
  });
