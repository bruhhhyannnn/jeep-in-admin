'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib';
import { useAuthStore } from '@/store';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export function SignOutButton() {
  const router = useRouter();
  const reset = useAuthStore((s) => s.reset);

  const handleSignOut = async () => {
    const toastId = toast.loading('Signing out...');
    try {
      // Destroy server session cookie
      await fetch('/api/auth/session', { method: 'DELETE' });
      // Sign out from Firebase client
      await signOut(auth);
      reset();
      toast.success('Signed out', { id: toastId });
      router.push('/signin');
    } catch {
      toast.error('Failed to sign out', { id: toastId });
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-900 dark:hover:text-gray-200"
    >
      <LogOut size={18} />
      Sign out
    </button>
  );
}
