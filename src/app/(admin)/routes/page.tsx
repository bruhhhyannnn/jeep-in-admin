'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Button,
  ConfirmDialog,
  ConfirmFacts,
  DataTable,
  Field,
  Input,
  PageError,
  PanelActionRow,
  SidePanel,
  StatusChip,
  Switch,
} from '@/components/ui';
import { PageHeader, SearchField } from '@/components/common';
import { useAllRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute } from '@/hooks';
import { formatClock, formatDirection, routeSchema, type RouteFormData } from '@/lib';
import type { Route } from '@/types';

export default function RoutesPage() {
  const [query, setQuery] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Route | null>(null);

  const { data: routes = [], isPending, error } = useAllRoutes();
  const deleteRoute = useDeleteRoute();

  const q = query.trim().toLowerCase();
  const filtered = q ? routes.filter((r) => r.name.toLowerCase().includes(q)) : routes;
  const active = routes.filter((r) => r.isActive).length;

  const openPanel = (id: string | null) => {
    setEditId(id);
    setPanelOpen(true);
  };

  const columns: ColumnDef<Route, unknown>[] = [
    {
      id: 'name',
      header: 'Route',
      accessorFn: (r) => r.name,
      cell: ({ row: { original: r } }) => (
        <div className="min-w-0">
          <p className="text-ink font-semibold">{r.name}</p>
          {r.description && (
            <p className="text-ink-muted line-clamp-1 max-w-[320px] text-[12px]">{r.description}</p>
          )}
        </div>
      ),
    },
    {
      id: 'directions',
      header: 'Directions',
      enableSorting: false,
      cell: ({ row: { original: r } }) => (
        <div className="flex flex-wrap gap-1.5">
          {r.directions?.length ? (
            r.directions.map((d) => (
              <StatusChip key={d} tone="info">
                {formatDirection(d)}
              </StatusChip>
            ))
          ) : (
            <span className="text-ink-muted">None</span>
          )}
        </div>
      ),
    },
    {
      id: 'workingHours',
      header: 'Shift hours',
      accessorFn: (r) => r.workingHours.start,
      cell: ({ row: { original: r } }) => (
        <span className="font-data text-ink-muted text-[13px] whitespace-nowrap">
          {formatClock(r.workingHours.start)} – {formatClock(r.workingHours.end)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (r) => r.isActive,
      cell: ({ row: { original: r } }) =>
        r.isActive ? (
          <StatusChip tone="live" dot>
            Active
          </StatusChip>
        ) : (
          <StatusChip tone="neutral">Inactive</StatusChip>
        ),
    },
    {
      id: 'edit',
      header: () => <span className="sr-only">Edit</span>,
      enableSorting: false,
      cell: ({ row: { original: r } }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openPanel(r.id);
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  if (error) return <PageError message={error.message} />;

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Routes"
          description={`${routes.length} ${routes.length === 1 ? 'route' : 'routes'} · ${active} active`}
          actions={
            <>
              <SearchField value={query} onChange={setQuery} placeholder="Search routes" />
              <Button startIcon={<Plus size={17} />} onClick={() => openPanel(null)}>
                Add route
              </Button>
            </>
          }
        />

        <DataTable
          columns={columns}
          data={filtered}
          loading={isPending}
          emptyMessage={q ? 'No routes match' : 'No routes yet'}
          emptyHint={q ? undefined : 'Add a route, then its stops and fares.'}
          onRowClick={(r) => openPanel(r.id)}
        />
      </div>

      <RoutePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        route={routes.find((r) => r.id === editId) ?? null}
        onDelete={setDeleting}
      />

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'this route'}?`}
        message="Its stops, fares and drivers are deleted with it. This can't be undone."
        cancelLabel="Keep the route"
        confirmLabel="Delete route"
        loadingText="Deleting…"
        isLoading={deleteRoute.isPending}
        onConfirm={() =>
          deleting &&
          deleteRoute.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(`${deleting.name} deleted`);
              setDeleting(null);
              setPanelOpen(false);
            },
            onError: (e) => toast.error(e.message),
          })
        }
      >
        <ConfirmFacts
          items={[
            {
              label: 'Deleted',
              text: 'Its stop points, fare guide, and the drivers on it (including their sign-ins).',
            },
            {
              label: 'Kept',
              text: 'Organizations that use it — they are left without a route until you assign one.',
            },
          ]}
        />
      </ConfirmDialog>
    </>
  );
}

/* ─── Add / edit a route ─── */
function RoutePanel({
  isOpen,
  onClose,
  route,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  route: Route | null;
  onDelete: (route: Route) => void;
}) {
  const isEdit = !!route;
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const formId = 'route-form';

  const [dirInput, setDirInput] = useState('');
  const [directions, setDirections] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      isActive: true,
      directions: [],
      workingHours: { start: '06:00', end: '20:00' },
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    const dirs = route?.directions ?? [];
    setDirections(dirs);
    setDirInput('');
    reset(
      route
        ? {
            name: route.name,
            description: route.description ?? '',
            directions: dirs,
            isActive: route.isActive,
            workingHours: route.workingHours,
          }
        : {
            name: '',
            description: '',
            directions: [],
            isActive: true,
            workingHours: { start: '06:00', end: '20:00' },
          }
    );
  }, [isOpen, route, reset]);

  const addDirection = () => {
    const val = dirInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (!val || directions.includes(val)) return;
    const next = [...directions, val];
    setDirections(next);
    setValue('directions', next, { shouldValidate: true, shouldDirty: true });
    setDirInput('');
  };

  const removeDirection = (index: number) => {
    const next = directions.filter((_, i) => i !== index);
    setDirections(next);
    setValue('directions', next, { shouldValidate: true, shouldDirty: true });
  };

  const isSaving = isSubmitting || createRoute.isPending || updateRoute.isPending;

  const onSubmit = handleSubmit((data) => {
    const done = {
      onSuccess: () => {
        toast.success(isEdit ? `${data.name} saved` : `${data.name} added`);
        onClose();
      },
      onError: (e: Error) => toast.error(e.message),
    };
    if (route) updateRoute.mutate({ routeId: route.id, data }, done);
    else createRoute.mutate(data, done);
  });

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      busy={isSaving}
      title={route ? route.name : 'Add a route'}
      subtitle={
        route
          ? 'Directions, shift hours and status.'
          : 'A line jeepneys run, in one or both directions.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} isLoading={isSaving} loadingText="Saving…">
            {isEdit ? 'Save changes' : 'Save this route'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-5" noValidate>
        <Input
          id="route-name"
          label="Name"
          placeholder="Laoag – Batac – Paoay"
          error={!!errors.name}
          hint={errors.name?.message}
          {...register('name')}
        />
        <Input
          id="route-description"
          label="Description (optional)"
          placeholder="Main line through Laoag, Batac and Paoay"
          {...register('description')}
        />

        <Field
          label="Directions"
          htmlFor="route-direction"
          error={
            errors.directions
              ? ((errors.directions as { message?: string }).message ??
                'Add at least one direction')
              : undefined
          }
          hint="Type both ends with an underscore, e.g. laoag_paoay, then press Enter."
        >
          <div className="flex gap-2">
            <input
              id="route-direction"
              value={dirInput}
              onChange={(e) => setDirInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addDirection();
                }
              }}
              placeholder="laoag_paoay"
              className="font-data border-line-strong bg-card text-ink placeholder:text-ink-meta focus:border-action focus:ring-action/15 rounded-input h-12 min-w-0 flex-1 border-[1.5px] px-4 text-[14px] focus:ring-[3px] focus:outline-none"
            />
            <Button variant="outline" className="h-12" onClick={addDirection}>
              Add
            </Button>
          </div>
        </Field>
        {directions.length > 0 && (
          <div className="-mt-2 flex flex-wrap gap-2">
            {directions.map((dir, i) => (
              <span
                key={dir}
                className="bg-action-soft text-action inline-flex h-8 items-center gap-1.5 rounded-full pr-1.5 pl-3 text-[13px] font-semibold"
              >
                {formatDirection(dir)}
                <button
                  type="button"
                  onClick={() => removeDirection(i)}
                  aria-label={`Remove ${formatDirection(dir)}`}
                  className="hover:bg-action/15 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            id="route-start"
            type="time"
            label="Sharing opens"
            className="font-data"
            error={!!errors.workingHours?.start}
            hint={errors.workingHours?.start?.message}
            {...register('workingHours.start')}
          />
          <Input
            id="route-end"
            type="time"
            label="Sharing closes"
            className="font-data"
            error={!!errors.workingHours?.end}
            hint={errors.workingHours?.end?.message}
            {...register('workingHours.end')}
          />
        </div>

        <div className="border-line rounded-tile flex items-center justify-between gap-4 border-[1.5px] p-4">
          <div>
            <p className="text-ink text-[14px] font-bold">Active</p>
            <p className="text-ink-muted mt-0.5 text-[13px]">
              Turn off to mark the route inactive.
            </p>
          </div>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Switch
                checked={!!field.value}
                onCheckedChange={field.onChange}
                aria-label="Active"
              />
            )}
          />
        </div>

        {route && (
          <PanelActionRow
            tone="danger"
            title="Delete this route"
            description="Also deletes its stops, fares and the drivers on it."
            action={
              <Button variant="danger-outline" size="sm" onClick={() => onDelete(route)}>
                Delete route
              </Button>
            }
          />
        )}
      </form>
    </SidePanel>
  );
}
