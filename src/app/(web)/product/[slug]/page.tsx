import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChevronRight, BadgeCheck, Zap, RefreshCw, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getProductCards } from '@/lib/queries';
import { mediumLabel } from '@/lib/utils';
import { PendingImage } from '@/components/product/PendingImage';
import { ClassPanel, ClassLegend, type ClassCell } from '@/components/product/ClassPanel';
import { ProductBuyBox } from '@/components/product/ProductBuyBox';
import { ProductRail } from '@/components/product/ProductRail';
import { ProductGallery } from '@/components/product/ProductGallery';

export async function generateStaticParams() {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug } });
  if (!product) return { title: 'Product not found' };
  return { title: product.name, description: product.shortDescription };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }] },
      variants: { orderBy: { position: 'asc' } },
      fireClasses: {
        orderBy: { fireClass: { position: 'asc' } },
        include: { fireClass: true },
      },
      hazards: { orderBy: { rank: 'asc' }, include: { hazard: true } },
    },
  });

  if (!product || !product.isActive) notFound();

  const session = await auth();
  const saved = session?.user?.id
    ? await db.wishlistItem.findUnique({
        where: { userId_productId: { userId: session.user.id, productId: product.id } },
      })
    : null;

  const related = await getProductCards(
    { categoryId: product.categoryId, id: { not: product.id } },
    6
  );

  const cells: ClassCell[] = product.fireClasses.map((fc) => ({
    code: fc.fireClass.code,
    label: fc.fireClass.label,
    covers: fc.covers,
  }));

  const covered = product.fireClasses.filter((fc) => fc.covers);
  const prohibited = product.fireClasses.filter((fc) => !fc.covers);
  const inStock = product.variants.some((v) => v.stock > 0);

  const specs: [string, string][] = [
    ['Extinguishing medium', mediumLabel(product.medium)],
    ['Product family', product.category.name],
    ...(product.standardCode ? ([['Manufactured to', product.standardCode]] as [string, string][]) : []),
    ['ISI marked', product.isIsiMarked ? 'Yes' : 'No — built to standard, mark not carried'],
    [
      'Safe on live electrical',
      product.safeOnLiveElectrical
        ? product.electricalRatingKv
          ? `Yes — tested to ${product.electricalRatingKv} kV`
          : 'Yes'
        : 'No — do not use on energised equipment',
    ],
    ...(product.refillMonths
      ? ([['Refill interval', `${product.refillMonths} months`]] as [string, string][])
      : []),
    ['Available capacities', product.variants.map((v) => v.label).join(', ')],
  ];

  return (
    <>
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
            <li>
              <Link href="/shop" className="transition-colors hover:text-ink">
                Collections
              </Link>
            </li>
            <ChevronRight className="size-3 text-ink-faint" aria-hidden="true" />
            <li>
              <Link
                href={`/shop/${product.category.slug}`}
                className="transition-colors hover:text-ink"
              >
                {product.category.name}
              </Link>
            </li>
            <ChevronRight className="size-3 text-ink-faint" aria-hidden="true" />
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Gallery */}
          <div>
            <ProductGallery images={product.images} sku={product.sku} name={product.name} />
          </div>

          {/* Detail */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`fx-stencil px-2.5 py-1 text-[0.6rem] ${
                  inStock ? 'bg-ink text-ground' : 'border border-rule-strong text-ink-muted'
                }`}
              >
                {inStock ? 'In stock' : 'Out of stock'}
              </span>
              {product.isIsiMarked && (
                <span className="fx-stencil inline-flex items-center gap-1.5 border border-rule-strong px-2.5 py-1 text-[0.6rem] text-ink-muted">
                  <BadgeCheck className="size-3" aria-hidden="true" />
                  ISI marked
                </span>
              )}
              {product.safeOnLiveElectrical && (
                <span className="fx-stencil inline-flex items-center gap-1.5 border border-rule-strong px-2.5 py-1 text-[0.6rem] text-ink-muted">
                  <Zap className="size-3" aria-hidden="true" />
                  Safe on live electrical
                </span>
              )}
            </div>

            <h1 className="fx-display mt-5 text-[clamp(2rem,4.5vw,3.25rem)] leading-[0.95]">
              {product.name}
            </h1>
            <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-ink-muted">
              {product.shortDescription}
            </p>

            {/* The coverage panel — the single most important block on the
                page, so it sits above the buy box, not below it. */}
            <section className="mt-8 border border-rule bg-ground-raised p-6" aria-labelledby="coverage">
              <h2 id="coverage" className="fx-stencil mb-4 text-[0.65rem] text-ink-faint">
                Fire class coverage
              </h2>
              <ClassPanel cells={cells} size="lg" />

              <dl className="mt-5 space-y-3 text-sm">
                {covered.length > 0 && (
                  <div className="flex gap-3">
                    <dt className="fx-stencil shrink-0 pt-0.5 text-[0.6rem] text-ink-faint">
                      Rated for
                    </dt>
                    <dd className="text-ink">
                      {covered
                        .map((fc) => `Class ${fc.fireClass.code} — ${fc.fireClass.label.toLowerCase()}`)
                        .join(' · ')}
                    </dd>
                  </div>
                )}
                {prohibited.length > 0 && (
                  <div className="flex gap-3">
                    <dt className="fx-stencil shrink-0 pt-0.5 text-[0.6rem] text-wedge">
                      Never use on
                    </dt>
                    <dd className="text-ink">
                      {prohibited
                        .map((fc) => `Class ${fc.fireClass.code} — ${fc.fireClass.label.toLowerCase()}`)
                        .join(' · ')}
                    </dd>
                  </div>
                )}
                {!product.safeOnLiveElectrical && (
                  <div className="flex gap-3">
                    <dt className="fx-stencil shrink-0 pt-0.5 text-[0.6rem] text-wedge">
                      Electrical
                    </dt>
                    <dd className="text-ink">
                      Not safe on energised equipment. Isolate the supply first.
                    </dd>
                  </div>
                )}
              </dl>

              <ClassLegend className="mt-5 border-t border-rule pt-4" />
            </section>

            <div className="mt-6">
              <ProductBuyBox
                productId={product.id}
                variants={product.variants}
                isSaved={Boolean(saved)}
              />
            </div>

            {/* Trust row */}
            <ul className="mt-6 grid gap-px border border-rule bg-rule sm:grid-cols-3">
              {[
                [ShieldCheck, 'Certified', product.standardCode ?? 'Built to Indian Standard'],
                [
                  RefreshCw,
                  'Refill service',
                  product.refillMonths ? `Every ${product.refillMonths} months` : 'On request',
                ],
                [BadgeCheck, 'Dispatch', '3–5 working days'],
              ].map(([Icon, title, detail], i) => {
                const Component = Icon as typeof ShieldCheck;
                return (
                  <li key={i} className="bg-ground-raised px-4 py-4">
                    <Component className="size-4 text-wedge" aria-hidden="true" />
                    <p className="fx-stencil mt-2 text-[0.6rem] text-ink">{title as string}</p>
                    <p className="mt-1 text-xs text-ink-muted">{detail as string}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Description + specification */}
        <div className="mt-20 grid gap-12 border-t border-rule pt-14 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <section aria-labelledby="about-product">
            <h2 id="about-product" className="fx-display text-3xl">
              About this unit
            </h2>
            <div className="mt-6 max-w-[70ch] space-y-5 text-[0.95rem] leading-relaxed text-ink-muted">
              {product.description.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            {product.warrantyNote && (
              <p className="mt-8 border-l-2 border-wedge pl-5 text-sm leading-relaxed text-ink-muted">
                {product.warrantyNote}
              </p>
            )}
          </section>

          <section aria-labelledby="specification">
            <h2 id="specification" className="fx-display text-3xl">
              Specification
            </h2>
            <dl className="mt-6 border-t border-rule">
              {specs.map(([term, value]) => (
                <div
                  key={term}
                  className="grid grid-cols-[minmax(0,11rem)_1fr] gap-4 border-b border-rule py-3.5"
                >
                  <dt className="fx-stencil pt-0.5 text-[0.6rem] text-ink-faint">{term}</dt>
                  <dd className="fx-num text-sm text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            {product.hazards.length > 0 && (
              <div className="mt-8">
                <h3 className="fx-stencil mb-3 text-[0.65rem] text-ink-faint">
                  Recommended for
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {product.hazards.map((ph) => (
                    <li key={ph.id}>
                      <Link
                        href={`/hazard/${ph.hazard.slug}`}
                        className="inline-block border border-rule-strong px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-ink hover:text-ink"
                      >
                        {ph.hazard.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        {related.length > 0 && (
          <div className="mt-16 border-t border-rule">
            <ProductRail
              title="Also in this collection"
              href={`/shop/${product.category.slug}`}
              products={related}
            />
          </div>
        )}
      </div>
    </>
  );
}
