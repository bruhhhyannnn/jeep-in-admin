'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useSidebarStore } from '@/store';
import { LogoMark } from '@/components/common';

/** Below 1024px the sidebar becomes a drawer; this bar opens it. */
export function AppHeader() {
  const toggleMobileSidebar = useSidebarStore((s) => s.toggleMobileSidebar);

  return (
    <header className="bg-inverse sticky top-0 z-30 flex h-14 items-center gap-3 px-4 text-white lg:hidden">
      <button
        type="button"
        onClick={toggleMobileSidebar}
        aria-label="Open menu"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 hover:bg-white/10"
      >
        <Menu size={19} />
      </button>
      <Link href="/" className="flex items-center gap-2">
        <LogoMark className="h-6 w-4 text-white" />
        <span className="text-[16px] font-extrabold tracking-tight">JEEP-IN</span>
      </Link>
    </header>
  );
}
