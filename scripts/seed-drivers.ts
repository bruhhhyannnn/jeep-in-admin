import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';

if (!getApps().length) {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const auth = getAuth();

// TODO: fill these in before running
const ORGANIZATION_ID = 'ITC';
const ROUTE_ID = 'EsFshXnDTyKnsbTeUTiM'; // paste your route document ID here

const DRIVERS = [
  { firstName: 'Ramon', lastName: 'Aquino', email: 'ramon.aquino@itc.com' },
  { firstName: 'Carlos', lastName: 'Domingo', email: 'carlos.domingo@itc.com' },
  { firstName: 'Eduardo', lastName: 'Verzosa', email: 'eduardo.verzosa@itc.com' },
  { firstName: 'Rodolfo', lastName: 'Pascual', email: 'rodolfo.pascual@itc.com' },
  { firstName: 'Alejandro', lastName: 'Soriano', email: 'alejandro.soriano@itc.com' },
];

const TEMP_PASSWORD = 'Driver@1234';

async function seedDrivers() {
  if (!ROUTE_ID) {
    console.error('ERROR: Set ROUTE_ID before running.');
    process.exit(1);
  }

  console.log(`Seeding ${DRIVERS.length} drivers...`);
  const now = Timestamp.now();

  for (const driver of DRIVERS) {
    try {
      const userRecord = await auth.createUser({
        email: driver.email,
        password: TEMP_PASSWORD,
        displayName: `${driver.firstName} ${driver.lastName}`,
      });

      await auth.setCustomUserClaims(userRecord.uid, { role: 'driver' });

      await db
        .collection('users')
        .doc(userRecord.uid)
        .set({
          uid: userRecord.uid,
          email: driver.email,
          role: 'driver',
          displayName: `${driver.firstName} ${driver.lastName}`,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });

      await db.collection('drivers').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: driver.email,
        firstName: driver.firstName,
        lastName: driver.lastName,
        organizationId: ORGANIZATION_ID,
        routeId: ROUTE_ID,
        assignedJeepneyId: null,
        isActive: true,
        mustChangePassword: true,
        lastLocationUpdate: null,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`  ✅ ${driver.firstName} ${driver.lastName} — ${userRecord.uid}`);
    } catch (e: any) {
      console.warn(`  ⚠️  Skipped ${driver.email}: ${e.message}`);
    }
  }

  console.log('Done — drivers seeded.');
  process.exit(0);
}

seedDrivers().catch((e) => {
  console.error(e);
  process.exit(1);
});
