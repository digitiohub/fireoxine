import { db } from '@/lib/db';
import { ok } from '@/lib/http';
import { getSettings } from '@/lib/settings';
import { productCardSelect, toCategory, toFireClass, toHazard, toProductCard } from '@/lib/serialize';

/**
 * The home page in a single request.
 *
 * It used to run a query per section inside the page component — settings,
 * categories, hazards, classes, FAQs and one rail per category. Over HTTP
 * that would be a dozen round trips on the site's most-hit page, so the whole
 * page's data is assembled here instead.
 */
export async function GET() {
  const [settings, categories, hazards, fireClasses, faqs] = await Promise.all([
    getSettings(),
    db.category.findMany({ where: { isActive: true }, orderBy: { position: 'asc' } }),
    db.hazard.findMany({ where: { isActive: true }, orderBy: { position: 'asc' } }),
    db.fireClass.findMany({ orderBy: { position: 'asc' } }),
    db.faq.findMany({
      where: { isActive: true, group: 'GENERAL' },
      orderBy: { position: 'asc' },
      select: { id: true, question: true, answer: true, group: true },
    }),
  ]);

  const railRows = await Promise.all(
    categories.map(async (category) => ({
      category: toCategory(category),
      products: (
        await db.product.findMany({
          where: { isActive: true, categoryId: category.id },
          select: productCardSelect,
          orderBy: [{ position: 'asc' }, { name: 'asc' }],
          take: 8,
        })
      ).map(toProductCard),
    }))
  );

  // Rails are chosen by how much they actually have to show. A rail built
  // from a category with one product is a single card adrift in an empty
  // row, which reads as a loading failure rather than a small range.
  const rails = railRows
    .filter((rail) => rail.products.length >= 2)
    .sort((a, b) => b.products.length - a.products.length)
    .slice(0, 4);

  return ok({
    settings,
    categories: categories.map(toCategory),
    hazards: hazards.map(toHazard),
    fireClasses: fireClasses.map(toFireClass),
    faqs,
    rails,
  });
}
