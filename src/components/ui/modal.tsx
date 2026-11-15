'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4',
        !visible && 'pointer-events-none'
      )}
    >
      <div
        className={cn(
          'bg-scrim fixed inset-0 transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'bg-card sm:rounded-card relative flex max-h-[90dvh] w-full flex-col rounded-t-[28px] shadow-lg transition-all duration-200 ease-(--ease-calm) sm:max-w-lg',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="border-line flex shrink-0 items-center justify-between border-b px-6 py-4">
            <h2 className="text-heading text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-ink-muted hover:bg-sunken hover:text-ink flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
            >
              <X size={17} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
