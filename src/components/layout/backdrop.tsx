'use client';

import { useSidebarStore } from '@/store';

export function Backdrop() {
  const { isMobileOpen, closeMobile } = useSidebarStore();

  if (!isMobileOpen) return null;

  return <div className="bg-scrim fixed inset-0 z-30 lg:hidden" onClick={closeMobile} />;
}
