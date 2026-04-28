'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Modal({ isOpen, onClose, children, title, className }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        !visible && 'pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl transition-all duration-200 dark:border-gray-800 dark:bg-gray-950',
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-500 hover:text-gray-300 dark:hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
