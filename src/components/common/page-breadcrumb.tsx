import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface PageBreadcrumbProps {
  pageTitle: string;
  parent?: { label: string; href: string };
}

export function PageBreadcrumb({ pageTitle, parent }: PageBreadcrumbProps) {
  return (
    <div className="mb-6 flex flex-col gap-1">
      <h2 className="text-xl font-semibold text-gray-100 dark:text-gray-900">{pageTitle}</h2>
      <nav>
        <ol className="flex items-center gap-1 text-sm">
          <li>
            <Link href="/" className="text-gray-500 hover:text-gray-300 dark:hover:text-gray-700">
              Home
            </Link>
          </li>
          {parent && (
            <>
              <ChevronRight size={13} className="text-gray-600" />
              <li>
                <Link
                  href={parent.href}
                  className="text-gray-500 hover:text-gray-300 dark:hover:text-gray-700"
                >
                  {parent.label}
                </Link>
              </li>
            </>
          )}
          <ChevronRight size={13} className="text-gray-600" />
          <li className="text-gray-400 dark:text-gray-600">{pageTitle}</li>
        </ol>
      </nav>
    </div>
  );
}
