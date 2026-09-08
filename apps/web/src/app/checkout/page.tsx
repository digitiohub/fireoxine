import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiGet, apiGetOr } from '@/lib/api';
import { formatPaiseExact } from '@/lib/money';
import { PageHeader } from '@/components/site/PageHeader';
import { CheckoutForm } from '@/components/site/CheckoutForm';
import type { CartDto } from '@fireoxine/types';

type AddressDto = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
};
type AccountPayload = {
  user: { name: string; email: string; phone: string | null };
  addresses: AddressDto[];
};

const EMPTY_CART: CartDto = {
  items: [],
  subtotalPaise: 0,
  shippingPaise: 0,
  totalPaise: 0,
  count: 0,
  freeAbovePaise: 500000,
};

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const cart = await apiGetOr<CartDto>('/api/cart', EMPTY_CART);
  if (cart.items.length === 0) redirect('/cart');

  // A guest checks out too, so a 401 here is an expected answer, not a fault.
  const account = await apiGet<AccountPayload>('/api/account');
  const user = account.ok
    ? { ...account.data.user, addresses: account.data.addresses }
    : null;

  return (
    <>
      <PageHeader title="Checkout" lede="Delivery details, then we confirm by phone before dispatch." />

      <div className="mx-auto max-w-[1600px] px-4 py-12 pb-24 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
          <CheckoutForm
            defaults={{
              fullName: user?.addresses[0]?.fullName ?? user?.name ?? '',
              email: user?.email ?? '',
              phone: user?.addresses[0]?.phone ?? user?.phone ?? '',
              line1: user?.addresses[0]?.line1 ?? '',
              line2: user?.addresses[0]?.line2 ?? '',
              city: user?.addresses[0]?.city ?? '',
              state: user?.addresses[0]?.state ?? '',
              pincode: user?.addresses[0]?.pincode ?? '',
            }}
            signedIn={Boolean(user)}
          />

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-rule-strong bg-ground-raised p-6">
              <h2 className="fx-display text-xl">
                {cart.count} {cart.count === 1 ? 'item' : 'items'}
              </h2>

              <ul className="mt-5 space-y-3 border-t border-rule pt-5">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-ink">{item.variant.product.name}</p>
                      <p className="fx-num text-xs text-ink-faint">
                        {item.variant.label} × {item.quantity}
                      </p>
                    </div>
                    <p className="fx-num shrink-0">
                      {formatPaiseExact(item.variant.pricePaise * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="fx-num mt-5 space-y-3 border-t border-rule pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Subtotal</dt>
                  <dd>{formatPaiseExact(cart.subtotalPaise)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Shipping</dt>
                  <dd>{cart.shippingPaise === 0 ? 'Free' : formatPaiseExact(cart.shippingPaise)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-rule pt-3">
                  <dt className="fx-display text-base">Total</dt>
                  <dd className="fx-display text-lg">{formatPaiseExact(cart.totalPaise)}</dd>
                </div>
              </dl>

              <p className="mt-4 border-t border-rule pt-4 text-xs leading-relaxed text-ink-faint">
                No online payment is taken at this step. We confirm stock and delivery by phone,
                then raise an invoice.
              </p>

              <Link
                href="/cart"
                className="mt-4 block text-center text-xs text-ink-muted underline decoration-rule-strong underline-offset-4 transition-colors hover:text-ink"
              >
                Edit cart
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
