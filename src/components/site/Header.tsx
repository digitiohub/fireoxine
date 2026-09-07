'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ShoppingBag, User, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/site/ThemeToggle';
import { Logo } from '@/components/site/Logo';
import { cn } from '@/lib/utils';

type NavItem = { name: string; slug: string };

export function Header({
  categories,
  hazards,
  cartCount,
  user,
}: {
  categories: NavItem[];
  hazards: NavItem[];
  cartCount: number;
  user: { name?: string | null; role?: string } | null;
}) {
  const pathname = usePathname();
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close both menus on navigation. Without this a mobile menu stays open
  // over the page it just navigated to, which reads as a broken tap.
  useEffect(() => {
    setShopOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const linkClass = (href: string) =>
    cn(
      'relative py-1 text-sm transition-colors',
      isActive(href) ? 'text-ink' : 'text-ink-muted hover:text-ink',
      isActive(href) &&
        'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[2px] after:bg-wedge'
    );

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-ground/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-10">
        {/* Left: theme toggle, then the primary nav group */}
        <div className="flex flex-1 items-center gap-1">
          <ThemeToggle />

          <nav className="ml-3 hidden items-center gap-6 lg:flex" aria-label="Primary">
            <Link href="/" className={linkClass('/')}>
              Home
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <button
                type="button"
                onClick={() => setShopOpen((v) => !v)}
                aria-expanded={shopOpen}
                aria-haspopup="true"
                className={cn(
                  'flex items-center gap-1 py-1 text-sm transition-colors',
                  isActive('/shop') || isActive('/hazard')
                    ? 'text-ink'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                Shop
                <ChevronDown
                  className={cn('size-3.5 transition-transform duration-200', shopOpen && 'rotate-180')}
                />
              </button>

              {shopOpen && (
                <div className="absolute left-0 top-full w-[34rem] border border-rule-strong bg-ground-raised p-6 shadow-[0_18px_40px_-24px_rgb(20_18_15_/_0.5)]">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="fx-stencil mb-3 text-[0.65rem] text-ink-faint">
                        By product family
                      </p>
                      <ul className="space-y-1.5">
                        <li>
                          <Link
                            href="/shop/all"
                            className="block py-0.5 text-sm text-ink transition-colors hover:text-wedge"
                          >
                            All products
                          </Link>
                        </li>
                        {categories.slice(0, 7).map((c) => (
                          <li key={c.slug}>
                            <Link
                              href={`/shop/${c.slug}`}
                              className="block py-0.5 text-sm text-ink-muted transition-colors hover:text-ink"
                            >
                              {c.name}
                            </Link>
                          </li>
                        ))}
                        <li>
                          <Link
                            href="/shop"
                            className="mt-1 block py-0.5 text-sm text-ink underline decoration-rule-strong"
                          >
                            All collections
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="fx-stencil mb-3 text-[0.65rem] text-ink-faint">
                        By what is at risk
                      </p>
                      <ul className="space-y-1.5">
                        {hazards.slice(0, 7).map((h) => (
                          <li key={h.slug}>
                            <Link
                              href={`/hazard/${h.slug}`}
                              className="block py-0.5 text-sm text-ink-muted transition-colors hover:text-ink"
                            >
                              {h.name}
                            </Link>
                          </li>
                        ))}
                        <li>
                          <Link
                            href="/hazard"
                            className="mt-1 block py-0.5 text-sm text-ink underline decoration-rule-strong"
                          >
                            All hazards
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link href="/about" className={linkClass('/about')}>
              About
            </Link>
          </nav>
        </div>

        {/* Centre: the mark */}
        <Link href="/" className="shrink-0 text-lg sm:text-xl" aria-label="FireOxine home">
          <Logo />
        </Link>

        {/* Right: secondary nav, then account and cart */}
        <div className="flex flex-1 items-center justify-end gap-1">
          <nav className="mr-3 hidden items-center gap-6 lg:flex" aria-label="Secondary">
            <Link href="/partner" className={linkClass('/partner')}>
              Partner
            </Link>
            <Link href="/contact" className={linkClass('/contact')}>
              Contact
            </Link>
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className={linkClass('/admin')}>
                Admin
              </Link>
            )}
          </nav>

          <Link
            href="/account"
            className="grid size-9 place-items-center text-ink-muted transition-colors hover:text-ink"
            aria-label={user ? `Account — ${user.name ?? 'signed in'}` : 'Sign in'}
          >
            <User className="size-4" />
          </Link>

          <Link
            href="/cart"
            className="relative grid size-9 place-items-center text-ink-muted transition-colors hover:text-ink"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
          >
            <ShoppingBag className="size-4" />
            {cartCount > 0 && (
              <span className="fx-num absolute -right-0.5 -top-0.5 grid min-w-[1.15rem] place-items-center bg-wedge px-1 text-[0.65rem] font-bold leading-[1.15rem] text-wedge-ink">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center text-ink-muted transition-colors hover:text-ink lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ground lg:hidden">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-rule px-4">
            <Logo className="text-lg" />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="grid size-9 place-items-center text-ink-muted hover:text-ink"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-8" aria-label="Mobile">
            <ul className="space-y-1">
              {[
                ['Home', '/'],
                ['All products', '/shop/all'],
                ['Collections', '/shop'],
                ['Shop by hazard', '/hazard'],
                ['About', '/about'],
                ['Partner', '/partner'],
                ['Contact', '/contact'],
                ['Account', '/account'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="fx-display block border-b border-rule py-4 text-3xl text-ink"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="fx-stencil mt-10 mb-4 text-[0.65rem] text-ink-faint">By product family</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/shop/${c.slug}`} className="text-sm text-ink-muted">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
