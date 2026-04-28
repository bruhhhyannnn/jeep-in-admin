'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib';

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Dropdown({ isOpen, onClose, children, className }: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('.dropdown-toggle')
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'dark:shadow-theme-lg-dark absolute right-0 z-30 mt-2 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900',
        className
      )}
    >
      {children}
    </div>
  );
}
