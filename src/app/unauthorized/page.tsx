import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="bg-page flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="border-line bg-card w-full max-w-[420px] rounded-[24px] border-[1.5px] p-7 text-center shadow-md">
        <span className="bg-danger-soft text-danger-ink mx-auto flex h-14 w-14 items-center justify-center rounded-full">
          <ShieldAlert size={26} />
        </span>
        <h1 className="text-title text-ink mt-5">This account can&apos;t open the dashboard</h1>
        <p className="text-ink-muted mt-2 text-[15px] leading-relaxed">
          Only admins and super admins sign in here. Driver accounts work in the driver app. If you
          think this is a mistake, ask your super admin.
        </p>
        <Link
          href="/signin"
          className="bg-action text-on-action hover:bg-action-hover mt-6 inline-flex h-[52px] w-full items-center justify-center rounded-full text-[15px] font-semibold transition-colors hover:no-underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
