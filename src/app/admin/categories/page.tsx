import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { CategoryImageManager } from '@/components/admin/CategoryImageManager';

export const metadata: Metadata = { title: 'Collections · Admin' };

export default async function AdminCategoriesPage() {
  const [categories, hazards] = await Promise.all([
    db.category.findMany({
      orderBy: { position: 'asc' },
      include: { _count: { select: { products: true } } },
    }),
    db.hazard.findMany({
      orderBy: { position: 'asc' },
      include: { _count: { select: { products: true } } },
    }),
  ]);

  return (
    <div>
      <h1 className="fx-display text-4xl">Collections</h1>
      <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-ink-muted">
        Collection artwork is optional. Where none is uploaded, the site sets the collection name at
        large scale on newsprint instead — which is a deliberate design, not a fallback.
      </p>

      <section className="mt-10" aria-labelledby="families">
        <h2 id="families" className="fx-display mb-5 border-b border-rule pb-3 text-2xl">
          Product families
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <li key={category.id}>
              <CategoryImageManager
                categoryId={category.id}
                name={category.name}
                imageUrl={category.imageUrl}
                productCount={category._count.products}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="hazards">
        <h2 id="hazards" className="fx-display mb-5 border-b border-rule pb-3 text-2xl">
          Hazards
        </h2>
        <p className="mb-5 max-w-[68ch] text-sm leading-relaxed text-ink-muted">
          Hazards are the second door into the catalogue. Assign products to them from each
          product’s own editor.
        </p>
        <div className="overflow-x-auto border border-rule">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-rule bg-ground-sunk text-left">
                {['Hazard', 'Summary', 'Products'].map((h) => (
                  <th key={h} className="fx-stencil px-4 py-3 text-[0.6rem] text-ink-faint">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hazards.map((hazard) => (
                <tr key={hazard.id} className="border-b border-rule last:border-0">
                  <td className="px-4 py-3 text-ink">{hazard.name}</td>
                  <td className="px-4 py-3 text-ink-muted">{hazard.summary}</td>
                  <td className="fx-num px-4 py-3">
                    <span className={hazard._count.products === 0 ? 'text-wedge' : 'text-ink-muted'}>
                      {hazard._count.products}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
