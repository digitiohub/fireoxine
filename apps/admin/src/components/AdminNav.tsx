'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Inbox, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

// This app is the back office, so its routes start at the root rather than
// under /admin the way they did when it shared a deployment with the site.
const LINKS = [
  { href: '/', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
  { href: '/products', label: 'Products', Icon: Package },
  { href: '/categories', label: 'Collections', Icon: FolderTree },
  { href: '/orders', label: 'Orders', Icon: ShoppingCart },
  { href: '/enquiries', label: 'Enquiries', Icon: Inbox },
  { href: '/settings', label: 'Settings', Icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
        {LINKS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 border px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'border-ink bg-ink text-ground'
                    : 'border-transparent text-ink-muted hover:border-rule hover:text-ink'
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
