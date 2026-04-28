import Link from 'next/link';
import { Bus } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-white px-4 dark:bg-gray-100">
      <div className="bg-brand-600/10 flex h-16 w-16 items-center justify-center rounded-2xl">
        <Bus size={32} className="text-brand-400" />
      </div>
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-200">404</h1>
        <p className="mt-2 text-sm text-gray-500">This page doesn't exist or was moved.</p>
      </div>
      <Link
        href="/"
        className="bg-brand-600 hover:bg-brand-700 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
