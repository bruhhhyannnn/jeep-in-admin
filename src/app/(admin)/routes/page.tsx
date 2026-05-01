'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { useAllRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute } from '@/hooks';
import { routeSchema, type RouteFormData } from '@/lib';
import type { ColumnDef } from '@tanstack/react-table';
import type { Route } from '@/types';

function formatDirection(dir: string): string {
  return dir
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' → ');
}

export default function RoutesPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: routes = [], isPending, isFetching, error } = useAllRoutes();
  const deleteRoute = useDeleteRoute();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = debouncedQuery
    ? routes.filter((r) => r.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
    : routes;

  const handleClose = () => {
    setModalOpen(false);
    setEditId(null);
  };

  const columns: ColumnDef<Route, unknown>[] = [
    {
      id: 'name',
      header: 'Route',
      accessorFn: (r) => r.name,
      cell: ({ row: { original: r } }) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">{r.name}</p>
          {r.description && <p className="text-xs text-gray-500">{r.description}</p>}
        </div>
      ),
    },
    {
      id: 'directions',
      header: 'Directions',
      enableSorting: false,
      cell: ({ row: { original: r } }) => (
        <div className="flex flex-wrap gap-1">
          {r.directions?.length ? (
            r.directions.map((d) => (
              <Badge key={d} color="info" size="sm">
                {formatDirection(d)}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-gray-400">None</span>
          )}
        </div>
      ),
    },
    {
      id: 'workingHours',
      header: 'Working Hours',
      accessorFn: (r) => `${r.workingHours.start} – ${r.workingHours.end}`,
      cell: ({ row: { original: r } }) => (
        <span className="font-mono text-xs text-gray-500">
          {r.workingHours.start} – {r.workingHours.end}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (r) => r.isActive,
      cell: ({ row: { original: r } }) => (
        <Badge color={r.isActive ? 'success' : 'danger'} size="sm">
          {r.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row: { original: r } }) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditId(r.id);
              setModalOpen(true);
            }}
            className="hover:text-brand-400 cursor-pointer text-gray-600 transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeleteId(r.id)}
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
        <PageBreadcrumb pageTitle="Routes" />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="relative max-w-sm min-w-48 flex-1">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-600" />
            <Input
              placeholder="Search routes…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setModalOpen(true)} startIcon={<Plus size={16} />}>
            Add Route
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={isPending || isFetching}
          emptyMessage="No routes found"
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={editId ? 'Edit Route' : 'Add Route'}
      >
        <RouteForm
          editId={editId}
          routes={routes}
          onSuccess={() => {
            handleClose();
            toast.success(editId ? 'Route updated' : 'Route created');
          }}
          onCancel={handleClose}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() =>
          deleteRoute.mutate(deleteId!, {
            onSuccess: () => {
              setDeleteId(null);
              toast.success('Route deleted');
            },
            onError: (e) => toast.error(e.message),
          })
        }
        title="Delete route"
        message="This route will be permanently deleted. Stop points linked to it will lose their route reference."
        confirmLabel="Delete"
        isLoading={deleteRoute.isPending}
      />
    </>
  );
}

/* ─── Route Form ─── */
function RouteForm({
  editId,
  routes,
  onSuccess,
  onCancel,
}: {
  editId: string | null;
  routes: Route[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!editId;
  const current = routes.find((r) => r.id === editId);
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();

  const [dirInput, setDirInput] = useState('');
  const [directions, setDirections] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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
    if (current) {
      const dirs = current.directions ?? [];
      setDirections(dirs);
      reset({
        name: current.name,
        description: current.description ?? '',
        directions: dirs,
        isActive: current.isActive,
        workingHours: current.workingHours,
      });
    } else {
      setDirections([]);
    }
  }, [current, reset]);

  const addDirection = () => {
    const val = dirInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (!val || directions.includes(val)) return;
    const next = [...directions, val];
    setDirections(next);
    setValue('directions', next, { shouldValidate: true });
    setDirInput('');
  };

  const removeDirection = (index: number) => {
    const next = directions.filter((_, i) => i !== index);
    setDirections(next);
    setValue('directions', next, { shouldValidate: true });
  };

  const onSubmit = handleSubmit((data) => {
    if (isEdit) {
      updateRoute.mutate(
        { routeId: editId!, data },
        { onSuccess, onError: (e) => toast.error(e.message) }
      );
    } else {
      createRoute.mutate(data, { onSuccess, onError: (e) => toast.error(e.message) });
    }
  });

  const isPending = isSubmitting || createRoute.isPending || updateRoute.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label required>Name</Label>
        <Input
          placeholder="e.g. Laoag–Batac–Paoay"
          error={!!errors.name}
          hint={errors.name?.message}
          {...register('name')}
        />
      </div>

      <div>
        <Label>
          Description{' '}
          <span className="text-xs font-normal text-gray-500">(optional)</span>
        </Label>
        <Input
          placeholder="e.g. Main route covering Laoag, Batac, and Paoay"
          {...register('description')}
        />
      </div>

      <div>
        <Label required>Directions</Label>
        <p className="mb-1.5 text-xs text-gray-500">
          Type a direction key and press Enter or click Add (e.g. <code>laoag_paoay</code>)
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. laoag_paoay"
            value={dirInput}
            onChange={(e) => setDirInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addDirection();
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addDirection}>
            Add
          </Button>
        </div>
        {errors.directions && (
          <p className="text-danger-400 mt-1 text-xs">
            {(errors.directions as { message?: string }).message ?? 'At least one direction is required'}
          </p>
        )}
        {directions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {directions.map((dir, i) => (
              <span
                key={dir}
                className="bg-brand-600/10 text-brand-500 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
              >
                {formatDirection(dir)}
                <button
                  type="button"
                  onClick={() => removeDirection(i)}
                  className="hover:text-danger-400 cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>Working Hours Start</Label>
          <Input
            type="time"
            error={!!errors.workingHours?.start}
            hint={errors.workingHours?.start?.message}
            {...register('workingHours.start')}
          />
        </div>
        <div>
          <Label required>Working Hours End</Label>
          <Input
            type="time"
            error={!!errors.workingHours?.end}
            hint={errors.workingHours?.end?.message}
            {...register('workingHours.end')}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          className="accent-brand-600 h-4 w-4 cursor-pointer"
          {...register('isActive')}
        />
        <Label htmlFor="isActive">Active</Label>
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
