import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';

if (!getApps().length) {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

const ACTIONS = [
  'CREATE_DRIVER',
  'DELETE_DRIVER',
  'UPDATE_DRIVER',
  'DEACTIVATE_DRIVER',
  'CREATE_JEEPNEY',
  'DELETE_JEEPNEY',
  'UPDATE_JEEPNEY',
  'ASSIGN_DRIVER',
  'UNASSIGN_DRIVER',
  'UPDATE_WORKING_HOURS',
  'GPS_TOGGLE_ON',
  'GPS_TOGGLE_OFF',
  'LOGIN',
  'LOGOUT',
];

const ACTORS = [
  { id: 'admin001', name: 'Juan dela Cruz', role: 'admin' },
  { id: 'admin002', name: 'Maria Santos', role: 'admin' },
  { id: 'driver001', name: 'Pedro Reyes', role: 'driver' },
  { id: 'driver002', name: 'Jose Bautista', role: 'driver' },
  { id: 'super001', name: 'Super Admin', role: 'super_admin' },
];

const TARGETS = [
  { type: 'driver', name: 'Ramon Aquino' },
  { type: 'driver', name: 'Carlos Domingo' },
  { type: 'jeepney', name: 'Jeepney #01 — ABC-1234' },
  { type: 'jeepney', name: 'Jeepney #02 — XYZ-5678' },
  { type: 'route', name: 'Laoag–Batac–Paoay' },
  { type: 'working_hours', name: 'Laoag–Batac–Paoay' },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number): Timestamp {
  const ms = Date.now() - Math.floor(Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return Timestamp.fromDate(new Date(ms));
}

async function seedAuditLogs() {
  console.log('Seeding 40 audit log entries...');

  const batch = db.batch();

  for (let i = 0; i < 40; i++) {
    const actor = randomItem(ACTORS);
    const action = randomItem(ACTIONS);
    const target = randomItem(TARGETS);
    const ref = db.collection('audit_logs').doc();

    batch.set(ref, {
      actorId: actor.id,
      actorRole: actor.role,
      actorName: actor.name,
      action,
      targetType: target.type,
      targetId: `${target.type}_${Math.floor(Math.random() * 100)}`,
      targetName: target.name,
      details: `${actor.name} performed ${action} on ${target.name}`,
      organizationId: 'ITC',
      createdAt: randomDate(30),
    });
  }

  await batch.commit();
  console.log('Done — 40 audit log entries created.');
  process.exit(0);
}

seedAuditLogs().catch((e) => {
  console.error(e);
  process.exit(1);
});
