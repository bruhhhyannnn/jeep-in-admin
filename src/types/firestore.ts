import type { Timestamp } from 'firebase/firestore';

/* ─── Role ─── */
export type UserRole = 'super_admin' | 'admin' | 'driver' | 'commuter';

/* ─── User (base auth record in Firestore /users/{uid}) ─── */
export interface FirestoreUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ─── Organization ─── */
export interface Organization {
  id: string;
  name: string;
  shortName: string;
  routeId: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ─── Admin profile (/admins/{uid}) ─── */
export interface AdminProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ─── Driver profile (/drivers/{uid}) ─── */
export interface DriverProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  assignedJeepneyId: string | null;
  routeId: string | null;
  isActive: boolean;
  /**
   * mustChangePassword: true when the admin first creates the account.
   * TODO: Mobile app should prompt the driver to change their password on first login
   * and update this field to false via a Firebase Cloud Function or direct Firestore write.
   */
  mustChangePassword: boolean;
  lastLocationUpdate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ─── Jeepney (/jeepneys/{jeepneyId}) ─── */
export interface Jeepney {
  id: string;
  plateNumber: string;
  jeepneyNumber: string;
  organizationId: string;
  routeId: string | null;
  assignedDriverId: string | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ─── Driver Location (/driver_locations/{uid}) — realtime ─── */
export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  /**
   * isSharing: controlled by the driver's GPS toggle in the mobile app.
   * TODO: working-hours enforcement — when outside working hours,
   * the mobile app should set isSharing to false automatically.
   * See: /src/app/(admin)/working-hours/page.tsx for the schedule config.
   */
  isSharing: boolean;
  updatedAt: Timestamp;
}

/* ─── Route (/routes/{routeId}) ─── */
export interface Route {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  workingHours: {
    start: string; // "06:00"
    end: string; // "20:00"
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ─── Stop Point (/stop_points/{stopId}) ─── */
export interface StopPoint {
  id: string;
  name: string;
  routeId: string;
  latitude: number;
  longitude: number;
  distanceFromTerminalKm: number;
  order: number;
  isActive: boolean;
}

/* ─── Fare Guide (/fare_guide/{fareId}) ─── */
export interface FareGuide {
  id: string;
  routeId: string;
  stopPointName: string;
  distanceKm: number;
  regularFare: number;
  discountedFare: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ─── Audit Log (/audit_logs/{logId}) ─── */
export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  actorName: string;
  action: string; // e.g. "CREATE_DRIVER", "DELETE_JEEPNEY", "GPS_TOGGLE_ON"
  targetType: string; // e.g. "driver", "jeepney", "fare_guide"
  targetId: string;
  targetName: string | null;
  details: string | null;
  organizationId: string | null;
  createdAt: Timestamp;
}

/* ─── Enriched types (joined data for display) ─── */
export interface DriverWithJeepney extends DriverProfile {
  jeepney: Pick<Jeepney, 'plateNumber' | 'jeepneyNumber'> | null;
}

export interface JeepneyWithDriver extends Jeepney {
  driver: Pick<DriverProfile, 'firstName' | 'lastName' | 'email'> | null;
}
