import { cn } from '@/lib';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  center?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-11 w-11 border-[3px]',
};

export function Spinner({ size = 'md', center = false, className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'border-action/20 border-t-action animate-spin rounded-full',
        center && 'mx-auto',
        sizeMap[size],
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Spinner size="md" />
    </div>
  );
}

export function PageError({ message }: { message: string }) {
  return (
    <div className="flex h-[50vh] items-center justify-center px-4">
      <div className="border-danger/30 bg-card rounded-card max-w-md border-[1.5px] p-6 text-center shadow-sm">
        <p className="text-ink text-heading">Something went wrong</p>
        <p className="text-danger-ink mt-1.5 text-[14px]">{message}</p>
      </div>
    </div>
  );
}
