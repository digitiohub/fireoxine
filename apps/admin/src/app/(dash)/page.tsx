import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ImageOff, PackageX, Inbox } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { formatPaiseExact } from '@/lib/money';
import { formatDate, orderStatusLabel } from '@/lib/utils';
import type { AdminStatsDto } from '@fireoxine/types';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminDashboard() {
  // One call. The dashboard's ten counts are aggregates the database can do
  // far better in one place than ten HTTP round trips could.
  const res = await apiGet<AdminStatsDto>('/api/admin/stats');
  if (!res.ok) {
    return (
      <div>
        <h1 className="fx-display text-4xl">Dashboard</h1>
        <p className="mt-8 border border-wedge bg-wedge/[0.06] p-6 text-sm text-ink">
          {res.error}
        </p>
      </div>
    );
  }

  const {
    products: productCount,
    activeProducts,
    productsWithoutImages,
    outOfStockVariants: outOfStock,
    orders: orderCount,
    pendingOrders,
    revenuePaise,
    newEnquiries,
    newMessages,
    recentOrders,
  } = res.data;

  const stats = [
    ['Products', `${activeProducts} / ${productCount}`, 'active of total'],
    ['Orders', String(orderCount), `${pendingOrders} pending`],
    ['Revenue', formatPaiseExact(revenuePaise), 'excluding cancelled'],
    ['Enquiries', String(newEnquiries + newMessages), 'unread'],
  ];

  return (
    <div>
      <h1 className="fx-display text-4xl">Dashboard</h1>

      {/* The one thing that actually matters right now. */}
      {productsWithoutImages > 0 && (
        <div className="mt-8 flex flex-col gap-4 border border-wedge bg-wedge/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <ImageOff className="mt-0.5 size-5 shrink-0 text-wedge" aria-hidden="true" />
            <div>
              <h2 className="fx-display text-lg">
                {productsWithoutImages} {productsWithoutImages === 1 ? 'product has' : 'products have'} no
                photograph
              </h2>
              <p className="mt-1.5 max-w-[64ch] text-sm leading-relaxed text-ink-muted">
                Those products currently show a designed “photograph pending” plate on the site, so
                nothing looks broken — but a real photograph will always sell better. Upload from
                the product editor.
              </p>
            </div>
          </div>
          <Link href="/products?filter=no-image" className="fx-wedge shrink-0">
            Upload images
          </Link>
        </div>
      )}

      <dl className="mt-8 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([term, value, detail]) => (
          <div key={term} className="bg-ground-raised p-5">
            <dt className="fx-stencil text-[0.6rem] text-ink-faint">{term}</dt>
            <dd className="fx-display fx-num mt-2 text-2xl">{value}</dd>
            <dd className="mt-1 text-xs text-ink-faint">{detail}</dd>
          </div>
        ))}
      </dl>

      {outOfStock > 0 && (
        <p className="mt-6 flex items-center gap-2.5 border border-rule bg-ground-raised px-4 py-3 text-sm text-ink-muted">
          <PackageX className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
          <span className="fx-num">{outOfStock}</span> variants are out of stock and showing as
          unavailable on the site.
        </p>
      )}

      <section className="mt-12" aria-labelledby="recent">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-rule pb-3">
          <h2 id="recent" className="fx-display text-2xl">
            Recent orders
          </h2>
          <Link
            href="/orders"
            className="text-xs text-ink-muted underline decoration-rule-strong underline-offset-4 hover:text-ink"
          >
            All orders
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="border border-rule bg-ground-raised px-5 py-10 text-center text-sm text-ink-muted">
            No orders yet.
          </p>
        ) : (
          <div className="overflow-x-auto border border-rule">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-rule bg-ground-sunk text-left">
                  {['Order', 'Placed', 'Items', 'Status', 'Total'].map((h) => (
                    <th key={h} className="fx-stencil px-4 py-3 text-[0.6rem] text-ink-faint">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-rule last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href="/orders" 
                        className="fx-num text-ink underline decoration-rule-strong underline-offset-4 hover:text-wedge"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="fx-num px-4 py-3 text-ink-muted">{formatDate(order.placedAt)}</td>
                    <td className="fx-num px-4 py-3 text-ink-muted">{order.itemCount}</td>
                    <td className="px-4 py-3">
                      <span className="fx-stencil border border-rule-strong px-2 py-0.5 text-[0.55rem] text-ink-muted">
                        {orderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="fx-num px-4 py-3">{formatPaiseExact(order.totalPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
