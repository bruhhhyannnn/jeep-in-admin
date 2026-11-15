import { Suspense } from 'react';
import { SignInForm } from '@/components/auth';

export default function SignInPage() {
  return (
    <div className="bg-page flex min-h-dvh items-center justify-center px-4 py-10">
      <Suspense>
        <SignInForm />
      </Suspense>
    </div>
  );
}
