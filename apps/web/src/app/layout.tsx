import type { Metadata } from 'next';
import { Anton, Archivo } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@fireoxine/ui';
import { Header } from '@/components/site/Header';
import { ScrollChoreography } from '@/components/site/ScrollChoreography';
import { Footer } from '@/components/site/Footer';
import { apiGetOr } from '@/lib/api';
import type { SessionUserDto, SettingsDto } from '@fireoxine/types';
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

type Shell = {
  settings: SettingsDto;
  categories: { name: string; slug: string }[];
  hazards: { name: string; slug: string }[];
  cartCount: number;
  user: SessionUserDto | null;
};

const EMPTY_SHELL: Shell = {
  settings: {},
  categories: [],
  hazards: [],
  cartCount: 0,
  user: null,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // One call, not five. The API bundles settings, nav, cart count and user
  // because this layout runs on every page in the site.
  const shell = await apiGetOr<Shell>('/api/shell', EMPTY_SHELL);

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
            categories={shell.categories}
            hazards={shell.hazards}
            cartCount={shell.cartCount}
            user={shell.user}
          />
          <main id="main">{children}</main>
          <ScrollChoreography />
          <Footer settings={shell.settings} />
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
