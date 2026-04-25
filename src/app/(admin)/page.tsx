'use client';

import { Bus, Users, MapPin, Clock } from 'lucide-react';
import { PageBreadcrumb } from '@/components/common';
import { Badge, Spinner } from '@/components/ui';
import { useAuthStore } from '@/store';
import { useDrivers, useJeepneys, useRoute, useOrganization } from '@/hooks';

export default function DashboardPage() {
  const { userProfile } = useAuthStore();
  const orgId = userProfile?.organizationId ?? '';

  const { data: org } = useOrganization(orgId);
  const { data: drivers = [], isPending: loadingDrivers } = useDrivers(orgId);
  const { data: jeepneys = [], isPending: loadingJeepneys } = useJeepneys(orgId);
  const { data: route } = useRoute(org?.routeId);

  const activeDrivers = drivers.filter((d) => d.isActive);
  const activeJeepneys = jeepneys.filter((j) => j.isActive);
  const assignedJeepneys = jeepneys.filter((j) => j.assignedDriverId);

  // Determine working hours status
  const isOpen = (() => {
    if (!route?.workingHours) return null;
    const now = new Date();
    const [sh, sm] = route.workingHours.start.split(':').map(Number);
    const [eh, em] = route.workingHours.end.split(':').map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= sh * 60 + sm && cur <= eh * 60 + em;
  })();

  const stats = [
    {
      title: 'Active Drivers',
      value: loadingDrivers ? '—' : activeDrivers.length,
      icon: <Users size={20} />,
      color: 'brand' as const,
      sub: `${drivers.length} total`,
    },
    {
      title: 'Total Jeepneys',
      value: loadingJeepneys ? '—' : jeepneys.length,
      icon: <Bus size={20} />,
      color: 'success' as const,
      sub: `${activeJeepneys.length} active`,
    },
    {
      title: 'Currently Assigned',
      value: loadingJeepneys ? '—' : assignedJeepneys.length,
      icon: <MapPin size={20} />,
      color: 'info' as const,
      sub: 'jeepneys with a driver',
    },
    {
      title: 'Working Hours',
      value: route ? `${route.workingHours.start} – ${route.workingHours.end}` : '—',
      icon: <Clock size={20} />,
      color: isOpen ? ('success' as const) : ('warning' as const),
      sub: isOpen === null ? 'loading…' : isOpen ? 'Currently open' : 'Currently closed',
      badge: isOpen === null ? null : isOpen ? 'Open' : 'Closed',
      badgeColor: isOpen ? 'success' : 'warning',
    },
  ];

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Dashboard" />

      {/* Org header */}
      {org && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 px-5 py-4 dark:border-gray-200 dark:bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Organization</p>
              <h3 className="mt-0.5 text-base font-semibold text-gray-100 dark:text-gray-900">
                {org.name}
              </h3>
            </div>
            {route && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Route</p>
                <p className="mt-0.5 text-sm font-medium text-gray-300 dark:text-gray-700">
                  {route.name}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Recent drivers table */}
      <div className="rounded-xl border border-gray-800 bg-gray-950 p-5 dark:border-gray-200 dark:bg-white">
        <h3 className="mb-4 text-sm font-semibold text-gray-200 dark:text-gray-800">
          Recent Drivers
        </h3>
        {loadingDrivers ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : drivers.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-600">No drivers yet</p>
        ) : (
          <div className="space-y-2">
            {drivers.slice(0, 5).map((d) => (
              <div
                key={d.uid}
                className="flex items-center justify-between rounded-lg border border-gray-800 px-4 py-3 dark:border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-brand-600/20 text-brand-400 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold">
                    {d.firstName.charAt(0)}
                    {d.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200 dark:text-gray-800">
                      {d.firstName} {d.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{d.email}</p>
                  </div>
                </div>
                <Badge color={d.isActive ? 'success' : 'danger'} size="sm">
                  {d.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color = 'brand',
  sub,
  badge,
  badgeColor,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'brand' | 'success' | 'warning' | 'info';
  sub?: string;
  badge?: string | null;
  badgeColor?: string;
}) {
  const bgMap = {
    brand: 'bg-brand-600/10 text-brand-400',
    success: 'bg-success-500/10 text-success-400',
    warning: 'bg-warning-500/10 text-warning-400',
    info: 'bg-info-500/10 text-info-400',
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 p-5 dark:border-gray-200 dark:bg-white">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgMap[color]}`}>
          {icon}
        </div>
        {badge && (
          <Badge color={badgeColor as 'success' | 'warning'} size="sm">
            {badge}
          </Badge>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-gray-100 dark:text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-400 dark:text-gray-600">{title}</p>
      {sub && <p className="mt-1 text-xs text-gray-600">{sub}</p>}
    </div>
  );
}
