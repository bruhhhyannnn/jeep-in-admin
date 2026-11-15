'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Check, CircleAlert } from 'lucide-react';
import { auth } from '@/lib';
import { signInSchema, type SignInFormData } from '@/lib';
import { useAuthStore } from '@/store';
import { Button, Input } from '@/components/ui';
import { LogoMark } from '@/components/common';
import { LAST_EMAIL_KEY } from './sign-out-button';

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('from') ?? '/';
  const loggedOut = searchParams?.get('loggedOut') === '1';
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({ resolver: zodResolver(signInSchema) });

  // Redirect already-authenticated admins
  useEffect(() => {
    if (user) router.push(redirectTo);
  }, [user, router, redirectTo]);

  // After logging out, keep the email so signing back in is quick.
  useEffect(() => {
    if (!loggedOut) return;
    try {
      const last = localStorage.getItem(LAST_EMAIL_KEY);
      if (last) setValue('email', last);
    } catch {
      // Storage unavailable — the field just starts empty.
    }
  }, [loggedOut, setValue]);

  const onSubmit = async (data: SignInFormData) => {
    setAuthError('');
    try {
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const idToken = await credential.user.getIdToken();

      // Create server-side session cookie and validate role
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const body = await res.json();
        setAuthError(
          body.error?.includes('insufficient role')
            ? "This account can't open the dashboard. Driver accounts only work in the driver app."
            : (body.error ?? 'You do not have permission to access this portal.')
        );
        await auth.signOut();
        return;
      }

      try {
        localStorage.setItem(LAST_EMAIL_KEY, data.email);
      } catch {
        // Not critical.
      }
      router.push(redirectTo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found')) {
        setAuthError('That email and password don’t match. Check both and try again.');
      } else if (msg.includes('auth/too-many-requests')) {
        setAuthError('Too many tries. Wait a few minutes, then sign in again.');
      } else {
        setAuthError(msg);
      }
    }
  };

  return (
    <div className="border-line bg-card w-full max-w-[400px] rounded-[24px] border-[1.5px] p-7 shadow-md">
      <div className="flex items-center gap-2.5">
        <LogoMark className="text-action h-9 w-[23px]" />
        <div>
          <p className="text-ink text-[17px] leading-tight font-extrabold tracking-tight">
            JEEP-IN
          </p>
          <p className="text-ink-muted text-[12px] font-medium">Manager dashboard</p>
        </div>
      </div>

      <h1 className="text-title text-ink mt-6">Sign in</h1>

      {loggedOut && !authError && (
        <div
          role="status"
          className="border-line bg-page rounded-input mt-4 flex items-center gap-2.5 border-[1.5px] px-3.5 py-3"
        >
          <span className="bg-live flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-white">
            <Check size={13} strokeWidth={3} />
          </span>
          <p className="text-ink text-[13px] font-semibold">
            You&apos;re logged out. Drivers keep sharing as normal.
          </p>
        </div>
      )}

      {authError && (
        <div
          role="alert"
          className="bg-danger-soft text-danger-ink rounded-input mt-4 flex items-start gap-2.5 px-3.5 py-3 text-[13px] font-medium"
        >
          <CircleAlert size={17} className="mt-px shrink-0" />
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
        <Input
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="name@email.com"
          error={!!errors.email}
          hint={errors.email?.message}
          {...register('email')}
        />

        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          error={!!errors.password}
          hint={errors.password?.message}
          endSlot={
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-pressed={showPassword}
              className="text-ink hover:bg-sunken h-8 cursor-pointer rounded-full px-3 text-[12px] font-semibold"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
          {...register('password')}
        />

        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          isLoading={isSubmitting}
          loadingText="Signing in…"
        >
          Sign in
        </Button>
      </form>

      <p className="text-ink-muted mt-5 text-center text-[13px] font-semibold">
        Forgot password — ask your super admin
      </p>
    </div>
  );
}
