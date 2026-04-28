'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { Spinner } from '@/components/ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If set, only this role can access. Both admin and super_admin allowed if not set. */
  requiredRole?: 'admin' | 'super_admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const path = window.location.pathname + window.location.search;
      router.push(`/signin?from=${encodeURIComponent(path)}`);
      return;
    }

    const role = userProfile?.role;

    // TODO: works but cannot be able to go back to sign-in page anymore
    // Neither admin nor super_admin → unauthorized
    if (!role || (role !== 'admin' && role !== 'super_admin')) {
      router.push('/unauthorized');
      return;
    }

    // Page requires super_admin but user is only admin
    if (requiredRole === 'super_admin' && role !== 'super_admin') {
      router.push('/unauthorized');
      return;
    }
  }, [user, userProfile, loading, router, requiredRole]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  const role = userProfile?.role;
  if (!role || (role !== 'admin' && role !== 'super_admin')) return null;
  if (requiredRole === 'super_admin' && role !== 'super_admin') return null;

  return <>{children}</>;
}
