'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Route as RouteIcon } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Button,
  ConfirmDialog,
  DataTable,
  Field,
  Input,
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  PageError,
  PanelActionRow,
  Select,
  SidePanel,
  StatusChip,
  Switch,
  useMap,
} from '@/components/ui';
import { Notice, PageHeader, SearchField } from '@/components/common';
import { useAuthStore } from '@/store';
import {
  useStopPoints,
  useCreateStopPoint,
  useUpdateStopPoint,
  useDeleteStopPoint,
  useAllRoutes,
  useOrganization,
} from '@/hooks';
import { formatDirection, stopPointSchema, type StopPointFormData } from '@/lib';
import type { StopPoint } from '@/types';

const DEFAULT_CENTER: [number, number] = [120.551474, 18.058174];
const DEFAULT_ZOOM = 12;

export default function StopPointsPage() {
  const { userProfile } = useAuthStore();
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const orgId = userProfile?.organizationId ?? '';

  const { data: org } = useOrganization(isSuperAdmin ? undefined : orgId);
  const adminRouteId = org?.routeId ?? '';

  const { data: allRoutes = [] } = useAllRoutes();
  const [selectedRouteId, setSelectedRouteId] = useState('');

  useEffect(() => {
    if (isSuperAdmin && !selectedRouteId && allRoutes.length > 0) {
      setSelectedRouteId(allRoutes[0].id);
    }
  }, [isSuperAdmin, allRoutes, selectedRouteId]);

  const routeId = isSuperAdmin ? selectedRouteId : adminRouteId;
  const currentRoute = allRoutes.find((r) => r.id === routeId);
  const directions = currentRoute?.directions ?? [];

  const [query, setQuery] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<StopPoint | null>(null);

  const { data: stopPoints = [], isPending, error } = useStopPoints(routeId || undefined);
  const deleteStopPoint = useDeleteStopPoint();

  const q = query.trim().toLowerCase();
  const filtered = stopPoints
    .filter((s) => !q || `${s.name} ${s.address ?? ''}`.toLowerCase().includes(q))
    .filter((s) => !selectedDirection || s.routeDirection === selectedDirection);

  const openPanel = (id: string | null) => {
    setEditId(id);
    setPanelOpen(true);
  };

  const columns: ColumnDef<StopPoint, unknown>[] = [
    {
      id: 'name',
      header: 'Stop',
      accessorFn: (s) => s.name,
      cell: ({ row: { original: s } }) => (
        <div className="flex items-center gap-3">
          <span className="border-ink-mark bg-card h-3.5 w-3.5 shrink-0 rounded-full border-[3px]" />
          <div className="min-w-0">
            <p className="text-ink truncate font-semibold">{s.name}</p>
            {s.address && <p className="text-ink-muted truncate text-[12px]">{s.address}</p>}
          </div>
        </div>
      ),
    },
    {
      id: 'direction',
      header: 'Direction',
      accessorFn: (s) => s.routeDirection,
      cell: ({ row: { original: s } }) => (
        <StatusChip tone="info">{formatDirection(s.routeDirection)}</StatusChip>
      ),
    },
    {
      id: 'latLng',
      header: 'Coordinates',
      accessorFn: (s) => `${s.latitude}, ${s.longitude}`,
      cell: ({ row: { original: s } }) => (
        <span className="font-data text-ink-muted text-[12px]">
          {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (s) => s.isActive,
      cell: ({ row: { original: s } }) =>
        s.isActive ? (
          <StatusChip tone="live" dot>
            In use
          </StatusChip>
        ) : (
          <StatusChip tone="neutral">Hidden</StatusChip>
        ),
    },
    {
      id: 'edit',
      header: () => <span className="sr-only">Edit</span>,
      enableSorting: false,
      cell: ({ row: { original: s } }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openPanel(s.id);
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
          title="Stop points"
          description={
            currentRoute
              ? `${stopPoints.length} ${stopPoints.length === 1 ? 'stop' : 'stops'} on ${currentRoute.name}`
              : 'Where commuters wait for a jeepney.'
          }
          actions={
            <>
              {isSuperAdmin && (
                <Select
                  appearance="pill"
                  aria-label="Route"
                  options={allRoutes.map((r) => ({ value: r.id, label: r.name }))}
                  value={selectedRouteId}
                  onChange={(e) => {
                    setSelectedRouteId(e.target.value);
                    setSelectedDirection('');
                  }}
                  placeholder="Choose a route"
                  className="max-w-[240px]"
                />
              )}
              {directions.length > 0 && (
                <Select
                  appearance="pill"
                  aria-label="Direction"
                  options={[
                    { value: '', label: 'Both directions' },
                    ...directions.map((d) => ({ value: d, label: formatDirection(d) })),
                  ]}
                  value={selectedDirection}
                  onChange={(e) => setSelectedDirection(e.target.value)}
                />
              )}
              <SearchField value={query} onChange={setQuery} placeholder="Search stops" />
              <Button
                startIcon={<Plus size={17} />}
                onClick={() => openPanel(null)}
                disabled={!routeId}
              >
                Add stop
              </Button>
            </>
          }
        />

        {!routeId && !isPending ? (
          <Notice
            icon={<RouteIcon size={17} />}
            tone="info"
            title={isSuperAdmin ? 'No routes yet' : 'Your organization has no route yet'}
            description="Stops belong to a route. Once there is one, add its stops here."
          />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            loading={!!routeId && isPending}
            emptyMessage={q || selectedDirection ? 'No stops match' : 'No stops on this route yet'}
            emptyHint={
              q || selectedDirection ? undefined : 'Add the first stop and place it on the map.'
            }
            onRowClick={(s) => openPanel(s.id)}
            pageSize={15}
          />
        )}
      </div>

      <StopPointPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        routeId={routeId}
        routeName={currentRoute?.name}
        directions={directions}
        stop={stopPoints.find((s) => s.id === editId) ?? null}
        onDelete={setDeleting}
      />

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Remove ${deleting?.name ?? 'this stop'}?`}
        message="It disappears from the route and from commuters' maps. This can't be undone."
        cancelLabel="Keep the stop"
        confirmLabel="Remove stop"
        loadingText="Removing…"
        isLoading={deleteStopPoint.isPending}
        onConfirm={() =>
          deleting &&
          deleteStopPoint.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(`${deleting.name} removed`);
              setDeleting(null);
              setPanelOpen(false);
            },
            onError: (e) => toast.error(e.message),
          })
        }
      />
    </>
  );
}

/* ─── Map click handler — captures click coordinates ─── */
function MapClickHandler({ onPick }: { onPick: (lng: number, lat: number) => void }) {
  const { map, isLoaded } = useMap();
  const cbRef = useRef(onPick);
  cbRef.current = onPick;

  useEffect(() => {
    if (!map || !isLoaded) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => cbRef.current(e.lngLat.lng, e.lngLat.lat);
    map.on('click', handler);
    map.getCanvas().style.cursor = 'crosshair';
    return () => {
      map.off('click', handler);
      map.getCanvas().style.cursor = '';
    };
  }, [map, isLoaded]);

  return null;
}

/* ─── Add / edit a stop ─── */
function StopPointPanel({
  isOpen,
  onClose,
  routeId,
  routeName,
  directions,
  stop,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  routeId: string;
  routeName?: string;
  directions: string[];
  stop: StopPoint | null;
  onDelete: (stop: StopPoint) => void;
}) {
  const isEdit = !!stop;
  const createStopPoint = useCreateStopPoint();
  const updateStopPoint = useUpdateStopPoint();
  const formId = 'stop-point-form';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StopPointFormData>({
    resolver: zodResolver(stopPointSchema),
    defaultValues: { isActive: true },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(
      stop
        ? {
            name: stop.name,
            address: stop.address ?? '',
            routeDirection: stop.routeDirection,
            latitude: stop.latitude,
            longitude: stop.longitude,
            isActive: stop.isActive,
          }
        : {
            name: '',
            address: '',
            routeDirection: directions.length === 1 ? directions[0] : '',
            isActive: true,
          }
    );
    // Directions is compared by value; the array itself is rebuilt on every render.
  }, [isOpen, stop, directions.join('|'), reset]);

  const lat = watch('latitude');
  const lng = watch('longitude');
  const hasPin = typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);

  const handlePick = (pickedLng: number, pickedLat: number) => {
    setValue('longitude', pickedLng, { shouldValidate: true, shouldDirty: true });
    setValue('latitude', pickedLat, { shouldValidate: true, shouldDirty: true });
  };

  const mapCenter: [number, number] = stop ? [stop.longitude, stop.latitude] : DEFAULT_CENTER;
  const mapZoom = stop ? 15 : DEFAULT_ZOOM;
  const isSaving = isSubmitting || createStopPoint.isPending || updateStopPoint.isPending;

  const onSubmit = handleSubmit((data) => {
    const done = {
      onSuccess: () => {
        toast.success(isEdit ? `${data.name} saved` : `${data.name} added`);
        onClose();
      },
      onError: (e: Error) => toast.error(e.message),
    };
    if (stop) updateStopPoint.mutate({ id: stop.id, data }, done);
    else createStopPoint.mutate({ data, routeId }, done);
  });

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      busy={isSaving}
      width="lg"
      title={stop ? stop.name : 'Add a stop'}
      subtitle={
        stop
          ? `${formatDirection(stop.routeDirection)}${routeName ? ` · ${routeName}` : ''}`
          : routeName
            ? `A new stop on ${routeName}.`
            : 'A new stop on this route.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} isLoading={isSaving} loadingText="Saving…">
            {isEdit ? 'Save changes' : 'Save this stop'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-5" noValidate>
        <Input
          id="stop-name"
          label="Name"
          placeholder="Batac Public Market"
          error={!!errors.name}
          hint={errors.name?.message}
          {...register('name')}
        />
        <Input
          id="stop-address"
          label="Address (optional)"
          placeholder="National Highway, Batac City"
          {...register('address')}
        />
        <Field label="Direction" htmlFor="stop-direction" error={errors.routeDirection?.message}>
          <Select
            id="stop-direction"
            options={directions.map((d) => ({ value: d, label: formatDirection(d) }))}
            placeholder={
              directions.length === 0 ? 'This route has no directions yet' : 'Choose a direction'
            }
            disabled={directions.length === 0}
            error={!!errors.routeDirection}
            {...register('routeDirection')}
          />
        </Field>

        {/* Hidden inputs so RHF registers lat/lng for validation */}
        <input type="hidden" {...register('latitude')} />
        <input type="hidden" {...register('longitude')} />

        <div>
          <p className="text-label text-ink-muted mb-1.5">
            Location — click the map to place the stop
          </p>
          <div
            className={
              errors.latitude || errors.longitude
                ? 'border-danger rounded-tile h-64 overflow-hidden border-[1.5px]'
                : 'border-line-strong rounded-tile h-64 overflow-hidden border-[1.5px]'
            }
          >
            {isOpen && (
              <Map center={mapCenter} zoom={mapZoom}>
                <MapControls showZoom position="top-right" />
                <MapClickHandler onPick={handlePick} />
                {hasPin && (
                  <MapMarker
                    longitude={lng}
                    latitude={lat}
                    draggable
                    onDragEnd={({ lng: dLng, lat: dLat }) => handlePick(dLng, dLat)}
                  >
                    <MarkerContent>
                      <span className="border-ink-mark bg-card block h-5 w-5 rounded-full border-4 shadow-md" />
                    </MarkerContent>
                  </MapMarker>
                )}
              </Map>
            )}
          </div>
          {hasPin ? (
            <p className="text-ink-muted mt-1.5 text-[13px]">
              <span className="font-data text-ink">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </span>{' '}
              · drag the pin to fine-tune
            </p>
          ) : (
            <p
              className={
                errors.latitude || errors.longitude
                  ? 'text-danger-ink mt-1.5 text-[13px]'
                  : 'text-ink-muted mt-1.5 text-[13px]'
              }
            >
              Click anywhere on the map to place the stop.
            </p>
          )}
        </div>

        <div className="border-line rounded-tile flex items-center justify-between gap-4 border-[1.5px] p-4">
          <div>
            <p className="text-ink text-[14px] font-bold">Show to commuters</p>
            <p className="text-ink-muted mt-0.5 text-[13px]">
              Hidden stops stay saved but off the map.
            </p>
          </div>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Switch
                checked={!!field.value}
                onCheckedChange={field.onChange}
                aria-label="Show to commuters"
              />
            )}
          />
        </div>

        {stop && (
          <PanelActionRow
            tone="danger"
            title="Remove this stop"
            description="Takes it off the route for good."
            action={
              <Button variant="danger-outline" size="sm" onClick={() => onDelete(stop)}>
                Remove stop
              </Button>
            }
          />
        )}
      </form>
    </SidePanel>
  );
}
