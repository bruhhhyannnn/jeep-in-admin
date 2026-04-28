'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { PageBreadcrumb } from '@/components/common';
import {
  Button,
  Input,
  Label,
  Badge,
  Modal,
  ConfirmDialog,
  DataTable,
  PageError,
} from '@/components/ui';
import { useAuthStore } from '@/store';
import {
  useJeepneys,
  useDrivers,
  useCreateJeepney,
  useUpdateJeepney,
  useDeleteJeepney,
  useOrganization,
} from '@/hooks';
import { jeepneySchema, type JeepneyFormData } from '@/lib';
import type { ColumnDef } from '@tanstack/react-table';
import type { Jeepney } from '@/types';
import { toDate } from '@/lib';

export default function JeepneysPage() {
  const { userProfile } = useAuthStore();
  const orgId = userProfile?.organizationId ?? '';
  const { data: org } = useOrganization(orgId);
  const routeId = org?.routeId ?? '';

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: jeepneys = [], isPending, isFetching, error } = useJeepneys(orgId);
  const { data: allDrivers = [] } = useDrivers(orgId);
  const driverMap = Object.fromEntries(allDrivers.map((d) => [d.uid, d]));
  const deleteJeepney = useDeleteJeepney();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = debouncedQuery
    ? jeepneys.filter((j) =>
        `${j.plateNumber} ${j.jeepneyNumber}`.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : jeepneys;

  const handleClose = () => {
    setModalOpen(false);
    setEditId(null);
  };

  const columns: ColumnDef<Jeepney, unknown>[] = [
    {
      accessorKey: 'jeepneyNumber',
      header: 'Jeepney No.',
      cell: ({ getValue }) => (
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          #{String(getValue())}
        </span>
      ),
    },
    {
      accessorKey: 'plateNumber',
      header: 'Plate Number',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
          {String(getValue())}
        </span>
      ),
    },
    {
      id: 'assignment',
      header: 'Driver',
      accessorFn: (j) => {
        const d = j.assignedDriverId ? driverMap[j.assignedDriverId] : null;
        return d ? `${d.firstName} ${d.lastName}` : '';
      },
      cell: ({ row: { original: j } }) => {
        const d = j.assignedDriverId ? driverMap[j.assignedDriverId] : null;
        return d ? (
          <div className="flex items-center gap-2">
            <div className="bg-brand-600/20 text-brand-400 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              {d.firstName.charAt(0).toUpperCase()}
              {d.lastName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {d.firstName} {d.lastName}
              </p>
              <p className="text-xs text-gray-500">{d.email}</p>
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-500">—</span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (j) => j.isActive,
      cell: ({ row: { original: j } }) => (
        <Badge color={j.isActive ? 'success' : 'danger'} size="sm">
          {j.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'created',
      header: 'Created',
      accessorFn: (j) => j.createdAt,
      cell: ({ row: { original: j } }) => {
        const d = toDate(j.createdAt);
        return <span className="text-xs text-gray-500">{d ? format(d, 'MMM d, yyyy') : '—'}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row: { original: j } }) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditId(j.id);
              setModalOpen(true);
            }}
            className="hover:text-brand-400 cursor-pointer text-gray-600 transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeleteId(j.id)}
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
        <PageBreadcrumb pageTitle="Jeepneys" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-600" />
            <Input
              placeholder="Search by plate or number…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setModalOpen(true)} startIcon={<Plus size={16} />}>
            Add Jeepney
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={isPending || isFetching}
          emptyMessage="No jeepneys found"
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={editId ? 'Edit Jeepney' : 'Add Jeepney'}
      >
        <JeepneyForm
          orgId={orgId}
          routeId={routeId}
          editId={editId}
          onSuccess={() => {
            handleClose();
            toast.success(editId ? 'Jeepney updated' : 'Jeepney created');
          }}
          onCancel={handleClose}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() =>
          deleteJeepney.mutate(deleteId!, {
            onSuccess: () => {
              setDeleteId(null);
              toast.success('Jeepney deleted');
            },
            onError: (e) => toast.error(e.message),
          })
        }
        title="Delete jeepney"
        message="This will permanently remove this jeepney unit. Any driver assignment will also be cleared."
        confirmLabel="Delete"
        isLoading={deleteJeepney.isPending}
      />
    </>
  );
}

/* ─── Jeepney Form (create & edit) ─── */
function JeepneyForm({
  orgId,
  routeId,
  editId,
  onSuccess,
  onCancel,
}: {
  orgId: string;
  routeId: string;
  editId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!editId;
  const createJeepney = useCreateJeepney();
  const updateJeepney = useUpdateJeepney();
  const { data: existing } = useJeepneys(orgId);
  const current = existing?.find((j) => j.id === editId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JeepneyFormData>({ resolver: zodResolver(jeepneySchema) });

  useEffect(() => {
    if (current) reset({ plateNumber: current.plateNumber, jeepneyNumber: current.jeepneyNumber });
  }, [current, reset]);

  const onSubmit = handleSubmit((data) => {
    if (isEdit) {
      updateJeepney.mutate(
        { id: editId!, data },
        { onSuccess, onError: (e) => toast.error(e.message) }
      );
    } else {
      createJeepney.mutate(
        { data, organizationId: orgId, routeId },
        { onSuccess, onError: (e) => toast.error(e.message) }
      );
    }
  });

  const isPending = isSubmitting || createJeepney.isPending || updateJeepney.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label required>Jeepney Number</Label>
        <Input
          placeholder="e.g. 01, A1, 12"
          error={!!errors.jeepneyNumber}
          hint={errors.jeepneyNumber?.message}
          {...register('jeepneyNumber')}
        />
      </div>
      <div>
        <Label required>Plate Number</Label>
        <Input
          placeholder="e.g. ABC-1234"
          error={!!errors.plateNumber}
          hint={errors.plateNumber?.message}
          {...register('plateNumber')}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" isLoading={isPending} loadingText="Saving…">
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
