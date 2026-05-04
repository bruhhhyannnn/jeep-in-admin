# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**JEEP-IN Admin Dashboard** — a Next.js 15 web admin portal for managing a jeepney fleet tracking system. Admins and super admins manage routes, organizations, jeepneys, drivers, stop points, and fare guides. Real-time GPS tracking of drivers is displayed on a MapLibre map. The companion mobile app (separate repo) serves commuters and drivers.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint on src/
npm run lint:fix     # ESLint with auto-fix
npm run seed         # Run scripts/seed.ts to seed Firestore
```

No test suite exists yet.

## Architecture

### Stack

- **Next.js 15 App Router** with TypeScript, Tailwind CSS v4, Shadcn UI (Radix primitives)
- **Firebase**: client SDK (`src/lib/firebase.ts`) for auth + realtime; Admin SDK (`src/lib/firebase-admin.ts`) for server-side Firestore writes — never import admin in client components
- **TanStack Query v5** for all server state; **Zustand v5** for client-only state (auth, sidebar, theme)
- **React Hook Form + Zod** for all forms and validation
- **MapLibre GL** for the real-time driver GPS map

### Auth Flow

1. Client signs in via Firebase Auth (email/password)
2. ID token is sent to `POST /api/auth/session` → verified by Admin SDK → sets `jeep-in-session` cookie (5-day, httpOnly)
3. Edge middleware at `src/proxy.ts` (not `middleware.ts`) guards all routes by checking the cookie
4. Roles live as Firebase custom claims: `super_admin`, `admin`, `driver`, `commuter`
5. Only `admin` and `super_admin` can create sessions in this app

### Role Hierarchy

- **super_admin**: manages all organizations and routes; sees all data across orgs
- **admin**: scoped to their own organization; manages jeepneys, drivers, fare guides
- **driver / commuter**: mobile app only; cannot access this admin portal

### Data Layer Pattern

Every resource follows the same pattern:

- `src/actions/<resource>.ts` — `'use server'` functions calling Admin SDK directly
- `src/hooks/use-<resource>.ts` — TanStack Query wrappers (`useQuery` + `useMutation`) that call the server actions
- Pages import hooks only; pages never call server actions directly

### Firestore Collections

| Collection         | Key fields                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `routes`           | name, directions[], isActive, workingHours {start, end}                                          |
| `organizations`    | name, shortName (used as doc ID), routeId, isActive                                              |
| `admins`           | uid (doc ID), organizationId, firstName, lastName, isActive                                      |
| `drivers`          | uid (doc ID), organizationId, routeId, assignedJeepneyId, mustChangePassword, lastLocationUpdate |
| `jeepneys`         | plateNumber, jeepneyNumber, organizationId, routeId, assignedDriverId                            |
| `stop_points`      | name, address, routeId, routeDirection, lat, long, order, isActive                               |
| `fare_guide`       | routeId, stopPointName, distanceKm, regularFare, discountedFare                                  |
| `audit_logs`       | actorId, actorRole, action, targetType, targetId, organizationId                                 |
| `users`            | uid, email, role, displayName, isActive (mirror of auth claims)                                  |
| `driver_locations` | driverId, lat, long, heading, isSharing                                                          |

`organizations` uses `shortName.toUpperCase()` as the Firestore document ID (not an auto-ID).
`admins` and `drivers` use their Firebase Auth UID as the document ID.

### Cascade Deletion Rules

- **deleteOrganization**: deletes jeepneys, audit_logs, admins (+users docs), drivers (+users docs), then the org doc; Firebase Auth accounts deleted after batch
- **deleteRoute**: deletes stop_points, fare_guide entries, drivers (+users docs), route doc; organizations referencing the route get `routeId: null` (unassigned, not deleted); Firebase Auth accounts deleted after batch

### Key Utilities (`src/lib/utils.ts`)

- `serializeDoc<T>()` — strips Firestore Timestamp `.toJSON` methods before passing data across the server→client boundary; always use this in server actions
- `toDate(value)` — safely converts Timestamp, plain `{seconds, nanoseconds}`, or `Date` to a JS `Date`
- `cn()` — clsx + tailwind-merge for conditional class names

### Path Alias

`@/*` maps to `src/*` — use this for all internal imports.

## Environment Variables

Copy `.env.local.example` to `.env.local`. Required vars:

```
# Firebase Client (public — safe for browser)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Firebase Admin (server only — never expose to client)
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY   # escape newlines as \\n in the .env file
```

## Important Conventions

- All Firestore writes in server actions use `FieldValue.serverTimestamp()` for `updatedAt` and `Timestamp.now()` for `createdAt`
- Firestore batch writes cap at 500 ops; Firebase Auth deletions must happen **outside** the batch (separate API)
- TanStack Query keys follow the pattern `['resource']` for lists and `['resource', id]` for single items. Mutation `onSuccess` must invalidate all query keys affected by cascade side effects.
- The `directions` field on a `Route` document drives stop point direction options (e.g. `["laoag_paoay", "paoay_laoag"]`). Format for display: split on `_`, capitalize each word, join with `→`.
- `src/proxy.ts` is the Edge middleware file (Next.js config points to it); do not create `middleware.ts`
