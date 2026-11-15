'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Plus, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
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
  PanelValue,
  Select,
  SidePanel,
  StatusChip,
} from '@/components/ui';
import {
  Avatar,
  FilterChips,
  Notice,
  OrgPicker,
  PageHeader,
  SearchField,
  UnitTile,
} from '@/components/common';
import {
  useAssignJeepney,
  useCreateDriver,
  useDeactivateDriver,
  useDeleteDriver,
  useDrivers,
  useJeepneys,
  useOrgScope,
  useOrganization,
  useReactivateDriver,
  useUnassignJeepney,
  useNow,
} from '@/hooks';
import {
  driverCreateSchema,
  generatePassword,
  timeAgo,
  toDate,
  type DriverCreateFormData,
} from '@/lib';
import type { DriverProfile, Jeepney } from '@/types';

type DriverFilter = 'all' | 'active' | 'inactive' | 'temp';
type ConfirmKind = 'deactivate' | 'reactivate' | 'delete';

const fullName = (d: DriverProfile) => `${d.firstName} ${d.lastName}`;

export default function DriversPage() {
  const { orgId } = useOrgScope();
  const { data: org } = useOrganization(orgId || undefined);
  const routeId = org?.routeId ?? '';

  const { data: drivers = [], isPending, error } = useDrivers(orgId);
  const { data: jeepneys = [] } = useJeepneys(orgId);
  const jeepneyById = new Map(jeepneys.map((j) => [j.id, j]));

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<DriverFilter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editUid, setEditUid] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; driver: DriverProfile } | null>(null);

  const editing = drivers.find((d) => d.uid === editUid) ?? null;

  const counts = {
    all: drivers.length,
    active: drivers.filter((d) => d.isActive).length,
    inactive: drivers.filter((d) => !d.isActive).length,
    temp: drivers.filter((d) => d.mustChangePassword).length,
  };

  const q = query.trim().toLowerCase();
  const filtered = drivers
    .filter((d) =>
      filter === 'active'
        ? d.isActive
        : filter === 'inactive'
          ? !d.isActive
          : filter === 'temp'
            ? d.mustChangePassword
            : true
    )
    .filter((d) => !q || `${fullName(d)} ${d.email}`.toLowerCase().includes(q));

  const columns: ColumnDef<DriverProfile, unknown>[] = [
    {
      id: 'name',
      header: 'Driver',
      accessorFn: (d) => fullName(d),
      cell: ({ row: { original: d } }) => (
        <div className="flex items-center gap-3">
          <Avatar name={fullName(d)} size="md" />
          <div className="min-w-0">
            <p className="text-ink truncate font-semibold">{fullName(d)}</p>
            <p className="text-ink-muted truncate text-[12px]">{d.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'unit',
      header: 'Unit today',
      accessorFn: (d) =>
        d.assignedJeepneyId ? jeepneyById.get(d.assignedJeepneyId)?.plateNumber : '',
      cell: ({ row: { original: d } }) => {
        const j = d.assignedJeepneyId ? jeepneyById.get(d.assignedJeepneyId) : undefined;
        return j ? (
          <div className="flex items-center gap-2.5">
            <UnitTile number={j.jeepneyNumber} size="sm" />
            <span className="font-data text-ink text-[13px] font-semibold">{j.plateNumber}</span>
          </div>
        ) : (
          <span className="text-ink-muted">—</span>
        );
      },
    },
    {
      id: 'signin',
      header: 'Sign-in',
      accessorFn: (d) => d.mustChangePassword,
      cell: ({ row: { original: d } }) =>
        d.mustChangePassword ? (
          <StatusChip tone="pending">Temporary password</StatusChip>
        ) : (
          <StatusChip tone="neutral">Own password</StatusChip>
        ),
    },
    {
      id: 'created',
      header: 'Added',
      accessorFn: (d) => toDate(d.createdAt)?.getTime() ?? 0,
      cell: ({ row: { original: d } }) => {
        const date = toDate(d.createdAt);
        return (
          <span className="text-ink-muted text-[13px]">
            {date ? format(date, 'MMM d, yyyy') : '—'}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (d) => d.isActive,
      cell: ({ row: { original: d } }) =>
        d.isActive ? (
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
      cell: ({ row: { original: d } }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditUid(d.uid);
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
          title="Drivers"
          description={`${counts.all} ${counts.all === 1 ? 'record' : 'records'} · ${counts.active} active, ${counts.inactive} inactive`}
          actions={
            <>
              <OrgPicker />
              <SearchField value={query} onChange={setQuery} placeholder="Search name or email" />
              <Button
                startIcon={<Plus size={17} />}
                onClick={() => setAddOpen(true)}
                disabled={!orgId}
              >
                Add driver
              </Button>
            </>
          }
        />

        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'active', label: 'Active', count: counts.active },
            { value: 'inactive', label: 'Inactive', count: counts.inactive },
            { value: 'temp', label: 'Temporary password', count: counts.temp },
          ]}
        />

        <DataTable
          columns={columns}
          data={filtered}
          loading={!!orgId && isPending}
          emptyMessage={q || filter !== 'all' ? 'No drivers match' : 'No drivers yet'}
          emptyHint={
            q || filter !== 'all'
              ? 'Try another name or filter.'
              : 'Add a driver, then give them a unit on Assignments.'
          }
          onRowClick={(d) => setEditUid(d.uid)}
          pageSize={20}
        />
      </div>

      <DriverCreatePanel
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        orgId={orgId}
        routeId={routeId}
      />

      <DriverEditPanel
        driver={editing}
        jeepneys={jeepneys}
        onClose={() => setEditUid(null)}
        onAction={(kind, driver) => setConfirm({ kind, driver })}
      />

      <DriverConfirm
        confirm={confirm}
        jeepneyById={jeepneyById}
        onClose={() => setConfirm(null)}
        onDeleted={() => setEditUid(null)}
      />
    </>
  );
}

/* ─── Add a driver ─── */
function DriverCreatePanel({
  isOpen,
  onClose,
  orgId,
  routeId,
}: {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  routeId: string;
}) {
  const createDriver = useCreateDriver();
  const [copied, setCopied] = useState(false);
  const formId = 'driver-create-form';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DriverCreateFormData>({ resolver: zodResolver(driverCreateSchema) });

  useEffect(() => {
    if (isOpen) reset({ firstName: '', lastName: '', email: '', password: generatePassword() });
  }, [isOpen, reset]);

  const password = watch('password') ?? '';
  const isSaving = isSubmitting || createDriver.isPending;

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Select the password and copy it yourself.');
    }
  };

  const onSubmit = handleSubmit((data) => {
    createDriver.mutate(
      { data, organizationId: orgId, routeId },
      {
        onSuccess: () => {
          toast.success(`${data.firstName} ${data.lastName} added`);
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  });

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      busy={isSaving}
      title="Add a driver"
      subtitle="They sign in to the driver app with this email."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} isLoading={isSaving} loadingText="Saving…">
            Save this driver
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-5" noValidate>
        {!routeId && (
          <Notice
            icon={<KeyRound size={16} />}
            tone="info"
            title="This organization has no route yet"
            description="The driver is saved without a route until one is assigned."
          />
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            id="firstName"
            label="First name"
            autoComplete="off"
            error={!!errors.firstName}
            hint={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            id="lastName"
            label="Last name"
            autoComplete="off"
            error={!!errors.lastName}
            hint={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
        <Input
          id="email"
          type="email"
          label="Email"
          autoComplete="off"
          placeholder="name@email.com"
          error={!!errors.email}
          hint={errors.email?.message ?? "This is what they type on the driver app's sign-in."}
          {...register('email')}
        />

        <Field
          label="Password · made for you"
          htmlFor="password"
          error={errors.password?.message}
          hint="Share it with the driver. They choose their own the first time they sign in."
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <input
                id="password"
                autoComplete="off"
                spellCheck={false}
                className="font-data border-line-strong bg-sunken text-ink focus:border-action focus:ring-action/15 rounded-input h-12 w-full border-[1.5px] pr-24 pl-4 text-[15px] focus:ring-[3px] focus:outline-none"
                {...register('password')}
              />
              <button
                type="button"
                onClick={copyPassword}
                className="text-action hover:bg-action-soft absolute top-1/2 right-2 flex h-8 -translate-y-1/2 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <Button
              variant="outline"
              className="h-12"
              startIcon={<RefreshCw size={15} />}
              onClick={() => setValue('password', generatePassword(), { shouldValidate: true })}
            >
              Make a new one
            </Button>
          </div>
        </Field>
      </form>
    </SidePanel>
  );
}

/* ─── Edit a driver ─── */
function DriverEditPanel({
  driver,
  jeepneys,
  onClose,
  onAction,
}: {
  driver: DriverProfile | null;
  jeepneys: Jeepney[];
  onClose: () => void;
  onAction: (kind: ConfirmKind, driver: DriverProfile) => void;
}) {
  const assign = useAssignJeepney();
  const unassign = useUnassignJeepney();
  const now = useNow(30_000);
  const [unitId, setUnitId] = useState('');
  const [copied, setCopied] = useState(false);

  // Keep the last driver around while the panel animates closed.
  const [shown, setShown] = useState<DriverProfile | null>(driver);
  useEffect(() => {
    if (driver) setShown(driver);
  }, [driver]);

  useEffect(() => {
    setUnitId(driver?.assignedJeepneyId ?? '');
  }, [driver?.uid, driver?.assignedJeepneyId]);

  const d = driver ?? shown;
  if (!d) return null;

  const currentUnit = jeepneys.find((j) => j.id === d.assignedJeepneyId);
  const lastShared = toDate(d.lastLocationUpdate);
  const added = toDate(d.createdAt);
  const isSaving = assign.isPending || unassign.isPending;
  const dirty = unitId !== (d.assignedJeepneyId ?? '');

  const unitOptions = [
    { value: '', label: 'No unit' },
    ...[...jeepneys]
      .sort((a, b) => a.jeepneyNumber.localeCompare(b.jeepneyNumber, undefined, { numeric: true }))
      .map((j) => ({
        value: j.id,
        label: `J${j.jeepneyNumber} · ${j.plateNumber}${j.assignedDriverId && j.assignedDriverId !== d.uid ? ' (has a driver)' : ''}`,
        disabled: !!j.assignedDriverId && j.assignedDriverId !== d.uid,
      })),
  ];

  const save = async () => {
    try {
      if (!unitId && d.assignedJeepneyId) {
        await unassign.mutateAsync({ driverUid: d.uid, jeepneyId: d.assignedJeepneyId });
      } else if (unitId) {
        await assign.mutateAsync({ driverUid: d.uid, jeepneyId: unitId });
      }
      toast.success('Changes saved');
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save changes');
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(d.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the email');
    }
  };

  return (
    <SidePanel
      isOpen={!!driver}
      onClose={onClose}
      busy={isSaving}
      title={fullName(d)}
      subtitle={[
        d.email,
        d.isActive ? 'active' : 'inactive',
        currentUnit ? `Unit J${currentUnit.jeepneyNumber}` : null,
      ]
        .filter(Boolean)
        .join(' · ')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!dirty} isLoading={isSaving} loadingText="Saving…">
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {d.mustChangePassword && (
          <Notice
            icon={<KeyRound size={16} />}
            title="Still on the temporary password"
            description="The app asks them to choose their own the first time they sign in."
          />
        )}

        <div className="flex items-center gap-4">
          <Avatar name={fullName(d)} size="lg" />
          <div className="min-w-0">
            <p className="text-ink text-[15px] font-bold">{fullName(d)}</p>
            <p className="text-ink-muted text-[13px]">
              {lastShared
                ? `Last shared location ${timeAgo(lastShared, now)} ago`
                : 'Has not shared a location yet'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PanelValue label="Email">
            <span className="flex w-full items-center justify-between gap-2">
              <span className="min-w-0 truncate">{d.email}</span>
              <button
                type="button"
                onClick={copyEmail}
                aria-label="Copy email"
                className="text-action hover:bg-action-soft flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </span>
          </PanelValue>
          <PanelValue label="Added">{added ? format(added, 'MMM d, yyyy') : '—'}</PanelValue>
          <PanelValue label="Driver ID" mono>
            {d.uid.slice(0, 12)}
          </PanelValue>
          <PanelValue label="Sign-in">
            {d.mustChangePassword ? 'Temporary password' : 'Own password'}
          </PanelValue>
        </div>

        <Field
          label="Unit today"
          htmlFor="driver-unit"
          hint={
            d.isActive
              ? 'Saving moves them onto this unit right away.'
              : 'Reactivate them to give them a unit.'
          }
        >
          <Select
            id="driver-unit"
            options={unitOptions}
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            disabled={!d.isActive}
          />
        </Field>

        {d.isActive ? (
          <PanelActionRow
            title="Leaving the cooperative"
            description="Ends their sign-in and frees their unit. The record stays."
            action={
              <Button variant="outline" size="sm" onClick={() => onAction('deactivate', d)}>
                Deactivate this driver
              </Button>
            }
          />
        ) : (
          <PanelActionRow
            title="Back on the roster"
            description="Lets them sign in to the driver app again."
            action={
              <Button variant="outline" size="sm" onClick={() => onAction('reactivate', d)}>
                Reactivate
              </Button>
            }
          />
        )}

        <PanelActionRow
          tone="danger"
          title="Delete the account"
          description="Removes their sign-in and record for good."
          action={
            <Button variant="danger-outline" size="sm" onClick={() => onAction('delete', d)}>
              Delete driver
            </Button>
          }
        />
      </div>
    </SidePanel>
  );
}

/* ─── Confirm dialogs ─── */
function DriverConfirm({
  confirm,
  jeepneyById,
  onClose,
  onDeleted,
}: {
  confirm: { kind: ConfirmKind; driver: DriverProfile } | null;
  jeepneyById: Map<string, Jeepney>;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const deactivate = useDeactivateDriver();
  const reactivate = useReactivateDriver();
  const remove = useDeleteDriver();

  // Keep content stable during the close animation.
  const [last, setLast] = useState(confirm);
  useEffect(() => {
    if (confirm) setLast(confirm);
  }, [confirm]);
  const c = confirm ?? last;
  if (!c) return null;

  const { kind, driver } = c;
  const name = fullName(driver);
  const unit = driver.assignedJeepneyId ? jeepneyById.get(driver.assignedJeepneyId) : undefined;
  const handlers = { onError: (e: Error) => toast.error(e.message) };

  if (kind === 'deactivate') {
    return (
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={onClose}
        title={`Deactivate ${name}?`}
        message={
          unit
            ? `They drive ${unit.plateNumber} today. Deactivating takes them off that unit straight away, and it will have no driver until you assign someone.`
            : "They won't be able to sign in to the driver app until you reactivate them."
        }
        cancelLabel="Keep them active"
        confirmLabel="Deactivate this driver"
        loadingText="Deactivating…"
        isLoading={deactivate.isPending}
        onConfirm={() =>
          deactivate.mutate(driver.uid, {
            ...handlers,
            onSuccess: () => {
              toast.success(`${name} deactivated`);
              onClose();
            },
          })
        }
      >
        <ConfirmFacts
          items={[
            { label: 'Kept', text: 'The record, and their history in the audit logs.' },
            { label: 'Removed', text: "Their current sign-in and today's unit." },
          ]}
        />
      </ConfirmDialog>
    );
  }

  if (kind === 'reactivate') {
    return (
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={onClose}
        variant="primary"
        title={`Reactivate ${name}?`}
        message="They can sign in to the driver app again. Give them a unit on Assignments."
        cancelLabel="Not now"
        confirmLabel="Reactivate"
        loadingText="Reactivating…"
        isLoading={reactivate.isPending}
        onConfirm={() =>
          reactivate.mutate(driver.uid, {
            ...handlers,
            onSuccess: () => {
              toast.success(`${name} is active again`);
              onClose();
            },
          })
        }
      />
    );
  }

  return (
    <ConfirmDialog
      isOpen={!!confirm}
      onClose={onClose}
      title={`Delete ${name}?`}
      message="This removes their sign-in, their record and their last shared location. It can't be undone."
      cancelLabel="Keep the record"
      confirmLabel="Delete driver"
      loadingText="Deleting…"
      isLoading={remove.isPending}
      onConfirm={() =>
        remove.mutate(driver.uid, {
          ...handlers,
          onSuccess: () => {
            toast.success(`${name} deleted`);
            onClose();
            onDeleted();
          },
        })
      }
    >
      {unit && (
        <ConfirmFacts
          items={[
            {
              label: 'Also',
              text: `${unit.plateNumber} will have no driver until you assign someone.`,
            },
          ]}
        />
      )}
    </ConfirmDialog>
  );
}
