import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';

if (!getApps().length) {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

const ROUTE_ID = 'q2JCd9VCVuwhlFWfLais'; // TODO: paste your Firestore route document ID here

const FARE_DATA = [
  { stopPointName: 'Laoag City', distanceKm: 0, regularFare: 14.0, discountedFare: 11.25 },
  { stopPointName: 'Gabu Junction', distanceKm: 1, regularFare: 14.0, discountedFare: 11.25 },
  {
    stopPointName: 'Iglesia ni Cristo Brgy. 1',
    distanceKm: 2,
    regularFare: 14.0,
    discountedFare: 11.25,
  },
  {
    stopPointName: 'San Nicolas Town Hall',
    distanceKm: 3,
    regularFare: 14.0,
    discountedFare: 11.25,
  },
  {
    stopPointName: 'Elijah Thomas Videoke',
    distanceKm: 4,
    regularFare: 14.0,
    discountedFare: 11.25,
  },
  { stopPointName: 'Green Meadows', distanceKm: 5, regularFare: 16.25, discountedFare: 13.0 },
  {
    stopPointName: 'San Nicolas Ice Plant',
    distanceKm: 6,
    regularFare: 18.5,
    discountedFare: 14.75,
  },
  { stopPointName: 'San Lorenzo', distanceKm: 7, regularFare: 20.5, discountedFare: 16.5 },
  { stopPointName: 'Bingao', distanceKm: 8, regularFare: 22.75, discountedFare: 18.25 },
  { stopPointName: 'NIA', distanceKm: 9, regularFare: 25.0, discountedFare: 20.0 },
  { stopPointName: 'Baay Elem. School', distanceKm: 10, regularFare: 27.25, discountedFare: 21.75 },
  { stopPointName: 'Paoay Lake Junction', distanceKm: 11, regularFare: 29.5, discountedFare: 23.5 },
  { stopPointName: 'Marit', distanceKm: 12, regularFare: 31.5, discountedFare: 25.25 },
  { stopPointName: 'Alcantara', distanceKm: 13, regularFare: 33.75, discountedFare: 27.0 },
  { stopPointName: 'Sunrise Lodge', distanceKm: 14, regularFare: 36.0, discountedFare: 28.75 },
  { stopPointName: 'Garasgas Bridge', distanceKm: 15, regularFare: 38.25, discountedFare: 30.5 },
  {
    stopPointName: 'Batac Public Market',
    distanceKm: 16,
    regularFare: 40.5,
    discountedFare: 32.25,
  },
  { stopPointName: 'Ever Mart', distanceKm: 17, regularFare: 42.5, discountedFare: 34.0 },
  { stopPointName: 'Batac Crossing', distanceKm: 18, regularFare: 44.75, discountedFare: 36.0 },
  { stopPointName: 'MMSU Main Gate', distanceKm: 19, regularFare: 47.0, discountedFare: 37.75 },
  {
    stopPointName: 'Batac-Paoay Boundary',
    distanceKm: 20,
    regularFare: 49.25,
    discountedFare: 39.5,
  },
  { stopPointName: 'Shell Station', distanceKm: 21, regularFare: 51.5, discountedFare: 41.25 },
  {
    stopPointName: 'Paoay North Institute',
    distanceKm: 22,
    regularFare: 53.5,
    discountedFare: 43.0,
  },
  {
    stopPointName: 'Paoay Public Market',
    distanceKm: 23,
    regularFare: 55.75,
    discountedFare: 44.75,
  },
];

async function seedFareGuide() {
  if (!ROUTE_ID) {
    console.error('ERROR: Set ROUTE_ID before running.');
    process.exit(1);
  }

  console.log(`Seeding ${FARE_DATA.length} fare guide entries...`);

  const now = Timestamp.now();
  const batch = db.batch();

  FARE_DATA.forEach((entry) => {
    const ref = db.collection('fare_guide').doc();
    batch.set(ref, {
      routeId: ROUTE_ID,
      stopPointName: entry.stopPointName,
      distanceKm: entry.distanceKm,
      regularFare: entry.regularFare,
      discountedFare: entry.discountedFare,
      createdAt: now,
      updatedAt: now,
    });
  });

  await batch.commit();
  console.log('Done — fare guide seeded successfully.');
  process.exit(0);
}

seedFareGuide().catch((e) => {
  console.error(e);
  process.exit(1);
});
