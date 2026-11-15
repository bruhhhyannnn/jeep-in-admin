'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, Plus, RefreshCw } from 'lucide-react';
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
import { Avatar, FilterChips, PageHeader, SearchField } from '@/components/common';
import {
  useAdmins,
  useCreateAdmin,
  useDeactivateAdmin,
  useReactivateAdmin,
  useDeleteAdmin,
  useReassignAdminOrg,
  useOrganizations,
} from '@/hooks';
import { adminCreateSchema, generatePassword, toDate, type AdminCreateFormData } from '@/lib';
import type { AdminProfile, Organization } from '@/types';

type AdminFilter = 'all' | 'active' | 'inactive';
type ConfirmKind = 'deactivate' | 'reactivate' | 'delete';

const fullName = (a: AdminProfile) => `${a.firstName} ${a.lastName}`;

export default function AdminsPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AdminFilter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editUid, setEditUid] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; admin: AdminProfile } | null>(null);

  const { data: admins = [], isPending, error } = useAdmins();
  const { data: orgs = [] } = useOrganizations();
  const orgById = new Map(orgs.map((o) => [o.id, o]));

  const counts = {
    all: admins.length,
    active: admins.filter((a) => a.isActive).length,
    inactive: admins.filter((a) => !a.isActive).length,
  };

  const q = query.trim().toLowerCase();
  const filtered = admins
    .filter((a) => (filter === 'active' ? a.isActive : filter === 'inactive' ? !a.isActive : true))
    .filter((a) => !q || `${fullName(a)} ${a.email} ${a.organizationId}`.toLowerCase().includes(q));

  const columns: ColumnDef<AdminProfile, unknown>[] = [
    {
      id: 'name',
      header: 'Admin',
      accessorFn: (a) => fullName(a),
      cell: ({ row: { original: a } }) => (
        <div className="flex items-center gap-3">
          <Avatar name={fullName(a)} size="md" />
          <div className="min-w-0">
            <p className="text-ink truncate font-semibold">{fullName(a)}</p>
            <p className="text-ink-muted truncate text-[12px]">{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'organizationId',
      header: 'Organization',
      cell: ({ row: { original: a } }) => {
        const org = orgById.get(a.organizationId);
        return (
          <div className="flex items-center gap-2">
            <span className="font-data bg-action-soft text-action rounded-full px-2.5 py-0.5 text-[11px] font-bold">
              {org?.shortName ?? a.organizationId}
            </span>
            {org && (
              <span className="text-ink-muted hidden truncate text-[13px] xl:inline">
                {org.name}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (a) => a.isActive,
      cell: ({ row: { original: a } }) =>
        a.isActive ? (
          <StatusChip tone="live" dot>
            Active
          </StatusChip>
        ) : (
          <StatusChip tone="neutral">Inactive</StatusChip>
        ),
    },
    {
      id: 'created',
      header: 'Added',
      accessorFn: (a) => toDate(a.createdAt)?.getTime() ?? 0,
      cell: ({ row: { original: a } }) => {
        const d = toDate(a.createdAt);
        return (
          <span className="text-ink-muted text-[13px]">{d ? format(d, 'MMM d, yyyy') : '—'}</span>
        );
      },
    },
    {
      id: 'edit',
      header: () => <span className="sr-only">Edit</span>,
      enableSorting: false,
      cell: ({ row: { original: a } }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditUid(a.uid);
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
          title="Admin accounts"
          description={`${counts.all} ${counts.all === 1 ? 'admin' : 'admins'} · each one manages a single organization`}
          actions={
            <>
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder="Search name, email or org"
              />
              <Button startIcon={<Plus size={17} />} onClick={() => setAddOpen(true)}>
                Add admin
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
          ]}
        />

        <DataTable
          columns={columns}
          data={filtered}
          loading={isPending}
          emptyMessage={q || filter !== 'all' ? 'No admins match' : 'No admin accounts yet'}
          emptyHint={q || filter !== 'all' ? undefined : 'Add an admin for each organization.'}
          onRowClick={(a) => setEditUid(a.uid)}
          pageSize={20}
        />
      </div>

      <AdminCreatePanel isOpen={addOpen} onClose={() => setAddOpen(false)} orgs={orgs} />

      <AdminEditPanel
        admin={admins.find((a) => a.uid === editUid) ?? null}
        orgs={orgs}
        onClose={() => setEditUid(null)}
        onAction={(kind, admin) => setConfirm({ kind, admin })}
      />

      <AdminConfirm
        confirm={confirm}
        onClose={() => setConfirm(null)}
        onDeleted={() => setEditUid(null)}
      />
    </>
  );
}

/* ─── Add an admin ─── */
function AdminCreatePanel({
  isOpen,
  onClose,
  orgs,
}: {
  isOpen: boolean;
  onClose: () => void;
  orgs: Organization[];
}) {
  const createAdmin = useCreateAdmin();
  const [copied, setCopied] = useState(false);
  const formId = 'admin-create-form';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdminCreateFormData>({ resolver: zodResolver(adminCreateSchema) });

  useEffect(() => {
    if (isOpen) {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        password: generatePassword(),
        organizationId: '',
      });
    }
  }, [isOpen, reset]);

  const password = watch('password') ?? '';
  const isSaving = isSubmitting || createAdmin.isPending;

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
    createAdmin.mutate(data, {
      onSuccess: () => {
        toast.success(`${data.firstName} ${data.lastName} added`);
        onClose();
      },
      onError: (e) => toast.error(e.message),
    });
  });

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      busy={isSaving}
      title="Add an admin"
      subtitle="They sign in to this dashboard and manage one organization."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} isLoading={isSaving} loadingText="Saving…">
            Save this admin
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            id="admin-first"
            label="First name"
            autoComplete="off"
            error={!!errors.firstName}
            hint={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            id="admin-last"
            label="Last name"
            autoComplete="off"
            error={!!errors.lastName}
            hint={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
        <Input
          id="admin-email"
          type="email"
          label="Email"
          autoComplete="off"
          placeholder="name@email.com"
          error={!!errors.email}
          hint={errors.email?.message}
          {...register('email')}
        />
        <Field label="Organization" htmlFor="admin-org" error={errors.organizationId?.message}>
          <Select
            id="admin-org"
            options={orgs.map((o) => ({ value: o.id, label: `${o.shortName} · ${o.name}` }))}
            placeholder="Choose an organization"
            error={!!errors.organizationId}
            {...register('organizationId')}
          />
        </Field>
        <Field
          label="Password · made for you"
          htmlFor="admin-password"
          error={errors.password?.message}
          hint="Share it with them along with the email."
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <input
                id="admin-password"
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

/* ─── Edit an admin ─── */
function AdminEditPanel({
  admin,
  orgs,
  onClose,
  onAction,
}: {
  admin: AdminProfile | null;
  orgs: Organization[];
  onClose: () => void;
  onAction: (kind: ConfirmKind, admin: AdminProfile) => void;
}) {
  const reassignOrg = useReassignAdminOrg();
  const [orgId, setOrgId] = useState('');
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState<AdminProfile | null>(admin);

  useEffect(() => {
    if (admin) setShown(admin);
  }, [admin]);

  useEffect(() => {
    setOrgId(admin?.organizationId ?? '');
  }, [admin?.uid, admin?.organizationId]);

  const a = admin ?? shown;
  if (!a) return null;

  const added = toDate(a.createdAt);
  const dirty = !!orgId && orgId !== a.organizationId;

  const save = () =>
    reassignOrg.mutate(
      { uid: a.uid, organizationId: orgId },
      {
        onSuccess: () => {
          toast.success('Organization updated');
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(a.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the email');
    }
  };

  return (
    <SidePanel
      isOpen={!!admin}
      onClose={onClose}
      busy={reassignOrg.isPending}
      title={fullName(a)}
      subtitle={`${a.email} · ${a.isActive ? 'active' : 'inactive'}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={reassignOrg.isPending}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={!dirty}
            isLoading={reassignOrg.isPending}
            loadingText="Saving…"
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PanelValue label="Email">
            <span className="flex w-full items-center justify-between gap-2">
              <span className="min-w-0 truncate">{a.email}</span>
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
        </div>

        <Field
          label="Organization"
          htmlFor="admin-edit-org"
          hint="They only see this organization's drivers, units and logs."
        >
          <Select
            id="admin-edit-org"
            options={orgs.map((o) => ({ value: o.id, label: `${o.shortName} · ${o.name}` }))}
            placeholder="Choose an organization"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
          />
        </Field>

        {a.isActive ? (
          <PanelActionRow
            title="Pause their access"
            description="Signs them out now. The account stays."
            action={
              <Button variant="outline" size="sm" onClick={() => onAction('deactivate', a)}>
                Deactivate
              </Button>
            }
          />
        ) : (
          <PanelActionRow
            title="Give access back"
            description="Lets them sign in to the dashboard again."
            action={
              <Button variant="outline" size="sm" onClick={() => onAction('reactivate', a)}>
                Reactivate
              </Button>
            }
          />
        )}

        <PanelActionRow
          tone="danger"
          title="Delete the account"
          description="Removes their sign-in for good."
          action={
            <Button variant="danger-outline" size="sm" onClick={() => onAction('delete', a)}>
              Delete admin
            </Button>
          }
        />
      </div>
    </SidePanel>
  );
}

/* ─── Confirm dialogs ─── */
function AdminConfirm({
  confirm,
  onClose,
  onDeleted,
}: {
  confirm: { kind: ConfirmKind; admin: AdminProfile } | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const deactivate = useDeactivateAdmin();
  const reactivate = useReactivateAdmin();
  const remove = useDeleteAdmin();

  const [last, setLast] = useState(confirm);
  useEffect(() => {
    if (confirm) setLast(confirm);
  }, [confirm]);
  const c = confirm ?? last;
  if (!c) return null;

  const { kind, admin } = c;
  const name = fullName(admin);
  const onError = (e: Error) => toast.error(e.message);

  if (kind === 'deactivate') {
    return (
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={onClose}
        title={`Deactivate ${name}?`}
        message="They are signed out straight away and can't sign in until you reactivate them."
        cancelLabel="Keep them active"
        confirmLabel="Deactivate admin"
        loadingText="Deactivating…"
        isLoading={deactivate.isPending}
        onConfirm={() =>
          deactivate.mutate(admin.uid, {
            onError,
            onSuccess: () => {
              toast.success(`${name} deactivated`);
              onClose();
            },
          })
        }
      >
        <ConfirmFacts
          items={[
            { label: 'Kept', text: 'The account and everything they set up.' },
            { label: 'Removed', text: 'Their current session.' },
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
        message="They can sign in to the dashboard again."
        cancelLabel="Not now"
        confirmLabel="Reactivate"
        loadingText="Reactivating…"
        isLoading={reactivate.isPending}
        onConfirm={() =>
          reactivate.mutate(admin.uid, {
            onError,
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
      message="Their sign-in is removed for good. Drivers, units and logs in their organization stay. This can't be undone."
      cancelLabel="Keep the account"
      confirmLabel="Delete admin"
      loadingText="Deleting…"
      isLoading={remove.isPending}
      onConfirm={() =>
        remove.mutate(admin.uid, {
          onError,
          onSuccess: () => {
            toast.success(`${name} deleted`);
            onClose();
            onDeleted();
          },
        })
      }
    />
  );
}
