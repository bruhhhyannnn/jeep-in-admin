import { cn } from '@/lib';

type NoticeTone = 'pending' | 'live' | 'error' | 'info';

const iconTone: Record<NoticeTone, string> = {
  pending: 'bg-pending-soft text-pending-ink',
  live: 'bg-live-soft text-live-ink',
  error: 'bg-danger-soft text-danger-ink',
  info: 'bg-action-soft text-action',
};

/** A dashed callout: one icon, one fact, an optional action. */
export function Notice({
  icon,
  title,
  description,
  action,
  tone = 'pending',
  dashed = true,
  className,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: NoticeTone;
  dashed?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-card rounded-card flex flex-col gap-3 border-[1.5px] p-4 sm:flex-row sm:items-center',
        dashed ? 'border-line-strong border-dashed' : 'border-line',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            iconTone[tone]
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-ink text-[15px] leading-snug font-bold">{title}</p>
          {description && (
            <p className="text-ink-muted mt-0.5 text-[13px] leading-snug">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
