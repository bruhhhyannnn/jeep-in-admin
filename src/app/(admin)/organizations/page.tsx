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
  Badge,
  Modal,
  ConfirmDialog,
  DataTable,
  PageError,
} from '@/components/ui';
import {
  useOrganizations,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useAllRoutes,
} from '@/hooks';
import { organizationSchema, type OrganizationFormData } from '@/lib';
import type { ColumnDef } from '@tanstack/react-table';
import type { Organization } from '@/types';

export default function OrganizationsPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: organizations = [], isPending, isFetching, error } = useOrganizations();
  const { data: allRoutes = [] } = useAllRoutes();
  const deleteOrganization = useDeleteOrganization();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = debouncedQuery
    ? organizations.filter(
        (o) =>
          o.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          o.shortName.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : organizations;

  const handleClose = () => {
    setModalOpen(false);
    setEditId(null);
  };

  const columns: ColumnDef<Organization, unknown>[] = [
    {
      id: 'name',
      header: 'Organization',
      accessorFn: (o) => o.name,
      cell: ({ row: { original: o } }) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">{o.name}</p>
          <p className="text-xs text-gray-500">{o.shortName}</p>
        </div>
      ),
    },
    {
      id: 'route',
      header: 'Route',
      accessorFn: (o) => o.routeId,
      cell: ({ row: { original: o } }) => {
        const route = allRoutes.find((r) => r.id === o.routeId);
        return route ? (
          <span className="text-sm text-gray-700 dark:text-gray-300">{route.name}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (o) => o.isActive,
      cell: ({ row: { original: o } }) => (
        <Badge color={o.isActive ? 'success' : 'danger'} size="sm">
          {o.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row: { original: o } }) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditId(o.id);
              setModalOpen(true);
            }}
            className="hover:text-brand-400 cursor-pointer text-gray-600 transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeleteId(o.id)}
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
        <PageBreadcrumb pageTitle="Organizations" />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="relative max-w-sm min-w-48 flex-1">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-600" />
            <Input
              placeholder="Search organizations…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setModalOpen(true)} startIcon={<Plus size={16} />}>
            Add Organization
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={isPending || isFetching}
          emptyMessage="No organizations found"
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={editId ? 'Edit Organization' : 'Add Organization'}
      >
        <OrganizationForm
          editId={editId}
          organizations={organizations}
          routes={allRoutes}
          onSuccess={() => {
            handleClose();
            toast.success(editId ? 'Organization updated' : 'Organization created');
          }}
          onCancel={handleClose}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() =>
          deleteOrganization.mutate(deleteId!, {
            onSuccess: () => {
              setDeleteId(null);
              toast.success('Organization deleted');
            },
            onError: (e) => toast.error(e.message),
          })
        }
        title="Delete organization"
        message="This organization will be permanently deleted. Admin accounts linked to it will lose their organization reference."
        confirmLabel="Delete"
        isLoading={deleteOrganization.isPending}
      />
    </>
  );
}

/* ─── Organization Form ─── */
function OrganizationForm({
  editId,
  organizations,
  routes,
  onSuccess,
  onCancel,
}: {
  editId: string | null;
  organizations: Organization[];
  routes: { id: string; name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!editId;
  const current = organizations.find((o) => o.id === editId);
  const createOrganization = useCreateOrganization();
  const updateOrganization = useUpdateOrganization();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { isActive: true },
  });

  useEffect(() => {
    if (current) {
      reset({
        name: current.name,
        shortName: current.shortName,
        routeId: current.routeId,
        isActive: current.isActive,
      });
    }
  }, [current, reset]);

  const onSubmit = handleSubmit((data) => {
    if (isEdit) {
      updateOrganization.mutate(
        { id: editId!, data },
        { onSuccess, onError: (e) => toast.error(e.message) }
      );
    } else {
      createOrganization.mutate(data, { onSuccess, onError: (e) => toast.error(e.message) });
    }
  });

  const isPending = isSubmitting || createOrganization.isPending || updateOrganization.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label required>Name</Label>
        <Input
          placeholder="e.g. Ilocos Transport Cooperative"
          error={!!errors.name}
          hint={errors.name?.message}
          {...register('name')}
        />
      </div>

      <div>
        <Label required>Short Name</Label>
        <Input
          placeholder="e.g. ITC"
          disabled={isEdit}
          hint={isEdit ? 'Short name cannot be changed after creation' : errors.shortName?.message}
          error={!isEdit && !!errors.shortName}
          style={{ textTransform: 'uppercase' }}
          {...register('shortName')}
        />
      </div>

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
