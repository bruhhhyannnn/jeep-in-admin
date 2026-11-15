import type { Metadata } from 'next';
import { Figtree, Spline_Sans_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-figtree',
});

const splineMono = Spline_Sans_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-spline-mono',
});

export const metadata: Metadata = {
  title: 'JEEP-IN',
  description: 'Admin dashboard for the JEEP-IN Modern Jeepney Tracking System',
  icons: { icon: '/jeep-in-favicon.png' },
};

// Applies the saved Appearance (light · dark · match computer) before first paint.
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem('jeep-in-theme')||'{}');var t=(s.state&&s.state.theme)||'light';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${splineMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
