import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import { db } from '@/lib/db';
import { formatPaiseExact } from '@/lib/money';
import { formatDate, orderStatusLabel } from '@/lib/utils';
import { PageHeader } from '@/components/site/PageHeader';

export const metadata: Metadata = { title: 'Order confirmed' };

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <>
      <PageHeader
        title="Order confirmed"
        lede={`We have your order. Our team will call ${order.phone} to confirm stock and delivery before dispatch.`}
      />

      <div className="mx-auto max-w-4xl px-4 py-12 pb-24 sm:px-6 lg:px-10">
        <div className="flex items-start gap-4 border border-rule-strong bg-ground-raised p-6">
          <span className="grid size-10 shrink-0 place-items-center bg-wedge text-wedge-ink">
            <Check className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="fx-stencil text-[0.65rem] text-ink-faint">Order number</p>
            <p className="fx-display fx-num mt-1 text-2xl">{order.orderNumber}</p>
            <p className="fx-num mt-2 text-sm text-ink-muted">
              Placed {formatDate(order.placedAt)} · {orderStatusLabel(order.status)}
            </p>
          </div>
        </div>

        <section className="mt-10" aria-labelledby="order-items">
          <h2 id="order-items" className="fx-display text-2xl">
            What you ordered
          </h2>
          <ul className="mt-5 border-t border-rule">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-6 border-b border-rule py-4">
                <div>
                  <p className="text-[0.95rem] font-medium">{item.productName}</p>
                  <p className="fx-num mt-1 text-xs text-ink-muted">
                    {item.variantLabel} · SKU {item.sku} · Qty {item.quantity}
                  </p>
                </div>
                <p className="fx-num shrink-0 text-sm">{formatPaiseExact(item.lineTotalPaise)}</p>
              </li>
            ))}
          </ul>

          <dl className="fx-num mt-5 space-y-2.5 text-sm sm:ml-auto sm:max-w-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd>{formatPaiseExact(order.subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Shipping</dt>
              <dd>{order.shippingPaise === 0 ? 'Free' : formatPaiseExact(order.shippingPaise)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-rule pt-2.5">
              <dt className="fx-display text-base">Total</dt>
              <dd className="fx-display text-lg">{formatPaiseExact(order.totalPaise)}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-10 grid gap-8 border-t border-rule pt-8 sm:grid-cols-2">
          <div>
            <h2 className="fx-stencil mb-3 text-[0.65rem] text-ink-faint">Delivering to</h2>
            <address className="not-italic text-sm leading-relaxed text-ink-muted">
              {order.shipName}
              <br />
              {order.shipLine1}
              <br />
              {order.shipLine2 && (
                <>
                  {order.shipLine2}
                  <br />
                </>
              )}
              {order.shipCity}, {order.shipState}
              <br />
              <span className="fx-num">{order.shipPincode}</span>
              <br />
              <span className="fx-num">{order.phone}</span>
            </address>
          </div>
          <div>
            <h2 className="fx-stencil mb-3 text-[0.65rem] text-ink-faint">What happens next</h2>
            <ol className="space-y-2 text-sm leading-relaxed text-ink-muted">
              <li>1. We confirm stock and delivery window by phone.</li>
              <li>2. An invoice is raised against your details.</li>
              <li>3. Dispatch within three to five working days.</li>
            </ol>
          </div>
        </section>

        {order.notes && (
          <section className="mt-8 border-t border-rule pt-8">
            <h2 className="fx-stencil mb-3 text-[0.65rem] text-ink-faint">Your notes</h2>
            <p className="max-w-[70ch] text-sm leading-relaxed text-ink-muted">{order.notes}</p>
          </section>
        )}

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/shop/all" className="fx-wedge">
            Continue shopping
          </Link>
          <Link href="/account" className="fx-wedge-ghost">
            View my orders
          </Link>
        </div>
      </div>
    </>
  );
}
