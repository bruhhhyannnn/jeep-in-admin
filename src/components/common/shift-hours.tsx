'use client';

import { useEffect } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button, Input, SidePanel, Spinner, StatusChip } from '@/components/ui';
import { useRoute, useUpdateWorkingHours, useNow } from '@/hooks';
import { formatClock, isWithinHours, workingHoursSchema, type WorkingHoursFormData } from '@/lib';

function useShiftHoursForm(routeId: string, onSaved?: () => void) {
  const { data: route, isPending } = useRoute(routeId || undefined);
  const updateHours = useUpdateWorkingHours();

  const form = useForm<WorkingHoursFormData>({ resolver: zodResolver(workingHoursSchema) });
  const { reset } = form;

  useEffect(() => {
    if (route?.workingHours) {
      reset({ start: route.workingHours.start, end: route.workingHours.end });
    }
  }, [route, reset]);

  const onSubmit = form.handleSubmit((data) => {
    if (!routeId) return;
    updateHours.mutate(
      { routeId, data },
      {
        onSuccess: () => {
          toast.success(
            `Shift hours saved · ${formatClock(data.start)} – ${formatClock(data.end)}`
          );
          reset(data);
          onSaved?.();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  });

  const isSaving = form.formState.isSubmitting || updateHours.isPending;

  return { route, isPending: !!routeId && isPending, form, onSubmit, isSaving };
}

function ShiftHoursFields({
  form,
  routeHours,
}: {
  form: UseFormReturn<WorkingHoursFormData>;
  routeHours?: { start: string; end: string };
}) {
  const now = useNow(30_000);
  const {
    register,
    formState: { errors },
  } = form;

  const isOpen = routeHours ? isWithinHours(routeHours, new Date(now)) : null;

  return (
    <div className="space-y-5">
      {routeHours && (
        <StatusChip tone={isOpen ? 'live' : 'pending'} dot>
          {isOpen
            ? `Open now · until ${formatClock(routeHours.end)}`
            : `Closed now · opens ${formatClock(routeHours.start)}`}
        </StatusChip>
      )}

      <div className="border-line rounded-tile border-[1.5px] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <p className="text-ink w-24 shrink-0 pt-3 text-[14px] font-bold">Every day</p>
          <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-start gap-2.5">
            <Input
              type="time"
              aria-label="Sharing opens at"
              className="font-data"
              error={!!errors.start}
              hint={errors.start?.message}
              {...register('start')}
            />
            <span className="text-ink-muted pt-3 text-[14px]">to</span>
            <Input
              type="time"
              aria-label="Sharing closes at"
              className="font-data"
              error={!!errors.end}
              hint={errors.end?.message}
              {...register('end')}
            />
          </div>
        </div>
      </div>

      <div className="bg-sunken rounded-tile p-4">
        <p className="text-ink text-[14px] font-bold">What these hours do</p>
        <p className="text-ink-muted mt-1 text-[13px] leading-relaxed">
          The fleet overview uses them to tell a quiet map from a problem: outside these hours an
          empty map is normal. Switching a driver&apos;s sharing off on its own outside these hours
          is handled by the driver app and arrives in a future update.
        </p>
      </div>
    </div>
  );
}

/** Inline card used on the Shift hours page. */
export function ShiftHoursForm({ routeId }: { routeId: string }) {
  const { route, isPending, form, onSubmit, isSaving } = useShiftHoursForm(routeId);

  if (isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-line bg-card rounded-card max-w-[560px] border-[1.5px] p-5 shadow-sm sm:p-6"
    >
      <p className="eyebrow">{route?.name ?? 'Route'}</p>
      <h2 className="text-heading text-ink mt-1 mb-4">When sharing is allowed</h2>
      <ShiftHoursFields form={form} routeHours={route?.workingHours} />
      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          disabled={!form.formState.isDirty || !routeId}
          isLoading={isSaving}
          loadingText="Saving…"
        >
          Save these hours
        </Button>
      </div>
    </form>
  );
}

/** The same form as a side panel, opened from Assignments and the Fleet overview. */
export function ShiftHoursPanel({
  isOpen,
  onClose,
  routeId,
}: {
  isOpen: boolean;
  onClose: () => void;
  routeId: string;
}) {
  const { route, isPending, form, onSubmit, isSaving } = useShiftHoursForm(routeId, onClose);
  const formId = 'shift-hours-panel-form';
  const { reset } = form;

  // Drop unsaved edits each time the panel opens.
  useEffect(() => {
    if (isOpen && route?.workingHours) {
      reset({ start: route.workingHours.start, end: route.workingHours.end });
    }
  }, [isOpen, route, reset]);

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      busy={isSaving}
      title="Shift hours"
      subtitle={
        route
          ? `${route.name} · drivers should only share their location inside these hours.`
          : 'Drivers should only share their location inside these hours.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={!form.formState.isDirty}
            isLoading={isSaving}
            loadingText="Saving…"
          >
            Save these hours
          </Button>
        </>
      }
    >
      {!routeId ? (
        <p className="text-ink-muted text-[14px]">
          This organization has no route yet, so there are no shift hours to set.
        </p>
      ) : isPending ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <form id={formId} onSubmit={onSubmit}>
          <ShiftHoursFields form={form} routeHours={route?.workingHours} />
        </form>
      )}
    </SidePanel>
  );
}
