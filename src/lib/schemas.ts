import { z } from 'zod';

/* ─── Auth ─── */
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
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
  plateNumber: z
    .string()
    .min(1, 'Plate number is required')
    .max(8, 'Plate number must be 8 characters or less'),
  jeepneyNumber: z
    .string()
    .min(1, 'Jeepney number is required')
    .max(2, 'Jeepney number must be 2 characters or less'),
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

/* ─── Stop Point ─── */
export const stopPointSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  routeDirection: z.string().min(1, 'Direction is required'),
  latitude: z.coerce.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  longitude: z.coerce.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  isActive: z.boolean().default(true),
});

/* ─── Route ─── */
export const routeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  directions: z.array(z.string().min(1)).min(1, 'At least one direction is required'),
  isActive: z.boolean().default(true),
  workingHours: z.object({
    start: z.string().min(1, 'Start time is required'),
    end: z.string().min(1, 'End time is required'),
  }),
});

/* ─── Organization ─── */
export const organizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  shortName: z
    .string()
    .min(1, 'Short name is required')
    .max(10, 'Short name must be 10 characters or less'),
  routeId: z.string().min(1, 'Route is required'),
  isActive: z.boolean().default(true),
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
export type JeepneyFormData = z.infer<typeof jeepneySchema>;
export type FareGuideFormData = z.infer<typeof fareGuideSchema>;
export type WorkingHoursFormData = z.infer<typeof workingHoursSchema>;
export type StopPointFormData = z.infer<typeof stopPointSchema>;
export type RouteFormData = z.infer<typeof routeSchema>;
export type OrganizationFormData = z.infer<typeof organizationSchema>;
export type AdminCreateFormData = z.infer<typeof adminCreateSchema>;
