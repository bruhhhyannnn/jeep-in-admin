/**
 * Seed Script — JEEP-IN Admin
 * Run with: npm run seed
 *
 * Creates:
 *   1. ITC organization document
 *   2. Laoag–Batac–Paoay route document
 *   3. Super admin Firestore profile (linked to your existing Firebase Auth account)
 *
 * Before running:
 *   - Copy .env.local.example to .env.local and fill in all values
 *   - Make sure your Firebase Auth super admin account already exists
 *   - Set SUPER_ADMIN_UID below (your Firebase Auth UID) or it will be left blank
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// ─── CONFIGURE BEFORE RUNNING ───────────────────────────────────────────────
const SUPER_ADMIN_UID = ''; // TODO: paste your Firebase Auth UID here
const SUPER_ADMIN_EMAIL = 'jeepin.official@gmail.com'; // TODO: paste your super admin email here
const SUPER_ADMIN_FIRST_NAME = 'Super';
const SUPER_ADMIN_LAST_NAME = 'Admin';

/**
 * Path to your downloaded service account JSON file.
 * Place the file next to this script, or adjust the path.
 * NEVER commit this file to git — it's already in .gitignore.
 */
const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';
// ─────────────────────────────────────────────────────────────────────────────

if (!getApps().length) {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const auth = getAuth();

async function seed() {
  console.log('🌱 Starting JEEP-IN seed script...\n');

  const now = Timestamp.now();

  // ── 1. Create Route ──────────────────────────────────────────────────────
  console.log('Creating route: Laoag–Batac–Paoay...');
  const routeRef = db.collection('routes').doc();
  const routeId = routeRef.id;

  await routeRef.set({
    name: 'Laoag–Batac–Paoay',
    description: 'Main route covering Laoag, Batac, and Paoay in Ilocos Norte',
    directions: ['laoag_paoay', 'paoay_laoag'],
    isActive: true,
    workingHours: {
      start: '06:00',
      end: '20:00',
    },
    createdAt: now,
    updatedAt: now,
  });
  console.log(`  ✅ Route created: ${routeId}\n`);

  // ── 2. Create Organization ───────────────────────────────────────────────
  console.log('Creating organization: Ilocos Transport Cooperative (ITC)...');
  const orgRef = db.collection('organizations').doc('ITC');

  await orgRef.set({
    name: 'Ilocos Transport Cooperative',
    shortName: 'ITC',
    routeId,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`  ✅ Organization created: ITC\n`);

  // ── 3. Create Super Admin Firestore profile ──────────────────────────────
  if (!SUPER_ADMIN_UID) {
    console.warn(
      '⚠️  SUPER_ADMIN_UID is empty. Skipping super admin Firestore profile creation.\n' +
        '   Fill in SUPER_ADMIN_UID in scripts/seed.ts and re-run to create the profile.'
    );
  } else {
    console.log(`Creating super admin profile for UID: ${SUPER_ADMIN_UID}...`);

    // Set custom claim on the Firebase Auth user
    await auth.setCustomUserClaims(SUPER_ADMIN_UID, { role: 'super_admin' });
    console.log('  ✅ Custom claim set: role = super_admin');

    // Create /users/{uid} doc
    await db
      .collection('users')
      .doc(SUPER_ADMIN_UID)
      .set({
        uid: SUPER_ADMIN_UID,
        email: SUPER_ADMIN_EMAIL,
        role: 'super_admin',
        displayName: `${SUPER_ADMIN_FIRST_NAME} ${SUPER_ADMIN_LAST_NAME}`,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    console.log('  ✅ /users doc created');

    // Create /admins/{uid} doc (super admin lives in admins collection too)
    await db.collection('admins').doc(SUPER_ADMIN_UID).set({
      uid: SUPER_ADMIN_UID,
      email: SUPER_ADMIN_EMAIL,
      firstName: SUPER_ADMIN_FIRST_NAME,
      lastName: SUPER_ADMIN_LAST_NAME,
      organizationId: 'ITC', // Super admin is associated with ITC by default
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log('  ✅ /admins doc created\n');
  }

  console.log('✅ Seed complete!');
  console.log('\nNext steps:');
  console.log('  1. If you skipped super admin, fill in SUPER_ADMIN_UID and re-run');
  console.log('  2. Sign in at /signin with your super admin email + password');
  console.log('  3. Start adding admins, drivers, and jeepneys from the dashboard\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
