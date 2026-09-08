import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { getAdmin } from '@/lib/session';
import { AdminNav } from '@/components/AdminNav';
import { adminLogoutAction } from '@/actions/auth';

/**
 * Every authenticated page sits inside this group. The guard is here rather
 * than in each page so a new route cannot be added unprotected by accident.
 *
 * There is no "back to the site" link any more: the storefront is a separate
 * deployment on another origin, and this app is meant to be reachable only
 * from inside the business network.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect('/login');

  return (
    <div className="mx-auto grid max-w-[1600px] gap-0 px-4 py-10 sm:px-6 lg:grid-cols-[14rem_1fr] lg:gap-12 lg:px-10">
      <aside className="lg:sticky lg:top-10 lg:self-start">
        <Link href="/" className="fx-display block text-2xl leading-none">
          FIREOXINE
          <span className="fx-stencil mt-1 block text-[0.55rem] text-wedge">Back office</span>
        </Link>

        <div className="mb-6 mt-6 border-b border-rule pb-4">
          <p className="fx-stencil text-[0.6rem] text-ink-faint">Signed in as</p>
          <p className="mt-1 truncate text-sm text-ink">{admin.email}</p>
        </div>

        <AdminNav />

        <form action={adminLogoutAction} className="mt-6 border-t border-rule pt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 text-xs text-ink-muted transition-colors hover:text-ink"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </aside>

      <div className="min-w-0 pt-8 lg:pt-0">{children}</div>
    </div>
  );
}
