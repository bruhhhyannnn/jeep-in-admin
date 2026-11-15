'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
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
  Select,
  SidePanel,
  StatusChip,
  Switch,
} from '@/components/ui';
import { PageHeader, SearchField } from '@/components/common';
import {
  useOrganizations,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useAllRoutes,
} from '@/hooks';
import { organizationSchema, type OrganizationFormData } from '@/lib';
import type { Organization } from '@/types';

export default function OrganizationsPage() {
  const [query, setQuery] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Organization | null>(null);

  const { data: organizations = [], isPending, error } = useOrganizations();
  const { data: allRoutes = [] } = useAllRoutes();
  const deleteOrganization = useDeleteOrganization();

  const active = organizations.filter((o) => o.isActive).length;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? organizations.filter((o) => `${o.name} ${o.shortName}`.toLowerCase().includes(q))
    : organizations;

  const openPanel = (id: string | null) => {
    setEditId(id);
    setPanelOpen(true);
  };

  const columns: ColumnDef<Organization, unknown>[] = [
    {
      id: 'name',
      header: 'Organization',
      accessorFn: (o) => o.name,
      cell: ({ row: { original: o } }) => (
        <div className="flex items-center gap-3">
          <span className="font-data bg-action-soft text-action flex h-10 min-w-10 items-center justify-center rounded-[11px] px-2 text-[11px] font-bold">
            {o.shortName}
          </span>
          <p className="text-ink font-semibold">{o.name}</p>
        </div>
      ),
    },
    {
      id: 'route',
      header: 'Route',
      accessorFn: (o) => allRoutes.find((r) => r.id === o.routeId)?.name ?? '',
      cell: ({ row: { original: o } }) => {
        const route = allRoutes.find((r) => r.id === o.routeId);
        return route ? (
          <span className="text-ink">{route.name}</span>
        ) : (
          <StatusChip tone="pending">No route</StatusChip>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (o) => o.isActive,
      cell: ({ row: { original: o } }) =>
        o.isActive ? (
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
      cell: ({ row: { original: o } }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openPanel(o.id);
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
          title="Organizations"
          description={`${organizations.length} ${organizations.length === 1 ? 'cooperative' : 'cooperatives'} · ${active} active`}
          actions={
            <>
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder="Search name or short name"
              />
              <Button startIcon={<Plus size={17} />} onClick={() => openPanel(null)}>
                Add organization
              </Button>
            </>
          }
        />

        <DataTable
          columns={columns}
          data={filtered}
          loading={isPending}
          emptyMessage={q ? 'No organizations match' : 'No organizations yet'}
          emptyHint={q ? undefined : 'Add a cooperative and give it a route.'}
          onRowClick={(o) => openPanel(o.id)}
        />
      </div>

      <OrganizationPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        org={organizations.find((o) => o.id === editId) ?? null}
        routes={allRoutes}
        onDelete={setDeleting}
      />

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'this organization'}?`}
        message="Everything that belongs to it is deleted with it. This can't be undone."
        cancelLabel="Keep it"
        confirmLabel="Delete organization"
        loadingText="Deleting…"
        isLoading={deleteOrganization.isPending}
        onConfirm={() =>
          deleting &&
          deleteOrganization.mutate(deleting.id, {
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
              text: 'Its jeepney units, drivers and admins (including their sign-ins), and its audit logs.',
            },
            { label: 'Kept', text: 'The route it uses, with its stops and fares.' },
          ]}
        />
      </ConfirmDialog>
    </>
  );
}

/* ─── Add / edit an organization ─── */
function OrganizationPanel({
  isOpen,
  onClose,
  org,
  routes,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  org: Organization | null;
  routes: { id: string; name: string }[];
  onDelete: (org: Organization) => void;
}) {
  const isEdit = !!org;
  const createOrganization = useCreateOrganization();
  const updateOrganization = useUpdateOrganization();
  const formId = 'organization-form';

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { isActive: true },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(
      org
        ? {
            name: org.name,
            shortName: org.shortName,
            routeId: org.routeId ?? '',
            isActive: org.isActive,
          }
        : { name: '', shortName: '', routeId: '', isActive: true }
    );
  }, [isOpen, org, reset]);

  const isSaving = isSubmitting || createOrganization.isPending || updateOrganization.isPending;

  const onSubmit = handleSubmit((data) => {
    const done = {
      onSuccess: () => {
        toast.success(isEdit ? `${data.name} saved` : `${data.name} added`);
        onClose();
      },
      onError: (e: Error) => toast.error(e.message),
    };
    if (org) updateOrganization.mutate({ id: org.id, data }, done);
    else createOrganization.mutate(data, done);
  });

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      busy={isSaving}
      title={org ? org.name : 'Add an organization'}
      subtitle={
        org ? `Short name ${org.shortName}` : 'A transport cooperative and the route it runs.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} isLoading={isSaving} loadingText="Saving…">
            {isEdit ? 'Save changes' : 'Save this organization'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-5" noValidate>
        <Input
          id="org-name"
          label="Name"
          placeholder="Ilocos Transport Cooperative"
          error={!!errors.name}
          hint={errors.name?.message}
          {...register('name')}
        />
        <Input
          id="org-short"
          label="Short name"
          placeholder="ITC"
          className="font-data uppercase"
          disabled={isEdit}
          error={!isEdit && !!errors.shortName}
          hint={
            isEdit
              ? "Can't be changed after the organization is created."
              : (errors.shortName?.message ?? 'Up to 10 characters. Used as its ID.')
          }
          {...register('shortName')}
        />
        <Field label="Route" htmlFor="org-route" error={errors.routeId?.message}>
          <Select
            id="org-route"
            options={routes.map((r) => ({ value: r.id, label: r.name }))}
            placeholder={routes.length ? 'Choose a route' : 'Create a route first'}
            error={!!errors.routeId}
            {...register('routeId')}
          />
        </Field>

        <div className="border-line rounded-tile flex items-center justify-between gap-4 border-[1.5px] p-4">
          <div>
            <p className="text-ink text-[14px] font-bold">Active</p>
            <p className="text-ink-muted mt-0.5 text-[13px]">
              Turn off to mark the cooperative inactive.
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

        {org && (
          <PanelActionRow
            tone="danger"
            title="Delete this organization"
            description="Also deletes its units, drivers, admins and audit logs."
            action={
              <Button variant="danger-outline" size="sm" onClick={() => onDelete(org)}>
                Delete organization
              </Button>
            }
          />
        )}
      </form>
    </SidePanel>
  );
}
