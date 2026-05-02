'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Pencil, Trash2, MapPin } from 'lucide-react';
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
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from '@/components/ui';
import { useAuthStore } from '@/store';
import {
  useStopPoints,
  useCreateStopPoint,
  useUpdateStopPoint,
  useDeleteStopPoint,
  useAllRoutes,
  useOrganization,
} from '@/hooks';
import { stopPointSchema, type StopPointFormData } from '@/lib';
import type { ColumnDef } from '@tanstack/react-table';
import type { StopPoint } from '@/types';

const DEFAULT_CENTER: [number, number] = [120.5936, 18.198];
const DEFAULT_ZOOM = 12;

export default function StopPointsPage() {
  const { userProfile } = useAuthStore();
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const orgId = userProfile?.organizationId ?? '';

  const { data: org } = useOrganization(orgId);
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
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: stopPoints = [], isPending, isFetching, error } = useStopPoints(routeId);
  const deleteStopPoint = useDeleteStopPoint();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = stopPoints
    .filter((s) => !debouncedQuery || s.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
    .filter((s) => !selectedDirection || s.routeDirection === selectedDirection);

  const handleClose = () => {
    setModalOpen(false);
    setEditId(null);
  };

  const columns: ColumnDef<StopPoint, unknown>[] = [
    {
      id: 'name',
      header: 'Stop Point',
      accessorFn: (s) => s.name,
      cell: ({ row: { original: s } }) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">{s.name}</p>
          {s.address && <p className="text-xs text-gray-500">{s.address}</p>}
        </div>
      ),
    },
    {
      id: 'direction',
      header: 'Direction',
      accessorFn: (s) => s.routeDirection,
      cell: ({ row: { original: s } }) => (
        <Badge color="info" size="sm">
          {formatDirection(s.routeDirection)}
        </Badge>
      ),
    },
    {
      id: 'latLng',
      header: 'Coordinates',
      accessorFn: (s) => `${s.latitude}, ${s.longitude}`,
      cell: ({ row: { original: s } }) => (
        <span className="font-mono text-xs text-gray-500">
          {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (s) => s.isActive,
      cell: ({ row: { original: s } }) => (
        <Badge color={s.isActive ? 'success' : 'danger'} size="sm">
          {s.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row: { original: s } }) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditId(s.id);
              setModalOpen(true);
            }}
            className="hover:text-brand-400 cursor-pointer text-gray-600 transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeleteId(s.id)}
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
        <PageBreadcrumb pageTitle="Stop Points" />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {isSuperAdmin && (
              <Select
                options={allRoutes.map((r) => ({ value: r.id, label: r.name }))}
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                placeholder="Select route…"
              />
            )}
            {directions.length > 0 && (
              <Select
                options={[
                  { value: '', label: 'All directions' },
                  ...directions.map((d) => ({ value: d, label: formatDirection(d) })),
                ]}
                value={selectedDirection}
                onChange={(e) => setSelectedDirection(e.target.value)}
              />
            )}
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
            Add Stop Point
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={isPending || isFetching}
          emptyMessage="No stop points found"
          pageSize={15}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={editId ? 'Edit Stop Point' : 'Add Stop Point'}
      >
        <StopPointForm
          routeId={routeId}
          directions={directions}
          editId={editId}
          stopPoints={stopPoints}
          onSuccess={() => {
            handleClose();
            toast.success(editId ? 'Stop point updated' : 'Stop point created');
          }}
          onCancel={handleClose}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() =>
          deleteStopPoint.mutate(deleteId!, {
            onSuccess: () => {
              setDeleteId(null);
              toast.success('Stop point deleted');
            },
            onError: (e) => toast.error(e.message),
          })
        }
        title="Delete stop point"
        message="This stop point will be permanently removed from the route."
        confirmLabel="Delete"
        isLoading={deleteStopPoint.isPending}
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

/* ─── Stop Point Form (create & edit) ─── */
function StopPointForm({
  routeId,
  directions,
  editId,
  stopPoints,
  onSuccess,
  onCancel,
}: {
  routeId: string;
  directions: string[];
  editId: string | null;
  stopPoints: StopPoint[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!editId;
  const current = stopPoints.find((s) => s.id === editId);
  const createStopPoint = useCreateStopPoint();
  const updateStopPoint = useUpdateStopPoint();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StopPointFormData>({
    resolver: zodResolver(stopPointSchema),
    defaultValues: { isActive: true },
  });

  const lat = watch('latitude');
  const lng = watch('longitude');
  const hasPin = typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);

  useEffect(() => {
    if (current) {
      reset({
        name: current.name,
        address: current.address ?? '',
        routeDirection: current.routeDirection,
        latitude: current.latitude,
        longitude: current.longitude,
        isActive: current.isActive,
      });
    }
  }, [current, reset]);

  const handlePick = (lng: number, lat: number) => {
    setValue('longitude', lng, { shouldValidate: true });
    setValue('latitude', lat, { shouldValidate: true });
  };

  const mapCenter: [number, number] = current
    ? [current.longitude, current.latitude]
    : DEFAULT_CENTER;
  const mapZoom = current ? 15 : DEFAULT_ZOOM;

  const onSubmit = handleSubmit((data) => {
    if (isEdit) {
      updateStopPoint.mutate(
        { id: editId!, data },
        { onSuccess, onError: (e) => toast.error(e.message) }
      );
    } else {
      createStopPoint.mutate(
        { data, routeId },
        { onSuccess, onError: (e) => toast.error(e.message) }
      );
    }
  });

  const isPending = isSubmitting || createStopPoint.isPending || updateStopPoint.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label required>Name</Label>
        <Input
          placeholder="e.g. Batac City Hall"
          error={!!errors.name}
          hint={errors.name?.message}
          {...register('name')}
        />
      </div>

      <div>
        <Label>
          Address <span className="text-xs font-normal text-gray-500">(optional)</span>
        </Label>
        <Input placeholder="e.g. National Highway, Batac City" {...register('address')} />
      </div>

      <div>
        <Label required>Direction</Label>
        <Select
          options={directions.map((d) => ({ value: d, label: formatDirection(d) }))}
          placeholder={directions.length === 0 ? 'Select a route first' : 'Select direction…'}
          disabled={directions.length === 0}
          error={!!errors.routeDirection}
          hint={errors.routeDirection?.message}
          {...register('routeDirection')}
        />
      </div>

      {/* Hidden inputs so RHF registers lat/lng for validation */}
      <input type="hidden" {...register('latitude')} />
      <input type="hidden" {...register('longitude')} />

      <div>
        <Label required>
          Location{' '}
          <span className="text-xs font-normal text-gray-500">— click map to place pin</span>
        </Label>
        <div
          className="mt-1 overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700"
          style={{ height: 240 }}
        >
          <Map center={mapCenter} zoom={mapZoom}>
            <MapControls showZoom position="top-right" />
            <MapClickHandler onPick={handlePick} />
            {hasPin && (
              <MapMarker
                longitude={lng}
                latitude={lat}
                draggable
                onDragEnd={({ lng, lat }) => handlePick(lng, lat)}
              >
                <MarkerContent>
                  <div className="bg-warning-400 dark:shadow-theme-lg-dark flex h-8 w-8 animate-pulse items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-700">
                    <MapPin size={14} className="text-white" />
                  </div>
                </MarkerContent>
              </MapMarker>
            )}
          </Map>
        </div>
        {hasPin ? (
          <p className="mt-1 font-mono text-xs text-gray-500">
            {lat.toFixed(6)}, {lng.toFixed(6)} — drag pin to fine-tune
          </p>
        ) : (
          <p className="mt-1 text-xs text-gray-500">Click anywhere on the map to place a pin</p>
        )}
        {(errors.latitude || errors.longitude) && (
          <p className="text-danger-400 mt-1 text-xs">Please click the map to place a pin.</p>
        )}
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

function formatDirection(dir: string): string {
  return dir
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' → ');
}
