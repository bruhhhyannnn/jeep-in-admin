'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import {
  Map,
  ClipboardList,
  Users,
  Bus,
  MapPin,
  Receipt,
  Clock,
  ScrollText,
  Building2,
  Route,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsUpDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib';
import { useSidebarStore, useAuthStore } from '@/store';
import { useOrganization } from '@/hooks';
import { Avatar, LogoMark } from '@/components/common';
import { AccountMenu } from './account-menu';
import { useSidebarCollapsed } from './use-sidebar-collapsed';

type NavItem = { name: string; icon: React.ElementType; path: string };
type NavGroup = { label: string; items: NavItem[]; superAdminOnly?: boolean };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { icon: Map, name: 'Fleet overview', path: '/' },
      { icon: ClipboardList, name: 'Assignments', path: '/assignments' },
      { icon: Users, name: 'Drivers', path: '/drivers' },
      { icon: Bus, name: 'Jeepney units', path: '/jeepneys' },
    ],
  },
  {
    label: 'Route',
    items: [
      { icon: MapPin, name: 'Stop points', path: '/stop-points' },
      { icon: Receipt, name: 'Fare guide', path: '/fare-guide' },
      { icon: Clock, name: 'Shift hours', path: '/working-hours' },
    ],
  },
  {
    label: 'Records',
    items: [{ icon: ScrollText, name: 'Audit logs', path: '/audit-logs' }],
  },
  {
    label: 'Super admin',
    superAdminOnly: true,
    items: [
      { icon: Building2, name: 'Organizations', path: '/organizations' },
      { icon: Route, name: 'Routes', path: '/routes' },
      { icon: UserCog, name: 'Admins', path: '/admins' },
    ],
  },
];

export const SIDEBAR_WIDTH = { expanded: 'lg:pl-[248px]', collapsed: 'lg:pl-[76px]' };

export function AppSidebar() {
  const { isMobileOpen, closeMobile, setCollapsedPref } = useSidebarStore();
  const isCollapsedDesktop = useSidebarCollapsed();
  const { user, userProfile } = useAuthStore();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = userProfile?.role;
  const isSuperAdmin = role === 'super_admin';
  const { data: org } = useOrganization(isSuperAdmin ? undefined : userProfile?.organizationId);

  // The mobile drawer always shows labels.
  const collapsed = isCollapsedDesktop && !isMobileOpen;

  const displayName = userProfile?.firstName
    ? `${userProfile.firstName} ${userProfile.lastName}`
    : (user?.email?.split('@')[0] ?? 'Manager');
  const scopeLine = isSuperAdmin ? 'Super admin · all organizations' : (org?.name ?? 'Admin');

  const isActive = useCallback(
    (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path)),
    [pathname]
  );

  const groups = NAV_GROUPS.filter((g) => !g.superAdminOnly || isSuperAdmin);

  return (
    <aside
      className={cn(
        'bg-inverse fixed top-0 left-0 z-40 flex h-dvh flex-col text-white transition-[width,transform] duration-300 ease-(--ease-calm)',
        collapsed ? 'w-[76px]' : 'w-[248px]',
        isMobileOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex shrink-0 items-center gap-2.5 pt-5 pb-4',
          collapsed ? 'justify-center px-3' : 'px-5'
        )}
      >
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5" onClick={closeMobile}>
          <LogoMark className={cn('text-white', collapsed && 'mx-auto')} />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-[17px] leading-tight font-extrabold tracking-tight">
                JEEP-IN
              </span>
              <span className="text-navy-200 block text-[11px] font-medium">
                {isSuperAdmin ? 'Super admin dashboard' : 'Manager dashboard'}
              </span>
            </span>
          )}
        </Link>
        {!collapsed && (
          <>
            <button
              type="button"
              onClick={() => setCollapsedPref(true)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="text-navy-200 hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 transition-colors hover:bg-white/10 hover:text-white lg:flex"
            >
              <PanelLeftClose size={16} />
            </button>
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close menu"
              className="text-navy-200 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X size={17} />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="inverse-scrollbar flex-1 overflow-x-hidden overflow-y-auto px-3 pb-3">
        {groups.map((group) => (
          <div key={group.label} className="mt-3 first:mt-1">
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-8 bg-white/10" />
            ) : (
              <p className="text-navy-200/80 text-eyebrow mb-1.5 px-4 uppercase">{group.label}</p>
            )}
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      onClick={closeMobile}
                      title={collapsed ? item.name : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-[42px] items-center gap-3 rounded-full text-[14px] transition-colors duration-150',
                        collapsed ? 'mx-auto w-[42px] justify-center' : 'px-4',
                        active
                          ? 'bg-blue-600 font-semibold text-white shadow-[0_6px_16px_rgba(22,112,224,.35)]'
                          : 'text-navy-200 font-medium hover:bg-white/8 hover:text-white'
                      )}
                    >
                      <Icon size={collapsed ? 19 : 18} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: expand button (collapsed) + profile card */}
      <div className={cn('relative shrink-0 pb-4', collapsed ? 'px-3' : 'px-3')}>
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsedPref(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="text-navy-200 mx-auto mb-3 hidden h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border border-white/15 transition-colors hover:bg-white/10 hover:text-white lg:flex"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title={collapsed ? displayName : undefined}
          className={cn(
            'account-menu-toggle flex w-full cursor-pointer items-center gap-2.5 rounded-full border border-white/12 bg-white/6 text-left transition-colors hover:bg-white/10',
            collapsed ? 'mx-auto h-11 w-11 justify-center p-0' : 'p-1.5 pr-3'
          )}
        >
          <Avatar name={displayName} size="sm" tone="solid" />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{displayName}</span>
                <span className="text-navy-200 block truncate text-[11px]">{scopeLine}</span>
              </span>
              <ChevronsUpDown size={15} className="text-navy-200 shrink-0" />
            </>
          )}
        </button>

        <AccountMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          displayName={displayName}
          className={collapsed ? 'bottom-4 left-full ml-2' : 'bottom-full left-3 mb-2'}
        />
      </div>
    </aside>
  );
}
