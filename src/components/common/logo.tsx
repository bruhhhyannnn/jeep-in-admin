import { cn } from '@/lib';

/** The JEEP-IN mark, tinted with the current text colour. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="JEEP-IN"
      className={cn('inline-block h-8 w-5 shrink-0 bg-current', className)}
      style={{
        WebkitMask: 'url(/jeep-in-logo.png) center / contain no-repeat',
        mask: 'url(/jeep-in-logo.png) center / contain no-repeat',
      }}
    />
  );
}
