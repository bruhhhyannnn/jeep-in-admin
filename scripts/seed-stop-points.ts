/**
 * Seed Script — Stop Points
 * Run with: npm run seed:stops
 *
 * Creates all 42 stop points (21 paoay→laoag, 21 laoag→paoay) in Firestore.
 *
 * Before running:
 *   - Fill in ROUTE_ID below (from your Firestore routes collection)
 *   - Ensure serviceAccountKey.json is present next to this script
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// ─── CONFIGURE BEFORE RUNNING ───────────────────────────────────────────────
const ROUTE_ID = 'q2JCd9VCVuwhlFWfLais'; // TODO: paste your Firestore route document ID here
const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';
// ─────────────────────────────────────────────────────────────────────────────

if (!getApps().length) {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

interface StopSeed {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  routeDirection: string;
  order: number;
}

const PAOAY_LAOAG: StopSeed[] = [
  {
    order: 1,
    name: 'Paoay-Laoag Modern Jeep Terminal',
    address: 'Balacao Rd, Paoay',
    latitude: 18.051355,
    longitude: 120.518746,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 2,
    name: '7-Eleven (Centro)',
    address: 'Balacao Rd, Paoay',
    latitude: 18.060268,
    longitude: 120.52171,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 3,
    name: 'Phil-Rice Research Institute',
    address: 'Marcos Ave, Batac',
    latitude: 18.057726,
    longitude: 120.544146,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 4,
    name: 'In front of MMSU Twin Gate',
    address: 'Marcos Ave, Batac',
    latitude: 18.057144,
    longitude: 120.547645,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 5,
    name: 'MMSU Teatro',
    address: 'Marcos Ave, Batac',
    latitude: 18.056291,
    longitude: 120.552822,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 6,
    name: 'MMSU Gate 3',
    address: 'Marcos Ave, Batac',
    latitude: 18.055938,
    longitude: 120.555326,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 7,
    name: 'In front of Tealive (Crossing)',
    address: 'Marcos Ave, Batac',
    latitude: 18.0556,
    longitude: 120.5575,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 8,
    name: 'Jollibee',
    address: 'Marcos Ave, Batac',
    latitude: 18.054762,
    longitude: 120.562627,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 9,
    name: 'In front of City of Batac Municipality',
    address: 'Washington St, Batac',
    latitude: 18.05476,
    longitude: 120.56435,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 10,
    name: 'Ricarte Park',
    address: 'Washington St, Batac',
    latitude: 18.056616,
    longitude: 120.565189,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 11,
    name: 'In front of C N B Drugstore',
    address: 'Washington St, Batac',
    latitude: 18.062565,
    longitude: 120.565537,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 12,
    name: 'Batac Public Market Place',
    address: 'Washington St, Batac',
    latitude: 18.066417,
    longitude: 120.562268,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 13,
    name: 'Batac Welcome Arch',
    address: 'Washington St, Batac',
    latitude: 18.06809,
    longitude: 120.56133,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 14,
    name: 'In front of Bil-loca Elementary School',
    address: 'McArthur Highway, Batac',
    latitude: 18.088505,
    longitude: 120.568151,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 15,
    name: 'Brgy. Baay Public Market',
    address: 'McArthur Highway, Batac',
    latitude: 18.108253,
    longitude: 120.568959,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 16,
    name: 'Batac-San Nicolas Boundary Arch',
    address: 'McArthur Highway, San Nicolas',
    latitude: 18.1208651,
    longitude: 120.5756987,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 17,
    name: 'In front of Bingao National High School',
    address: 'McArthur Highway, San Nicolas',
    latitude: 18.136172,
    longitude: 120.583707,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 18,
    name: 'In front of Cockfight Arena',
    address: 'McArthur Highway, San Nicolas',
    latitude: 18.152961,
    longitude: 120.585532,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 19,
    name: 'In front of 7-Eleven',
    address: '7 Eleven, San Nicolas',
    latitude: 18.1724577,
    longitude: 120.5939382,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 20,
    name: 'In front of Robinsons Mall',
    address: 'Robinsons Mall, San Nicolas',
    latitude: 18.179488,
    longitude: 120.590411,
    routeDirection: 'paoay_laoag',
  },
  {
    order: 21,
    name: 'Gabu Tricycle Terminal',
    address: 'McArthur Highway, San Nicolas',
    latitude: 18.185368,
    longitude: 120.588945,
    routeDirection: 'paoay_laoag',
  },
];

const LAOAG_PAOAY: StopSeed[] = [
  {
    order: 1,
    name: 'Laoag-Paoay Modern Jeep Terminal',
    address: 'Barangay No. 1, Laoag City',
    latitude: 18.195729,
    longitude: 120.590441,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 2,
    name: 'Gabu Junction',
    address: 'Barangay No. 2, Laoag City',
    latitude: 18.186152,
    longitude: 120.588687,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 3,
    name: 'Robinsons Ilocos',
    address: 'Barangay 1, San Nicolas',
    latitude: 18.179402,
    longitude: 120.590341,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 4,
    name: 'San Nicolas Municipality',
    address: 'Barangay 2, San Nicolas',
    latitude: 18.172783,
    longitude: 120.593965,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 5,
    name: 'Cockfight Arena',
    address: 'Barangay 3, San Nicolas',
    latitude: 18.153305,
    longitude: 120.585531,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 6,
    name: 'Bingao Elementary & National High School',
    address: 'Barangay 4, San Nicolas',
    latitude: 18.136204,
    longitude: 120.58358,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 7,
    name: 'Brgy. Bingao',
    address: 'Barangay 5, San Nicolas',
    latitude: 18.128952,
    longitude: 120.579599,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 8,
    name: 'Baay Elementary School',
    address: 'Baay, Batac',
    latitude: 18.116064,
    longitude: 120.572574,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 9,
    name: 'Market Place, Brgy. Baay',
    address: 'Baay, Batac',
    latitude: 18.108161,
    longitude: 120.568836,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 10,
    name: 'GARSH and Bil-loca Elementary School',
    address: 'Bil-loca, Batac',
    latitude: 18.088731,
    longitude: 120.568068,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 11,
    name: 'Rana-Ann Gas Station, Baligat',
    address: 'Baligat, Batac',
    latitude: 18.079227,
    longitude: 120.562914,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 12,
    name: 'Arko Batac',
    address: 'Barangay 6, Batac',
    latitude: 18.067465,
    longitude: 120.561356,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 13,
    name: 'Market Place',
    address: 'Barangay 7, Batac',
    latitude: 18.065589,
    longitude: 120.56294,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 14,
    name: 'Pik A Bun (Centro)',
    address: 'Barangay 8, Batac',
    latitude: 18.0567,
    longitude: 120.5647,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 15,
    name: 'Cebuana Pawnshop (Centro)',
    address: 'Barangay 9, Batac',
    latitude: 18.055136,
    longitude: 120.561324,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 16,
    name: 'Eco-Oil Gas Station (Crossing)',
    address: 'Barangay 10, Batac',
    latitude: 18.055791,
    longitude: 120.557112,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 17,
    name: 'MMSU Gate 3',
    address: 'Barangay 11, Batac',
    latitude: 18.05606,
    longitude: 120.555191,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 18,
    name: 'MMSU Teatro',
    address: 'Barangay 12, Batac',
    latitude: 18.056383,
    longitude: 120.552828,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 19,
    name: 'MMSU Twin Gate',
    address: 'Barangay 13, Batac',
    latitude: 18.057171,
    longitude: 120.548076,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 20,
    name: 'Paoay Church',
    address: 'Barangay 14',
    latitude: 18.061527,
    longitude: 120.522527,
    routeDirection: 'laoag_paoay',
  },
  {
    order: 21,
    name: 'Paoay Municipality',
    address: 'Barangay 15, Paoay',
    latitude: 18.06037,
    longitude: 120.521639,
    routeDirection: 'laoag_paoay',
  },
];

async function seed() {
  if (!ROUTE_ID) {
    console.error('❌ ROUTE_ID is empty. Fill it in at the top of scripts/seed-stop-points.ts');
    process.exit(1);
  }

  console.log('🌱 Seeding stop points...\n');

  const now = Timestamp.now();
  const all = [...PAOAY_LAOAG, ...LAOAG_PAOAY];

  let count = 0;
  for (const stop of all) {
    await db.collection('stop_points').add({
      name: stop.name,
      address: stop.address,
      routeId: ROUTE_ID,
      routeDirection: stop.routeDirection,
      latitude: stop.latitude,
      longitude: stop.longitude,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    count++;
    console.log(`  ✅ [${stop.routeDirection}] ${stop.name}`);
  }

  console.log(`\n✅ Done! Created ${count} stop points for route ${ROUTE_ID}\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
