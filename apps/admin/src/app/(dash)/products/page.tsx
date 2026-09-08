import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, ImageOff } from 'lucide-react';
import { apiGetOr } from '@/lib/api';
import { formatPaise } from '@/lib/money';
import { mediumLabel, mediaUrl } from '@/lib/utils';
import type { AdminProductRowDto } from '@fireoxine/types';

export const metadata: Metadata = { title: 'Products · Admin' };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;

  const products = await apiGetOr<AdminProductRowDto[]>(
    `/api/admin/products${filter === 'no-image' ? '?filter=no-image' : ''}`,
    []
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="fx-display text-4xl">Products</h1>
          <p className="fx-num mt-2 text-sm text-ink-muted">
            {products.length} {products.length === 1 ? 'product' : 'products'}
            {filter === 'no-image' && ' without a photograph'}
          </p>
        </div>
        <Link href="/products/new" className="fx-wedge">
          <Plus className="size-4" aria-hidden="true" />
          New product
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        <Link
          href="/products"
          className={`fx-stencil border px-3 py-1.5 text-[0.65rem] transition-colors ${
            !filter ? 'border-ink bg-ink text-ground' : 'border-rule text-ink-muted hover:border-ink'
          }`}
        >
          All
        </Link>
        <Link
          href="/products?filter=no-image"
          className={`fx-stencil border px-3 py-1.5 text-[0.65rem] transition-colors ${
            filter === 'no-image'
              ? 'border-ink bg-ink text-ground'
              : 'border-rule text-ink-muted hover:border-ink'
          }`}
        >
          Needs a photograph
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto border border-rule">
        <table className="w-full min-w-[52rem] text-sm">
          <thead>
            <tr className="border-b border-rule bg-ground-sunk text-left">
              {['', 'Product', 'Family', 'Medium', 'Variants', 'From', 'Stock', 'Status'].map(
                (h, i) => (
                  <th key={i} className="fx-stencil px-4 py-3 text-[0.6rem] text-ink-faint">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const image = product.image;
              const from = product.fromPricePaise;
              const stock = product.stock;

              return (
                <tr key={product.id} className="border-b border-rule last:border-0">
                  <td className="px-4 py-3">
                    <div className="relative size-11 shrink-0 border border-rule bg-ground-sunk">
                      {image ? (
                        <Image
                          src={mediaUrl(image.url)!}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        <span
                          title="No photograph uploaded"
                          className="grid size-full place-items-center"
                        >
                          <ImageOff className="size-4 text-wedge" aria-hidden="true" />
                          <span className="sr-only">No photograph uploaded</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/products/${product.id}`}
                      className="text-ink underline decoration-rule-strong underline-offset-4 hover:text-wedge"
                    >
                      {product.name}
                    </Link>
                    <p className="fx-num mt-0.5 text-xs text-ink-faint">{product.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{product.categoryName}</td>
                  <td className="px-4 py-3 text-ink-muted">{mediumLabel(product.medium)}</td>
                  <td className="fx-num px-4 py-3 text-ink-muted">{product.variantCount}</td>
                  <td className="fx-num px-4 py-3">{from !== null ? formatPaise(from) : '—'}</td>
                  <td className="fx-num px-4 py-3">
                    <span className={stock === 0 ? 'text-wedge' : 'text-ink-muted'}>{stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`fx-stencil border px-2 py-0.5 text-[0.55rem] ${
                        product.isActive
                          ? 'border-rule-strong text-ink-muted'
                          : 'border-wedge text-wedge'
                      }`}
                    >
                      {product.isActive ? 'Live' : 'Hidden'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <p className="mt-6 border border-rule bg-ground-raised px-5 py-12 text-center text-sm text-ink-muted">
          {filter === 'no-image'
            ? 'Every product has at least one photograph. Nothing to do here.'
            : 'No products yet.'}
        </p>
      )}
    </div>
  );
}
