'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  Bus,
  Map,
  MapPin,
  Clock,
  ScrollText,
  UserCog,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib';
import { useSidebarStore, useAuthStore } from '@/store';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  superAdminOnly?: boolean;
  subItems?: { name: string; path: string }[];
};

const NAV_ITEMS: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, name: 'Dashboard', path: '/' },
  { icon: <Users size={20} />, name: 'Drivers', path: '/drivers' },
  { icon: <Bus size={20} />, name: 'Jeepneys', path: '/jeepneys' },
  { icon: <Map size={20} />, name: 'Live Map', path: '/map' },
  { icon: <MapPin size={20} />, name: 'Stop Points', path: '/stop-points' },
  { icon: <Clock size={20} />, name: 'Working Hours', path: '/working-hours' },
  { icon: <ScrollText size={20} />, name: 'Audit Logs', path: '/audit-logs' },
  // Super admin only
  { icon: <UserCog size={20} />, name: 'Admins', path: '/admins', superAdminOnly: true },
  { icon: <BookOpen size={20} />, name: 'Fare Guide', path: '/fare-guide', superAdminOnly: true },
];

export function AppSidebar() {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    openSubmenu,
    setIsHovered,
    toggleSubmenu,
    setOpenSubmenu,
  } = useSidebarStore();
  const { userProfile } = useAuthStore();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const role = userProfile?.role;
  const isVisible = isExpanded || isHovered || isMobileOpen;

  const visibleItems = NAV_ITEMS.filter((item) => !item.superAdminOnly || role === 'super_admin');

  const isActive = useCallback(
    (path?: string) => {
      if (!path) return false;
      if (path === '/') return pathname === '/';
      return pathname.startsWith(path);
    },
    [pathname]
  );

  useEffect(() => {
    const activeParent = visibleItems.find((item) =>
      item.subItems?.some((sub) => pathname.startsWith(sub.path))
    );
    setOpenSubmenu(activeParent?.name ?? null);
  }, [pathname]);

  return (
    <aside
      ref={sidebarRef}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'fixed top-0 left-0 z-30 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-950',
        isVisible ? 'w-72' : 'w-20',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center border-b border-gray-200 py-5 dark:border-gray-800',
          isVisible ? 'justify-start px-5' : 'justify-center px-4'
          // TODO: revalidate
          // isMobileOpen && 'mt-16'
        )}
      >
        <Link href="/" className="flex items-center gap-3">
          {/* TODO: add proper logo here */}
          {/* <Image
            src="/jeep-in-logo.png"
            alt="JEEP-IN Logo"
            sizes="(max-width: 768px) 48px, 64px"
            className="object-contain"
            fill
            unoptimized
          /> */}
          <div className="bg-brand-600 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <Bus size={20} className="text-white" />
          </div>
          {isVisible && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">JEEP-IN</span>
              <span className="text-xs text-gray-500">
                {role === 'super_admin' ? 'Super Admin' : 'Admin Portal'}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {visibleItems.map((item) => (
            <li key={item.name}>
              {item.subItems ? (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={cn(
                      'menu-item w-full',
                      openSubmenu === item.name ? 'menu-item-active' : 'menu-item-inactive',
                      !isVisible && 'lg:justify-center'
                    )}
                  >
                    <span
                      className={
                        openSubmenu === item.name
                          ? 'menu-item-icon-active'
                          : 'menu-item-icon-inactive'
                      }
                    >
                      {item.icon}
                    </span>
                    {isVisible && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        <ChevronDown
                          size={16}
                          className={cn(
                            'transition-transform duration-200',
                            openSubmenu === item.name && 'rotate-180'
                          )}
                        />
                      </>
                    )}
                  </button>
                  {isVisible && openSubmenu === item.name && (
                    <ul className="mt-1 ml-9 flex flex-col gap-0.5">
                      {item.subItems.map((sub) => (
                        <li key={sub.path}>
                          <Link
                            href={sub.path}
                            className={cn(
                              'block rounded-lg px-3 py-2 text-sm transition-colors',
                              isActive(sub.path)
                                ? 'bg-brand-600/10 text-brand-500 font-medium'
                                : 'text-gray-500 hover:text-gray-200 dark:hover:text-gray-700'
                            )}
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  href={item.path!}
                  className={cn(
                    'menu-item',
                    isActive(item.path) ? 'menu-item-active' : 'menu-item-inactive',
                    !isVisible && 'lg:justify-center'
                  )}
                >
                  <span
                    className={
                      isActive(item.path) ? 'menu-item-icon-active' : 'menu-item-icon-inactive'
                    }
                  >
                    {item.icon}
                  </span>
                  {isVisible && <span>{item.name}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* Org badge */}
        {isVisible && userProfile && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-100/50 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500">Organization</p>
            <p className="mt-0.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              {userProfile.organizationId}
            </p>
          </div>
        )}
      </nav>
    </aside>
  );
}
