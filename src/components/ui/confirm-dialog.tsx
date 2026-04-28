'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib';
import { Button } from './button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
      setTimeout(() => setMounted(false), 200);
    }
  }, [isOpen]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, isLoading, onClose]);

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
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={() => !isLoading && onClose()}
      />
      <div
        className={cn(
          'relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl transition-all duration-200 dark:border-gray-800 dark:bg-gray-950',
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {variant === 'danger' && (
          <div className="bg-danger-500/10 mb-4 flex h-11 w-11 animate-bounce items-center justify-center rounded-full">
            <AlertTriangle size={20} className="text-danger-400" />
          </div>
        )}
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="mb-6 text-sm text-gray-500">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText="Deleting..."
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
