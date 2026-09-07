import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

/** Everything a ProductCard needs, and nothing it does not. */
export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  medium: true,
  isIsiMarked: true,
  standardCode: true,
  safeOnLiveElectrical: true,
  images: {
    where: { isPrimary: true },
    orderBy: { position: 'asc' },
    take: 1,
    select: { url: true, alt: true },
  },
  variants: {
    orderBy: { position: 'asc' },
    select: { id: true, label: true, pricePaise: true, mrpPaise: true, stock: true },
  },
  fireClasses: {
    orderBy: { fireClass: { position: 'asc' } },
    select: { covers: true, fireClass: { select: { code: true, label: true } } },
  },
} satisfies Prisma.ProductSelect;

/**
 * The primary image may not be flagged yet (admin uploads set isPrimary on
 * the first image, but a client can unset it). Fall back to position order so
 * a product with images never renders the pending plate by accident.
 */
export async function getProductCards(where: Prisma.ProductWhereInput, take?: number) {
  const products = await db.product.findMany({
    where: { isActive: true, ...where },
    select: {
      ...productCardSelect,
      images: {
        orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
        take: 1,
        select: { url: true, alt: true },
      },
    },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    take,
  });
  return products;
}
