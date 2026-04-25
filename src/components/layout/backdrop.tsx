'use client';

import { useSidebarStore } from '@/store';

export function Backdrop() {
  const { isMobileOpen, closeMobile } = useSidebarStore();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
      onClick={closeMobile}
    />
  );
}
