import type { Metadata } from 'next';
import Link from 'next/link';
import { apiGetOr } from '@/lib/api';
import { formatPaiseExact } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { OrderStatusSelect } from '@/components/OrderStatusSelect';
import type { OrderDto } from '@fireoxine/types';

export const metadata: Metadata = { title: 'Orders · Admin' };

export default async function AdminOrdersPage() {
  const orders = await apiGetOr<OrderDto[]>('/api/admin/orders', []);

  return (
    <div>
      <h1 className="fx-display text-4xl">Orders</h1>
      <p className="fx-num mt-2 text-sm text-ink-muted">
        {orders.length} {orders.length === 1 ? 'order' : 'orders'}
      </p>

      {orders.length === 0 ? (
        <p className="mt-8 border border-rule bg-ground-raised px-5 py-14 text-center text-sm text-ink-muted">
          No orders yet. They will appear here as soon as someone checks out.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border border-rule bg-ground-raised p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/order/${order.orderNumber}`}
                    className="fx-display fx-num text-lg underline decoration-rule-strong underline-offset-4 hover:text-wedge"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="fx-num mt-1 text-xs text-ink-muted">
                    {formatDate(order.placedAt)} · {order.shipName} · {order.phone}
                  </p>
                  <p className="fx-num mt-0.5 text-xs text-ink-faint">
                    {order.shipCity}, {order.shipState} {order.shipPincode}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="fx-num fx-display text-lg">
                    {formatPaiseExact(order.totalPaise)}
                  </p>
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </div>
              </div>

              <ul className="fx-num mt-4 space-y-1 border-t border-rule pt-3 text-xs text-ink-muted">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.productName} · {item.variantLabel} · {item.sku} × {item.quantity} ={' '}
                    {formatPaiseExact(item.lineTotalPaise)}
                  </li>
                ))}
              </ul>

              {order.notes && (
                <p className="mt-3 border-l-2 border-wedge pl-4 text-xs leading-relaxed text-ink-muted">
                  {order.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
