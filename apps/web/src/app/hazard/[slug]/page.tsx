import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import { apiGet, apiGetOr } from '@/lib/api';
import { PageHeader } from '@/components/site/PageHeader';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ClassLegend } from '@/components/product/ClassPanel';
import type { FilterGroups, HazardDto, ProductCardDto } from '@fireoxine/types';

type HazardPayload = {
  hazard: HazardDto;
  products: ProductCardDto[];
  filters: FilterGroups;
  total: number;
};

export async function generateStaticParams() {
  const hazards = await apiGetOr<HazardDto[]>('/api/catalogue/hazards', [], { anonymous: true });
  return hazards.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await apiGet<HazardPayload>(`/api/catalogue/hazards/${slug}`, { anonymous: true });
  if (!res.ok) return { title: 'Hazard not found' };
  const { hazard } = res.data;
  return { title: hazard.name, description: hazard.description ?? hazard.summary };
}

export default async function HazardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const res = await apiGet<HazardPayload>(`/api/catalogue/hazards/${slug}`, { anonymous: true });
  if (!res.ok) notFound();

  const { hazard, products } = res.data;

  // Anything explicitly prohibited by a recommended unit is worth naming on
  // the page: for a kitchen, "never water on a fryer" is the single most
  // valuable sentence we can publish.
  const prohibitions = new Map<string, string>();
  for (const product of products) {
    for (const fc of product.fireClasses) {
      if (fc.covers) continue;
      prohibitions.set(fc.code, fc.label);
    }
  }

  return (
    <>
      <PageHeader
        title={hazard.name}
        lede={hazard.description ?? hazard.summary}
        eyebrowLinks={
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
              <li>
                <Link href="/hazard" className="transition-colors hover:text-ink">
                  Hazards
                </Link>
              </li>
              <ChevronRight className="size-3 text-ink-faint" aria-hidden="true" />
              <li aria-current="page" className="text-ink">
                {hazard.name}
              </li>
            </ol>
          </nav>
        }
        action={
          <Link href="/shop/all" className="fx-wedge-ghost">
            All products
          </Link>
        }
      />

      <div className="mx-auto max-w-[1600px] px-4 py-12 pb-24 sm:px-6 lg:px-10">
        {prohibitions.size > 0 && (
          <aside className="mb-10 flex gap-4 border border-wedge/40 bg-wedge/[0.06] p-5 sm:p-6">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-wedge" aria-hidden="true" />
            <div>
              <h2 className="fx-stencil text-[0.65rem] text-wedge">Before you choose</h2>
              <p className="mt-2 max-w-[74ch] text-sm leading-relaxed text-ink">
                Some units below carry explicit prohibitions for this space. Check the struck
                classes on each card:{' '}
                {[...prohibitions.entries()]
                  .map(([code, label]) => `Class ${code} (${label.toLowerCase()})`)
                  .join(', ')}
                . Using the wrong agent on these makes the fire worse, not better.
              </p>
              <ClassLegend className="mt-4" />
            </div>
          </aside>
        )}

        <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-rule pb-4">
          <h2 className="fx-display text-2xl">What belongs here</h2>
          <p className="fx-num text-sm text-ink-muted">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        <ProductGrid
          products={products}
          emptyAction={
            <Link href="/shop/all" className="fx-wedge">
              Browse all products
            </Link>
          }
        />
      </div>
    </>
  );
}
