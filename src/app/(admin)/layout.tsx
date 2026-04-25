'use client';

import { AppSidebar, AppHeader, Backdrop } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';
import { useSidebarStore } from '@/store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebarStore();

  const marginLeft = isMobileOpen ? 'ml-0' : isExpanded || isHovered ? 'lg:ml-72' : 'lg:ml-20';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 xl:flex dark:bg-gray-50">
        <AppSidebar />
        <Backdrop />
        <div className={`flex-1 transition-all duration-300 ease-in-out ${marginLeft}`}>
          <AppHeader />
          <main className="mx-auto max-w-screen-2xl p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
