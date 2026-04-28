import { cn } from '@/lib';
import Image from 'next/image';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  center?: boolean;
  className?: string;
}

const sizeMap = { sm: 'h-6 w-6', md: 'h-9 w-9', lg: 'h-12 w-12' };

export function Spinner({ size = 'md', center = false, className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'relative flex animate-bounce items-center justify-center',
        center && 'mx-auto',
        sizeMap[size],
        className
      )}
    >
      <Image
        src="/jeep-in-favicon.png"
        alt="JEEP-IN Logo"
        sizes="(max-width: 768px) 48px, 64px"
        className="object-contain"
        fill
        // TODO: why unoptimized
        unoptimized
      />
      <div className="absolute inset-0 animate-spin rounded-full border-2 bg-linear-to-tr from-20% to-white blur-sm dark:to-gray-900" />
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
