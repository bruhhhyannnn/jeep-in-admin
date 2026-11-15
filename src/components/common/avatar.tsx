import { cn, getInitials } from '@/lib';

const avatarSizes = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-[13px]',
  lg: 'h-14 w-14 text-[17px]',
};

export function Avatar({
  name,
  size = 'sm',
  tone = 'soft',
  className,
}: {
  name: string;
  size?: keyof typeof avatarSizes;
  tone?: 'soft' | 'solid';
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        tone === 'soft' ? 'bg-action-soft text-action' : 'bg-blue-600 text-white',
        avatarSizes[size],
        className
      )}
    >
      {getInitials(name).slice(0, 2) || '?'}
    </span>
  );
}

/**
 * A jeepney unit number. `live` uses the map's vehicle colour (yellow) so a unit
 * reads the same in lists and on the map; `stale` is dashed and hollow.
 */
export function UnitTile({
  number,
  state = 'idle',
  size = 'md',
  className,
}: {
  number: string | null | undefined;
  state?: 'live' | 'stale' | 'idle' | 'empty';
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'font-data inline-flex shrink-0 items-center justify-center rounded-[11px] font-bold',
        size === 'md' ? 'h-10 w-10 text-[12px]' : 'h-8 w-8 text-[11px]',
        state === 'live' && 'bg-moment text-on-moment',
        state === 'stale' && 'border-stale text-ink-muted border-2 border-dashed',
        state === 'idle' && 'bg-sunken text-ink-muted',
        state === 'empty' && 'border-line-strong text-ink-meta border-[1.5px] border-dashed',
        className
      )}
    >
      {number ? `J${number}` : '—'}
    </span>
  );
}
