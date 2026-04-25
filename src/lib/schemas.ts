import { z } from 'zod';

/* ─── Auth ─── */
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/* ─── Driver ─── */
export const driverCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const driverEditSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  isActive: z.boolean().default(true),
});

/* ─── Jeepney ─── */
export const jeepneySchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required'),
  jeepneyNumber: z.string().min(1, 'Jeepney number is required'),
});

/* ─── Fare Guide ─── */
export const fareGuideSchema = z.object({
  routeId: z.string().min(1, 'Route is required'),
  stopPointName: z.string().min(1, 'Stop point name is required'),
  distanceKm: z.coerce.number().min(0, 'Distance must be 0 or more'),
  regularFare: z.coerce.number().min(0, 'Fare must be 0 or more'),
  discountedFare: z.coerce.number().min(0, 'Discounted fare must be 0 or more'),
});

/* ─── Working Hours ─── */
export const workingHoursSchema = z.object({
  start: z.string().min(1, 'Start time is required'),
  end: z.string().min(1, 'End time is required'),
});

/* ─── Admin Account (created by super admin) ─── */
export const adminCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationId: z.string().min(1, 'Organization is required'),
});

/* ─── Inferred Types ─── */
export type SignInFormData = z.infer<typeof signInSchema>;
export type DriverCreateFormData = z.infer<typeof driverCreateSchema>;
export type DriverEditFormData = z.infer<typeof driverEditSchema>;
export type JeepneyFormData = z.infer<typeof jeepneySchema>;
export type FareGuideFormData = z.infer<typeof fareGuideSchema>;
export type WorkingHoursFormData = z.infer<typeof workingHoursSchema>;
export type AdminCreateFormData = z.infer<typeof adminCreateSchema>;
