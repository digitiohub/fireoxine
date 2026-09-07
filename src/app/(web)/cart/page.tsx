import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { getCart } from '@/lib/cart';
import { formatPaiseExact } from '@/lib/money';
import { PageHeader } from '@/components/site/PageHeader';
import { PendingImage } from '@/components/product/PendingImage';
import { CartQuantity } from '@/components/site/CartQuantity';

export const metadata: Metadata = { title: 'Cart' };

export default async function CartPage() {
  const cart = await getCart();

  if (cart.items.length === 0) {
    return (
      <>
        <PageHeader title="Your cart" />
        <div className="mx-auto max-w-[1600px] px-4 py-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-md border border-rule bg-ground-raised px-6 py-16 text-center">
            <ShoppingBag className="mx-auto size-8 text-ink-faint" aria-hidden="true" />
            <h2 className="fx-display mt-5 text-2xl">Nothing in the cart yet</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              If you are not sure what you need, start from the room you are protecting rather than
              the product list.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/hazard" className="fx-wedge">
                Shop by hazard
              </Link>
              <Link href="/shop/all" className="fx-wedge-ghost">
                All products
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const remaining = cart.freeAbovePaise - cart.subtotalPaise;

  return (
    <>
      <PageHeader title="Your cart" lede={`${cart.count} ${cart.count === 1 ? 'item' : 'items'}`} />

      <div className="mx-auto max-w-[1600px] px-4 py-12 pb-24 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
          <ul className="border-t border-rule">
            {cart.items.map((item) => {
              const image = item.variant.product.images[0];
              return (
                <li
                  key={item.id}
                  className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-rule py-5 sm:grid-cols-[7rem_1fr] sm:gap-6"
                >
                  <Link
                    href={`/product/${item.variant.product.slug}`}
                    className="relative aspect-square overflow-hidden border border-rule"
                  >
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <PendingImage sku={item.variant.sku} />
                    )}
                  </Link>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                      <div>
                        <h2 className="text-[0.95rem] font-medium leading-snug">
                          <Link
                            href={`/product/${item.variant.product.slug}`}
                            className="transition-colors hover:text-wedge"
                          >
                            {item.variant.product.name}
                          </Link>
                        </h2>
                        <p className="fx-num mt-1 text-xs text-ink-muted">
                          {item.variant.label} · {item.variant.product.category.name}
                        </p>
                      </div>
                      <p className="fx-num fx-display text-lg">
                        {formatPaiseExact(item.variant.pricePaise * item.quantity)}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                      <CartQuantity
                        itemId={item.id}
                        quantity={item.quantity}
                        max={item.variant.stock}
                      />
                      <p className="fx-num text-xs text-ink-faint">
                        {formatPaiseExact(item.variant.pricePaise)} each
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-rule-strong bg-ground-raised p-6">
              <h2 className="fx-display text-xl">Order summary</h2>

              <dl className="fx-num mt-6 space-y-3 border-t border-rule pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Subtotal</dt>
                  <dd>{formatPaiseExact(cart.subtotalPaise)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Shipping</dt>
                  <dd>
                    {cart.shippingPaise === 0 ? 'Free' : formatPaiseExact(cart.shippingPaise)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-rule pt-3">
                  <dt className="fx-display text-base">Total</dt>
                  <dd className="fx-display text-lg">{formatPaiseExact(cart.totalPaise)}</dd>
                </div>
              </dl>

              <p className="mt-2 text-xs text-ink-faint">Inclusive of all taxes</p>

              {remaining > 0 && (
                <p className="fx-num mt-4 border-t border-rule pt-4 text-xs text-ink-muted">
                  Add {formatPaiseExact(remaining)} more for free shipping.
                </p>
              )}

              <Link href="/checkout" className="fx-wedge mt-6 w-full justify-center">
                Checkout
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/shop/all"
                className="mt-3 block text-center text-xs text-ink-muted underline decoration-rule-strong underline-offset-4 transition-colors hover:text-ink"
              >
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
