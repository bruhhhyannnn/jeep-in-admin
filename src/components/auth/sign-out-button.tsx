'use client';

import { signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '@/lib';
import { useAuthStore } from '@/store';
import { cn } from '@/lib';

export const LAST_EMAIL_KEY = 'jeep-in-last-email';

/** Signs out and lands on the sign-in card with a "you're logged out" line. No confirm. */
export function useSignOut() {
  const reset = useAuthStore((s) => s.reset);
  const email = useAuthStore((s) => s.user?.email ?? s.userProfile?.email);

  return async () => {
    try {
      if (email) localStorage.setItem(LAST_EMAIL_KEY, email);
    } catch {
      // Storage can be unavailable (private mode); the email just won't be kept.
    }
    try {
      // Destroy server session cookie
      await fetch('/api/auth/session', { method: 'DELETE' });
      // Sign out from Firebase client
      await signOut(auth);
      reset();
      // Full navigation so the protected layout can't race this redirect, and cached data is dropped.
      window.location.assign('/signin?loggedOut=1');
    } catch {
      toast.error('Could not log out. Check your connection and try again.');
    }
  };
}

export function SignOutButton({ className }: { className?: string }) {
  const handleSignOut = useSignOut();

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={cn(
        'text-danger-ink hover:bg-danger-soft flex h-11 w-full cursor-pointer items-center gap-3 rounded-full px-4 text-[14px] font-semibold transition-colors',
        className
      )}
    >
      <LogOut size={17} />
      Log out
    </button>
  );
}
