import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { db } from '@/lib/db';
import { ProductForm } from '@/components/admin/ProductForm';
import { VariantEditor } from '@/components/admin/VariantEditor';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { DeleteProductButton } from '@/components/admin/DeleteProductButton';

export const metadata: Metadata = { title: 'Edit product · Admin' };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories, hazards, fireClasses] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { position: 'asc' } },
        images: { orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }] },
        fireClasses: { include: { fireClass: true } },
        hazards: true,
      },
    }),
    db.category.findMany({ orderBy: { position: 'asc' }, select: { id: true, name: true } }),
    db.hazard.findMany({ orderBy: { position: 'asc' }, select: { id: true, name: true } }),
    db.fireClass.findMany({ orderBy: { position: 'asc' } }),
  ]);

  if (!product) notFound();

  const classStates: Record<string, 'covers' | 'prohibited' | 'unstated'> = {};
  for (const fc of product.fireClasses) {
    classStates[fc.fireClass.code] = fc.covers ? 'covers' : 'prohibited';
  }

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="size-3.5" aria-hidden="true" />
        Products
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="fx-display text-4xl leading-tight">{product.name}</h1>
          <p className="fx-num mt-2 text-sm text-ink-muted">{product.sku}</p>
        </div>
        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className="fx-wedge-ghost shrink-0"
        >
          View on site
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Photographs first: it is the outstanding task on this project. */}
      <section className="mt-12" aria-labelledby="photographs">
        <h2 id="photographs" className="fx-display mb-2 text-xl">
          Photographs
        </h2>
        <p className="mb-6 max-w-[70ch] text-sm leading-relaxed text-ink-muted">
          {product.images.length === 0
            ? 'This product has no photograph yet, so the site shows a designed “photograph pending” plate in its place. Upload one or more here and it replaces the plate everywhere immediately.'
            : `${product.images.length} ${product.images.length === 1 ? 'photograph' : 'photographs'}. The primary one is used on cards, listings and the cart.`}
        </p>
        <ImageUploader
          productId={product.id}
          productName={product.name}
          images={product.images}
        />
      </section>

      <section className="mt-14" aria-labelledby="capacities">
        <h2 id="capacities" className="fx-display mb-2 text-xl">
          Capacities and pricing
        </h2>
        <p className="mb-6 max-w-[70ch] text-sm leading-relaxed text-ink-muted">
          A product needs at least one capacity before it can be added to a cart. Prices are entered
          in rupees, inclusive of tax.
        </p>
        <VariantEditor
          productId={product.id}
          productSku={product.sku}
          variants={product.variants}
        />
      </section>

      <section className="mt-14 border-t border-rule pt-12" aria-labelledby="details">
        <h2 id="details" className="sr-only">
          Product details
        </h2>
        <ProductForm
          values={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            categoryId: product.categoryId,
            shortDescription: product.shortDescription,
            description: product.description,
            medium: product.medium,
            standardCode: product.standardCode ?? '',
            warrantyNote: product.warrantyNote ?? '',
            refillMonths: product.refillMonths?.toString() ?? '',
            electricalRatingKv: product.electricalRatingKv?.toString() ?? '',
            isIsiMarked: product.isIsiMarked,
            safeOnLiveElectrical: product.safeOnLiveElectrical,
            isFeatured: product.isFeatured,
            isActive: product.isActive,
            classStates,
            hazardIds: product.hazards.map((h) => h.hazardId),
          }}
          categories={categories}
          hazards={hazards}
          fireClasses={fireClasses}
        />
      </section>

      <section className="mt-14 border-t border-rule pt-8">
        <h2 className="fx-display text-lg">Delete this product</h2>
        <p className="mt-2 max-w-[64ch] text-sm leading-relaxed text-ink-muted">
          Products with order history are archived rather than deleted, so past invoices stay
          readable.
        </p>
        <DeleteProductButton productId={product.id} productName={product.name} />
      </section>
    </div>
  );
}
