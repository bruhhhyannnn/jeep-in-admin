'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Bus, UserMinus, UserCheck, Copy, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { PageBreadcrumb } from '@/components/common';
import {
  Button,
  Input,
  Label,
  Select,
  Badge,
  Modal,
  ConfirmDialog,
  DataTable,
  PageError,
} from '@/components/ui';
import { useAuthStore } from '@/store';
import {
  useDrivers,
  useJeepneys,
  useCreateDriver,
  useDeactivateDriver,
  useReactivateDriver,
  useDeleteDriver,
  useAssignJeepney,
  useUnassignJeepney,
  useUnassignedJeepneys,
  useOrganization,
  useOrganizations,
} from '@/hooks';
import { driverCreateSchema, type DriverCreateFormData } from '@/lib';
import type { ColumnDef } from '@tanstack/react-table';
import type { DriverProfile } from '@/types';
import { toDate } from '@/lib';

export default function DriversPage() {
  const { userProfile } = useAuthStore();
  const isSuperAdmin = userProfile?.role === 'super_admin';

  const { data: allOrgs = [] } = useOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState('');

  useEffect(() => {
    if (isSuperAdmin && !selectedOrgId && allOrgs.length > 0) {
      setSelectedOrgId(allOrgs[0].id);
    }
  }, [isSuperAdmin, allOrgs, selectedOrgId]);

  const orgId = isSuperAdmin ? selectedOrgId : (userProfile?.organizationId ?? '');
  const { data: org } = useOrganization(orgId);
  const routeId = org?.routeId ?? '';

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [reactivateId, setReactivateId] = useState<string | null>(null);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<{
    driverUid: string;
    jeepneyId: string;
  } | null>(null);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const { data: drivers = [], isPending, isFetching, error } = useDrivers(orgId);
  const { data: allJeepneys = [] } = useJeepneys(orgId);
  const { data: unassignedJeepneys = [] } = useUnassignedJeepneys(orgId);

  const jeepneyMap = Object.fromEntries(allJeepneys.map((j) => [j.id, j]));
  // const updateDriver = useUpdateDriver();
  const deactivateDriver = useDeactivateDriver();
  const reactivateDriver = useReactivateDriver();
  const deleteDriver = useDeleteDriver();
  const assignJeepney = useAssignJeepney();
  const unassignJeepney = useUnassignJeepney();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = debouncedQuery
    ? drivers.filter((d) =>
        `${d.firstName} ${d.lastName} ${d.email}`
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase())
      )
    : drivers;

  const handleCopyEmail = async (email: string, uid: string) => {
    await navigator.clipboard.writeText(email);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
    toast.success('Email copied');
  };

  const columns: ColumnDef<DriverProfile, unknown>[] = [
    {
      id: 'name',
      header: 'Driver',
      accessorFn: (d) => `${d.firstName} ${d.lastName}`,
      cell: ({ row: { original: d } }) => (
        <div className="flex items-center gap-3">
          <div className="bg-brand-600/20 text-brand-400 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {d.firstName.charAt(0).toUpperCase()}
            {d.lastName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {d.firstName} {d.lastName}
            </p>
            <p className="text-xs text-gray-500">{d.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (d) => d.isActive,
      cell: ({ row: { original: d } }) => (
        <Badge color={d.isActive ? 'success' : 'danger'} size="sm">
          {d.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'jeepney',
      header: 'Assigned Jeepney',
      accessorFn: (d) => {
        const j = d.assignedJeepneyId ? jeepneyMap[d.assignedJeepneyId] : null;
        return j ? `${j.jeepneyNumber} ${j.plateNumber}` : '';
      },
      cell: ({ row: { original: d } }) => {
        const j = d.assignedJeepneyId ? jeepneyMap[d.assignedJeepneyId] : null;
        return j ? (
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              #{j.jeepneyNumber}
            </p>
            <p className="font-mono text-xs text-gray-500">{j.plateNumber}</p>
          </div>
        ) : (
          <span className="text-xs text-gray-500">—</span>
        );
      },
    },
    {
      id: 'mustChange',
      header: 'Password',
      cell: ({ row: { original: d } }) =>
        d.mustChangePassword ? (
          <Badge color="warning" size="sm">
            Must change
          </Badge>
        ) : (
          <Badge color="success" size="sm">
            Set
          </Badge>
        ),
    },
    {
      id: 'created',
      header: 'Created',
      accessorFn: (d) => d.createdAt,
      cell: ({ row: { original: d } }) => {
        const date = toDate(d.createdAt);
        return (
          <span className="text-xs text-gray-500">{date ? format(date, 'MMM d, yyyy') : '—'}</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row: { original: d } }) => (
        <div className="flex items-center gap-3">
          <button
            title="Copy email"
            onClick={() => handleCopyEmail(d.email, d.uid)}
            className="cursor-pointer text-gray-600 transition-colors hover:text-gray-300"
          >
            {copiedUid === d.uid ? (
              <Check size={16} className="text-success-400" />
            ) : (
              <Copy size={16} />
            )}
          </button>
          {d.isActive && (
            <button
              title="Deactivate driver"
              onClick={() => setDeactivateId(d.uid)}
              className="hover:text-warning-400 cursor-pointer text-gray-600 transition-colors"
            >
              <UserMinus size={16} />
            </button>
          )}
          {!d.isActive && (
            <button
              title="Reactivate driver"
              onClick={() => setReactivateId(d.uid)}
              className="hover:text-success-400 cursor-pointer text-gray-600 transition-colors"
            >
              <UserCheck size={16} />
            </button>
          )}
          {!d.assignedJeepneyId && d.isActive && (
            <button
              title="Assign jeepney"
              onClick={() => setAssignId(d.uid)}
              className="hover:text-brand-400 cursor-pointer text-gray-600 transition-colors"
            >
              <Bus size={16} />
            </button>
          )}
          {d.assignedJeepneyId && (
            <button
              title="Unassign jeepney"
              onClick={() =>
                setUnassignTarget({ driverUid: d.uid, jeepneyId: d.assignedJeepneyId! })
              }
              className="hover:text-danger-400 cursor-pointer text-gray-600 transition-colors"
            >
              <Bus size={16} />
            </button>
          )}
          <button
            title="Delete driver"
            onClick={() => setDeleteId(d.uid)}
            className="hover:text-danger-400 cursor-pointer text-gray-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (error) return <PageError message={error.message} />;

  return (
    <>
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Drivers" />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {isSuperAdmin && (
              <Select
                options={allOrgs.map((o) => ({ value: o.id, label: `${o.id} — ${o.name}` }))}
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                placeholder="Select organization…"
              />
            )}
            <div className="relative max-w-sm min-w-48 flex-1">
              <Search
                size={15}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-600"
              />
              <Input
                placeholder="Search drivers…"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)} startIcon={<Plus size={16} />}>
            Add Driver
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={isPending || isFetching}
          emptyMessage="No drivers found"
        />
      </div>

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add Driver">
        <DriverCreateForm
          orgId={orgId}
          routeId={routeId}
          onSuccess={() => {
            setCreateOpen(false);
            toast.success('Driver created');
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {/* Assign jeepney modal */}
      <Modal isOpen={!!assignId} onClose={() => setAssignId(null)} title="Assign Jeepney">
        {assignId && (
          <AssignJeepneyForm
            driverUid={assignId}
            jeepneys={unassignedJeepneys}
            onSuccess={() => {
              setAssignId(null);
              toast.success('Jeepney assigned');
            }}
            onCancel={() => setAssignId(null)}
            isPending={assignJeepney.isPending}
            onAssign={(jeepneyId) => assignJeepney.mutate({ driverUid: assignId, jeepneyId })}
          />
        )}
      </Modal>

      {/* Unassign jeepney confirm */}
      <ConfirmDialog
        isOpen={!!unassignTarget}
        onClose={() => setUnassignTarget(null)}
        onConfirm={() =>
          unassignJeepney.mutate(unassignTarget!, {
            onSuccess: () => {
              setUnassignTarget(null);
              toast.success('Jeepney unassigned');
            },
            onError: (e) => toast.error(e.message),
          })
        }
        title="Unassign jeepney"
        message="This will remove the jeepney assignment from this driver. The jeepney will become available for reassignment."
        confirmLabel="Unassign"
        variant="danger"
        isLoading={unassignJeepney.isPending}
      />

      {/* Deactivate confirm */}
      <ConfirmDialog
        isOpen={!!deactivateId}
        onClose={() => setDeactivateId(null)}
        onConfirm={() =>
          deactivateDriver.mutate(deactivateId!, {
            onSuccess: () => {
              setDeactivateId(null);
              toast.success('Driver deactivated');
            },
            onError: (e) => toast.error(e.message),
          })
        }
        title="Deactivate driver"
        message="This driver will be marked inactive and their current session will be revoked. Their jeepney assignment will also be cleared."
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={deactivateDriver.isPending}
      />

      {/* Reactivate confirm */}
      <ConfirmDialog
        isOpen={!!reactivateId}
        onClose={() => setReactivateId(null)}
        onConfirm={() =>
          reactivateDriver.mutate(reactivateId!, {
            onSuccess: () => {
              setReactivateId(null);
              toast.success('Driver reactivated');
            },
            onError: (e) => toast.error(e.message),
          })
        }
        title="Reactivate driver"
        message="This driver will be marked active again and can log in to the app."
        confirmLabel="Reactivate"
        variant="primary"
        isLoading={reactivateDriver.isPending}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() =>
          deleteDriver.mutate(deleteId!, {
            onSuccess: () => {
              setDeleteId(null);
              toast.success('Driver deleted');
            },
            onError: (e) => toast.error(e.message),
          })
        }
        title="Delete driver"
        message="This will permanently delete the driver account from the system. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteDriver.isPending}
      />
    </>
  );
}

/* ─── Create Form ─── */
function DriverCreateForm({
  orgId,
  routeId,
  onSuccess,
  onCancel,
}: {
  orgId: string;
  routeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const createDriver = useCreateDriver();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DriverCreateFormData>({
    resolver: zodResolver(driverCreateSchema),
  });

  const onSubmit = handleSubmit((data) => {
    createDriver.mutate(
      { data, organizationId: orgId, routeId },
      { onSuccess, onError: (e) => toast.error(e.message) }
    );
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>First Name</Label>
          <Input
            error={!!errors.firstName}
            hint={errors.firstName?.message}
            {...register('firstName')}
          />
        </div>
        <div>
          <Label required>Last Name</Label>
          <Input
            error={!!errors.lastName}
            hint={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
      </div>
      <div>
        <Label required>Email</Label>
        <Input
          type="email"
          error={!!errors.email}
          hint={errors.email?.message}
          {...register('email')}
        />
      </div>
      <div>
        {/* TODO: UI improvement of using eye icon */}
        <Label required>Temporary Password</Label>
        <Input
          type="password"
          placeholder="Min. 8 characters"
          error={!!errors.password}
          hint={errors.password?.message}
          {...register('password')}
        />
        <p className="mt-1 text-xs text-gray-600">
          Share this password with the driver. They will be prompted to change it on first login.
        </p>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          isLoading={isSubmitting || createDriver.isPending}
          loadingText="Creating…"
        >
          Create Driver
        </Button>
      </div>
    </form>
  );
}

/* ─── Assign Jeepney Form ─── */
function AssignJeepneyForm({
  jeepneys,
  onSuccess,
  onCancel,
  isPending,
  onAssign,
}: {
  driverUid: string;
  jeepneys: { id: string; plateNumber: string; jeepneyNumber: string }[];
  onSuccess: () => void;
  onCancel: () => void;
  isPending: boolean;
  onAssign: (jeepneyId: string) => void;
}) {
  const [selected, setSelected] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <Label required>Select Jeepney</Label>
        <Select
          options={jeepneys.map((j) => ({
            value: j.id,
            label: `${j.jeepneyNumber} — ${j.plateNumber}`,
          }))}
          placeholder="Choose a jeepney…"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        />
        {jeepneys.length === 0 && (
          <p className="text-warning-400 mt-2 text-xs">No unassigned jeepneys available.</p>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!selected || isPending}
          isLoading={isPending}
          loadingText="Assigning…"
          onClick={() => {
            if (selected) {
              onAssign(selected);
              onSuccess();
            }
          }}
        >
          Assign
        </Button>
      </div>
    </div>
  );
}
