'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock, UserRoundX, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import { Button, DataTable, PageError } from '@/components/ui';
import {
  Avatar,
  Notice,
  OrgPicker,
  PageHeader,
  SearchField,
  ShiftHoursPanel,
  UnitTile,
} from '@/components/common';
import {
  useAssignJeepney,
  useDrivers,
  useJeepneys,
  useOrgScope,
  useOrganization,
  useRoute,
  useUnassignJeepney,
} from '@/hooks';
import { cn, formatClock } from '@/lib';
import type { DriverProfile, Jeepney } from '@/types';

const fullName = (d: DriverProfile) => `${d.firstName} ${d.lastName}`;

export default function AssignmentsPage() {
  const { orgId } = useOrgScope();
  const { data: org } = useOrganization(orgId || undefined);
  const routeId = org?.routeId ?? '';
  const { data: route } = useRoute(routeId || undefined);

  const { data: jeepneys = [], isPending, error } = useJeepneys(orgId);
  const { data: drivers = [] } = useDrivers(orgId);

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Started from "Assign these units": after each save, move to the next empty unit. */
  const [walkingEmpty, setWalkingEmpty] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const driverById = useMemo(() => new Map(drivers.map((d) => [d.uid, d])), [drivers]);
  const units = useMemo(
    () =>
      [...jeepneys].sort((a, b) =>
        a.jeepneyNumber.localeCompare(b.jeepneyNumber, undefined, { numeric: true })
      ),
    [jeepneys]
  );
  const unassigned = units.filter((j) => !j.assignedDriverId);
  const freeDrivers = drivers.filter((d) => d.isActive && !d.assignedJeepneyId);
  const selected = units.find((j) => j.id === selectedId) ?? null;

  const q = query.trim().toLowerCase();
  const visible = q
    ? units.filter((j) => {
        const d = j.assignedDriverId ? driverById.get(j.assignedDriverId) : undefined;
        return `${j.plateNumber} ${j.jeepneyNumber} ${d ? fullName(d) : ''}`
          .toLowerCase()
          .includes(q);
      })
    : units;

  const select = (id: string | null) => {
    setSelectedId(id);
    if (id && window.innerWidth < 1024) {
      setTimeout(
        () => pickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        50
      );
    }
  };

  const handleSaved = (savedId: string) => {
    if (!walkingEmpty) {
      setSelectedId(null);
      return;
    }
    const next = unassigned.find((j) => j.id !== savedId);
    if (next) setSelectedId(next.id);
    else {
      setWalkingEmpty(false);
      setSelectedId(null);
    }
  };

  const columns: ColumnDef<Jeepney, unknown>[] = [
    {
      id: 'unit',
      header: 'Jeepney',
      accessorFn: (j) => j.jeepneyNumber,
      sortingFn: 'alphanumeric',
      cell: ({ row: { original: j } }) => (
        <div className="flex items-center gap-3">
          <UnitTile number={j.jeepneyNumber} state={j.assignedDriverId ? 'idle' : 'empty'} />
          <div>
            <p className="font-data text-ink text-[14px] font-bold">{j.plateNumber}</p>
            <p className="text-ink-muted text-[12px]">Unit J{j.jeepneyNumber}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'driver',
      header: 'Driver today',
      accessorFn: (j) => {
        const d = j.assignedDriverId ? driverById.get(j.assignedDriverId) : undefined;
        return d ? fullName(d) : '';
      },
      cell: ({ row: { original: j } }) => {
        const d = j.assignedDriverId ? driverById.get(j.assignedDriverId) : undefined;
        return d ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={fullName(d)} />
            <div className="min-w-0">
              <p className="text-ink truncate font-semibold">{fullName(d)}</p>
              <p className="text-ink-muted truncate text-[12px]">{d.email}</p>
            </div>
          </div>
        ) : (
          <span className="text-ink-muted text-[14px] italic">No driver yet</span>
        );
      },
    },
    {
      id: 'action',
      header: () => <span className="sr-only">Action</span>,
      enableSorting: false,
      cell: ({ row: { original: j } }) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant={j.assignedDriverId ? 'outline' : 'primary'}
            onClick={(e) => {
              e.stopPropagation();
              setWalkingEmpty(false);
              select(j.id);
            }}
          >
            {j.assignedDriverId ? 'Change driver' : 'Assign driver'}
          </Button>
        </div>
      ),
    },
  ];

  if (error) return <PageError message={error.message} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Who drives what today"
        description={
          isPending && orgId
            ? 'Loading the roster…'
            : `${units.length - unassigned.length} of ${units.length} units have a driver · every change saves right away`
        }
        actions={
          <>
            <OrgPicker />
            <SearchField value={query} onChange={setQuery} placeholder="Search plate or driver" />
            {route && (
              <div className="border-line-strong bg-card flex h-10 items-center gap-2 rounded-full border-[1.5px] pr-1 pl-3.5 shadow-sm">
                <Clock size={15} className="text-ink-muted" />
                <span className="text-ink text-[13px] font-semibold whitespace-nowrap">
                  Shift hours ·{' '}
                  <span className="font-data">
                    {formatClock(route.workingHours.start)} – {formatClock(route.workingHours.end)}
                  </span>
                </span>
                <Button
                  variant="final"
                  size="sm"
                  className="h-8 px-3.5"
                  onClick={() => setShiftOpen(true)}
                >
                  Change
                </Button>
              </div>
            )}
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <DataTable
          columns={columns}
          data={visible}
          loading={!!orgId && isPending}
          emptyMessage={q ? 'No units match your search' : 'No jeepney units yet'}
          emptyHint={
            q ? undefined : 'Add units on the Jeepney units page, then assign drivers here.'
          }
          onRowClick={(j) => {
            setWalkingEmpty(false);
            select(j.id === selectedId ? null : j.id);
          }}
          isRowSelected={(j) => j.id === selectedId}
        />

        <div ref={pickerRef} className="scroll-mt-20 space-y-3 lg:sticky lg:top-6">
          {selected ? (
            <DriverPicker
              key={selected.id}
              unit={selected}
              drivers={drivers}
              units={units}
              onClose={() => {
                setSelectedId(null);
                setWalkingEmpty(false);
              }}
              onSaved={handleSaved}
            />
          ) : (
            <>
              {unassigned.length > 0 ? (
                <div className="border-line-strong bg-card rounded-card border-[1.5px] border-dashed p-4">
                  <p className="text-ink text-[15px] font-bold">
                    {unassigned.length === 1
                      ? '1 unit still has no driver'
                      : `${unassigned.length} units still have no driver`}
                  </p>
                  <p className="text-ink-muted mt-1 text-[13px] leading-snug">
                    <span className="font-data text-ink">
                      {unassigned
                        .slice(0, 3)
                        .map((j) => j.plateNumber)
                        .join(', ')}
                    </span>
                    {unassigned.length > 3 ? ` and ${unassigned.length - 3} more` : ''}{' '}
                    {unassigned.length === 1 ? 'has' : 'have'} no one to drive{' '}
                    {unassigned.length === 1 ? 'it' : 'them'} today.
                  </p>
                  <Button
                    variant="final"
                    className="mt-3 w-full"
                    onClick={() => {
                      setWalkingEmpty(true);
                      select(unassigned[0].id);
                    }}
                  >
                    {unassigned.length === 1
                      ? 'Assign this unit'
                      : `Assign these ${unassigned.length} units`}
                  </Button>
                </div>
              ) : (
                units.length > 0 && (
                  <Notice
                    dashed={false}
                    tone="live"
                    icon={<CheckCircle2 size={17} />}
                    title="Every unit has a driver"
                    description="Pick a row to change who drives it."
                  />
                )
              )}

              <div className="border-line bg-card rounded-card border-[1.5px] p-4 shadow-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-ink text-[15px] font-bold">Drivers without a unit</p>
                  <span className="font-data text-ink-muted text-[12px]">{freeDrivers.length}</span>
                </div>
                {freeDrivers.length === 0 ? (
                  <p className="text-ink-muted mt-1.5 text-[13px]">
                    Every active driver has a unit.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {freeDrivers.slice(0, 8).map((d) => (
                      <li key={d.uid} className="flex items-center gap-2.5">
                        <Avatar name={fullName(d)} />
                        <span className="text-ink truncate text-[14px] font-medium">
                          {fullName(d)}
                        </span>
                      </li>
                    ))}
                    {freeDrivers.length > 8 && (
                      <li className="text-ink-muted text-[13px]">
                        and {freeDrivers.length - 8} more
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ShiftHoursPanel isOpen={shiftOpen} onClose={() => setShiftOpen(false)} routeId={routeId} />
    </div>
  );
}

/* ─── Right column: pick a driver for one unit ─── */
function DriverPicker({
  unit,
  drivers,
  units,
  onClose,
  onSaved,
}: {
  unit: Jeepney;
  drivers: DriverProfile[];
  units: Jeepney[];
  onClose: () => void;
  onSaved: (unitId: string) => void;
}) {
  const assign = useAssignJeepney();
  const unassign = useUnassignJeepney();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string | null>(unit.assignedDriverId);

  useEffect(() => setPicked(unit.assignedDriverId), [unit.assignedDriverId]);

  const unitById = new Map(units.map((j) => [j.id, j]));
  const current = drivers.find((d) => d.uid === unit.assignedDriverId) ?? null;
  const pickedDriver = drivers.find((d) => d.uid === picked) ?? null;
  const movingFrom =
    pickedDriver?.assignedJeepneyId && pickedDriver.assignedJeepneyId !== unit.id
      ? unitById.get(pickedDriver.assignedJeepneyId)
      : undefined;

  const q = query.trim().toLowerCase();
  const pool = drivers
    .filter((d) => d.isActive)
    .filter((d) => !q || fullName(d).toLowerCase().includes(q))
    .sort((a, b) => Number(!!a.assignedJeepneyId) - Number(!!b.assignedJeepneyId));

  const isSaving = assign.isPending || unassign.isPending;
  const canSave = !!picked && picked !== unit.assignedDriverId && !isSaving;

  const save = async () => {
    if (!picked || !pickedDriver) return;
    try {
      if (unit.assignedDriverId && unit.assignedDriverId !== picked) {
        await unassign.mutateAsync({ driverUid: unit.assignedDriverId, jeepneyId: unit.id });
      }
      await assign.mutateAsync({ driverUid: picked, jeepneyId: unit.id });
      toast.success(`${fullName(pickedDriver)} now drives ${unit.plateNumber}`);
      onSaved(unit.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save this change');
    }
  };

  const removeCurrent = async () => {
    if (!current) return;
    try {
      await unassign.mutateAsync({ driverUid: current.uid, jeepneyId: unit.id });
      toast.success(`${current.firstName} is off ${unit.plateNumber}`);
      onSaved(unit.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save this change');
    }
  };

  return (
    <div className="border-line bg-card rounded-card flex flex-col gap-3 border-[1.5px] p-4 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-ink text-[15px] leading-snug font-bold">
            Pick a driver for <span className="font-data">{unit.plateNumber}</span>
          </p>
          <p className="text-ink-muted mt-0.5 text-[13px]">
            Unit J{unit.jeepneyNumber} ·{' '}
            {current ? `${fullName(current)} drives it now` : 'no driver yet'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close driver picker"
          className="border-line-strong text-ink-muted hover:bg-sunken hover:text-ink flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px]"
        >
          <X size={16} />
        </button>
      </div>

      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search a driver's name"
        className="sm:w-full"
      />

      <div className="custom-scrollbar -mx-1 flex max-h-[340px] flex-col gap-1.5 overflow-y-auto px-1 py-0.5">
        {pool.length === 0 ? (
          <p className="text-ink-muted px-1 py-4 text-center text-[13px]">
            {q
              ? 'No driver matches that name.'
              : 'No active drivers yet. Add one on the Drivers page.'}
          </p>
        ) : (
          pool.map((d) => {
            const isPicked = d.uid === picked;
            const drives = d.assignedJeepneyId ? unitById.get(d.assignedJeepneyId) : undefined;
            const meta =
              d.assignedJeepneyId === unit.id
                ? 'Driving this unit'
                : drives
                  ? `Drives ${drives.plateNumber}`
                  : 'Free';
            return (
              <button
                key={d.uid}
                type="button"
                role="radio"
                aria-checked={isPicked}
                onClick={() => setPicked(d.uid)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2.5 rounded-full p-1.5 pr-3.5 text-left transition-[border-color,background-color] duration-150',
                  isPicked
                    ? 'border-action bg-action-soft border-2'
                    : 'border-line hover:border-line-strong border-[1.5px]'
                )}
              >
                <Avatar name={fullName(d)} />
                <span className="text-ink min-w-0 flex-1 truncate text-[14px] font-semibold">
                  {fullName(d)}
                </span>
                <span
                  className={cn(
                    'shrink-0 text-[12px] font-semibold',
                    meta === 'Free' ? 'text-live-ink' : 'text-ink-muted'
                  )}
                >
                  {meta}
                </span>
              </button>
            );
          })
        )}
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!canSave}
        isLoading={assign.isPending}
        loadingText="Saving…"
        onClick={save}
      >
        Save this change now
      </Button>
      <p className="text-ink-muted text-center text-[12px] leading-snug">
        {movingFrom
          ? `Takes effect right away. ${pickedDriver?.firstName} moves off ${movingFrom.plateNumber}, which will have no driver.`
          : 'Takes effect right away.'}
      </p>

      {current && (
        <Button
          variant="ghost"
          size="sm"
          className="text-danger-ink hover:bg-danger-soft hover:text-danger-ink"
          startIcon={<UserRoundX size={15} />}
          onClick={removeCurrent}
          disabled={isSaving}
        >
          Take {current.firstName} off this unit
        </Button>
      )}
    </div>
  );
}
