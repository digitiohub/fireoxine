import type { Metadata } from 'next';
import { Anton, Archivo } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@fireoxine/ui';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'FireOxine Admin', template: '%s · FireOxine Admin' },
  description: 'FireOxine back office.',
  // The back office must never be indexed, even if it is reachable.
  robots: { index: false, follow: false },
};

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${anton.variable} ${archivo.variable}`}>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--ground-raised)',
                color: 'var(--ink)',
                border: '1px solid var(--rule-strong)',
                borderRadius: '0',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
