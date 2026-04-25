'use client';

import { useState } from 'react';
import { Sun, Moon, Menu, X, PanelRightClose, ChevronDown } from 'lucide-react';
import { useSidebarStore, useThemeStore, useAuthStore } from '@/store';
import { Dropdown, DropdownItem } from '@/components/ui';
import { SignOutButton } from '@/components/auth';
import { cn } from '@/lib';

export function AppHeader() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isMobileOpen, isExpanded, toggleSidebar, toggleMobileSidebar } = useSidebarStore();
  const { theme, toggleTheme } = useThemeStore();
  const { user, userProfile } = useAuthStore();

  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const displayName = userProfile?.firstName
    ? `${userProfile.firstName} ${userProfile.lastName}`
    : (user?.email?.split('@')[0] ?? 'User');

  const roleBadge = userProfile?.role === 'super_admin' ? 'Super Admin' : 'Admin';

  return (
    <header className="sticky top-0 z-20 flex w-full border-b border-gray-800 bg-gray-950 dark:border-gray-200 dark:bg-white">
      <div className="flex w-full items-center justify-between px-4 py-3 lg:px-6">
        {/* Left — sidebar toggle */}
        <button
          onClick={handleToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:bg-gray-900 dark:border-gray-200 dark:hover:bg-gray-100"
        >
          {isMobileOpen ? (
            <X size={18} />
          ) : isExpanded ? (
            <Menu size={18} />
          ) : (
            <PanelRightClose size={18} />
          )}
        </button>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:bg-gray-900 dark:border-gray-200 dark:hover:bg-gray-100"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((p) => !p)}
              className="dropdown-toggle flex items-center gap-2 rounded-lg px-2 py-1.5 text-gray-400 hover:bg-gray-900 dark:hover:bg-gray-100"
            >
              <div className="bg-brand-600 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden flex-col items-start leading-tight lg:flex">
                <span className="text-sm font-medium text-gray-200 dark:text-gray-800">
                  {displayName}
                </span>
                <span className="text-xs text-gray-500">{roleBadge}</span>
              </div>
              <ChevronDown
                size={15}
                className={cn('transition-transform duration-200', userMenuOpen && 'rotate-180')}
              />
            </button>

            <Dropdown
              isOpen={userMenuOpen}
              onClose={() => setUserMenuOpen(false)}
              className="w-56 p-2"
            >
              <DropdownItem>
                <div className="w-full border-b border-gray-800 pb-2 dark:border-gray-200">
                  <p className="text-left text-sm font-medium text-gray-200 dark:text-gray-800">
                    {displayName}
                  </p>
                  <p className="text-left text-xs text-gray-500">{user?.email}</p>
                </div>
              </DropdownItem>
              <SignOutButton />
            </Dropdown>
          </div>
        </div>
      </div>
    </header>
  );
}
