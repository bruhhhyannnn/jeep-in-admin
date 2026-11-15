'use client';

import {
  AppSidebar,
  AppHeader,
  Backdrop,
  ProfilePanel,
  SIDEBAR_WIDTH,
  useSidebarCollapsed,
} from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';
import { cn } from '@/lib';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebarCollapsed();

  return (
    <ProtectedRoute>
      <div className="bg-page min-h-dvh">
        <AppSidebar />
        <Backdrop />
        <div
          className={cn(
            'transition-[padding] duration-300 ease-(--ease-calm)',
            collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded
          )}
        >
          <AppHeader />
          <main className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            {children}
          </main>
        </div>
        <ProfilePanel />
      </div>
    </ProtectedRoute>
  );
}
