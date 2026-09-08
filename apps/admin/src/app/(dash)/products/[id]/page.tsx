import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { ProductForm } from '@/components/ProductForm';
import { VariantEditor } from '@/components/VariantEditor';
import { ImageUploader } from '@/components/ImageUploader';
import { DeleteProductButton } from '@/components/DeleteProductButton';
import type { FireClassDto, ProductDetailDto, VariantDto } from '@fireoxine/types';

type AdminImage = { id: string; url: string; alt: string; isPrimary: boolean; position: number };

type EditPayload = {
  product: ProductDetailDto;
  images: AdminImage[];
  variants: VariantDto[];
  selectedFireClasses: Record<string, 'covers' | 'prohibited'>;
  selectedHazardIds: string[];
  categories: { id: string; name: string }[];
  hazards: { id: string; name: string }[];
  fireClasses: Pick<FireClassDto, 'code' | 'label'>[];
};

/** The storefront is a separate deployment now, so "view on site" needs its origin. */
const WEB_URL = (process.env.WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const metadata: Metadata = { title: 'Edit product · Admin' };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // One call returns the product, its images and variants, and every option
  // the form offers, so the editor never renders half-populated.
  const res = await apiGet<EditPayload>(`/api/admin/products/${id}`);
  if (!res.ok) notFound();

  const {
    product,
    images,
    variants,
    selectedFireClasses,
    selectedHazardIds,
    categories,
    hazards,
    fireClasses,
  } = res.data;

  const classStates: Record<string, 'covers' | 'prohibited' | 'unstated'> = {
    ...selectedFireClasses,
  };

  return (
    <div>
      <Link
        href="/products"
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
          href={`${WEB_URL}/product/${product.slug}`}
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
          {images.length === 0
            ? 'This product has no photograph yet, so the site shows a designed “photograph pending” plate in its place. Upload one or more here and it replaces the plate everywhere immediately.'
            : `${images.length} ${images.length === 1 ? 'photograph' : 'photographs'}. The primary one is used on cards, listings and the cart.`}
        </p>
        <ImageUploader
          productId={product.id}
          productName={product.name}
          images={images}
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
          variants={variants}
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
            categoryId: product.category.id,
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
            hazardIds: selectedHazardIds,
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
