'use client';

import { cn, timeAgo } from '@/lib';
import { Spinner } from '@/components/ui';
import { UnitTile } from '@/components/common';
import { driverName, type FleetUnit } from './fleet-state';

interface UnitRailProps {
  units: FleetUnit[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  now: number;
  /** Outside shift hours the list shows roster status instead of live state. */
  inShift: boolean;
  statusLine: React.ReactNode;
  loading?: boolean;
}

/** Answers who-drives-what without clicking a marker. */
export function UnitRail({
  units,
  selectedKey,
  onSelect,
  now,
  inShift,
  statusLine,
  loading,
}: UnitRailProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-ink text-[15px] font-bold">Active units</h2>
        {statusLine}
      </div>

      <div className="custom-scrollbar -mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 pb-1">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : units.length === 0 ? (
          <div className="border-line-strong rounded-card border-[1.5px] border-dashed p-5 text-center">
            <p className="text-ink text-[14px] font-bold">No units match</p>
            <p className="text-ink-muted mt-1 text-[13px]">
              Add jeepney units, then assign drivers to see them here.
            </p>
          </div>
        ) : (
          units.map((unit) => (
            <UnitRow
              key={unit.key}
              unit={unit}
              now={now}
              inShift={inShift}
              selected={unit.key === selectedKey}
              onClick={() => onSelect(unit.key === selectedKey ? null : unit.key)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function UnitRow({
  unit,
  now,
  inShift,
  selected,
  onClick,
}: {
  unit: FleetUnit;
  now: number;
  inShift: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  const { state } = unit;
  const tileState = !inShift
    ? 'idle'
    : state === 'live'
      ? 'live'
      : state === 'stale'
        ? 'stale'
        : state === 'no-driver'
          ? 'empty'
          : 'idle';

  const stateText = !inShift
    ? unit.driver
      ? 'On roster'
      : 'No driver'
    : state === 'live'
      ? `Live · ${timeAgo(unit.lastSeen, now)}`
      : state === 'stale'
        ? `Seen ${timeAgo(unit.lastSeen, now)} ago`
        : state === 'off'
          ? 'GPS off'
          : 'No driver';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'bg-card flex w-full cursor-pointer items-center gap-3 rounded-full p-1.5 pr-4 text-left transition-[border-color,box-shadow] duration-150',
        selected
          ? 'border-action border-2 shadow-md'
          : 'border-line hover:border-line-strong border-[1.5px] shadow-sm'
      )}
    >
      <UnitTile number={unit.jeepney?.jeepneyNumber} state={tileState} className="rounded-full" />
      <span className="min-w-0 flex-1">
        <span className="font-data text-ink block truncate text-[13px] font-bold">
          {unit.jeepney?.plateNumber ?? 'No unit'}
        </span>
        <span className="text-ink-muted block truncate text-[12px]">
          {unit.driver ? driverName(unit.driver) : 'No driver assigned'}
        </span>
      </span>
      <span
        className={cn(
          'font-data shrink-0 text-[11px] font-semibold',
          inShift && state === 'live' ? 'text-live-ink' : 'text-ink-muted'
        )}
      >
        {stateText}
      </span>
    </button>
  );
}
