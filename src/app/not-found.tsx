import Link from 'next/link';
import { MapPinOff } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="bg-page flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="border-line bg-card w-full max-w-[420px] rounded-[24px] border-[1.5px] p-7 text-center shadow-md">
        <span className="bg-action-soft text-action mx-auto flex h-14 w-14 items-center justify-center rounded-full">
          <MapPinOff size={26} />
        </span>
        <p className="font-data text-ink-muted mt-5 text-[13px] font-semibold">404</p>
        <h1 className="text-title text-ink mt-1">This page isn&apos;t on the route</h1>
        <p className="text-ink-muted mt-2 text-[15px]">It doesn&apos;t exist or was moved.</p>
        <Link
          href="/"
          className="bg-action text-on-action hover:bg-action-hover mt-6 inline-flex h-[52px] w-full items-center justify-center rounded-full text-[15px] font-semibold transition-colors hover:no-underline"
        >
          Back to fleet overview
        </Link>
      </div>
    </div>
  );
}
