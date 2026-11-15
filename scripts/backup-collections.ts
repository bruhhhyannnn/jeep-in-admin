/**
 * Backup Script — commuter-facing collections
 * Run with: npx tsx scripts/backup-collections.ts
 *
 * Read-only. Writes every document of the collections below to
 * scripts/backups/<timestamp>.json (gitignored) before any data fix or simulation.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';
const COLLECTIONS = [
  'routes',
  'stop_points',
  'jeepneys',
  'driver_locations',
  'organizations',
  'fare_matrices',
  'fare_guide',
];

if (!getApps().length) {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function backup() {
  const out: Record<string, Record<string, unknown>> = {};

  for (const name of COLLECTIONS) {
    const snap = await db.collection(name).get();
    out[name] = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
    console.log(`  ✅ ${name}: ${snap.size} docs`);
  }

  const dir = join(__dirname, 'backups');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`\n✅ Backup written to ${file}\n`);
  process.exit(0);
}

backup().catch((err) => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
