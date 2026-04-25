import { Suspense } from 'react';
import { SignInForm } from '@/components/auth';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 dark:bg-gray-100">
      <Suspense>
        <SignInForm />
      </Suspense>
    </div>
  );
}
