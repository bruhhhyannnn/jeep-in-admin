import { cn } from '@/lib';

interface PageHeaderProps {
  title: string;
  /** One helpful line: counts, scope, or what the page is for. */
  description?: React.ReactNode;
  /** Search, filters and the page's main action, right-aligned on wide screens. */
  actions?: React.ReactNode;
  className?: string;
}

/** One heading, one helpful line. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-6',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-title text-ink">{title}</h1>
        {description && <p className="text-ink-muted mt-1.5 text-[14px]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
