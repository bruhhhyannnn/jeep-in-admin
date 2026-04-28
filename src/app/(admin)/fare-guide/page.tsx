'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { PageBreadcrumb } from '@/components/common';
import {
  Button,
  Input,
  Label,
  Select,
  Modal,
  ConfirmDialog,
  DataTable,
  PageError,
} from '@/components/ui';
import {
  useFareGuide,
  useCreateFareEntry,
  useUpdateFareEntry,
  useDeleteFareEntry,
  useAllRoutes,
} from '@/hooks';
import { fareGuideSchema, type FareGuideFormData } from '@/lib';
import type { ColumnDef } from '@tanstack/react-table';
import type { FareGuide } from '@/types';

export default function FareGuidePage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterRouteId, setFilterRouteId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: routes = [] } = useAllRoutes();
  const {
    data: fareGuide = [],
    isPending,
    isFetching,
    error,
  } = useFareGuide(filterRouteId || undefined);
  const deleteFare = useDeleteFareEntry();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = debouncedQuery
    ? fareGuide.filter((f) => f.stopPointName.toLowerCase().includes(debouncedQuery.toLowerCase()))
    : fareGuide;

  const handleClose = () => {
    setModalOpen(false);
    setEditId(null);
  };

  const columns: ColumnDef<FareGuide, unknown>[] = [
    {
      accessorKey: 'stopPointName',
      header: 'Stop Point',
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-800 dark:text-gray-200">{String(getValue())}</span>
      ),
    },
    {
      accessorKey: 'distanceKm',
      header: 'Distance (km)',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
          {Number(getValue()).toFixed(1)} km
        </span>
      ),
    },
    {
      accessorKey: 'regularFare',
      header: 'Regular Fare',
      cell: ({ getValue }) => (
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          ₱{Number(getValue()).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'discountedFare',
      header: 'Discounted Fare',
      cell: ({ getValue }) => (
        <span className="text-success-400 dark:text-success-600 font-semibold">
          ₱{Number(getValue()).toFixed(2)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row: { original: f } }) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditId(f.id);
              setModalOpen(true);
            }}
            className="hover:text-brand-400 cursor-pointer text-gray-600 transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeleteId(f.id)}
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
        <PageBreadcrumb pageTitle="Fare Guide" />

        {/* Filters */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <Select
              options={[...routes.map((r) => ({ value: r.id, label: r.name }))]}
              value={filterRouteId}
              onChange={(e) => setFilterRouteId(e.target.value)}
              placeholder="All routes"
            />
            <div className="relative max-w-sm min-w-48 flex-1">
              <Search
                size={15}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-600"
              />
              <Input
                placeholder="Search stop points…"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={() => setModalOpen(true)} startIcon={<Plus size={16} />}>
            Add Fare Entry
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={isPending || isFetching}
          emptyMessage="No fare entries found"
          globalFilter={debouncedQuery}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={editId ? 'Edit Fare Entry' : 'Add Fare Entry'}
      >
        <FareGuideForm
          editId={editId}
          fareGuide={fareGuide}
          routes={routes}
          onSuccess={() => {
            handleClose();
            toast.success(editId ? 'Fare entry updated' : 'Fare entry created');
          }}
          onCancel={handleClose}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() =>
          deleteFare.mutate(deleteId!, {
            onSuccess: () => {
              setDeleteId(null);
              toast.success('Fare entry deleted');
            },
            onError: (e) => toast.error(e.message),
          })
        }
        title="Delete fare entry"
        message="This fare entry will be permanently removed from the guide."
        confirmLabel="Delete"
        isLoading={deleteFare.isPending}
      />
    </>
  );
}

/* ─── Fare Guide Form (create & edit) ─── */
function FareGuideForm({
  editId,
  fareGuide,
  routes,
  onSuccess,
  onCancel,
}: {
  editId: string | null;
  fareGuide: FareGuide[];
  routes: { id: string; name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!editId;
  const current = fareGuide.find((f) => f.id === editId);

  const createFare = useCreateFareEntry();
  const updateFare = useUpdateFareEntry();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FareGuideFormData>({ resolver: zodResolver(fareGuideSchema) });

  useEffect(() => {
    if (current) {
      reset({
        routeId: current.routeId,
        stopPointName: current.stopPointName,
        distanceKm: current.distanceKm,
        regularFare: current.regularFare,
        discountedFare: current.discountedFare,
      });
    }
  }, [current, reset]);

  const onSubmit = handleSubmit((data) => {
    if (isEdit) {
      updateFare.mutate(
        { id: editId!, data },
        { onSuccess, onError: (e) => toast.error(e.message) }
      );
    } else {
      createFare.mutate(data, { onSuccess, onError: (e) => toast.error(e.message) });
    }
  });

  const isPending = isSubmitting || createFare.isPending || updateFare.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label required>Route</Label>
        <Select
          options={routes.map((r) => ({ value: r.id, label: r.name }))}
          placeholder="Select route…"
          error={!!errors.routeId}
          hint={errors.routeId?.message}
          {...register('routeId')}
        />
      </div>

      <div>
        <Label required>Stop Point Name</Label>
        <Input
          placeholder="e.g. Batac City Hall"
          error={!!errors.stopPointName}
          hint={errors.stopPointName?.message}
          {...register('stopPointName')}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label required>Distance (km)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            placeholder="0.0"
            error={!!errors.distanceKm}
            hint={errors.distanceKm?.message}
            {...register('distanceKm')}
          />
        </div>
        <div>
          <Label required>Regular Fare (₱)</Label>
          <Input
            type="number"
            step="0.25"
            min="0"
            placeholder="0.00"
            error={!!errors.regularFare}
            hint={errors.regularFare?.message}
            {...register('regularFare')}
          />
        </div>
        <div>
          <Label required>Discounted Fare (₱)</Label>
          <Input
            type="number"
            step="0.25"
            min="0"
            placeholder="0.00"
            error={!!errors.discountedFare}
            hint={errors.discountedFare?.message}
            {...register('discountedFare')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" isLoading={isPending} loadingText="Saving…">
          {isEdit ? 'Update' : 'Add Entry'}
        </Button>
      </div>
    </form>
  );
}
