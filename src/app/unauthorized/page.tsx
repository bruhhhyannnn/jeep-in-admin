import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-4">
      <div className="bg-danger-500/10 flex h-16 w-16 items-center justify-center rounded-2xl">
        <ShieldAlert size={32} className="text-danger-400" />
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Access Denied</h1>
        <p className="mt-2 text-sm text-gray-500">
          You do not have permission to access this portal.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Contact your super administrator if you believe this is a mistake.
        </p>
      </div>
      <Link
        href="/signin"
        className="bg-brand-600 hover:bg-brand-700 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
      >
        Back to Sign In
      </Link>
    </div>
  );
}
