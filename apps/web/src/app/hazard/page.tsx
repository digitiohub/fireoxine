import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { apiGetOr } from '@/lib/api';
import { PageHeader } from '@/components/site/PageHeader';
import { ClassPanel } from '@/components/product/ClassPanel';
import type { HazardDto } from '@fireoxine/types';

export const metadata: Metadata = {
  title: 'Shop by hazard',
  description:
    'Start from the room, not the product. Kitchens, server rooms, vehicles, warehouses and workshops — what belongs in each, and what must stay out.',
};

export default async function HazardIndexPage() {
  const hazards = await apiGetOr<HazardDto[]>('/api/catalogue/hazards', [], {
    anonymous: true,
    revalidate: 60,
  });

  return (
    <>
      <PageHeader
        title={
          <>
            What are you
            <br />
            protecting?
          </>
        }
        lede="The catalogue's second door. Most people arrive knowing the room, not the product code — so start from the room, and we will show you what belongs in it and what must never go near it."
        action={
          <Link href="/shop" className="fx-wedge-ghost">
            Browse by product
          </Link>
        }
      />

      <div className="mx-auto max-w-[1600px] px-4 py-14 pb-24 sm:px-6 lg:px-10">
        <ul className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {hazards.map((hazard) => {
            const count = hazard.productCount ?? 0;
            // The API folds the union of covered classes for us, so the card
            // answers "what does this room need?" without loading products.
            const cells = (hazard.coveredClasses ?? []).map((c) => ({ ...c, covers: true }));

            return (
              <li key={hazard.id} className="bg-ground-raised">
                <Link
                  href={`/hazard/${hazard.slug}`}
                  className="group flex h-full flex-col justify-between gap-6 p-7 transition-colors hover:bg-ground-sunk"
                >
                  <div>
                    <h2 className="fx-display text-2xl leading-tight transition-colors group-hover:text-wedge">
                      {hazard.name}
                    </h2>
                    <p className="fx-stencil mt-2 text-[0.6rem] text-ink-faint">
                      {hazard.summary}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                      {hazard.description}
                    </p>
                  </div>

                  <div>
                    <p className="fx-stencil mb-2 text-[0.55rem] text-ink-faint">
                      Classes covered by our picks
                    </p>
                    <div className="flex items-end justify-between gap-4">
                      <ClassPanel cells={cells} size="sm" />
                      <span className="fx-num text-xs text-ink-faint">
                        {count} {count === 1 ? 'product' : 'products'}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
