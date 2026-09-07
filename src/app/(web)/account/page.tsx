import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Package, MapPin, Heart, LogOut } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatPaiseExact } from '@/lib/money';
import { formatDate, orderStatusLabel } from '@/lib/utils';
import { PageHeader } from '@/components/site/PageHeader';
import { AuthPanel } from '@/components/site/AuthPanel';
import { PendingImage } from '@/components/product/PendingImage';
import { logoutAction } from '@/actions/auth';

export const metadata: Metadata = { title: 'Account' };

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <>
        <PageHeader
          title="Account"
          lede="Sign in to track orders, reorder refills and keep your delivery addresses."
        />
        <div className="mx-auto max-w-[1600px] px-4 py-14 pb-24 sm:px-6 lg:px-10">
          <AuthPanel />
        </div>
      </>
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      addresses: { orderBy: { isDefault: 'desc' } },
      orders: { orderBy: { placedAt: 'desc' }, include: { items: true }, take: 10 },
      wishlist: {
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: {
              images: { orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }], take: 1 },
              variants: { orderBy: { position: 'asc' }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Hello, ${user.name.split(' ')[0]}`}
        lede={user.email}
        action={
          <form action={logoutAction}>
            <button type="submit" className="fx-wedge-ghost">
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        }
      />

      <div className="mx-auto max-w-[1600px] space-y-16 px-4 py-14 pb-24 sm:px-6 lg:px-10">
        {/* Orders */}
        <section aria-labelledby="orders">
          <div className="mb-6 flex items-center gap-3 border-b border-rule pb-4">
            <Package className="size-5 text-wedge" aria-hidden="true" />
            <h2 id="orders" className="fx-display text-2xl">
              Orders
            </h2>
          </div>

          {user.orders.length === 0 ? (
            <div className="border border-rule bg-ground-raised px-6 py-12 text-center">
              <p className="text-sm text-ink-muted">No orders yet.</p>
              <Link href="/shop/all" className="fx-wedge mt-5">
                Browse the catalogue
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {user.orders.map((order) => (
                <li key={order.id} className="border border-rule bg-ground-raised p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="fx-display fx-num text-lg">{order.orderNumber}</p>
                      <p className="fx-num mt-1 text-xs text-ink-muted">
                        {formatDate(order.placedAt)} · {order.items.length}{' '}
                        {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="fx-stencil inline-block border border-rule-strong px-2 py-0.5 text-[0.6rem] text-ink-muted">
                        {orderStatusLabel(order.status)}
                      </span>
                      <p className="fx-num fx-display mt-2 text-lg">
                        {formatPaiseExact(order.totalPaise)}
                      </p>
                    </div>
                  </div>
                  <ul className="fx-num mt-4 space-y-1 border-t border-rule pt-3 text-xs text-ink-muted">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.productName} · {item.variantLabel} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/order/${order.orderNumber}`}
                    className="mt-4 inline-block text-xs text-ink underline decoration-rule-strong underline-offset-4 transition-colors hover:text-wedge"
                  >
                    View order
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Saved */}
        <section aria-labelledby="saved">
          <div className="mb-6 flex items-center gap-3 border-b border-rule pb-4">
            <Heart className="size-5 text-wedge" aria-hidden="true" />
            <h2 id="saved" className="fx-display text-2xl">
              Saved for later
            </h2>
          </div>

          {user.wishlist.length === 0 ? (
            <p className="border border-rule bg-ground-raised px-6 py-12 text-center text-sm text-ink-muted">
              Nothing saved yet. The heart on any product page keeps it here.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {user.wishlist.map((item) => {
                const image = item.product.images[0];
                const variant = item.product.variants[0];
                return (
                  <li key={item.id} className="border border-rule bg-ground-raised">
                    <Link href={`/product/${item.product.slug}`} className="group block">
                      <div className="relative aspect-[4/3] overflow-hidden border-b border-rule">
                        {image ? (
                          <Image
                            src={image.url}
                            alt={image.alt}
                            fill
                            sizes="(max-width:640px) 100vw, 25vw"
                            className="object-cover"
                          />
                        ) : (
                          <PendingImage sku={item.product.sku} />
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-medium leading-snug transition-colors group-hover:text-wedge">
                          {item.product.name}
                        </p>
                        {variant && (
                          <p className="fx-num fx-display mt-2 text-base">
                            {formatPaiseExact(variant.pricePaise)}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Addresses */}
        <section aria-labelledby="addresses">
          <div className="mb-6 flex items-center gap-3 border-b border-rule pb-4">
            <MapPin className="size-5 text-wedge" aria-hidden="true" />
            <h2 id="addresses" className="fx-display text-2xl">
              Addresses
            </h2>
          </div>

          {user.addresses.length === 0 ? (
            <p className="border border-rule bg-ground-raised px-6 py-12 text-center text-sm text-ink-muted">
              No saved addresses. Tick “save this address” at checkout to keep one here.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {user.addresses.map((address) => (
                <li key={address.id} className="border border-rule bg-ground-raised p-5">
                  {address.isDefault && (
                    <span className="fx-stencil mb-3 inline-block bg-ink px-2 py-0.5 text-[0.55rem] text-ground">
                      Default
                    </span>
                  )}
                  <address className="not-italic text-sm leading-relaxed text-ink-muted">
                    <span className="block font-medium text-ink">{address.fullName}</span>
                    {address.line1}
                    <br />
                    {address.line2 && (
                      <>
                        {address.line2}
                        <br />
                      </>
                    )}
                    {address.city}, {address.state}
                    <br />
                    <span className="fx-num">
                      {address.pincode} · {address.phone}
                    </span>
                  </address>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
