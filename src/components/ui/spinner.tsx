import { cn } from '@/lib';
import { Bus } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  center?: boolean;
  className?: string;
}

const sizeMap = { sm: 'h-6 w-6', md: 'h-9 w-9', lg: 'h-12 w-12' };
const iconMap = { sm: 14, md: 18, lg: 24 };

export function Spinner({ size = 'md', center = false, className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        center && 'mx-auto',
        sizeMap[size],
        className
      )}
    >
      <div className="border-brand-600/20 border-t-brand-600 absolute inset-0 animate-spin rounded-full border-2" />
      <Bus size={iconMap[size]} className="text-brand-600" />
    </div>
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
    <div className="flex h-[50vh] items-center justify-center">
      <p className="text-danger-400 text-sm">{message}</p>
    </div>
  );
}
