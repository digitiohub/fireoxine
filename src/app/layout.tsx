import type { Metadata } from 'next';
import { Anton, Archivo } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/site/ThemeProvider';
import { Header } from '@/components/site/Header';
import { ScrollChoreography } from '@/components/site/ScrollChoreography';
import { Footer } from '@/components/site/Footer';
import { getSettings } from '@/lib/settings';
import { getCart } from '@/lib/cart';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import './globals.css';

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

export const metadata: Metadata = {
  title: {
    default: 'FireOxine — Certified fire extinguishers, chosen by what is at risk',
    template: '%s · FireOxine',
  },
  description:
    'ISI-marked fire extinguishers, hose reels, detection and signage. Browse by product family or by the hazard you are actually protecting against.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, cart, session, categories, hazards] = await Promise.all([
    getSettings(),
    getCart(),
    auth(),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
      select: { name: true, slug: true },
    }),
    db.hazard.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
      select: { name: true, slug: true },
    }),
  ]);

  return (
    <html lang="en" suppressHydrationWarning className={`${anton.variable} ${archivo.variable}`}>
      <body className="min-h-dvh antialiased">
        {/*
          Arms the scroll choreography before first paint, the way a theme
          script does. Without this the page would paint visible, then hide
          itself when the effect ran, then animate — a flash on every load.

          The timeout is the safety net: if ScrollChoreography never mounts
          (a thrown render, a chunk that fails to load), the class is dropped
          and every pre-animation state stops matching, so the page is
          complete and still rather than blank and waiting.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var d=document.documentElement;d.classList.add('fx-motion');var t=setTimeout(function(){d.classList.remove('fx-motion')},1500);window.__fxReady=function(){clearTimeout(t)};}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-wedge focus:px-4 focus:py-2 focus:text-wedge-ink fx-stencil focus:text-xs"
          >
            Skip to content
          </a>
          <Header
            categories={categories}
            hazards={hazards}
            cartCount={cart.count}
            user={session?.user ?? null}
          />
          <main id="main">{children}</main>
          <ScrollChoreography />
          <Footer settings={settings} />
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
