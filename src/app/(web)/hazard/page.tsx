import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/site/PageHeader';
import { ClassPanel, type ClassCell } from '@/components/product/ClassPanel';

export const metadata: Metadata = {
  title: 'Shop by hazard',
  description:
    'Start from the room, not the product. Kitchens, server rooms, vehicles, warehouses and workshops — what belongs in each, and what must stay out.',
};

export default async function HazardIndexPage() {
  const hazards = await db.hazard.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' },
    include: {
      products: {
        orderBy: { rank: 'asc' },
        include: {
          product: {
            select: {
              isActive: true,
              fireClasses: {
                orderBy: { fireClass: { position: 'asc' } },
                select: { covers: true, fireClass: { select: { code: true, label: true } } },
              },
            },
          },
        },
      },
    },
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
            const active = hazard.products.filter((ph) => ph.product.isActive);

            // The union of every class the recommended units cover, so the
            // card answers "what does this room need?" before you click.
            const cells = new Map<string, ClassCell>();
            for (const ph of active) {
              for (const fc of ph.product.fireClasses) {
                if (!fc.covers) continue;
                cells.set(fc.fireClass.code, {
                  code: fc.fireClass.code,
                  label: fc.fireClass.label,
                  covers: true,
                });
              }
            }

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
                      <ClassPanel cells={[...cells.values()]} size="sm" />
                      <span className="fx-num text-xs text-ink-faint">
                        {active.length} {active.length === 1 ? 'product' : 'products'}
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
