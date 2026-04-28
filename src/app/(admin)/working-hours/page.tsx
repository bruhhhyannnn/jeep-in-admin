'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageBreadcrumb } from '@/components/common';
import { Button, Label, Input, Badge, Spinner } from '@/components/ui';
import { useAuthStore } from '@/store';
import { useOrganization, useRoute, useUpdateWorkingHours } from '@/hooks';
import { workingHoursSchema, type WorkingHoursFormData } from '@/lib';

export default function WorkingHoursPage() {
  const { userProfile } = useAuthStore();
  const orgId = userProfile?.organizationId ?? '';
  const { data: org } = useOrganization(orgId);
  const { data: route, isPending } = useRoute(org?.routeId);
  const updateHours = useUpdateWorkingHours();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<WorkingHoursFormData>({ resolver: zodResolver(workingHoursSchema) });

  useEffect(() => {
    if (route?.workingHours) {
      reset({ start: route.workingHours.start, end: route.workingHours.end });
    }
  }, [route, reset]);

  const onSubmit = handleSubmit((data) => {
    if (!org?.routeId) return;
    updateHours.mutate(
      { routeId: org.routeId, data },
      {
        onSuccess: () => toast.success('Working hours updated'),
        onError: (e) => toast.error(e.message),
      }
    );
  });

  // Determine current status
  const isOpen = (() => {
    if (!route?.workingHours) return null;
    const now = new Date();
    const [sh, sm] = route.workingHours.start.split(':').map(Number);
    const [eh, em] = route.workingHours.end.split(':').map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= sh * 60 + sm && cur <= eh * 60 + em;
  })();

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Working Hours" />

      {isPending ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Status banner */}
          <div className="dark:shadow-theme-md-dark flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="bg-brand-600/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <Clock size={20} className="text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {route?.name ?? 'Route'}
                </p>
                <p className="text-xs text-gray-500">
                  Current time:{' '}
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            {isOpen !== null && (
              <Badge color={isOpen ? 'success' : 'warning'} size="sm">
                {isOpen ? 'Currently Open' : 'Currently Closed'}
              </Badge>
            )}
          </div>

          {/* Edit form */}
          <div className="dark:shadow-theme-md-dark max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-800 dark:bg-gray-950">
            <h3 className="mb-5 text-sm font-semibold text-gray-800 dark:text-gray-200">
              Set Working Hours
            </h3>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Start Time</Label>
                  <Input
                    type="time"
                    error={!!errors.start}
                    hint={errors.start?.message}
                    {...register('start')}
                  />
                </div>
                <div>
                  <Label required>End Time</Label>
                  <Input
                    type="time"
                    error={!!errors.end}
                    hint={errors.end?.message}
                    {...register('end')}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600">
                {/* TODO: GPS enforcement — when outside working hours the mobile app should
                    automatically set isSharing=false on the driver's location document.
                    Current implementation is informational only.
                    See: /src/hooks/use-driver-locations.ts for the TODO comment. */}
                Note: GPS enforcement during off-hours is handled by the mobile app and will be
                enabled in a future update.
              </p>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!isDirty}
                  isLoading={isSubmitting || updateHours.isPending}
                  loadingText="Saving…"
                >
                  Save Working Hours
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
