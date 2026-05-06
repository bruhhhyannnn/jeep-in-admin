import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';

if (!getApps().length) {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

// TODO: fill these in before running
const ORGANIZATION_ID = 'ITC';
const ROUTE_ID = 'EsFshXnDTyKnsbTeUTiM'; // paste your route document ID here

const JEEPNEYS = [
  { jeepneyNumber: '01', plateNumber: 'ITC-0001' },
  { jeepneyNumber: '02', plateNumber: 'ITC-0002' },
  { jeepneyNumber: '03', plateNumber: 'ITC-0003' },
  { jeepneyNumber: '04', plateNumber: 'ITC-0004' },
  { jeepneyNumber: '05', plateNumber: 'ITC-0005' },
  { jeepneyNumber: '06', plateNumber: 'ITC-0006' },
  { jeepneyNumber: '07', plateNumber: 'ITC-0007' },
  { jeepneyNumber: '08', plateNumber: 'ITC-0008' },
  { jeepneyNumber: '09', plateNumber: 'ITC-0009' },
  { jeepneyNumber: '10', plateNumber: 'ITC-0010' },
];

async function seedJeepneys() {
  if (!ROUTE_ID) {
    console.error('ERROR: Set ROUTE_ID before running.');
    process.exit(1);
  }

  console.log(`Seeding ${JEEPNEYS.length} jeepneys...`);
  const now = Timestamp.now();
  const batch = db.batch();

  JEEPNEYS.forEach((jeepney) => {
    const ref = db.collection('jeepneys').doc();
    batch.set(ref, {
      jeepneyNumber: jeepney.jeepneyNumber,
      plateNumber: jeepney.plateNumber,
      organizationId: ORGANIZATION_ID,
      routeId: ROUTE_ID,
      assignedDriverId: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  });

  await batch.commit();
  console.log('Done — jeepneys seeded.');
  process.exit(0);
}

seedJeepneys().catch((e) => {
  console.error(e);
  process.exit(1);
});
