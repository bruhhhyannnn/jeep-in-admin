'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib';
import { Button } from './button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  /** The confirm button repeats the choice back, e.g. "Deactivate this driver". */
  confirmLabel?: string;
  /** Says what staying put means, e.g. "Keep them active". */
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  loadingText?: string;
  /** Extra detail under the message, e.g. what is kept and what is removed. */
  children?: React.ReactNode;
}

/** A yes/no before something that can't be casually undone. */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  loadingText = 'Working…',
  children,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const titleId = useId();

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
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', h, true);
    return () => document.removeEventListener('keydown', h, true);
  }, [isOpen, isLoading, onClose]);

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
        'fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center',
        !visible && 'pointer-events-none'
      )}
    >
      <div
        className={cn(
          'bg-scrim absolute inset-0 transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={() => !isLoading && onClose()}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'bg-card rounded-card relative w-full max-w-[480px] p-6 shadow-lg transition-all duration-200 ease-(--ease-calm) sm:p-7',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-ink text-xl leading-tight font-extrabold">
          {title}
        </h2>
        <div className="text-ink-muted mt-2 text-[15px] leading-relaxed">{message}</div>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="h-[46px] flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            className="h-[46px] flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText={loadingText}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** "Kept / Removed" style detail block used inside confirm dialogs. */
export function ConfirmFacts({ items }: { items: { label: string; text: string }[] }) {
  return (
    <div className="border-line divide-line rounded-tile divide-y border-[1.5px]">
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3">
          <p className="eyebrow">{item.label}</p>
          <p className="text-ink mt-1 text-[14px] leading-snug">{item.text}</p>
        </div>
      ))}
    </div>
  );
}
