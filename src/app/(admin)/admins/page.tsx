'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, UserMinus, Copy, Check, UserCheck, Pencil } from 'lucide-react';
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
import {
  useAdmins,
  useCreateAdmin,
  useDeactivateAdmin,
  useReactivateAdmin,
  useDeleteAdmin,
  useReassignAdminOrg,
  useOrganizations,
} from '@/hooks';
import { adminCreateSchema, toDate, type AdminCreateFormData } from '@/lib';
import type { ColumnDef } from '@tanstack/react-table';
import type { AdminProfile } from '@/types';

export default function AdminsPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [reassignId, setReassignId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [reactivateId, setReactivateId] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const { data: admins = [], isPending, isFetching, error } = useAdmins();
  const deactivateAdmin = useDeactivateAdmin();
  const reactivateAdmin = useReactivateAdmin();
  const deleteAdmin = useDeleteAdmin();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = debouncedQuery
    ? admins.filter((a) =>
        `${a.firstName} ${a.lastName} ${a.email} ${a.organizationId}`
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase())
      )
    : admins;

  const handleCopyEmail = async (email: string, uid: string) => {
    await navigator.clipboard.writeText(email);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
    toast.success('Email copied');
  };

  const columns: ColumnDef<AdminProfile, unknown>[] = [
    {
      id: 'name',
      header: 'Admin',
      accessorFn: (a) => `${a.firstName} ${a.lastName}`,
      cell: ({ row: { original: a } }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
            {a.firstName.charAt(0).toUpperCase()}
            {a.lastName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {a.firstName} {a.lastName}
            </p>
            <p className="text-xs text-gray-500">{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'organizationId',
      header: 'Organization',
      cell: ({ getValue }) => (
        <Badge color="info" size="sm">
          {String(getValue())}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (a) => a.isActive,
      cell: ({ row: { original: a } }) => (
        <Badge color={a.isActive ? 'success' : 'danger'} size="sm">
          {a.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'created',
      header: 'Created',
      accessorFn: (a) => a.createdAt,
      cell: ({ row: { original: a } }) => {
        const d = toDate(a.createdAt);
        return <span className="text-gray-500">{d ? format(d, 'MMM d, yyyy') : '—'}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row: { original: a } }) => (
        <div className="flex items-center gap-3">
          <button
            title="Copy email"
            onClick={() => handleCopyEmail(a.email, a.uid)}
            className="cursor-pointer text-gray-600 transition-colors hover:text-gray-300"
          >
            {copiedUid === a.uid ? (
              <Check size={16} className="text-success-400" />
            ) : (
              <Copy size={16} />
            )}
          </button>
          {a.isActive ? (
            <button
              title="Deactivate admin"
              onClick={() => setDeactivateId(a.uid)}
              className="hover:text-warning-400 cursor-pointer text-gray-600 transition-colors"
            >
              <UserMinus size={16} />
            </button>
          ) : (
            <button
              title="Reactivate admin"
              onClick={() => setReactivateId(a.uid)}
              className="hover:text-warning-400 cursor-pointer text-gray-600 transition-colors"
            >
              <UserCheck size={16} />
            </button>
          )}
          <button
            title="Reassign organization"
            onClick={() => setReassignId(a.uid)}
            className="hover:text-brand-400 cursor-pointer text-gray-600 transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            title="Delete admin"
            onClick={() => setDeleteId(a.uid)}
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
        <PageBreadcrumb pageTitle="Admin Accounts" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-600" />
            <Input
              placeholder="Search admins…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setCreateOpen(true)} startIcon={<Plus size={16} />}>
            Create Admin
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={isPending || isFetching}
          emptyMessage="No admin accounts found"
        />
      </div>

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Admin Account">
        <AdminCreateForm
          onSuccess={() => {
            setCreateOpen(false);
            toast.success('Admin account created');
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {/* Reassign org modal */}
      <Modal
        isOpen={!!reassignId}
        onClose={() => setReassignId(null)}
        title="Reassign Organization"
      >
        <ReassignOrgForm
          uid={reassignId}
          admins={admins}
          onSuccess={() => {
            setReassignId(null);
            toast.success('Organization updated');
          }}
          onCancel={() => setReassignId(null)}
        />
      </Modal>

      {/* Deactivate confirm */}
      <ConfirmDialog
        isOpen={!!deactivateId}
        onClose={() => setDeactivateId(null)}
        onConfirm={() =>
          deactivateAdmin.mutate(deactivateId!, {
            onSuccess: () => {
              setDeactivateId(null);
              toast.success('Admin deactivated');
            },
            onError: (e) => toast.error(e.message),
          })
        }
        title="Deactivate admin"
        message="This admin will be marked inactive and their active session will be revoked immediately."
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={deactivateAdmin.isPending}
      />

      {/* Reactivate confirm */}
      <ConfirmDialog
        isOpen={!!reactivateId}
        onClose={() => setReactivateId(null)}
        onConfirm={() =>
          reactivateAdmin.mutate(reactivateId!, {
            onSuccess: () => {
              setReactivateId(null);
              toast.success('Admin reactivated');
            },
            onError: (e) => toast.error(e.message),
          })
        }
        title="Reactivate admin"
        message="This admin will be marked active and allowed to access the system again."
        confirmLabel="Reactivate"
        variant="primary"
        isLoading={reactivateAdmin.isPending}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() =>
          deleteAdmin.mutate(deleteId!, {
            onSuccess: () => {
              setDeleteId(null);
              toast.success('Admin deleted');
            },
            onError: (e) => toast.error(e.message),
          })
        }
        title="Delete admin account"
        message="This will permanently remove the admin account. All data associated with this admin remains but they will lose access."
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteAdmin.isPending}
      />
    </>
  );
}

/* ─── Admin Create Form ─── */
function AdminCreateForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const createAdmin = useCreateAdmin();
  const { data: orgs = [] } = useOrganizations();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminCreateFormData>({
    resolver: zodResolver(adminCreateSchema),
  });

  const onSubmit = handleSubmit((data) => {
    createAdmin.mutate(data, {
      onSuccess,
      onError: (e) => toast.error(e.message),
    });
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
        <Label required>Temporary Password</Label>
        <Input
          type="password"
          placeholder="Min. 8 characters"
          error={!!errors.password}
          hint={errors.password?.message}
          {...register('password')}
        />
        <p className="mt-1 text-xs text-gray-600">
          Share these credentials with the admin. Use the copy button on the accounts table.
        </p>
      </div>

      {/* TODO: have this one to be edited as well. but only this one */}
      <div>
        <Label required>Organization</Label>
        <Select
          options={orgs.map((o) => ({ value: o.id, label: `${o.shortName} — ${o.name}` }))}
          placeholder="Select organization…"
          error={!!errors.organizationId}
          hint={errors.organizationId?.message}
          {...register('organizationId')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          isLoading={isSubmitting || createAdmin.isPending}
          loadingText="Creating…"
        >
          Create Admin
        </Button>
      </div>
    </form>
  );
}

/* ─── Reassign Org Form ─── */
function ReassignOrgForm({
  uid,
  admins,
  onSuccess,
  onCancel,
}: {
  uid: string | null;
  admins: AdminProfile[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const admin = admins.find((a) => a.uid === uid);
  const { data: orgs = [] } = useOrganizations();
  const reassignOrg = useReassignAdminOrg();
  const [selectedOrgId, setSelectedOrgId] = useState(admin?.organizationId ?? '');

  useEffect(() => {
    setSelectedOrgId(admin?.organizationId ?? '');
  }, [admin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !selectedOrgId) return;
    reassignOrg.mutate(
      { uid, organizationId: selectedOrgId },
      { onSuccess, onError: (e) => toast.error(e.message) }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">
        Reassigning organization for{' '}
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {admin?.firstName} {admin?.lastName}
        </span>
      </p>

      <div>
        <Label required>Organization</Label>
        <Select
          options={orgs.map((o) => ({ value: o.id, label: `${o.shortName} — ${o.name}` }))}
          placeholder="Select organization…"
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          isLoading={reassignOrg.isPending}
          loadingText="Saving…"
          disabled={!selectedOrgId || selectedOrgId === admin?.organizationId}
        >
          Save
        </Button>
      </div>
    </form>
  );
}
