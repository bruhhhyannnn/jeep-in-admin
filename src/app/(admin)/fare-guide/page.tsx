'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Button,
  ConfirmDialog,
  DataTable,
  Field,
  Input,
  PageError,
  PanelActionRow,
  Select,
  SidePanel,
} from '@/components/ui';
import { PageHeader, SearchField } from '@/components/common';
import { useAuthStore } from '@/store';
import {
  useFareGuide,
  useCreateFareEntry,
  useUpdateFareEntry,
  useDeleteFareEntry,
  useAllRoutes,
  useOrganization,
} from '@/hooks';
import { fareGuideSchema, type FareGuideFormData } from '@/lib';
import type { FareGuide } from '@/types';

const peso = (n: number) => `₱${Number(n).toFixed(2)}`;

export default function FareGuidePage() {
  const { userProfile } = useAuthStore();
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const orgId = userProfile?.organizationId ?? '';
  const { data: org } = useOrganization(isSuperAdmin ? undefined : orgId);

  const [query, setQuery] = useState('');
  const [filterRouteId, setFilterRouteId] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<FareGuide | null>(null);

  const { data: routes = [] } = useAllRoutes();
  const routeName = (id: string) => routes.find((r) => r.id === id)?.name ?? '—';

  const effectiveRouteId = isSuperAdmin ? filterRouteId : (org?.routeId ?? '');
  const { data: fareGuide = [], isPending, error } = useFareGuide(effectiveRouteId || undefined);
  const deleteFare = useDeleteFareEntry();

  const q = query.trim().toLowerCase();
  const filtered = q
    ? fareGuide.filter((f) => f.stopPointName.toLowerCase().includes(q))
    : fareGuide;

  const openPanel = (id: string | null) => {
    setEditId(id);
    setPanelOpen(true);
  };

  const columns: ColumnDef<FareGuide, unknown>[] = [
    {
      accessorKey: 'stopPointName',
      header: 'Stop',
      cell: ({ row: { original: f } }) => (
        <div>
          <p className="text-ink font-semibold">{f.stopPointName}</p>
          {isSuperAdmin && !filterRouteId && (
            <p className="text-ink-muted text-[12px]">{routeName(f.routeId)}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'distanceKm',
      header: 'Distance',
      cell: ({ getValue }) => (
        <span className="font-data text-ink-muted">{Number(getValue()).toFixed(1)} km</span>
      ),
    },
    {
      accessorKey: 'regularFare',
      header: 'Regular',
      cell: ({ getValue }) => (
        <span className="font-data text-ink font-bold">{peso(Number(getValue()))}</span>
      ),
    },
    {
      accessorKey: 'discountedFare',
      header: 'Discounted',
      cell: ({ getValue }) => (
        <span className="font-data text-live-ink font-bold">{peso(Number(getValue()))}</span>
      ),
    },
    {
      id: 'edit',
      header: () => <span className="sr-only">Edit</span>,
      enableSorting: false,
      cell: ({ row: { original: f } }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openPanel(f.id);
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  if (error) return <PageError message={error.message} />;

  const scopeName = effectiveRouteId ? routeName(effectiveRouteId) : 'all routes';

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Fare guide"
          description={`${fareGuide.length} ${fareGuide.length === 1 ? 'fare' : 'fares'} on ${scopeName} · regular and discounted`}
          actions={
            <>
              {isSuperAdmin && (
                <Select
                  appearance="pill"
                  aria-label="Route"
                  options={[
                    { value: '', label: 'All routes' },
                    ...routes.map((r) => ({ value: r.id, label: r.name })),
                  ]}
                  value={filterRouteId}
                  onChange={(e) => setFilterRouteId(e.target.value)}
                  className="max-w-[240px]"
                />
              )}
              <SearchField value={query} onChange={setQuery} placeholder="Search stops" />
              <Button startIcon={<Plus size={17} />} onClick={() => openPanel(null)}>
                Add fare
              </Button>
            </>
          }
        />

        <DataTable
          columns={columns}
          data={filtered}
          loading={isPending}
          emptyMessage={q ? 'No fares match' : 'No fares yet'}
          emptyHint={q ? undefined : 'Add the fare from the start of the route to each stop.'}
          onRowClick={(f) => openPanel(f.id)}
          pageSize={20}
        />
      </div>

      <FarePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        fare={fareGuide.find((f) => f.id === editId) ?? null}
        routes={routes}
        lockedRouteId={isSuperAdmin ? filterRouteId || undefined : effectiveRouteId}
        allowRouteChoice={isSuperAdmin}
        onDelete={setDeleting}
      />

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Remove the fare to ${deleting?.stopPointName ?? 'this stop'}?`}
        message="Commuters stop seeing it in the fare guide. This can't be undone."
        cancelLabel="Keep the fare"
        confirmLabel="Remove fare"
        loadingText="Removing…"
        isLoading={deleteFare.isPending}
        onConfirm={() =>
          deleting &&
          deleteFare.mutate(deleting.id, {
            onSuccess: () => {
              toast.success('Fare removed');
              setDeleting(null);
              setPanelOpen(false);
            },
            onError: (e) => toast.error(e.message),
          })
        }
      />
    </>
  );
}

/* ─── Add / edit a fare ─── */
function FarePanel({
  isOpen,
  onClose,
  fare,
  routes,
  lockedRouteId,
  allowRouteChoice,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  fare: FareGuide | null;
  routes: { id: string; name: string }[];
  lockedRouteId?: string;
  allowRouteChoice: boolean;
  onDelete: (fare: FareGuide) => void;
}) {
  const isEdit = !!fare;
  const createFare = useCreateFareEntry();
  const updateFare = useUpdateFareEntry();
  const formId = 'fare-form';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FareGuideFormData>({ resolver: zodResolver(fareGuideSchema) });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      routeId: fare?.routeId ?? lockedRouteId ?? '',
      stopPointName: fare?.stopPointName ?? '',
      distanceKm: fare?.distanceKm ?? 0,
      regularFare: fare?.regularFare ?? 0,
      discountedFare: fare?.discountedFare ?? 0,
    });
  }, [isOpen, fare, lockedRouteId, reset]);

  const isSaving = isSubmitting || createFare.isPending || updateFare.isPending;

  const onSubmit = handleSubmit((data) => {
    const done = {
      onSuccess: () => {
        toast.success(isEdit ? 'Fare saved' : `Fare to ${data.stopPointName} added`);
        onClose();
      },
      onError: (e: Error) => toast.error(e.message),
    };
    if (fare) updateFare.mutate({ id: fare.id, data }, done);
    else createFare.mutate(data, done);
  });

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      busy={isSaving}
      title={fare ? `Fare to ${fare.stopPointName}` : 'Add a fare'}
      subtitle="Measured from the start of the route."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} isLoading={isSaving} loadingText="Saving…">
            {isEdit ? 'Save changes' : 'Save this fare'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-5" noValidate>
        {allowRouteChoice ? (
          <Field label="Route" htmlFor="fare-route" error={errors.routeId?.message}>
            <Select
              id="fare-route"
              options={routes.map((r) => ({ value: r.id, label: r.name }))}
              placeholder="Choose a route"
              error={!!errors.routeId}
              {...register('routeId')}
            />
          </Field>
        ) : (
          <input type="hidden" {...register('routeId')} />
        )}

        <Input
          id="fare-stop"
          label="Stop"
          placeholder="Batac Public Market"
          error={!!errors.stopPointName}
          hint={errors.stopPointName?.message}
          {...register('stopPointName')}
        />

        <Input
          id="fare-distance"
          type="number"
          step="0.1"
          min="0"
          inputMode="decimal"
          label="Distance (km)"
          className="font-data"
          error={!!errors.distanceKm}
          hint={errors.distanceKm?.message}
          {...register('distanceKm')}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            id="fare-regular"
            type="number"
            step="0.25"
            min="0"
            inputMode="decimal"
            label="Regular fare (₱)"
            className="font-data"
            error={!!errors.regularFare}
            hint={errors.regularFare?.message}
            {...register('regularFare')}
          />
          <Input
            id="fare-discounted"
            type="number"
            step="0.25"
            min="0"
            inputMode="decimal"
            label="Discounted fare (₱)"
            className="font-data"
            error={!!errors.discountedFare}
            hint={errors.discountedFare?.message}
            {...register('discountedFare')}
          />
        </div>

        {fare && (
          <PanelActionRow
            tone="danger"
            title="Remove this fare"
            description="Takes it out of the commuter fare guide."
            action={
              <Button variant="danger-outline" size="sm" onClick={() => onDelete(fare)}>
                Remove fare
              </Button>
            }
          />
        )}
      </form>
    </SidePanel>
  );
}
