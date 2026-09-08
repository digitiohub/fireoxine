import Link from 'next/link';
import Image from 'next/image';
import { Zap, BadgeCheck } from 'lucide-react';
import { ClassPanel, type ClassCell } from '@/components/product/ClassPanel';
import { PendingImage } from '@/components/product/PendingImage';
import { AddToCartButton } from '@/components/product/AddToCartButton';
import { formatPaise, discountPercent } from '@/lib/money';
import { mediumLabel, cn, mediaUrl } from '@/lib/utils';
import type { ProductCardDto } from '@fireoxine/types';

/**
 * The card renders the API's DTO directly. Keeping the alias means every call
 * site did not have to change when the data started arriving over HTTP, and
 * the shape is now defined once, in @fireoxine/types.
 */
export type ProductCardData = ProductCardDto;

export function ProductCard({
  product,
  className,
  priority = false,
}: {
  product: ProductCardData;
  className?: string;
  /** Set on the cards that render above the fold: one of them is the page's
   *  Largest Contentful Paint, and lazy-loading it delays the metric. */
  priority?: boolean;
}) {
  const variant = product.variants[0];
  const image = product.image;
  const inStock = product.variants.some((v) => v.stock > 0);
  const discount = variant ? discountPercent(variant.pricePaise, variant.mrpPaise) : null;

  const cells: ClassCell[] = product.fireClasses;

  const capacities = product.variants.map((v) => v.label);

  return (
    <article
      className={cn(
        'group relative flex flex-col border border-rule bg-ground-raised transition-colors duration-200 hover:border-ink',
        className
      )}
    >
      <Link href={`/product/${product.slug}`} className="block focus-visible:outline-offset-4">
        <div className="relative aspect-[4/5] overflow-hidden border-b border-rule">
          {image ? (
            <Image
              src={mediaUrl(image.url)!}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 22vw"
              priority={priority}
              className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            />
          ) : (
            <PendingImage sku={product.sku} label={product.name} />
          )}

          {!inStock && (
            <span className="fx-stencil absolute left-0 top-3 bg-ink px-2.5 py-1 text-[0.6rem] text-ground">
              Out of stock
            </span>
          )}
          {inStock && discount !== null && (
            <span className="fx-stencil fx-num absolute left-0 top-3 bg-wedge px-2.5 py-1 text-[0.6rem] text-wedge-ink">
              {discount}% off
            </span>
          )}
        </div>
      </Link>

      {/* The spec field. Dense and on the face, never behind an accordion. */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {product.isIsiMarked && (
              <span className="fx-stencil inline-flex items-center gap-1 border border-rule-strong px-1.5 py-0.5 text-[0.55rem] text-ink-muted">
                <BadgeCheck className="size-2.5" aria-hidden="true" />
                ISI
              </span>
            )}
            {product.standardCode && (
              <span className="fx-stencil fx-num border border-rule px-1.5 py-0.5 text-[0.55rem] text-ink-faint">
                {product.standardCode}
              </span>
            )}
            {product.safeOnLiveElectrical && (
              <span
                title="Tested safe on electrically energised equipment"
                className="fx-stencil inline-flex items-center gap-1 border border-rule-strong px-1.5 py-0.5 text-[0.55rem] text-ink-muted"
              >
                <Zap className="size-2.5" aria-hidden="true" />
                Live OK
              </span>
            )}
          </div>
        </div>

        <h3 className="text-[0.95rem] font-medium leading-snug text-ink">
          <Link href={`/product/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>

        <p className="text-xs text-ink-muted">{mediumLabel(product.medium)}</p>

        <div>
          <p className="fx-stencil mb-1.5 text-[0.55rem] text-ink-faint">Fire class</p>
          <ClassPanel cells={cells} size="sm" />
        </div>

        <p className="fx-num text-xs text-ink-faint">
          {capacities.length > 1
            ? `${capacities.length} sizes · ${capacities[0]}–${capacities[capacities.length - 1]}`
            : capacities[0]}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            {variant && (
              <>
                <p className="fx-num fx-display text-xl leading-none text-ink">
                  {formatPaise(variant.pricePaise)}
                </p>
                {variant.mrpPaise && variant.mrpPaise > variant.pricePaise && (
                  <p className="fx-num mt-1 text-xs text-ink-faint line-through">
                    {formatPaise(variant.mrpPaise)}
                  </p>
                )}
              </>
            )}
          </div>
          {variant && (
            <AddToCartButton
              variantId={variant.id}
              disabled={!inStock}
              compact
              className="relative z-10"
            />
          )}
        </div>
      </div>
    </article>
  );
}
