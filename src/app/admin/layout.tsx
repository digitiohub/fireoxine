import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Inbox, Settings, ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { AdminNav } from '@/components/admin/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  // A non-admin never sees an admin URL exists — they land on the account
  // page as though they had asked for it.
  if (!admin) redirect('/account');

  return (
    <div className="mx-auto grid max-w-[1600px] gap-0 px-4 py-10 sm:px-6 lg:grid-cols-[14rem_1fr] lg:gap-12 lg:px-10">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-6 border-b border-rule pb-4">
          <p className="fx-stencil text-[0.6rem] text-ink-faint">Signed in as</p>
          <p className="mt-1 truncate text-sm text-ink">{admin.email}</p>
        </div>
        <AdminNav />
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 border-t border-rule pt-4 text-xs text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to the site
        </Link>
      </aside>

      <div className="min-w-0 pt-8 lg:pt-0">{children}</div>
    </div>
  );
}
