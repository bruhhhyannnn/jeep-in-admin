'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Eye, EyeOff, Bus } from 'lucide-react';
import { auth } from '@/lib';
import { signInSchema, type SignInFormData } from '@/lib';
import { useAuthStore } from '@/store';
import { Button, Input, Label } from '@/components/ui';

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('from') ?? '/';
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({ resolver: zodResolver(signInSchema) });

  // Redirect already-authenticated admins
  useEffect(() => {
    if (user) router.push(redirectTo);
  }, [user, router, redirectTo]);

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
        setAuthError(body.error ?? 'You do not have permission to access this portal.');
        await auth.signOut();
        return;
      }

      router.push(redirectTo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found')) {
        setAuthError('Invalid email or password.');
      } else {
        setAuthError(msg);
      }
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Logo + heading */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="bg-brand-600 flex h-14 w-14 items-center justify-center rounded-2xl">
          <Bus size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">JEEP-IN Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to manage your transport operations</p>
        </div>
      </div>

      {authError && (
        <div className="bg-danger-500/10 text-danger-400 border-danger-500/20 rounded-lg border px-4 py-3 text-sm">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@itc.com"
            error={!!errors.email}
            hint={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              error={!!errors.password}
              hint={errors.password?.message}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
          loadingText="Signing in..."
        >
          Sign in
        </Button>
      </form>

      <p className="text-center text-xs text-gray-500">
        Admin portal only — contact your super administrator for access.
      </p>
    </div>
  );
}
