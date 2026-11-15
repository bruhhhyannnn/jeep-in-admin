'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Button,
  ConfirmDialog,
  DataTable,
  Input,
  PageError,
  PanelActionRow,
  SidePanel,
  StatusChip,
} from '@/components/ui';
import { Avatar, OrgPicker, PageHeader, SearchField, UnitTile } from '@/components/common';
import {
  useCreateJeepney,
  useDeleteJeepney,
  useDrivers,
  useJeepneys,
  useOrgScope,
  useOrganization,
  useRoute,
  useUpdateJeepney,
} from '@/hooks';
import { jeepneySchema, toDate, type JeepneyFormData } from '@/lib';
import type { DriverProfile, Jeepney } from '@/types';

const fullName = (d: DriverProfile) => `${d.firstName} ${d.lastName}`;

export default function JeepneysPage() {
  const { orgId } = useOrgScope();
  const { data: org } = useOrganization(orgId || undefined);
  const routeId = org?.routeId ?? '';
  const { data: route } = useRoute(routeId || undefined);

  const { data: jeepneys = [], isPending, error } = useJeepneys(orgId);
  const { data: drivers = [] } = useDrivers(orgId);
  const driverById = new Map(drivers.map((d) => [d.uid, d]));

  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>({
    mode: 'add',
  });
  const [panelOpen, setPanelOpen] = useState(false);
  const openPanel = (next: typeof panel) => {
    setPanel(next);
    setPanelOpen(true);
  };
  const [deleting, setDeleting] = useState<Jeepney | null>(null);
  const deleteJeepney = useDeleteJeepney();

  const editing = panel.mode === 'edit' ? (jeepneys.find((j) => j.id === panel.id) ?? null) : null;
  const withDriver = jeepneys.filter((j) => j.assignedDriverId).length;
  const inactive = jeepneys.filter((j) => !j.isActive).length;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? jeepneys.filter((j) => `${j.plateNumber} ${j.jeepneyNumber}`.toLowerCase().includes(q))
    : jeepneys;

  const columns: ColumnDef<Jeepney, unknown>[] = [
    {
      id: 'unit',
      header: 'Unit',
      accessorFn: (j) => j.jeepneyNumber,
      sortingFn: 'alphanumeric',
      cell: ({ row: { original: j } }) => (
        <div className="flex items-center gap-3">
          <UnitTile number={j.jeepneyNumber} />
          <div>
            <p className="font-data text-ink text-[14px] font-bold">{j.plateNumber}</p>
            <p className="text-ink-muted text-[12px]">Unit J{j.jeepneyNumber}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'driver',
      header: 'Assigned driver',
      accessorFn: (j) => {
        const d = j.assignedDriverId ? driverById.get(j.assignedDriverId) : undefined;
        return d ? fullName(d) : '';
      },
      cell: ({ row: { original: j } }) => {
        const d = j.assignedDriverId ? driverById.get(j.assignedDriverId) : undefined;
        return d ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={fullName(d)} />
            <span className="text-ink font-semibold">{fullName(d)}</span>
          </div>
        ) : (
          <span className="text-ink-muted italic">No driver</span>
        );
      },
    },
    {
      id: 'status',
      header: 'Condition',
      accessorFn: (j) => j.isActive,
      cell: ({ row: { original: j } }) =>
        j.isActive ? (
          <StatusChip tone="live" dot>
            On the road
          </StatusChip>
        ) : (
          <StatusChip tone="neutral">Inactive</StatusChip>
        ),
    },
    {
      id: 'created',
      header: 'Added',
      accessorFn: (j) => toDate(j.createdAt)?.getTime() ?? 0,
      cell: ({ row: { original: j } }) => {
        const date = toDate(j.createdAt);
        return (
          <span className="text-ink-muted text-[13px]">
            {date ? format(date, 'MMM d, yyyy') : '—'}
          </span>
        );
      },
    },
    {
      id: 'edit',
      header: () => <span className="sr-only">Edit</span>,
      enableSorting: false,
      cell: ({ row: { original: j } }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openPanel({ mode: 'edit', id: j.id });
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  if (error) return <PageError message={error.message} />;

  const deletingDriver = deleting?.assignedDriverId
    ? driverById.get(deleting.assignedDriverId)
    : undefined;

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Jeepney units"
          description={`${jeepneys.length} ${jeepneys.length === 1 ? 'unit' : 'units'} · ${withDriver} with a driver${inactive ? ` · ${inactive} inactive` : ''}`}
          actions={
            <>
              <OrgPicker />
              <SearchField value={query} onChange={setQuery} placeholder="Search plate or unit" />
              <Button
                startIcon={<Plus size={17} />}
                onClick={() => openPanel({ mode: 'add' })}
                disabled={!orgId}
              >
                Add unit
              </Button>
            </>
          }
        />

        <DataTable
          columns={columns}
          data={filtered}
          loading={!!orgId && isPending}
          emptyMessage={q ? 'No units match your search' : 'No jeepney units yet'}
          emptyHint={q ? undefined : 'Add a unit, then give it a driver on Assignments.'}
          onRowClick={(j) => openPanel({ mode: 'edit', id: j.id })}
          pageSize={20}
        />
      </div>

      <JeepneyPanel
        isOpen={panelOpen}
        unit={editing}
        driver={editing?.assignedDriverId ? driverById.get(editing.assignedDriverId) : undefined}
        orgId={orgId}
        routeId={routeId}
        scopeLine={org ? `${org.name}${route ? ` · ${route.name}` : ''}` : ''}
        onClose={() => setPanelOpen(false)}
        onDelete={(j) => setDeleting(j)}
      />

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.plateNumber ?? 'this unit'}?`}
        message={
          deletingDriver
            ? `${fullName(deletingDriver)} drives it today and will be left without a unit. The record is removed for good.`
            : 'The record is removed for good. It disappears from every list and from the map.'
        }
        cancelLabel="Never mind"
        confirmLabel="Delete unit"
        loadingText="Deleting…"
        isLoading={deleteJeepney.isPending}
        onConfirm={() =>
          deleting &&
          deleteJeepney.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(`${deleting.plateNumber} deleted`);
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

/* ─── Add / edit a unit ─── */
function JeepneyPanel({
  isOpen,
  unit,
  driver,
  orgId,
  routeId,
  scopeLine,
  onClose,
  onDelete,
}: {
  isOpen: boolean;
  unit: Jeepney | null;
  driver?: DriverProfile;
  orgId: string;
  routeId: string;
  scopeLine: string;
  onClose: () => void;
  onDelete: (unit: Jeepney) => void;
}) {
  const isEdit = !!unit;
  const createJeepney = useCreateJeepney();
  const updateJeepney = useUpdateJeepney();
  const formId = 'jeepney-form';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<JeepneyFormData>({ resolver: zodResolver(jeepneySchema) });

  useEffect(() => {
    if (!isOpen) return;
    reset(
      unit
        ? { plateNumber: unit.plateNumber, jeepneyNumber: unit.jeepneyNumber }
        : { plateNumber: '', jeepneyNumber: '' }
    );
  }, [isOpen, unit, reset]);

  const isSaving = isSubmitting || createJeepney.isPending || updateJeepney.isPending;

  const onSubmit = handleSubmit((data) => {
    const done = {
      onSuccess: () => {
        toast.success(isEdit ? `${data.plateNumber} saved` : `${data.plateNumber} added`);
        onClose();
      },
      onError: (e: Error) => toast.error(e.message),
    };
    if (unit) updateJeepney.mutate({ id: unit.id, data }, done);
    else createJeepney.mutate({ data, organizationId: orgId, routeId }, done);
  });

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      busy={isSaving}
      title={unit ? unit.plateNumber : 'Add a jeepney unit'}
      subtitle={
        unit
          ? `Unit J${unit.jeepneyNumber} · ${driver ? `${fullName(driver)} drives it today` : 'no driver yet'}`
          : scopeLine
            ? `Joins the ${scopeLine} fleet.`
            : 'Jeepney units · new record'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={isEdit && !isDirty}
            isLoading={isSaving}
            loadingText="Saving…"
          >
            {isEdit ? 'Save changes' : 'Save this unit'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            id="jeepneyNumber"
            label="Unit number"
            placeholder="14"
            className="font-data"
            autoComplete="off"
            error={!!errors.jeepneyNumber}
            hint={errors.jeepneyNumber?.message ?? 'Up to 2 characters. Shown as J14.'}
            {...register('jeepneyNumber')}
          />
          <Input
            id="plateNumber"
            label="Plate number"
            placeholder="ABC 1234"
            className="font-data"
            autoComplete="off"
            error={!!errors.plateNumber}
            hint={errors.plateNumber?.message ?? 'Up to 8 characters.'}
            {...register('plateNumber')}
          />
        </div>

        <div className="bg-sunken rounded-tile p-4">
          <p className="text-ink text-[14px] font-bold">Drivers are assigned separately</p>
          <p className="text-ink-muted mt-1 text-[13px] leading-snug">
            Use Assignments to choose who drives this unit. Changes there take effect right away.
          </p>
        </div>

        {unit && (
          <PanelActionRow
            tone="danger"
            title="Taking it out of the fleet"
            description="Deletes the record. Any driver assignment is cleared."
            action={
              <Button variant="danger-outline" size="sm" onClick={() => onDelete(unit)}>
                Delete this unit
              </Button>
            }
          />
        )}
      </form>
    </SidePanel>
  );
}
